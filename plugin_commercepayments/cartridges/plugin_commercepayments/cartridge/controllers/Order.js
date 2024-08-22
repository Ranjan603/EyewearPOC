'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Confirm', function (req, res, next) {
    var OrderMgr = require('dw/order/OrderMgr');
    var SalesforcePaymentMethod = require('dw/extensions/payments/SalesforcePaymentMethod');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');
    var configurationHelper = require('~/cartridge/scripts/configurationHelper');

    configurationHelper.appendConfiguration(res);
    var viewData = res.getViewData();

    var order = OrderMgr.getOrder(viewData.order.orderNumber);

    if (viewData.commercePaymentsConfiguration.multiStepCheckoutEnabled) {
        if (order && order.customer && !order.customer.registered) {
            var paymentIntent = paymentHelpers.getPaymentIntent(order);
            viewData.allowSavePaymentMethod = paymentIntent && paymentIntent.paymentMethod
                && paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_CARD;
        }
    }

    res.setViewData(viewData);
    next();
});

server.append('CreateAccount', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var Transaction = require('dw/system/Transaction');
        var SalesforcePaymentMethod = require('dw/extensions/payments/SalesforcePaymentMethod');
        var SalesforcePaymentsMgr = require('dw/extensions/payments/SalesforcePaymentsMgr');
        var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

        var viewData = res.getViewData();
        var passwordForm = viewData.passwordForm;
        var newCustomer = viewData.newCustomer;
        var order = viewData.order;

        if (!viewData.error) {
            Transaction.wrap(function () {
                SalesforcePaymentsMgr.onCustomerRegistered(order);

                if (passwordForm.savepaymentmethod.checked) {
                    var paymentIntent = paymentHelpers.getPaymentIntent(order);
                    var allowSavePaymentMethod = paymentIntent && paymentIntent.paymentMethod
                        && paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_CARD;

                    if (allowSavePaymentMethod) {
                        SalesforcePaymentsMgr.savePaymentMethod(newCustomer, paymentIntent.paymentMethod);
                    }
                }
            });
        }
    });
    next();
});

server.append('Details', function (req, res, next) {
    var configurationHelper = require('~/cartridge/scripts/configurationHelper');
    configurationHelper.appendConfiguration(res);
    next();
});

module.exports = server.exports();
