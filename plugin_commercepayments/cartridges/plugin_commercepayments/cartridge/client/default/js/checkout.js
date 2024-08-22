'use strict';

var processInclude = require('base/util');

$(document).ready(function () {
    if ($('#checkout-main').hasClass('commercepayments')) {
        processInclude(require('./checkout/checkout'));
        processInclude(require('./checkout/payments'));
    } else {
        processInclude(require('base/checkout'));
    }
});
