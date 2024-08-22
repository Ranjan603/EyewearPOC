'use strict';

/**
 * Places the given order.
 * @param {dw.order.Order} order - order whose payment succeeded
 * @return {dw.system.Status} returns status of the hook handling
 */
function asyncPaymentSucceeded(order) {
    var OrderMgr = require('dw/order/OrderMgr');
    var PaymentTransaction = require('dw/order/PaymentTransaction');
    var Status = require('dw/system/Status');
    var Transaction = require('dw/system/Transaction');
    var SalesforcePaymentMethod = require('dw/extensions/payments/SalesforcePaymentMethod');
    var SalesforcePaymentsMgr = require('dw/extensions/payments/SalesforcePaymentsMgr');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    request.setLocale(order.customerLocaleID);

    // Validate Stripe payment
    var paymentIntentValidation = validationHelpers.validatePaymentIntent(order, false);
    if (!paymentIntentValidation.error) {
        var paymentInstrument = paymentIntentValidation.paymentInstrument;
        var paymentIntent = paymentIntentValidation.paymentIntent;

        Transaction.wrap(function () {
            // Update the details in the payment instrument
            var paymentDetails = paymentIntent.paymentMethod.getPaymentDetails(paymentInstrument);
            SalesforcePaymentsMgr.setPaymentDetails(paymentInstrument, paymentDetails);

            // Update the payment transaction
            var paymentTransaction = paymentInstrument.paymentTransaction;
            paymentTransaction.amount = paymentIntent.amount;
            paymentTransaction.transactionID = paymentIntent.ID;
            if (paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_CARD) {
                paymentTransaction.type = PaymentTransaction.TYPE_AUTH;
            } else {
                paymentTransaction.type = PaymentTransaction.TYPE_CAPTURE;
            }
        });
    } else {
        // Cancel or refund the payment if necessary
        paymentHelpers.reversePaymentIfNecessary(order);

        // Fail the order
        OrderMgr.failOrder(order, true);

        return new Status(Status.ERROR);
    }

    // Handles payment authorization
    var handlePaymentResult = COHelpers.handleCommercePayments(order);
    if (handlePaymentResult.error) {
        return new Status(Status.ERROR);
    }

    // Places the order
    // This code path is under the Payment_Intent.succeed Webhook event, so fraud detection is not necessary
    var placeOrderResult = COHelpers.placeOrder(order, {});
    if (placeOrderResult.error) {
        return new Status(Status.ERROR);
    }

    COHelpers.sendConfirmationEmail(order, order.customerLocaleID);

    return new Status(Status.OK);
}

exports.asyncPaymentSucceeded = asyncPaymentSucceeded;
