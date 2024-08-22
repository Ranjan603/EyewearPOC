'use strict';

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

/**
 * Returns the shipping method in the array with the given ID, or null if not found.
 * @param {Array} shippingMethods - The array of shipping methods in which to search
 * @param {string} id - The ID of the shipping method to find
 * @return {dw.order.ShippingMethod} The shipping method found with that ID
 */
function findShippingMethod(shippingMethods, id) {
    for (var i = 0; i < shippingMethods.length; i++) {
        if (id === shippingMethods[i].ID) {
            return shippingMethods[i];
        }
    }
    return null;
}

/**
 * Finishes placing the given order.
 * @param {Object} req - The request object for the current controller request
 * @param {Object} res - The response object for the current controller request
 * @param {Function} next - Executes the next step in the controller chain
 * @param {dw.order.Order} order - The order to be placed
 * @return {Object} The result of executing the next step in the controller chain
 */
function finishPlaceOrder(req, res, next, order) {
    var BasketMgr = require('dw/order/BasketMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');

    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    // Handles payment authorization
    var handlePaymentResult = COHelpers.handleCommercePayments(order, order.orderNo);
    if (handlePaymentResult.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    var fraudDetectionStatus = hooksHelper('app.fraud.detection', 'fraudDetection', order, require('*/cartridge/scripts/hooks/fraudDetection').fraudDetection);
    if (fraudDetectionStatus.status === 'fail') {
        // Cancel or refund the payment if necessary
        paymentHelpers.reversePaymentIfNecessary(order);

        // Fail the order
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        // fraud detection failed
        req.session.privacyCache.set('fraudDetectionStatus', true);

        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Error-ErrorCode', 'err', fraudDetectionStatus.errorCode).toString(),
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });

        return next();
    }

    // Places the order
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
        // In this case the order has been failed already, so cancel or refund
        // the payment in the reopened basket, if there is one
        var reopenedBasket = BasketMgr.getCurrentBasket();
        if (reopenedBasket) {
            paymentHelpers.reversePaymentIfNecessary(reopenedBasket);
        }

        res.json({
            error: true,
            fieldErrors: [],
            serverErrors: [Resource.msg('error.technical', 'checkout', null)],
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    if (req.currentCustomer.addressBook) {
        // save all used shipping addresses to address book of the logged in customer
        var allAddresses = addressHelpers.gatherShippingAddresses(order);
        allAddresses.forEach(function (address) {
            if (!addressHelpers.checkIfAddressStored(address, req.currentCustomer.addressBook.addresses)) {
                addressHelpers.saveAddress(address, req.currentCustomer, addressHelpers.generateAddressName(address));
            }
        });
    }

    if (order.getCustomerEmail()) {
        COHelpers.sendConfirmationEmail(order, req.locale.id);
    }

    // Reset usingMultiShip after successful Order placement
    req.session.privacyCache.set('usingMultiShipping', false);

    // TODO: Exposing a direct route to an Order, without at least encoding the orderID
    //  is a serious PII violation.  It enables looking up every customers orders, one at a
    //  time.
    res.json({
        error: false,
        orderID: order.orderNo,
        orderToken: order.orderToken,
        continueUrl: URLUtils.url('Order-Confirm').toString()
    });

    return next();
}

/**
 * Places an order for the given or current shopper basket.
 * @param {Object} req - The request object for the current controller request
 * @param {Object} res - The response object for the current controller request
 * @param {Function} next - Executes the next step in the controller chain
 * @param {dw.order.Basket=} basket - basket to use to create the order, default is current basket
 * @return {Object} The result of executing the next step in the controller chain
 */
function placeOrder(req, res, next, basket) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

    var currentBasket = basket || BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var validatedProducts = validationHelpers.validateProducts(currentBasket);
    if (validatedProducts.error) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
        res.json({
            error: true,
            errorMessage: validationOrderStatus.message
        });
        return next();
    }

    // Check to make sure there is a shipping address
    if (currentBasket.defaultShipment.shippingAddress === null) {
        res.json({
            error: true,
            errorStage: {
                stage: 'shipping',
                step: 'address'
            },
            errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
        });
        return next();
    }

    // Check to make sure billing address exists
    if (!currentBasket.billingAddress) {
        res.json({
            error: true,
            errorStage: {
                stage: 'payment',
                step: 'billingAddress'
            },
            errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
        });
        return next();
    }

    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Re-calculate the payments.
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
    if (calculatedPaymentTransactionTotal.error) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    // Creates a new order.
    var order = COHelpers.createOrder(currentBasket);
    if (!order) {
        res.json({
            error: true,
            errorMessage: Resource.msg('error.technical', 'checkout', null)
        });
        return next();
    }

    return finishPlaceOrder(req, res, next, order);
}

