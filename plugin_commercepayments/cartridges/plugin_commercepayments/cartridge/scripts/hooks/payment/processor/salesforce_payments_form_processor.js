'use strict';

var Resource = require('dw/web/Resource');

/**
 * Update the view data with information from the confirmed Salesforce Payments payment intent.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
    var BasketMgr = require('dw/order/BasketMgr');
    var paymentHelpers = require('*/cartridge/scripts/helpers/paymentHelpers');

    var viewData = viewFormData;
    var currentBasket = BasketMgr.getCurrentBasket();
    var paymentAmount = paymentHelpers.getPaymentAmount(currentBasket);
    if (paymentAmount.value > 0) {
        // Check for a Stripe payment
        var paymentIntent = paymentHelpers.getPaymentIntent(currentBasket);
        if (paymentIntent) {
            // Validate Stripe payment intent
            if (!paymentIntent.paymentMethod) {
                return {
                    error: true,
                    serverErrors: [Resource.msg('error.technical', 'checkout', null)]
                };
            }

            var method = Resource.msg('label.method.' + paymentIntent.paymentMethod.type, 'payment', null);

            viewData.paymentMethod = {
                value: method,
                htmlName: method
            };

            viewData.paymentInformation = {
                method: {
                    value: method,
                    htmlName: method
                }
            };

            viewData.saveCard = false;
        } else {
            // Check for a PayPal order
            var paypalOrder = paymentHelpers.getPayPalOrder(currentBasket);
            if (!paypalOrder) {
                return {
                    error: true,
                    serverErrors: [Resource.msg('error.technical', 'checkout', null)]
                };
            }
        }
    }

    return {
        error: false,
        viewData: viewData
    };
}

exports.processForm = processForm;
