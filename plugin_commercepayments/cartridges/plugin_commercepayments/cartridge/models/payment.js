'use strict';

var base = module.superModule;

var SalesforcePaymentMethod = require('dw/extensions/payments/SalesforcePaymentMethod');
var SalesforcePaymentsMgr = require('dw/extensions/payments/SalesforcePaymentsMgr');
var SalesforcePayPalOrder = require('dw/extensions/payments/SalesforcePayPalOrder');
var Resource = require('dw/web/Resource');

var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

/**
 * Creates an object containing payment method information.
 * @param {dw.extensions.payments.SalesforcePaymentMethod} paymentMethod - The payment method whose information to add to the model
 * @returns {Object} Object containing payment method information
 */
function getStripePaymentMethod(paymentMethod) {
    if (paymentMethod.type === SalesforcePaymentMethod.TYPE_CARD) {
        var brand = Resource.msgf('label.card.brand.' + paymentMethod.brand, 'payment', null);
        return {
            name: Resource.msg('label.method.card', 'payment', null),
            credential: Resource.msgf('label.credential.card', 'payment', null, brand, paymentMethod.last4)
        };
    }

    if (paymentMethod.type === SalesforcePaymentMethod.TYPE_EPS) {
        // get the label for the bank but fall back to the bank key if label not found
        var epsBankName = Resource.msgf('label.credential.eps.' + paymentMethod.bank, 'payment', paymentMethod.bank);
        return {
            name: Resource.msg('label.method.eps', 'payment', null),
            credential: Resource.msgf('label.credential.eps', 'payment', null, epsBankName)
        };
    }

    if (paymentMethod.type === SalesforcePaymentMethod.TYPE_IDEAL) {
        // get the label for the bank but fall back to the bank key if label not found
        var idealBankName = Resource.msgf('label.credential.ideal.' + paymentMethod.bank, 'payment', paymentMethod.bank);
        return {
            name: Resource.msg('label.method.ideal', 'payment', null),
            credential: Resource.msgf('label.credential.ideal', 'payment', null, idealBankName)
        };
    }

    if (paymentMethod.type === SalesforcePaymentMethod.TYPE_SEPA_DEBIT) {
        return {
            name: Resource.msg('label.method.sepa_debit', 'payment', null),
            credential: Resource.msgf('label.credential.sepa_debit', 'payment', null, paymentMethod.last4)
        };
    }

    if (paymentMethod.type === SalesforcePaymentMethod.TYPE_BANCONTACT) {
        return {
            name: Resource.msg('label.method.bancontact', 'payment', null),
            credential: Resource.msgf('label.credential.bancontact', 'payment', null, paymentMethod.bankName, paymentMethod.last4)
        };
    }

    if (paymentMethod.type === SalesforcePaymentMethod.TYPE_KLARNA) {
        return {
            name: Resource.msg('label.method.klarna', 'payment', null),
            credential: Resource.msgf('label.credential.klarna.paymentMethodCategory.' + paymentMethod.paymentMethodCategory, 'payment', null)
        };
    }

    if (paymentMethod.type === SalesforcePaymentMethod.TYPE_AFTERPAY_CLEARPAY) {
        return {
            name: Resource.msg('label.method.afterpay_clearpay', 'payment', null),
            credential: ''
        };
    }

    return {
        name: Resource.msg('label.method.' + paymentMethod.type, 'payment', null),
        credential: ''
    };
}

/**
 * Creates an object containing payment method information.
 * @param {dw.extensions.payments.SalesforcePayPalOrder} order - The PayPal order whose information to add to the model
 * @returns {Object} Object containing payment method information
 */
function getPayPalPaymentMethod(order) {
    var method = {
        name: Resource.msg('label.method.paypal', 'payment', null)
    };
    if (order.payer) {
        method.credential = Resource.msgf('label.credential.paypal', 'payment', null, order.payer.emailAddress);
    }
    if (order.captureID) {
        method.paymentId = Resource.msgf('label.paymentid.paypal', 'payment', null, order.captureID);
        method.paymentIdHelpText = Resource.msg('helptext.paymentid.paypal', 'payment', null);
    }
    return method;
}