server.post('PrepareBasket', server.middleware.https, function (req, res, next) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var ShippingMgr = require('dw/order/ShippingMgr');
    var Transaction = require('dw/system/Transaction');

    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var data = JSON.parse(req.body);

    if (!data.sku) {
        // Missing product SKU
        res.json({
            status: 'fail'
        });
        return next();
    }

    // Get product to add to the basket
    var product = ProductMgr.getProduct(data.sku);

    if (!product) {
        // Product doesn't exist
        res.json({
            status: 'fail'
        });
        return next();
    }

    // Get product option model
    var optionModel = product.getOptionModel();
    if (data.options) {
        data.options.forEach(function (option) {
            var productOption = optionModel.getOption(option.id);
            if (productOption) {
                var productOptionValue = optionModel.getOptionValue(productOption, option.valueId);
                if (productOptionValue) {
                    // Update selected value for product option
                    optionModel.setSelectedOptionValue(productOption, productOptionValue);
                }
            }
        });
    }

    Transaction.wrap(function () {
        // Create a temporary basket for Buy Now
        var currentBasket = COHelpers.createBuyNowBasket();
        var shipment = currentBasket.defaultShipment;

        // Clear any existing line items out of the basket
        currentBasket.productLineItems.toArray().forEach(function (pli) {
            currentBasket.removeProductLineItem(pli);
        });

        // Create a product line item for the product, option model, and quantity
        var pli = currentBasket.createProductLineItem(product, optionModel, shipment);
        pli.setQuantityValue(data.quantity || 1);

        if (data.shippingMethod) {
            // Find shipping method for selected shipping option
            var applicableShippingMethods = ShippingMgr.getShipmentShippingModel(shipment).applicableShippingMethods;
            var shippingMethod = null;
            for (var i = 0; i < applicableShippingMethods.length; i++) {
                if (data.shippingMethod === applicableShippingMethods[i].ID) {
                    shippingMethod = applicableShippingMethods[i];
                }
            }

            if (shippingMethod) {
                // Set selected shipping method
                shipment.setShippingMethod(shippingMethod);
            }
        }

        // Calculate basket
        basketCalculationHelpers.calculateTotals(currentBasket);

        res.json({
            status: 'success',
            basketId: currentBasket.UUID
        });
    });

    return next();
});

/**
 *  Handle Ajax shipping address change for express checkout
 */
