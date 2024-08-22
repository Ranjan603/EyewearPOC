'use strict';

var server = require('server');
server.extend(module.superModule);
var configurationHelper = require('~/cartridge/scripts/configurationHelper');

server.append('Show', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    var AccountModel = require('*/cartridge/models/account');

    configurationHelper.appendConfiguration(res);
    var viewData = res.getViewData();

    if (viewData.commercePaymentsConfiguration.multiStepCheckoutEnabled) {
        var paymentMethods = AccountModel.getCustomerPaymentMethods(req.currentCustomer.raw);

        viewData.viewSavedPaymentsUrl = URLUtils.url('PaymentInstruments-ListPaymentMethods').toString();
        viewData.addPaymentUrl = null;
        if (paymentMethods.empty) {
            viewData.payment = null;
        } else {
            viewData.payment = paymentMethods[0];
        }
    }

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
