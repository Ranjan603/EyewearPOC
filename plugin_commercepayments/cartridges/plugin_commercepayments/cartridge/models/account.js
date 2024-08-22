'use strict';

var AccountModel = module.superModule;

var SalesforcePaymentMethod = require('dw/extensions/payments/SalesforcePaymentMethod');
var SalesforcePaymentsMgr = require('dw/extensions/payments/SalesforcePaymentsMgr');
var Resource = require('dw/web/Resource');

/**
 * Creates a plain object that contains saved payment methods
 * @param {dw.customer.Customer} customer - customer
 * @returns {Object} object that contains info about the customer's saved payment methods
 */
function getCustomerPaymentMethods(customer) {
    return SalesforcePaymentsMgr.getSavedPaymentMethods(customer).toArray().map(function (paymentMethod) {
        var method = {
            ID: paymentMethod.ID,
            type: Resource.msg('label.method.' + paymentMethod.type, 'payment', null),
            raw: paymentMethod
        };

        if (paymentMethod.type === SalesforcePaymentMethod.TYPE_CARD) {
            var brand = Resource.msgf('label.card.brand.' + paymentMethod.brand, 'payment', null);
            method.description = Resource.msgf('label.credential.card', 'payment', null, brand, paymentMethod.last4);
        } else if (paymentMethod.type === SalesforcePaymentMethod.TYPE_SEPA_DEBIT) {
            method.description = Resource.msgf('label.credential.sepa_debit', 'payment', null, paymentMethod.last4);
        }

        return method;
    });
}

AccountModel.getCustomerPaymentMethods = getCustomerPaymentMethods;

module.exports = AccountModel;