server.post('ShippingAddressChange', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');
    var Transaction = require('dw/system/Transaction');

    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');

    var data = JSON.parse(req.body);

    var currentBasket = data.basketId ? BasketMgr.getTemporaryBasket(data.basketId) : BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        // Basket required to complete express checkout
        res.json({
            status: 'fail'
        });
        return next();
    }

    var shipment = currentBasket.defaultShipment;
    if (!shipment) {
        // Shipment required to complete express checkout
        res.json({
            status: 'fail'
        });
        return next();
    }

    Transaction.wrap(function () {
        // Get or create shipment shipping address
        var shippingAddress = shipment.shippingAddress;
        if (!shippingAddress) {
            shippingAddress = shipment.createShippingAddress();
        }

        var name = data.shippingAddress.recipient;
        if (name) {
            // Update shopper name in basket
            currentBasket.customerName = name;

            var names = name.split(' ');
            shippingAddress.firstName = names.slice(0, -1).join(' ');
            shippingAddress.lastName = names.slice(-1).join(' ');
        }

        // Copy shipping contact information to shipping address
        var addressLine = data.shippingAddress.addressLine || [];
        shippingAddress.address1 = addressLine.length > 0 ? addressLine[0] : null;
        shippingAddress.address2 = addressLine.length > 1 ? addressLine[1] : null;
        shippingAddress.city = data.shippingAddress.city;
        shippingAddress.stateCode = data.shippingAddress.region;
        shippingAddress.postalCode = data.shippingAddress.postalCode;
        shippingAddress.countryCode = data.shippingAddress.country;

        // Update the selected shipping method if necessary
        shippingHelpers.selectShippingMethod(shipment, shipment.shippingMethod ? shipment.shippingMethod.ID : null);

        // Calculate basket
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Calculate updated payment request options
    var options = SalesforcePaymentRequest.format(COHelpers.calculateBasketPaymentRequestOptions(currentBasket));

    res.json({
        status: 'success',
        total: options.total,
        displayItems: options.displayItems,
        shippingOptions: options.shippingOptions
    });
    return next();
});

/**
 *  Handle Ajax shipping option change for express checkout
 */
server.post('ShippingOptionChange', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');
    var Transaction = require('dw/system/Transaction');

    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');

    var data = JSON.parse(req.body);

    var currentBasket = data.basketId ? BasketMgr.getTemporaryBasket(data.basketId) : BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        // Basket required to complete express checkout
        res.json({
            status: 'fail'
        });
        return next();
    }

    var shipment = currentBasket.defaultShipment;
    if (!shipment) {
        // Shipment required to complete express checkout
        res.json({
            status: 'fail'
        });
        return next();
    }

    // Find shipping method for selected shipping option
    var applicableShippingMethods = shippingHelpers.getApplicableShippingMethods(shipment);
    var shippingMethod = findShippingMethod(applicableShippingMethods, data.shippingOption.id);

    if (!shippingMethod) {
        // Shopper selected a shipping method that is not applicable
        res.json({
            status: 'fail'
        });
        return next();
    }

    Transaction.wrap(function () {
        // Set selected shipping method
        shippingHelpers.selectShippingMethod(shipment, shippingMethod.ID);

        // Calculate basket
        basketCalculationHelpers.calculateTotals(currentBasket);
    });

    // Calculate updated payment request options
    var options = SalesforcePaymentRequest.format(COHelpers.calculateBasketPaymentRequestOptions(currentBasket));

    res.json({
        status: 'success',
        total: options.total,
        displayItems: options.displayItems
    });
    return next();
});

/**
 *  Handle Ajax payment method event for express checkout
 */
