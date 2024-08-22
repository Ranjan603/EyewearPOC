'use strict';

var sinon = require('sinon');

function SalesforcePaymentRequest(id, selector) {
    return {
        id: id,
        getId: function () {
            return id;
        },
        selector: selector,
        getSelector: function () {
            return selector;
        },
        addInclude: sinon.stub(),
        setBasketData: sinon.stub(),
        setOptions: sinon.stub(),
        setPayPalButtonsOptions: sinon.stub(),
        setPayPalShippingPreference: sinon.stub(),
        setPayPalUserAction: sinon.stub()
    };
}
SalesforcePaymentRequest.ELEMENT_TYPE_APPLEPAY = 'applepay';
SalesforcePaymentRequest.ELEMENT_TYPE_PAYMENTREQUEST = 'paymentrequest';
SalesforcePaymentRequest.ELEMENT_TYPE_PAYPAL_EXPRESS = 'paypalexpress';
SalesforcePaymentRequest.ELEMENT_TYPE_VENMO_EXPRESS = 'venmoexpress';
SalesforcePaymentRequest.PAYPAL_SHIPPING_PREFERENCE_GET_FROM_FILE = 'GET_FROM_FILE';
SalesforcePaymentRequest.PAYPAL_SHIPPING_PREFERENCE_SET_PROVIDED_ADDRESS = 'SET_PROVIDED_ADDRESS';
SalesforcePaymentRequest.PAYPAL_USER_ACTION_CONTINUE = 'CONTINUE';
SalesforcePaymentRequest.PAYPAL_USER_ACTION_PAY_NOW = 'PAY_NOW';

module.exports = SalesforcePaymentRequest;
