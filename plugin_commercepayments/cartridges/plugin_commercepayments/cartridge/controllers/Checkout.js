'use strict';

var server = require('server');
server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.prepend('Begin', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var configurationHelper = require('~/cartridge/scripts/configurationHelper');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    var currentBasket = BasketMgr.getCurrentBasket();
    var configuration = configurationHelper.getConfiguration();

    if (currentBasket && !configuration.multiStepCheckoutEnabled) {
        // Remove Salesforce Payments payment instruments if multi-step checkout is not using Salesforce Payments
        paymentHelpers.removePaymentInstruments(currentBasket);
    }
    next();
});

// Return from async payment
server.get(
    'Async',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        var OrderMgr = require('dw/order/OrderMgr');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');

        var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');
        var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');

        var orderNo = req.querystring.orderNo;
        var token = req.querystring.token;
        if (!orderNo || !token) {
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }

        var order = OrderMgr.getOrder(orderNo);
        if (!order || token !== order.orderToken || order.customer.ID !== req.currentCustomer.raw.ID) {
            res.redirect(URLUtils.url('Home-Show'));
            return next();
        }

        var paymentValidation = validationHelpers.validatePaymentIntent(order, false);
        if (!paymentValidation.error) {
            res.render('/_commercepayments/checkout/returnFromAsyncPayment', {
                continueUrl: URLUtils.url('Order-Confirm').toString(),
                orderID: order.orderNo,
                orderToken: order.orderToken
            });

            return next();
        }

        // Cancel or refund the payment if necessary
        paymentHelpers.reversePaymentIfNecessary(order);

        // Fail the order
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });

        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'error', 'payment'));
        return next();
    }
);

server.append('Begin', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');
    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');
    var configurationHelper = require('~/cartridge/scripts/configurationHelper');

    configurationHelper.appendConfiguration(res);
    var viewData = res.getViewData();

    if (viewData.commercePaymentsConfiguration.multiStepCheckoutEnabled) {
        var inputFieldsInvalidStyle = {
            style: {
                invalid: {
                    color: '#495057'
                }
            }
        };

        var multiStepPaymentRequest = new SalesforcePaymentRequest('payments', '.salesforce-payments-element');
        multiStepPaymentRequest.setReturnController('Checkout-Async');
        multiStepPaymentRequest.addExclude(SalesforcePaymentRequest.ELEMENT_TYPE_APPLEPAY);
        multiStepPaymentRequest.addExclude(SalesforcePaymentRequest.ELEMENT_TYPE_PAYMENTREQUEST);
        multiStepPaymentRequest.addExclude(SalesforcePaymentRequest.ELEMENT_TYPE_PAYPAL_EXPRESS);
        multiStepPaymentRequest.addExclude(SalesforcePaymentRequest.ELEMENT_TYPE_VENMO_EXPRESS);
        multiStepPaymentRequest.setStripeCreateElementOptions(SalesforcePaymentRequest.ELEMENT_CARD_CVC, inputFieldsInvalidStyle);
        multiStepPaymentRequest.setStripeCreateElementOptions(SalesforcePaymentRequest.ELEMENT_CARD_EXPIRY, inputFieldsInvalidStyle);
        multiStepPaymentRequest.setStripeCreateElementOptions(SalesforcePaymentRequest.ELEMENT_CARD_NUMBER, inputFieldsInvalidStyle);
        multiStepPaymentRequest.setStripeCreateElementOptions(SalesforcePaymentRequest.ELEMENT_IBAN, inputFieldsInvalidStyle);
        multiStepPaymentRequest.setPayPalShippingPreference(SalesforcePaymentRequest.PAYPAL_SHIPPING_PREFERENCE_SET_PROVIDED_ADDRESS);
        multiStepPaymentRequest.setPayPalUserAction(SalesforcePaymentRequest.PAYPAL_USER_ACTION_PAY_NOW);
        multiStepPaymentRequest.setPayPalButtonsOptions({
            style: {
                height: 40
            }
        });

        viewData.multiStepPaymentRequest = multiStepPaymentRequest;

        var currentBasket = BasketMgr.getCurrentBasket();
        if (currentBasket && viewData.currentStage === 'payment' && req.querystring.error === 'payment') {
            var paymentValidation = validationHelpers.validatePaymentIntent(currentBasket);
            if (paymentValidation.error) {
                viewData.paymentError = Resource.msg('error.payment.failed', 'checkout', null);
            }
        }
    }

    if (viewData.commercePaymentsConfiguration.expressCheckoutEnabled ||
        viewData.commercePaymentsConfiguration.multiStepCheckoutEnabled) {
        viewData.paymentRequestData = paymentHelpers.createPaymentRequestData();
    }

    res.setViewData(viewData);
    next();
});


module.exports = server.exports();