server.post('PaymentMethod', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');

    var shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');

    var data = JSON.parse(req.body);

    var currentBasket = data.basketId ? BasketMgr.getTemporaryBasket(data.basketId) : BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        // Basket required to complete express checkout
        res.json({
            status: 'fail'
        });
        return next();
    }

    var shipment = currentBasket.defaultShipment;
    if (!shipment) {
        // Shipment required to complete express checkout
        res.json({
            status: 'fail'
        });
        return next();
    }

    if (!data.event.shippingAddress) {
        // Shipping address required to complete express checkout
        res.json({
            status: 'invalid_shipping_address'
        });
        return next();
    }

    if (!data.event.shippingOption) {
        // Shipping method required to complete express checkout
        res.json({
            status: 'fail'
        });
        return next();
    }

    Transaction.wrap(function () {
        // Update basket with billing information
        currentBasket.customerName = data.event.payerName;
        currentBasket.customerEmail = data.event.payerEmail;

        // Update billing address
        var billingAddress = currentBasket.billingAddress;
        if (!billingAddress) {
            billingAddress = currentBasket.createBillingAddress();
        }

        var names = data.event.paymentMethod.billing_details.name.split(' ');
        billingAddress.firstName = names.slice(0, -1).join(' ');
        billingAddress.lastName = names.slice(-1).join(' ');
        billingAddress.phone = data.event.payerPhone;
        billingAddress.address1 = data.event.paymentMethod.billing_details.address.line1;
        billingAddress.address2 = data.event.paymentMethod.billing_details.address.line2;
        billingAddress.city = data.event.paymentMethod.billing_details.address.city;
        billingAddress.stateCode = data.event.paymentMethod.billing_details.address.state;
        billingAddress.countryCode = data.event.paymentMethod.billing_details.address.country;
        billingAddress.postalCode = data.event.paymentMethod.billing_details.address.postal_code;

        // Update shipping address
        var shippingAddress = shipment.shippingAddress;
        if (!shippingAddress) {
            shippingAddress = shipment.createShippingAddress();
        }

        names = data.event.shippingAddress.recipient.split(' ');
        shippingAddress.firstName = names.slice(0, -1).join(' ');
        shippingAddress.lastName = names.slice(-1).join(' ');

        // Copy shipping contact information to shipping address
        var addressLine = data.event.shippingAddress.addressLine || [];
        shippingAddress.address1 = addressLine.length > 0 ? addressLine[0] : null;
        shippingAddress.address2 = addressLine.length > 1 ? addressLine[1] : null;
        shippingAddress.city = data.event.shippingAddress.city;
        shippingAddress.stateCode = data.event.shippingAddress.region;
        shippingAddress.postalCode = data.event.shippingAddress.postalCode;
        shippingAddress.countryCode = data.event.shippingAddress.country;
    });

    // Find shipping method for selected shipping option
    var applicableShippingMethods = shippingHelpers.getApplicableShippingMethods(shipment);
    var shippingMethod = findShippingMethod(applicableShippingMethods, data.event.shippingOption.id);
    if (shippingMethod) {
        res.json({
            status: 'success'
        });
    } else {
        res.json({
            status: 'fail',
            errorMessage: Resource.msg('error.shippingMethod.notApplicable', 'checkout', null)
        });
    }

    return next();
});

/**
 *  Handle Ajax billing form submission
 */
