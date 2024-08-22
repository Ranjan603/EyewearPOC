'use strict';

var base = module.superModule;

var BasketMgr = require('dw/order/BasketMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var ShippingMgr = require('dw/order/ShippingMgr');
var TaxMgr = require('dw/order/TaxMgr');
var Logger = require('dw/system/Logger');
var SalesforcePaymentRequest = require('dw/extensions/payments/SalesforcePaymentRequest');

var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');
var TotalsModel = require('*/cartridge/models/totals');

/**
 * validates the order has payment instruments if its total is nonzero.
 * @param {dw.order.Order} order - the order object
 * @returns {Object} an error object
 */
function handleCommercePayments(order) {
    var result = {};

    var total = order.totalNetPrice;
    if (total.available && total.value !== 0.00) {
        var paymentInstruments = order.paymentInstruments;

        if (paymentInstruments.length === 0) {
            // In this case there are no payment instruments so there can be no
            // payment to cancel or refund for the order
            Transaction.wrap(function () { OrderMgr.failOrder(order, true); });
            result.error = true;
        }
    }

    return result;
}

/**
 * Calculates payment request options for the given basket.
 * @param {dw.order.Basket} basket - basket whose options to calculate
 * @returns {Object} object containing payment request options
 */
function calculateBasketPaymentRequestOptions(basket) {
    if (!basket) {
        // Need basket for options
        return {};
    }

    var shipment = basket.defaultShipment;
    if (!shipment) {
        // Need shipment for options
        return {};
    }

    var totals = new TotalsModel(basket);

    // Subtotal
    var displayItems = [{
        label: Resource.msg('label.order.subtotal', 'confirmation', null),
        amount: basket.getAdjustedMerchandizeTotalPrice(false).decimalValue.toString()
    }];

    // Order Discount
    if (totals.orderLevelDiscountTotal.value !== 0) {
        displayItems.push({
            label: Resource.msg('label.order.discount', 'common', null),
            amount: '-' + totals.orderLevelDiscountTotal.value.toString()
        });
    }

    // Shipping Cost
    displayItems.push({
        label: Resource.msg('label.order.shipping.cost', 'confirmation', null),
        amount: basket.shippingTotalPrice.decimalValue.toString()
    });

    // Shipping Discount
    if (totals.shippingLevelDiscountTotal.value !== 0) {
        displayItems.push({
            label: Resource.msg('label.shipping.discount', 'common', null),
            amount: '-' + totals.shippingLevelDiscountTotal.value.toString()
        });
    }

    // Sales Tax
    if (basket.totalTax.value !== 0 && TaxMgr.taxationPolicy !== TaxMgr.TAX_POLICY_GROSS) {
        displayItems.push({
            label: Resource.msg('label.order.sales.tax', 'confirmation', null),
            amount: basket.totalTax.decimalValue.toString()
        });
    }

    // Grand Total
    var total = {
        label: Resource.msg('label.order.grand.total', 'confirmation', null),
        amount: basket.totalGrossPrice.decimalValue.toString()
    };

    // Shipping Methods
    var shippingMethods = shippingHelpers.getApplicableShippingMethods(shipment);
    shippingMethods.sort(function (s1, s2) {
        // Sort currently selected shipping method first in the list
        if (s1.ID === s2.ID) {
            return 0;
        }
        return s1.selected ? -1 : 1;
    });
    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
    var shippingOptions = shippingMethods.map(function (shippingMethodModel) {
        var shippingMethod = ShippingMgr.allShippingMethods.toArray().find(function (method) {
            return method.ID === shippingMethodModel.ID;
        });
        return {
            id: shippingMethodModel.ID,
            label: shippingMethodModel.displayName,
            detail: shippingMethodModel.estimatedArrivalTime,
            amount: shipmentShippingModel.getShippingCost(shippingMethod).amount.decimalValue.toString()
        };
    });

    return {
        currency: basket.currencyCode,
        total: total,
        displayItems: displayItems,
        shippingOptions: shippingOptions
    };
}

/**
 * calculates basket data and payment request options for a buy now button
 * @param {string} sku - SKU of the product to buy, must be orderable
 * @param {number} quantity - quantity of the product to buy
 * @param {Array=} options - array of options for the product, and their values
 * @returns {Object} object containing basket data and payment request options
 */
function calculateBuyNowData(sku, quantity, options) {
    var shippingMethod = ShippingMgr.defaultShippingMethod;

    var optionsArray;
    if (options) {
        optionsArray = options.map(function (option) {
            return {
                id: option.id,
                valueId: option.selectedValueId
            };
        });
    } else {
        optionsArray = [];
    }

    // Create a temporary basket for payment request options calculation
    var basket = Transaction.wrap(BasketMgr.createTemporaryBasket);

    var paymentRequestOptions = Transaction.wrap(function () {
        try {
            // Add product line item
            var pli = basket.createProductLineItem(sku, basket.defaultShipment);
            pli.setQuantityValue(quantity);

            // Update product line item option model
            var optionModel = pli.optionModel;
            optionsArray.forEach(function (option) {
                var productOption = optionModel.getOption(option.id);
                if (productOption) {
                    var productOptionValue = optionModel.getOptionValue(productOption, option.valueId);
                    if (productOptionValue) {
                        // Update selected value for product option
                        optionModel.setSelectedOptionValue(productOption, productOptionValue);
                    }
                }
            });

            // Set shipment shipping method
            shippingHelpers.selectShippingMethod(basket.defaultShipment, shippingMethod.ID);

            // Calculate basket
            basketCalculationHelpers.calculateTotals(basket);

            // Calculate the payment request options for the basket
            return calculateBasketPaymentRequestOptions(basket);
        } finally {
            // Delete temporary basket after calculation
            BasketMgr.deleteTemporaryBasket(basket);
        }
    });

    return {
        basketData: {
            sku: sku,
            quantity: quantity,
            shippingMethod: shippingMethod.ID,
            options: optionsArray
        },
        options: paymentRequestOptions
    };
}

/**
 * Calculates basket payment request options for a pay now button.
 * @returns {Object} object containing payment request options
 */
function calculatePayNowOptions() {
    return calculateBasketPaymentRequestOptions(BasketMgr.currentBasket);
}

/**
 * Gets billing details from the basket.
 * @param {dw.order.Basket} basket - basket containing billing details
 * @returns {Object} object containing billing details
 */
function getBillingDetails(basket) {
    var details = {
        address: {}
    };

    if (basket.customerName) {
        details.name = basket.customerName;
    }
    if (basket.customerEmail) {
        details.email = basket.customerEmail;
    }

    if (basket.billingAddress) {
        if (basket.billingAddress.fullName) {
            // Prefer name from billing address if available
            details.name = basket.billingAddress.fullName;
        }
        if (basket.billingAddress.phone) {
            details.phone = basket.billingAddress.phone;
        }

        if (basket.billingAddress.address1) {
            details.address.line1 = basket.billingAddress.address1;
        }
        if (basket.billingAddress.address2) {
            details.address.line2 = basket.billingAddress.address2;
        }
        if (basket.billingAddress.city) {
            details.address.city = basket.billingAddress.city;
        }
        if (basket.billingAddress.stateCode) {
            details.address.state = basket.billingAddress.stateCode;
        }
        if (basket.billingAddress.postalCode) {
            details.address.postal_code = basket.billingAddress.postalCode;
        }
        if (basket.billingAddress.countryCode && basket.billingAddress.countryCode.value) {
            details.address.country = basket.billingAddress.countryCode.value;
        }
    }

    return details;
}

/**
 * calculates payment request options for a pay now button calculated from the shopper basket
 * @returns {Object} payment request options object
 */
function calculatePaymentRequestOptions() {
    try {
        return SalesforcePaymentRequest.calculatePaymentRequestOptions(BasketMgr.currentBasket, {});
    } catch (e) {
        Logger.error(e);
        return null;
    }
}

/**
 * Calculates the PayPal-formatted amount for the given formatted payment request options.
 * @param {Object} paymentRequestOptions - object returned by calculatePaymentRequestOptions
 * @returns {string} amount formatted for PayPal
 */
function calculatePayPalAmount(paymentRequestOptions) {
    var Currency = require('dw/util/Currency');
    var Decimal = require('dw/util/Decimal');

    var currency = Currency.getCurrency(paymentRequestOptions.currency.toUpperCase());
    var amount = new Decimal(paymentRequestOptions.total.amount);
    amount = amount.divide(Math.pow(10, currency.defaultFractionDigits));

    return amount.toString();
}

/**
 * Creates a temporary basket to use for Buy Now.
 * @returns {dw.order.Basket} basket to use for Buy Now
 */
function createBuyNowBasket() {
    // Delete any existing open temporary baskets
    BasketMgr.getTemporaryBaskets().toArray().forEach(function (basket) {
        BasketMgr.deleteTemporaryBasket(basket);
    });

    // Create a new temporary basket
    return BasketMgr.createTemporaryBasket();
}

module.exports = {
    handleCommercePayments: handleCommercePayments,
    calculateBuyNowData: calculateBuyNowData,
    calculatePayNowOptions: calculatePayNowOptions,
    getBillingDetails: getBillingDetails,
    calculateBasketPaymentRequestOptions: calculateBasketPaymentRequestOptions,
    calculatePaymentRequestOptions: calculatePaymentRequestOptions,
    calculatePayPalAmount: calculatePayPalAmount,
    createBuyNowBasket: createBuyNowBasket
};
Object.keys(base).forEach(function (prop) {
    // eslint-disable-next-line no-prototype-builtins
    if (!module.exports.hasOwnProperty(prop)) {
        module.exports[prop] = base[prop];
    }
});
