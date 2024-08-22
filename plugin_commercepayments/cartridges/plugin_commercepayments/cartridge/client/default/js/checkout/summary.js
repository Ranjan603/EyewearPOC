'use strict';

var base = require('base/checkout/summary');
var baseUpdateTotals = base.updateTotals;

/**
 * updates the totals summary
 * @param {Array} totals - the totals data
 */
function updateTotals(totals) {
    baseUpdateTotals.call(this, totals);

    $('.gift-certificates-applied-total').text(totals.giftCertificatesApplied.formatted);

    if (totals.giftCertificatesApplied.value < 0) {
        $('.gift-certificates-applied').removeClass('hide-gift-certificates-applied');
    } else {
        $('.gift-certificates-applied').addClass('hide-gift-certificates-applied');
    }
}

base.updateTotals = updateTotals;

module.exports = base;
