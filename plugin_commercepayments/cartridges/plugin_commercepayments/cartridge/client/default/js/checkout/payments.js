'use strict';

var scrollAnimate = require('base/components/scrollAnimate');

module.exports = {
    updatePaymentOptions: function () {
        if (window.sfpp) {
            sfpp.ready(function () {   // eslint-disable-line
                var element = $('.salesforce-payments-element');
                var errorElement = $('.salesforce-payments-element-errors');
                var payments = sfpp.get('payments');   // eslint-disable-line
                var stripePayment;

                // Update error message on change
                payments.on('change', function (event) {
                    if (event.error) {
                        // Inform the customer that there is an error.
                        errorElement.empty().text(event.error.message);
                    } else {
                        // Clear out error message
                        errorElement.empty();
                    }
                });

                // Enable/Disable Place Order button on payment method selection
                payments.on('select', function (event) {
                    if (event.type === 'paypal') {
                        // disable the Place Order button
                        $('body').trigger('checkout:disableButton', '.next-step-button button');
                    } else {
                        // enable the next:Place Order button
                        $('body').trigger('checkout:enableButton', '.next-step-button button');
                    }
                });

                payments.on('paypal.approve', function () {
                    payments.confirm().then(function () {
                        // Clear out error message
                        errorElement.empty();

                        // Trigger order placement
                        $('body').trigger('checkout:paypalOrderApproved');
                    },
                    function (err) {
                        // Inform the customer that there was an error.
                        errorElement.empty().text(err.message);
                        scrollAnimate(errorElement);
                    });
                });

                $('body').on('checkout:beforeShippingMethodSelected checkout:beforeGiftCertificateUpdate', function () {
                    element.spinner().start();
                });

                $('body').on('checkout:shippingMethodSelected checkout:giftCertificateUpdate', function (e, data) {
                    // Show/hide payment card based on payment amount
                    $('form.payment-method-form').toggle(data.paymentRequestOptions.total.amount > 0);

                    payments.refresh().finally(function () {
                        element.spinner().stop();
                    });
                });

                $('body').on('checkout:billingCountrySelected', function (e, data) {
                    // Update payment billing details and refresh payment methods when country changed
                    payments.updateBillingDetails(data.billingDetails);
                    element.spinner().start();
                    payments.refresh().finally(function () {
                        element.spinner().stop();
                    });
                });

                /**
                 * Prepares a Stripe PaymentIntent for confirmation, and creates an order.
                 * @param {Object} evt - event object with callback function
                 */
                function prepareStripePayment(evt) {
                    $.ajax({
                        url: element.data('preparestripepayment'),
                        method: 'POST',
                        contentType: 'application/json; charset=UTF-8',
                        data: JSON.stringify(evt),
                        success: function (response) {
                            // Keep track of payment and order information
                            stripePayment = response;

                            // Execute event callback
                            evt.updateWith(response);
                        },
                        error: function () {
                            stripePayment = null;
                            evt.updateWith({
                                status: 'fail'
                            });
                        }
                    });
                }

                payments.on('preparepaymentintent', prepareStripePayment);

                payments.on('prepareorder', function (evt) {
                    if (stripePayment) {
                        // Execute event callback
                        setTimeout(function () {
                            evt.updateWith(stripePayment);
                        });
                    } else {
                        // Prepare a Stripe payment and order
                        prepareStripePayment(evt);
                    }
                });

                // Confirm payment or display an error when the event is fired.
                $('body').on('checkout:confirmPayment', function (e, data) {
                    payments.updateBillingDetails(data.billingDetails);
                    payments.confirm().then(function () {
                        // Clear out error message
                        errorElement.empty();

                        // Execute callback supplied in event
                        data.callback(stripePayment);
                    },
                    function (err) {
                        // Handle the error
                        data.errorCallback(stripePayment);

                        // Inform the customer that there was an error.
                        errorElement.empty().text(err.message);
                        scrollAnimate(errorElement);
                    });
                });
            });
        }
    }
};