/**
 * Creates an object containing payment method information.
 * @param {dw.extensions.payments.SalesforcePaymentDetails} details - Details to the Salesforce Payments payment
 * @returns {Object} Object containing payment method information
 */
function getPaymentMethod(details) {
    if (details.type === SalesforcePaymentMethod.TYPE_CARD) {
        var brand = Resource.msgf('label.card.brand.' + details.brand, 'payment', null);
        return {
            name: Resource.msg('label.method.card', 'payment', null),
            credential: Resource.msgf('label.credential.card', 'payment', null, brand, details.last4)
        };
    }

    if (details.type === SalesforcePaymentMethod.TYPE_EPS) {
        // get the label for the bank but fall back to the bank key if label not found
        var epsBankName = Resource.msgf('label.credential.eps.' + details.bank, 'payment', details.bank);
        return {
            name: Resource.msg('label.method.eps', 'payment', null),
            credential: Resource.msgf('label.credential.eps', 'payment', null, epsBankName)
        };
    }

    if (details.type === SalesforcePaymentMethod.TYPE_IDEAL) {
        // get the label for the bank but fall back to the bank key if label not found
        var idealBankName = Resource.msgf('label.credential.ideal.' + details.bank, 'payment', details.bank);
        return {
            name: Resource.msg('label.method.ideal', 'payment', null),
            credential: Resource.msgf('label.credential.ideal', 'payment', null, idealBankName)
        };
    }

    if (details.type === SalesforcePaymentMethod.TYPE_SEPA_DEBIT) {
        return {
            name: Resource.msg('label.method.sepa_debit', 'payment', null),
            credential: Resource.msgf('label.credential.sepa_debit', 'payment', null, details.last4)
        };
    }

    if (details.type === SalesforcePaymentMethod.TYPE_BANCONTACT) {
        return {
            name: Resource.msg('label.method.bancontact', 'payment', null),
            credential: Resource.msgf('label.credential.bancontact', 'payment', null, details.bankName, details.last4)
        };
    }

    if (details.type === SalesforcePaymentMethod.TYPE_KLARNA) {
        return {
            name: Resource.msg('label.method.klarna', 'payment', null),
            credential: Resource.msgf('label.credential.klarna.paymentMethodCategory.' + details.paymentMethodCategory, 'payment', null)
        };
    }

    if (details.type === SalesforcePaymentMethod.TYPE_AFTERPAY_CLEARPAY) {
        return {
            name: Resource.msg('label.method.afterpay_clearpay', 'payment', null),
            credential: ''
        };
    }

    if (details.type === SalesforcePayPalOrder.TYPE_PAYPAL) {
        var method = {
            name: Resource.msg('label.method.paypal', 'payment', null)
        };
        if (details.payerEmailAddress) {
            method.credential = Resource.msgf('label.credential.paypal', 'payment', null, details.payerEmailAddress);
        }
        if (details.captureID) {
            method.paymentId = Resource.msgf('label.paymentid.paypal', 'payment', null, details.captureID);
            method.paymentIdHelpText = Resource.msg('helptext.paymentid.paypal', 'payment', null);
        }
        return method;
    }

    return {
        name: Resource.msg('label.method.' + details.type, 'payment', null),
        credential: ''
    };
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
    base.call(this, currentBasket, currentCustomer, countryCode);
    var paymentInstrument = paymentHelpers.getPaymentInstrument(currentBasket);
    if (paymentInstrument) {
        var paymentDetails = SalesforcePaymentsMgr.getPaymentDetails(paymentInstrument);
        if (paymentDetails) {
            this.paymentMethod = getPaymentMethod(paymentDetails);
        }
    }
    if (!this.paymentMethod) {
        var paymentIntent = paymentHelpers.getPaymentIntent(currentBasket);
        if (paymentIntent && paymentIntent.paymentMethod) {
            this.paymentMethod = getStripePaymentMethod(paymentIntent.paymentMethod);
        } else {
            var paypalOrder = paymentHelpers.getPayPalOrder(currentBasket);
            if (paypalOrder) {
                this.paymentMethod = getPayPalPaymentMethod(paypalOrder);
            }
        }
    }
}

Payment.prototype = Object.create(base.prototype);

module.exports = Payment;
