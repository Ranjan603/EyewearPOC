'use strict';

var base = module.superModule;

var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

/**
 * Validates the payment intent of the basket
 * @param {dw.order.LineItemCtnr} lineItemCtnr - The current user's basket or order
 * @param {boolean} validateAmount - If the payment amount should be validated
 * @returns {Object} an error object
 */
function validatePaymentIntent(lineItemCtnr, validateAmount) {
    var paymentInstrument;
    var paymentIntent = paymentHelpers.getPaymentIntent(lineItemCtnr);
    if (paymentIntent) {
        paymentInstrument = paymentIntent.getPaymentInstrument(lineItemCtnr);
    }

    // Check if payment intent exists and has been confirmed
    var confirmed = paymentInstrument && paymentIntent && paymentIntent.confirmed;

    // If necessary, validate the amount of the payment intent matches
    if (confirmed && validateAmount) {
        confirmed &= paymentHelpers.getPaymentAmount(lineItemCtnr).equals(paymentIntent.amount);
    }

    return {
        error: !confirmed,
        paymentIntent: paymentIntent,
        paymentInstrument: paymentInstrument
    };
}

/**
 * Validates the PayPal order of the basket.
 * @param {dw.order.LineItemCtnr} lineItemCtnr - The current user's basket or order
 * @param {boolean} validateAmount - If the payment amount should be validated
 * @returns {Object} an error object
 */
function validatePayPalOrder(lineItemCtnr, validateAmount) {
    var paymentInstrument;
    var paypalOrder = paymentHelpers.getPayPalOrder(lineItemCtnr);
    if (paypalOrder) {
        paymentInstrument = paypalOrder.getPaymentInstrument(lineItemCtnr);
    }

    // Check if PayPal order exists and has been completed
    var confirmed = paymentInstrument && paypalOrder && paypalOrder.completed;

    // If necessary, validate the amount of the payment intent matches
    if (confirmed && validateAmount) {
        confirmed &= paymentHelpers.getPaymentAmount(lineItemCtnr).equals(paypalOrder.amount);
    }

    return {
        error: !confirmed,
        paypalOrder: paypalOrder,
        paymentInstrument: paymentInstrument
    };
}

module.exports = {
    validatePaymentIntent: validatePaymentIntent,
    validatePayPalOrder: validatePayPalOrder
};
Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
