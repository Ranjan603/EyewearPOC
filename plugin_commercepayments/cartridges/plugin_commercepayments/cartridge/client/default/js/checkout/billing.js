'use strict';

var base = require('base/checkout/billing');
var scrollAnimate = require('base/components/scrollAnimate');

/**
 * Updates the billing address form values within payment forms
 * @param {Object} order - the order model
 */
function updateBillingAddressFormValues(order) {
    base.methods.updateBillingAddress(order);
}

/**
 * Updates the billing information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 * @param {Object} customer - customer model to use as basis of new truth
 * @param {Object} [options] - options
 */
function updateBillingInformation(order, customer) {
    base.methods.updateBillingAddressSelector(order, customer);

    // update billing address form
    updateBillingAddressFormValues(order);

    // update billing address summary and billing parts of order summary
    base.methods.updateBillingAddressSummary(order);
}

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
    // update payment details
    var $paymentSummary = $('.payment-details');
    var htmlToAppend = '';

    if (order.billing.payment) {
        if (order.billing.payment.selectedPaymentInstruments) {
            for (var i = 0; i < order.billing.payment.selectedPaymentInstruments.length; i++) {
                var paymentInstrument = order.billing.payment.selectedPaymentInstruments[i];
                if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
                    // Render a gift card payment instrument
                    htmlToAppend += '<span> ' + order.resources.giftCardTypeLabel
                        + '</span><div>'
                        + paymentInstrument.maskedGiftCertificateCode
                        + '</div><div><span>'
                        + '</span></div>';
                }
            }
        }

        if (order.billing.payment.paymentMethod) {
            htmlToAppend += '<div class="payment-method"><span>'
                + order.billing.payment.paymentMethod.name
                + '</span></div><div class="payment-credential">'
                + order.billing.payment.paymentMethod.credential
                + '</div>';
        }
    }

    $paymentSummary.empty().append(htmlToAppend);
}

/**
 * Triggers an event when the billing country is changed.
 */
function onBillingCountryChange() {
    $('.billing-address-block .billingCountry').on('change', function () {
        $('body').trigger('checkout:billingCountrySelected', {
            billingDetails: {
                address: {
                    country: $('.billing-address-block .billingCountry').val()
                }
            }
        });
    });
}

/**
 * Triggers an event when the billing address is changed from the saved address dropdown. This is the same event
 * that is triggered when the billing country is changed. See onBillingCountryChange().
 */
function onBillingAddressChange() {
    var previousBillingCountry;

    $('.billing-address-block #billingAddressSelector').on('focus', function () {
        previousBillingCountry = $('.billing-address-block .billingCountry').val();
    }).change(function () {
        var currentBillingCountry = $('.billing-address-block .billingCountry').val();

        // Trigger the payment method refresh only when a different billing country is selected
        if (previousBillingCountry !== currentBillingCountry) {
            // Update the previous one with the current
            previousBillingCountry = currentBillingCountry;
            // Trigger the event to refresh the payment methods
            $('body').trigger('checkout:billingCountrySelected', {
                billingDetails: {
                    address: {
                        country: currentBillingCountry
                    }
                }
            });
        }
    });
}

base.methods.updateBillingAddressFormValues = updateBillingAddressFormValues;
base.methods.updateBillingInformation = updateBillingInformation;
base.methods.updatePaymentInformation = updatePaymentInformation;
base.methods.clearCreditCardForm = function () {};
base.onBillingCountryChange = onBillingCountryChange;
base.onBillingAddressChange = onBillingAddressChange;
base.handleCreditCardNumber = function () {};
base.showPaymentErrorMessage = function () {
    $('.salesforce-payments-element-errors:not(:empty)').each(function () {
        scrollAnimate($(this));
    });
};

module.exports = base;
