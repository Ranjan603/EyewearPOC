'use strict';

var server = require('server');
server.extend(module.superModule);
var configurationHelper = require('~/cartridge/scripts/configurationHelper');

server.append('Show', function (req, res, next) {
    var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    var viewData = res.getViewData();
    if (viewData.product && viewData.product.productType !== 'set') {
        var buyNowData = paymentHelpers.getBuyNowData(viewData.product);

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

        viewData.product.paymentRequest = buyNowPaymentRequest;
        viewData.product.paymentMessagesRequest = messagesPaymentRequest;
        res.setViewData(viewData);
    }

    configurationHelper.appendConfiguration(res);
    next();
});

server.append('Variation', function (req, res, next) {
    var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    var viewData = res.getViewData();

    var buynow = paymentHelpers.getBuyNowData(viewData.product);

    buynow.options = SalesforcePaymentRequest.format(buynow.options);
    buynow.amounts = {
        amount: buynow.options.total.amount,
        paypalAmount: COHelpers.calculatePayPalAmount(buynow.options)
    };

    viewData.product.buynow = buynow;
    res.setViewData(viewData);

    configurationHelper.appendConfiguration(res);
    next();
});

server.append('ShowQuickView', function (req, res, next) {
    configurationHelper.appendConfiguration(res);
    next();
});

module.exports = server.exports();
