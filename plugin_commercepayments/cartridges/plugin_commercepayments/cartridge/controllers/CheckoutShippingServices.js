'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('SelectShippingMethod', function (req, res, next) {
    var configurationHelper = require('~/cartridge/scripts/configurationHelper');

    var configuration = configurationHelper.getConfiguration();
    if (configuration.multiStepCheckoutEnabled) {
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');
            var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

            var viewData = res.getViewData();
            viewData.paymentRequestOptions = SalesforcePaymentRequest.format(COHelpers.calculatePayNowOptions());
            viewData.paypalAmount = COHelpers.calculatePayPalAmount(viewData.paymentRequestOptions);
            res.setViewData(viewData);
        });
    }
    next();
});

module.exports = server.exports();
