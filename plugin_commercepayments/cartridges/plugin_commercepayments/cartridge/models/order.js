'use strict';

var base = module.superModule;
var configurationHelper = require('~/cartridge/scripts/configurationHelper');

/**
 * Order class that represents the current order
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket/order
 * @param {Object} options - The current order's line items
 * @param {Object} options.config - Object to help configure the orderModel
 * @param {string} options.config.numberOfLineItems - helps determine the number of lineitems needed
 * @param {string} options.countryCode - the current request country code
 * @constructor
 */
function OrderModel(lineItemContainer, options) {
    base.call(this, lineItemContainer, options);

    if (this.orderNumber) {
        this.commercePaymentsOrder = configurationHelper.commercePaymentsOrder(lineItemContainer);
    }
}

OrderModel.prototype = Object.create(base.prototype);

module.exports = OrderModel;
