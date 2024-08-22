'use strict';

/**
 * This model extends the default totals model, adding a giftCertificatesApplied property for display in
 * various areas where order totals are displayed.
 */

var formatMoney = require('dw/util/StringUtils').formatMoney;

/**
 * Override for customization of totals object, adding custom logic.
 * @param {Object} lineItemContainer Line item container object used in the construction of a regular totals model
 * @returns {module.superModule} Customized totals model, with the added custom methods
 */
function customTotals(lineItemContainer) {
    var ParentTotals = module.superModule;
    var totals = new ParentTotals(lineItemContainer);

    var giftCertificatesApplied;
    if (lineItemContainer) {
        // Calculate the sub total of applied gift certificates
        lineItemContainer.giftCertificatePaymentInstruments.toArray().forEach(function (pi) {
            if (pi.paymentTransaction && pi.paymentTransaction.amount && pi.paymentTransaction.amount.available) {
                if (giftCertificatesApplied) {
                    giftCertificatesApplied = giftCertificatesApplied.add(pi.paymentTransaction.amount);
                } else {
                    giftCertificatesApplied = pi.paymentTransaction.amount;
                }
            }
        });

        if (giftCertificatesApplied) {
            // Update grand total to account for applied gift cards
            var totalGrossPrice = lineItemContainer.totalGrossPrice.subtract(giftCertificatesApplied);
            totals.grandTotal = totalGrossPrice.available ? formatMoney(totalGrossPrice) : '-';
        }
    }

    if (giftCertificatesApplied) {
        // Show applied gift certificates as a reduction of total
        giftCertificatesApplied = giftCertificatesApplied.multiply(-1);

        Object.defineProperty(totals, 'giftCertificatesApplied', {
            value: {
                value: giftCertificatesApplied.value,
                formatted: formatMoney(giftCertificatesApplied)
            },
            writable: false,
            enumerable: true
        });
    } else {
        Object.defineProperty(totals, 'giftCertificatesApplied', {
            value: {
                value: 0,
                formatted: '0'
            },
            writable: false,
            enumerable: true
        });
    }

    return totals;
}

module.exports = customTotals;
