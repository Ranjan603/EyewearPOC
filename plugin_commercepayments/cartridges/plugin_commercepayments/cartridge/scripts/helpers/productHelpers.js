'use strict';

var base = module.superModule;

/**
 * Renders the Product Details Page
 * @param {Object} querystring - query string parameters
 * @param {Object} reqPageMetaData - request pageMetaData object
 * @param {Object} usePageDesignerTemplates - wether to use the page designer version of the product detail templates, defaults to false
 * @returns {Object} contain information needed to render the product page
 */
function showProductPage() {
    var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    var result = base.showProductPage.apply(base, arguments);

    if (result.product && result.product.productType !== 'set') {
        var buyNowData = paymentHelpers.getBuyNowData(result.product);

        var buyNowPaymentRequest = new SalesforcePaymentRequest('buynow', '.salesforce-buynow-element');
        buyNowPaymentRequest.setBasketData(buyNowData.basketData);
        buyNowPaymentRequest.setOptions(buyNowData.options);
        buyNowPaymentRequest.setPayPalShippingPreference(SalesforcePaymentRequest.PAYPAL_SHIPPING_PREFERENCE_GET_FROM_FILE);
        buyNowPaymentRequest.setPayPalUserAction(SalesforcePaymentRequest.PAYPAL_USER_ACTION_CONTINUE);
        buyNowPaymentRequest.setPayPalButtonsOptions({
            style: {
                height: 40
            }
        });

        var messagesPaymentRequest = new SalesforcePaymentRequest('buynowMessages', '.salesforce-buynow-messages-element');
        messagesPaymentRequest.setOptions(buyNowData.options);

        result.product.paymentRequest = buyNowPaymentRequest;
        result.product.paymentMessagesRequest = messagesPaymentRequest;
    }

    return result;
}

module.exports = {
    showProductPage: showProductPage
};
Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
