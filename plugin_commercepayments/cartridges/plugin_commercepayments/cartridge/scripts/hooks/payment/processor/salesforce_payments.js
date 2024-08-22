'use strict';

var PaymentTransaction = require('dw/order/PaymentTransaction');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var SalesforcePaymentMethod = require('dw/extensions/payments/SalesforcePaymentMethod');
var SalesforcePaymentsMgr = require('dw/extensions/payments/SalesforcePaymentsMgr');
var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
var configurationHelper = require('~/cartridge/scripts/configurationHelper');
var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

/**
 * Verifies the SalesforcePayments payment intent is confirmed.
 * @param {dw.order.Basket} basket Current users's basket
 * @param {Object} paymentInformation - the payment information
 * @return {Object} returns an error object
 */
function Handle(basket, paymentInformation) {   // eslint-disable-line no-unused-vars
    var serverErrors = [];
    var error = false;
    var paymentInstrument;
    var paymentDetails;

    var paymentAmount = paymentHelpers.getPaymentAmount(basket);
    if (paymentAmount.value > 0) {
        // Check for Stripe payment intent
        var paymentIntent = paymentHelpers.getPaymentIntent(basket);
        if (paymentIntent) {
            // Validate Stripe payment
            var paymentIntentValidation = validationHelpers.validatePaymentIntent(basket);
            if (!paymentIntentValidation.error) {
                paymentInstrument = paymentIntentValidation.paymentInstrument;
                paymentIntent = paymentIntentValidation.paymentIntent;

                Transaction.wrap(function () {
                    // Update the details in the payment instrument
                    paymentDetails = paymentIntent.paymentMethod.getPaymentDetails(paymentInstrument);
                    SalesforcePaymentsMgr.setPaymentDetails(paymentInstrument, paymentDetails);

                    // Update the payment transaction
                    var paymentTransaction = paymentInstrument.paymentTransaction;
                    paymentTransaction.amount = paymentIntent.amount;
                    paymentTransaction.transactionID = paymentIntent.ID;

                    // "Auth" only if manual capture is enabled for credit card payment, everything else
                    // is "Capture".
                    var configuration = configurationHelper.getConfiguration();
                    if (paymentIntent.paymentMethod.type === SalesforcePaymentMethod.TYPE_CARD
                            && configuration.cardCaptureAutomatic === false) {
                        paymentTransaction.type = PaymentTransaction.TYPE_AUTH;
                    } else {
                        paymentTransaction.type = PaymentTransaction.TYPE_CAPTURE;
                    }
                });
            } else {
                error = true;
                serverErrors.push(
                    Resource.msg('error.technical', 'checkout', null)
                );
            }
        } else {
            // Validate PayPal order
            var paypalOrderValidation = validationHelpers.validatePayPalOrder(basket);
            if (!paypalOrderValidation.error) {
                paymentInstrument = paypalOrderValidation.paymentInstrument;
                var paypalOrder = paypalOrderValidation.paypalOrder;

                Transaction.wrap(function () {
                    // Update the details in the payment instrument
                    paymentDetails = paypalOrder.getPaymentDetails(paymentInstrument);
                    SalesforcePaymentsMgr.setPaymentDetails(paymentInstrument, paymentDetails);

                    // Update the payment transaction
                    var paymentTransaction = paymentInstrument.paymentTransaction;
                    paymentTransaction.amount = paypalOrder.amount;
                    paymentTransaction.transactionID = paypalOrder.ID;

                    // Type is always "Capture" for PayPal
                    paymentTransaction.type = PaymentTransaction.TYPE_CAPTURE;
                });
            } else {
                error = true;
                serverErrors.push(
                    Resource.msg('error.technical', 'checkout', null)
                );
            }
        }
    }

    return { fieldErrors: {}, serverErrors: serverErrors, error: error };
}

exports.Handle = Handle;