server.post(
    'SubmitBilling',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        var Locale = require('dw/util/Locale');
        var OrderModel = require('*/cartridge/models/order');

        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

        var viewData = {};
        var paymentForm = server.forms.getForm('billing');

        // verify billing form data
        var billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);
        var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);

        var formFieldErrors = [];
        if (Object.keys(billingFormErrors).length) {
            formFieldErrors.push(billingFormErrors);
        } else {
            viewData.address = {
                firstName: { value: paymentForm.addressFields.firstName.value },
                lastName: { value: paymentForm.addressFields.lastName.value },
                address1: { value: paymentForm.addressFields.address1.value },
                address2: { value: paymentForm.addressFields.address2.value },
                city: { value: paymentForm.addressFields.city.value },
                postalCode: { value: paymentForm.addressFields.postalCode.value },
                countryCode: { value: paymentForm.addressFields.country.value }
            };

            if (Object.prototype.hasOwnProperty.call(paymentForm.addressFields, 'states')) {
                viewData.address.stateCode = { value: paymentForm.addressFields.states.stateCode.value };
            }
        }

        if (Object.keys(contactInfoFormErrors).length) {
            formFieldErrors.push(contactInfoFormErrors);
        } else {
            viewData.phone = { value: paymentForm.contactInfoFields.phone.value };
        }

        if (formFieldErrors.length) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: formFieldErrors,
                serverErrors: [],
                error: true
            });
            return next();
        }

        var currentBasket = BasketMgr.getCurrentBasket();

        var billingData = viewData;

        if (!currentBasket) {
            delete billingData.paymentInformation;

            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        var billingAddress = currentBasket.billingAddress;

        Transaction.wrap(function () {
            if (!billingAddress) {
                billingAddress = currentBasket.createBillingAddress();
            }

            billingAddress.setFirstName(billingData.address.firstName.value);
            billingAddress.setLastName(billingData.address.lastName.value);
            billingAddress.setAddress1(billingData.address.address1.value);
            billingAddress.setAddress2(billingData.address.address2.value);
            billingAddress.setCity(billingData.address.city.value);
            billingAddress.setPostalCode(billingData.address.postalCode.value);
            if (Object.prototype.hasOwnProperty.call(billingData.address, 'stateCode')) {
                billingAddress.setStateCode(billingData.address.stateCode.value);
            }
            billingAddress.setCountryCode(billingData.address.countryCode.value);
            billingAddress.setPhone(billingData.phone.value);
        });

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
            req.session.privacyCache.set('usingMultiShipping', false);
            usingMultiShipping = false;
        }

        var currentLocale = Locale.getLocale(req.locale.id);
        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );
        var billingDetails = COHelpers.getBillingDetails(currentBasket);

        delete billingData.paymentInformation;

        res.json({
            order: basketModel,
            billingDetails: billingDetails,
            error: false
        });

        return next();
    }
);

/**
 *  Handle Ajax PayPal order approved
 */
