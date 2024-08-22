'use strict';

var PAYMENT_INTENT_KEY = '__commercepayments_paymentintent_';
var PAYPAL_ORDER_KEY = '__commercepayments_paypalorder_';

var Logger = require('dw/system/Logger');
var SalesforcePaymentsMgr = require('dw/extensions/payments/SalesforcePaymentsMgr');

/**
 * Gets the amount to be paid for the given basket or order. This is the total
 * gross price minus any applied gift certificates.
 * @param {Object} lineItemCtnr - either dw.orderBasket or dw.order.Order
 * @return {dw.value.Money} amount to be paid
 */
function getPaymentAmount(lineItemCtnr) {
    var amount = lineItemCtnr.totalGrossPrice;
    lineItemCtnr.giftCertificatePaymentInstruments.toArray().forEach(function (pi) {
        amount = amount.subtract(pi.paymentTransaction.amount);
    });
    return amount;
}

/**
 * Gets the SalesforcePaymentIntent for the given basket or order. Uses the one
 * cached in the current request if present, and retrieves it if not.
 * @param {Object} lineItemCtnr - either dw.order.Basket or dw.order.Order
 * @returns {dw.extensions.payments.SalesforcePaymentIntent} payment intent for the basket or order
 */
function getPaymentIntent(lineItemCtnr) {
    var cacheKey = PAYMENT_INTENT_KEY + lineItemCtnr.getUUID();

    if (request.custom[cacheKey]) {
        return request.custom[cacheKey];
    }

    try {
        var paymentIntent = SalesforcePaymentsMgr.getPaymentIntent(lineItemCtnr);
        request.custom[cacheKey] = paymentIntent;
        return paymentIntent;
    } catch (e) {
        Logger.error('Unable to obtain Stripe payment intent for basket: ' + lineItemCtnr.getUUID());
        return null;
    }
}

/**
 * Gets the SalesforcePayPalOrder for the given basket or order. Uses the one
 * cached in the current request if present, and retrieves it if not.
 * @param {Object} lineItemCtnr - either dw.order.Basket or dw.order.Order
 * @returns {dw.extensions.payments.SalesforcePayPalOrder} PayPal order for the basket or order
 */
function getPayPalOrder(lineItemCtnr) {
    var cacheKey = PAYPAL_ORDER_KEY + lineItemCtnr.getUUID();

    if (request.custom[cacheKey]) {
        return request.custom[cacheKey];
    }

    try {
        var paypalOrder = SalesforcePaymentsMgr.getPayPalOrder(lineItemCtnr);
        request.custom[cacheKey] = paypalOrder;
        return paypalOrder;
    } catch (e) {
        Logger.error('Unable to obtain PayPal order for basket: ' + lineItemCtnr.getUUID());
        return null;
    }
}

/**
 * Returns the Salesforce Payments-related payment instrument in the given basket, if there is one.
 * @param {dw.order.Basket} basket - basket whose Salesforce Payments payment instrument to get
 * @returns {dw.order.OrderPaymentInstrument} Salesforce Payments payment instrument
 */
function getPaymentInstrument(basket) {
    return basket.getPaymentInstruments('Salesforce Payments').toArray()[0];
}

/**
 * Removes any Salesforce Payments-related payment instruments from the given basket.
 * It's required to remove these payment instruments in order to check out a basket
 * using another payment processor.
 * @param {dw.order.Basket} basket - basket whose Salesforce Payments payment instruments to remove
 */
function removePaymentInstruments(basket) {
    var Transaction = require('dw/system/Transaction');

    Transaction.wrap(function () {
        basket.getPaymentInstruments('Salesforce Payments').toArray().forEach(function (pi) {
            basket.removePaymentInstrument(pi);
        });
    });
}

/**
 * Gets Buy now data.
 * @param {Object} product - Product Model
 * @returns {Object} an object containing basket data and payment request options
 */
function getBuyNowData(product) {
    var Money = require('dw/value/Money');
    var Resource = require('dw/web/Resource');

    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var price;
    if (product.price.type === 'tiered') {
        for (var i = 0, l = product.price.tiers.length; i < l; i++) {
            if (product.price.tiers[i].quantity <= product.selectedQuantity) {
                price = product.price.tiers[i].price.sales;
            }
        }
    } else if (product.price.type === 'range') {
        price = product.price.min.sales;
    } else {
        price = product.price.sales;
    }

    if (product.productType === 'master' || product.productType === 'set') {
        return {
            basketData: {},
            options: {
                currency: price.currency,
                total: {
                    label: Resource.msg('label.order.grand.total', 'confirmation', null),
                    amount: new Money(price.value, price.currency).multiply(product.selectedQuantity).decimalValue.toString()
                },
                displayItems: [],
                shippingOptions: []
            }
        };
    }

    return COHelpers.calculateBuyNowData(product.id, product.selectedQuantity, product.options);
}

/**
 * Return an object containing data to create a payment request button
 * @returns {Object} and object containing payment request information
 */
