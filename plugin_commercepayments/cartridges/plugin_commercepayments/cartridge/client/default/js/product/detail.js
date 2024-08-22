'use strict';

var base = require('base/product/detail');
var baseUpdateAddToCartEnableDisableOtherElements = base.methods.updateAddToCartEnableDisableOtherElements;

/**
 * Enable/disable Buy Now buttons based on product availability
 * @param {boolean} enableOrDisable - true or false
 */
function updateAddToCartEnableDisableOtherElements(enableOrDisable) {
    baseUpdateAddToCartEnableDisableOtherElements.call(this, enableOrDisable);
    $('.salesforce-buynow-element').attr('disabled', enableOrDisable);
}

base.methods.updateAddToCartEnableDisableOtherElements = updateAddToCartEnableDisableOtherElements;

module.exports = base;