server.post(
    'PayPalOrderApproved',
    server.middleware.https,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        var Locale = require('dw/util/Locale');
        var AccountModel = require('*/cartridge/models/account');
        var OrderModel = require('*/cartridge/models/order');

        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

        var viewData = {};

        var currentBasket = BasketMgr.getCurrentBasket();

        var billingData = viewData;

        if (!currentBasket) {
            delete billingData.paymentInformation;

            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        // Get PayPal order that was approved for the current basket
        var paypalOrder = paymentHelpers.getPayPalOrder(currentBasket);
        if (!paypalOrder) {
            res.json({
                error: true,
                fieldErrors: [],
                serverErrors: ['No PayPal order']
            });
            return next();
        }

        // Assume shopper should go to payment stage by default
        var checkoutStage = 'payment';

        Transaction.wrap(function () {
            // Copy payer name to basket
            currentBasket.customerName = paypalOrder.payer.givenName + ' ' + paypalOrder.payer.surname;

            if (req.currentCustomer.raw.registered) {
                // Copy registered customer profile email to basket
                currentBasket.customerEmail = req.currentCustomer.raw.profile.email;
            } else {
                // Copy payer email to basket
                currentBasket.customerEmail = paypalOrder.payer.emailAddress;
            }

            // Copy shipping address data from PayPal order
            var names = paypalOrder.shipping.fullName.split(' ');
            var shippingData = {
                address: {
                    firstName: names.slice(0, -1).join(' '),
                    lastName: names.slice(-1).join(' '),
                    address1: paypalOrder.shipping.addressLine1,
                    address2: paypalOrder.shipping.addressLine2,
                    city: paypalOrder.shipping.adminArea2,
                    postalCode: paypalOrder.shipping.postalCode,
                    stateCode: paypalOrder.shipping.adminArea1,
                    countryCode: paypalOrder.shipping.countryCode,
                    phone: paypalOrder.payer.phone || ''
                }
            };

            // Get basket currently selected shipping method, if there is one
            var shippingMethodID;
            if (currentBasket.defaultShipment && currentBasket.defaultShipment.shippingMethod) {
                shippingMethodID = currentBasket.defaultShipment.shippingMethod.ID;
                shippingData.shippingMethod = shippingMethodID;
            }

            // Copy the PayPal shipping address to the basket
            COHelpers.copyShippingAddressToShipment(shippingData, currentBasket.defaultShipment);

            // Copy billing address from shipping address
            COHelpers.copyBillingAddressToBasket(currentBasket.defaultShipment.shippingAddress, currentBasket);

            // Check if previously selected shipping method is still set on the basket
            if (!currentBasket.defaultShipment.shippingMethod || currentBasket.defaultShipment.shippingMethod.ID !== shippingMethodID) {
                // Shipping method was no longer applicable, so go to the shipping stage
                checkoutStage = 'shipping';
            }

            // Copy PayPal shipping data to the shipping form and validate it
            var shippingForm = session.forms.shipping;
            shippingForm.shippingAddress.addressFields.firstName.htmlValue = currentBasket.defaultShipment.shippingAddress.firstName;
            shippingForm.shippingAddress.addressFields.lastName.htmlValue = currentBasket.defaultShipment.shippingAddress.lastName;
            shippingForm.shippingAddress.addressFields.address1.htmlValue = currentBasket.defaultShipment.shippingAddress.address1;
            shippingForm.shippingAddress.addressFields.address2.htmlValue = currentBasket.defaultShipment.shippingAddress.address2;
            shippingForm.shippingAddress.addressFields.city.htmlValue = currentBasket.defaultShipment.shippingAddress.city;
            shippingForm.shippingAddress.addressFields.postalCode.htmlValue = currentBasket.defaultShipment.shippingAddress.postalCode;
            if (shippingForm.shippingAddress.addressFields.states && shippingForm.shippingAddress.addressFields.states.stateCode) {
                shippingForm.shippingAddress.addressFields.states.stateCode.htmlValue = currentBasket.defaultShipment.shippingAddress.stateCode;
            }
            shippingForm.shippingAddress.addressFields.country.htmlValue = currentBasket.defaultShipment.shippingAddress.countryCode;
            shippingForm.shippingAddress.addressFields.phone.htmlValue = currentBasket.defaultShipment.shippingAddress.phone || '';

            // Get shipping form errors
            var shippingFormErrors = COHelpers.validateShippingForm(server.forms.getForm('shipping').shippingAddress.addressFields);

            if (Object.keys(shippingFormErrors).length > 0) {
                // Shipping form has errors, so go to the shipping stage
                checkoutStage = 'shipping';
            }

            COHelpers.recalculateBasket(currentBasket);
        });

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
            req.session.privacyCache.set('usingMultiShipping', false);
            usingMultiShipping = false;
        }

        var currentLocale = Locale.getLocale(req.locale.id);
        var basketModel = new OrderModel(
            currentBasket,
            { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
        );
        var billingDetails = COHelpers.getBillingDetails(currentBasket);
        var accountModel = new AccountModel(req.currentCustomer);

        res.json({
            order: basketModel,
            billingDetails: billingDetails,
            customer: accountModel,
            redirectUrl: URLUtils.url('Checkout-Begin', 'stage', checkoutStage).toString(),
            error: false
        });

        return next();
    }
);

/**
 *  Handle Ajax payment form submit
 */