function createPaymentRequestData() {
    var BasketMgr = require('dw/order/BasketMgr');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');

    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var name = UUIDUtils.createUUID();
    var paymentRequestId = 'paymentrequest-' + name;
    var elementClass = 'salesforce-paymentrequest-element-' + name;
    var errorsClass = 'salesforce-paymentrequest-element-errors-' + name;

    // Create request for express checkout
    var payNowPaymentRequest = new SalesforcePaymentRequest(paymentRequestId, '.' + elementClass);
    payNowPaymentRequest.addInclude(SalesforcePaymentRequest.ELEMENT_TYPE_APPLEPAY);
    payNowPaymentRequest.addInclude(SalesforcePaymentRequest.ELEMENT_TYPE_PAYMENTREQUEST);
    payNowPaymentRequest.addInclude(SalesforcePaymentRequest.ELEMENT_TYPE_PAYPAL_EXPRESS);
    payNowPaymentRequest.addInclude(SalesforcePaymentRequest.ELEMENT_TYPE_VENMO_EXPRESS);
    payNowPaymentRequest.setPayPalShippingPreference(SalesforcePaymentRequest.PAYPAL_SHIPPING_PREFERENCE_GET_FROM_FILE);
    payNowPaymentRequest.setPayPalUserAction(SalesforcePaymentRequest.PAYPAL_USER_ACTION_CONTINUE);
    payNowPaymentRequest.setPayPalButtonsOptions({
        style: {
            height: 40,
            label: 'pay'
        }
    });

    // Calculate payment request options
    var options = COHelpers.calculatePayNowOptions();
    payNowPaymentRequest.setOptions(options);

    // Create request to display payment messages
    var total = 0;
    var currentBasket = BasketMgr.currentBasket;
    if (currentBasket) {
        var paymentAmount = getPaymentAmount(currentBasket);
        if (paymentAmount.available) {
            total = paymentAmount.value;
        }
    }

    var messagesPaymentRequestId = 'paymentrequest-' + name + '-messages';
    var messagesElementClass = 'salesforce-payment-messages-element-' + name;

    var messagesPaymentRequest = new SalesforcePaymentRequest(messagesPaymentRequestId, '.' + messagesElementClass);
    messagesPaymentRequest.setOptions(options);

    return {
        paymentRequestId: paymentRequestId,
        elementClass: elementClass,
        errorsClass: errorsClass,
        paymentRequest: payNowPaymentRequest,
        messagesElementClass: messagesElementClass,
        messagesPaymentRequest: messagesPaymentRequest,
        total: total
    };
}


/**
 * Reverses the payment in the given basket or order, if there is one.
 * @param {Object} lineItemCtnr - either dw.order.Basket or dw.order.Order
 */
function reversePaymentIfNecessary(lineItemCtnr) {
    var paymentIntent = getPaymentIntent(lineItemCtnr);
    if (paymentIntent) {
        if (paymentIntent.isRefundable()) {
            // Refund payment intent that has already been captured
            SalesforcePaymentsMgr.refundPaymentIntent(paymentIntent, null, {});
        } else if (paymentIntent.isCancelable()) {
            // Cancel payment intent that has not yet been canceled
            SalesforcePaymentsMgr.cancelPaymentIntent(paymentIntent, {});
        }
    }
}

/**
 * Prepare a payment intent to pay for the given basket.
 * @param {dw.order.Basket} basket - basket for checkout
 * @param {string} zoneId - id of the payment zone
 * @param {string} paymentMethodType - type of payment method for payment intent
 * @param {boolean} stripeCustomerRequired - if the payment intent must have a Stripe customer
 * @param {string=} statementDescriptor - optional statement descriptor to use for the payment
 * @param {boolean} cardCaptureAutomatic - if the capture method should be automatic for card payments
 * @returns {dw.system.Status} result of creating the payment intent
 */
function preparePaymentIntent(basket, zoneId, paymentMethodType, stripeCustomerRequired, statementDescriptor, cardCaptureAutomatic) {
    // Refund or cancel existing payment, if there is one
    reversePaymentIfNecessary(basket);

    // Remove any existing payment instruments from the basket
    removePaymentInstruments(basket);

    // Create a new payment intent with the latest basket calculation
    return SalesforcePaymentsMgr.createPaymentIntent(basket, basket.defaultShipment, zoneId,
        getPaymentAmount(basket), stripeCustomerRequired, {
            type: paymentMethodType,
            statementDescriptor: statementDescriptor,
            cardCaptureAutomatic: cardCaptureAutomatic
        });
}

module.exports = {
    getPaymentAmount: getPaymentAmount,
    getPaymentIntent: getPaymentIntent,
    getPayPalOrder: getPayPalOrder,
    getPaymentInstrument: getPaymentInstrument,
    removePaymentInstruments: removePaymentInstruments,
    getBuyNowData: getBuyNowData,
    createPaymentRequestData: createPaymentRequestData,
    reversePaymentIfNecessary: reversePaymentIfNecessary,
    preparePaymentIntent: preparePaymentIntent
};
