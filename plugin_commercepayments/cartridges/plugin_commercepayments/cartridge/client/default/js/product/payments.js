/* global Promise */
'use strict';

module.exports = {
    updateBuyNowRequest: function () {
        if (window.sfpp) {
            sfpp.ready(function () {   // eslint-disable-line
                var element = $('.salesforce-buynow-element');
                var errorElement = $('.salesforce-buynow-element-errors');
                var buynow = sfpp.get('buynow');   // eslint-disable-line
                var buynowMessages = sfpp.get('buynowMessages');   // eslint-disable-line

                var paypalApproveUrl = element.data('paypalapprove');
                var basketId;
                var stripePayment;

                $('body').on('product:updateAddToCart', function (e, response) {
                    // Will be null value is Express Checkout is not activated
                    if (buynow) {
                        // Update payment request data and options
                        buynow.updateBasketData(response.product.buynow.basketData);
                        buynow.updatePaymentRequest(response.product.buynow.options);
                    }

                    // Update amount in messages
                    if (buynowMessages) {
                        buynowMessages.updateAmount(response.product.buynow.amounts);
                    }
                });

                // Will be null value is Express Checkout is not activated
                if (buynow) {
                    // Update error message on change
                    buynow.on('change', function (event) {
                        if (event.error) {
                            // Inform the customer that there is an error.
                            errorElement.empty().text(event.error.message);
                        } else {
                            // Clear out error message
                            errorElement.empty();
                        }
                    });

                    if (element.data('preparebasket')) {
                        buynow.on('preparebasket', function (evt) {
                            $.ajax({
                                url: element.data('preparebasket'),
                                method: 'POST',
                                contentType: 'application/json; charset=UTF-8',
                                data: JSON.stringify(evt),
                                success: function (response) {
                                    basketId = response.basketId;
                                    evt.updateWith(response);
                                },
                                error: function () {
                                    evt.updateWith({
                                        status: 'fail'
                                    });
                                }
                            });
                        });
                    }

                    if (element.data('shippingaddresschange')) {
                        buynow.on('shippingaddresschange', function (evt) {
                            $.ajax({
                                url: element.data('shippingaddresschange'),
                                method: 'POST',
                                contentType: 'application/json; charset=UTF-8',
                                data: JSON.stringify({
                                    basketId: basketId,
                                    shippingAddress: evt.shippingAddress
                                }),
                                success: function (response) {
                                    evt.updateWith(response);
                                },
                                error: function () {
                                    evt.updateWith({
                                        status: 'fail'
                                    });
                                }
                            });
                        });
                    }

                    if (element.data('shippingoptionchange')) {
                        buynow.on('shippingoptionchange', function (evt) {
                            $.ajax({
                                url: element.data('shippingoptionchange'),
                                method: 'POST',
                                contentType: 'application/json; charset=UTF-8',
                                data: JSON.stringify({
                                    basketId: basketId,
                                    shippingOption: evt.shippingOption
                                }),
                                success: function (response) {
                                    evt.updateWith(response);
                                },
                                error: function () {
                                    evt.updateWith({
                                        status: 'fail'
                                    });
                                }
                            });
                        });
                    }

                    if (element.data('paymentmethod')) {
                        buynow.on('paymentmethod', function (evt) {
                            $.ajax({
                                url: element.data('paymentmethod'),
                                method: 'POST',
                                contentType: 'application/json; charset=UTF-8',
                                data: JSON.stringify({
                                    basketId: basketId,
                                    event: evt
                                }),
                                success: function (response) {
                                    if (response.errorMessage) {
                                        // Inform the customer that there is an error.
                                        errorElement.empty().text(response.errorMessage);
                                    }
                                    evt.updateWith(response);
                                },
                                error: function () {
                                    evt.updateWith({
                                        status: 'fail'
                                    });
                                }
                            });
                        });
                    }

                    /**
                     * Prepares a Stripe PaymentIntent for confirmation, and creates an order.
                     * @param {Object} evt - event object with callback function
                     */
                    function prepareStripePayment(evt) { // eslint-disable-line
                        var data = Object.assign({}, evt, {
                            basketId: basketId
                        });

                        $.ajax({
                            url: element.data('preparestripepayment'),
                            method: 'POST',
                            contentType: 'application/json; charset=UTF-8',
                            data: JSON.stringify(data),
                            success: function (response) {
                                // Keep track of created payment and order information
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

                    buynow.on('preparepaymentintent', prepareStripePayment);

                    buynow.on('prepareorder', function (evt) {
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

                    buynow.on('payment', function () {
                        $.ajax({
                            url: element.data('submitorder'),
                            method: 'POST',
                            data: {
                                orderID: stripePayment.orderNo,
                                orderToken: stripePayment.orderToken
                            },
                            success: function (data) {
                                if (data.error) {
                                    // Inform the customer that there is an error.
                                    errorElement.empty().text(data.errorMessage);
                                } else {
                                    // Show the order confirmation page
                                    var redirect = $('<form>')
                                        .appendTo(document.body)
                                        .attr({
                                            method: 'POST',
                                            action: data.continueUrl
                                        });

                                    $('<input>')
                                        .appendTo(redirect)
                                        .attr({
                                            name: 'orderID',
                                            value: data.orderID
                                        });

                                    $('<input>')
                                        .appendTo(redirect)
                                        .attr({
                                            name: 'orderToken',
                                            value: data.orderToken
                                        });

                                    redirect.submit();
                                }
                            },
                            error: function (err) {
                                if (err.message) {
                                    // Inform the customer that there is an error.
                                    errorElement.empty().text(err.message);

                                    // Fail the shopper order
                                    $.ajax({
                                        url: element.data('failorder'),
                                        method: 'POST',
                                        data: {
                                            orderID: stripePayment.orderNo,
                                            orderToken: stripePayment.orderToken
                                        },
                                        success: function () {},
                                        error: function () {}
                                    });

                                    stripePayment = null;
                                }
                            }
                        });
                    });

                    buynow.on('paypal.approve', function () {
                        $.ajax({
                            url: paypalApproveUrl,
                            type: 'post',
                            data: '',
                            success: function (data) {
                                window.location.href = data.redirectUrl;
                            },
                            error: function (err) {
                                if (err.responseJSON && err.responseJSON.redirectUrl) {
                                    window.location.href = err.responseJSON.redirectUrl;
                                } else if (err.message) {
                                    // Inform the customer that there is an error.
                                    errorElement.empty().text(err.message);
                                }
                            }
                        });
                    });
                }
            });
        }
    }
};