server.post(
    'SubmitPayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var HookMgr = require('dw/system/HookMgr');
        var Transaction = require('dw/system/Transaction');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');

        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

        var viewData = {};
        var paymentForm = server.forms.getForm('billing');

        var formFieldErrors = [];
        var paymentFormResult;
        if (HookMgr.hasHook('app.payment.form.processor.salesforce_payments')) {
            paymentFormResult = HookMgr.callHook('app.payment.form.processor.salesforce_payments',
                'processForm',
                req,
                paymentForm,
                viewData
            );
        } else {
            paymentFormResult = HookMgr.callHook('app.payment.form.processor.default_form_processor', 'processForm');
        }

        if (paymentFormResult.error && paymentFormResult.fieldErrors) {
            formFieldErrors.push(paymentFormResult.fieldErrors);
        }

        if (formFieldErrors.length || paymentFormResult.serverErrors) {
            // respond with form data and errors
            res.json({
                form: paymentForm,
                fieldErrors: formFieldErrors,
                serverErrors: paymentFormResult.serverErrors ? paymentFormResult.serverErrors : [],
                error: true
            });
            return next();
        }

        var currentBasket = BasketMgr.getCurrentBasket();

        var billingData = paymentFormResult.viewData;

        if (!currentBasket) {
            delete billingData.paymentInformation;

            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            delete billingData.paymentInformation;

            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString()
            });
            return next();
        }

        var billingForm = server.forms.getForm('billing');
        var result;

        if (HookMgr.hasHook('app.payment.processor.salesforce_payments')) {
            result = HookMgr.callHook('app.payment.processor.salesforce_payments',
                'Handle',
                currentBasket,
                billingData.paymentInformation
            );
        } else {
            result = HookMgr.callHook('app.payment.processor.default', 'Handle');
        }

        if (result.error) {
            delete billingData.paymentInformation;

            res.json({
                form: billingForm,
                fieldErrors: result.fieldErrors,
                serverErrors: result.serverErrors,
                error: true
            });
            return next();
        }

        // Calculate the basket
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        // Re-calculate the payments.
        var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
            currentBasket
        );

        if (calculatedPaymentTransaction.error) {
            res.json({
                form: paymentForm,
                fieldErrors: [],
                serverErrors: [Resource.msg('error.technical', 'checkout', null)],
                error: true
            });
            return next();
        }

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
            req.session.privacyCache.set('usingMultiShipping', false);
            usingMultiShipping = false;
        }

        hooksHelper('app.customer.subscription', 'subscribeTo', [paymentForm.subscribe.checked, currentBasket.customerEmail], function () {});

        delete billingData.paymentInformation;

        return placeOrder(req, res, next);
    }
);

server.post('PlaceOrder', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var HookMgr = require('dw/system/HookMgr');
    var URLUtils = require('dw/web/URLUtils');

    var data = JSON.parse(req.body);

    var currentBasket = data.basketId ? BasketMgr.getTemporaryBasket(data.basketId) : BasketMgr.getCurrentBasket();
    if (!currentBasket) {
        res.json({
            error: true,
            cartError: true,
            fieldErrors: [],
            serverErrors: [],
            redirectUrl: URLUtils.url('Cart-Show').toString()
        });
        return next();
    }

    var result;
    if (HookMgr.hasHook('app.payment.processor.salesforce_payments')) {
        result = HookMgr.callHook('app.payment.processor.salesforce_payments',
            'Handle',
            currentBasket,
            null
        );
    } else {
        result = HookMgr.callHook('app.payment.processor.default', 'Handle');
    }

    if (result.error) {
        res.json({
            fieldErrors: result.fieldErrors,
            serverErrors: result.serverErrors,
            error: true
        });
        return next();
    }

    return placeOrder(req, res, next, currentBasket);
});

/**
 *  Handle Ajax prepare payment intent and create order
 */
server.post('PrepareStripePayment',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var Resource = require('dw/web/Resource');
        var SalesforcePaymentsMgr = require('dw/extensions/payments/SalesforcePaymentsMgr');
        var Transaction = require('dw/system/Transaction');

        var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
        var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

        var data = JSON.parse(req.body);

        var currentBasket = data.basketId ? BasketMgr.getTemporaryBasket(data.basketId) : BasketMgr.getCurrentBasket();
        if (!currentBasket) {
            // Basket required to complete checkout
            res.json({
                status: 'fail'
            });
            return next();
        }

        var validatedProducts = validationHelpers.validateProducts(currentBasket);
        if (validatedProducts.error) {
            // Invalid products in basket
            res.json({
                status: 'fail'
            });
            return next();
        }

        var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
        if (validationOrderStatus.error) {
            // Invalid order
            res.json({
                status: 'fail',
                errorMessage: validationOrderStatus.message
            });
            return next();
        }

        // Check to make sure there is a shipping address
        if (currentBasket.defaultShipment.shippingAddress === null) {
            // Invalid shipping address
            res.json({
                status: 'fail',
                errorMessage: Resource.msg('error.no.shipping.address', 'checkout', null)
            });
            return next();
        }

        // Check to make sure billing address exists
        if (!currentBasket.billingAddress) {
            // Invalid billing address
            res.json({
                status: 'fail',
                errorMessage: Resource.msg('error.no.billing.address', 'checkout', null)
            });
            return next();
        }

        // Calculate the basket
        Transaction.wrap(function () {
            basketCalculationHelpers.calculateTotals(currentBasket);
        });

        // Re-calculate the payments.
        var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);
        if (calculatedPaymentTransactionTotal.error) {
            // Calculation error
            res.json({
                status: 'fail',
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }

        var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
        if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
            req.session.privacyCache.set('usingMultiShipping', false);
            usingMultiShipping = false;
        }

        var paymentForm = server.forms.getForm('billing');
        hooksHelper('app.customer.subscription', 'subscribeTo', [paymentForm.subscribe.checked, currentBasket.customerEmail], function () {});

        // Prepare a payment intent for the basket
        var result = Transaction.wrap(function () {
            return paymentHelpers.preparePaymentIntent(currentBasket, data.zoneId, data.paymentMethodType,
                data.stripeCustomerRequired, data.statementDescriptor, data.cardCaptureAutomatic);
        });

        if (result.error) {
            // Stripe error response
            res.json({
                status: 'fail',
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }

        var paymentIntent = result.getDetail('paymentintent');
        if (!paymentIntent) {
            // No created payment intent
            res.json({
                status: 'fail',
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }

        // Creates a new order.
        var order = COHelpers.createOrder(currentBasket);
        if (!order) {
            // Order could not be created
            res.json({
                status: 'fail',
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }

        // Associate the payment intent with the order
        Transaction.wrap(function () {
            SalesforcePaymentsMgr.updatePaymentIntent(paymentIntent, null, null, order.orderNo, {});
        });

        res.json({
            status: 'success',
            clientSecret: paymentIntent.clientSecret,
            orderNo: order.orderNo,
            orderToken: order.orderToken
        });
        return next();
    }
);

server.post('SubmitOrder',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var HookMgr = require('dw/system/HookMgr');
        var OrderMgr = require('dw/order/OrderMgr');
        var Resource = require('dw/web/Resource');
        var URLUtils = require('dw/web/URLUtils');

        var order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);
        if (!order) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString(),
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }

        var result;
        if (HookMgr.hasHook('app.payment.processor.salesforce_payments')) {
            result = HookMgr.callHook('app.payment.processor.salesforce_payments',
                'Handle',
                order,
                {}
            );
        } else {
            result = HookMgr.callHook('app.payment.processor.default', 'Handle');
        }

        if (result.error) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: result.fieldErrors,
                serverErrors: result.serverErrors,
                redirectUrl: URLUtils.url('Cart-Show').toString(),
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }

        return finishPlaceOrder(req, res, next, order);
    }
);

server.post('FailOrder',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Resource = require('dw/web/Resource');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');

        var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

        var order = OrderMgr.getOrder(req.form.orderID, req.form.orderToken);
        if (!order) {
            res.json({
                error: true,
                cartError: true,
                fieldErrors: [],
                serverErrors: [],
                redirectUrl: URLUtils.url('Cart-Show').toString(),
                errorMessage: Resource.msg('error.technical', 'checkout', null)
            });
            return next();
        }

        // Cancel or refund the payment if necessary
        paymentHelpers.reversePaymentIfNecessary(order);

        // Fail the order
        Transaction.wrap(function () { OrderMgr.failOrder(order, true); });

        res.json({});
        return next();
    }
);

module.exports = server.exports();
