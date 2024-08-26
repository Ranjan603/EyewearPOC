'use strict';

const stepMapping = {
    customer: 1,
    shipping: 2,
    payment: 3,
    placeOrder: 4
};

/**
 * Create the order product line item tracking data
 *
 * @param {array} orderModel order model
 * @returns {array} products
 */
function getOrderProductData(orderModel) {
    var products = [];
    products = orderModel.items.items.map(function (item) {
        var product = {};
        product.name = item.productName;
        product.id = item.id;
        product.price = item.priceTotal.price.value;
        product.quantity = item.quantity;
        return product;
    });

    return products;
}

/**
 * Get coupon codes from the model
 *
 * @param {Object} orderModel order model
 * @returns {array} coupons
 */
function getCouponCodes(orderModel) {
    if (orderModel.coupons && !empty(orderModel.coupons.items)) {
        return orderModel.coupons.items.map((coupon) => coupon.code).join(',');
    }
    return undefined; // because Marlitt
}

/**
 *
 * @param {Object} address order address model
 * @returns {Object} address tracking data
 */
function getAddressData(address) {
    return {
        address1: address.address1,
        city: address.city,
        country: address.countryCode.value,
        firstName: address.firstName,
        lastName: address.lastName,
        postalCode: address.postalCode
    };
}

/**
 *
 * @param {Object} orderModel order model
 * @returns {Object} shipping tracking data
 */
function getShippingData(orderModel) {
    let data = orderModel.shipping.map(function (shipping) {
        let shippingInfo = {};
        if (shipping.selectedShippingMethod) {
            shippingInfo.shippingMethod = {
                id: shipping.selectedShippingMethod.ID,
                name: shipping.selectedShippingMethod.displayName
            };
        }
        if (shipping.shippingAddress) {
            shippingInfo.shippingAddress = getAddressData(shipping.shippingAddress);
        }

        return shippingInfo;
    });

    return data;
}

/**
 *
 * @param {Object} orderModel order model
 * @returns {Object} billing tracking data
 */
function getBillingData(orderModel) {
    var data = {};
    let payment = orderModel.billing.payment;
    let billingAddress = orderModel.billing.billingAddress;

    if (payment.selectedPaymentInstruments && payment.selectedPaymentInstruments.length > 0) {
        data.payment = payment.selectedPaymentInstruments.map(function (pi) {
            return {
                amount: pi.amount.value,
                name: pi.name,
                id: pi.paymentMethodID
            };
        });
    }
    if (billingAddress && billingAddress.address) {
        data.billingAddress = getAddressData(billingAddress.address);
    }

    return data;
}

/**
 * Create the overall order tracking data
 *
 * @param {Object} orderModel order model
 * @param {string} page current checkout page/step
 * @returns {Object} cart
 */
function getOrderData(orderModel, page) {
    var apiOrder = orderModel.raw;
    var data = {
        id: orderModel.orderNumber,
        revenue: apiOrder.totalGrossPrice.value,
        email: orderModel.orderEmail,
        tax: apiOrder.totalTax.value,
        shipping: apiOrder.shippingTotalGrossPrice.value,
        discount: apiOrder.merchandizeTotalGrossPrice.subtract(apiOrder.adjustedMerchandizeTotalGrossPrice).value,
        coupon: getCouponCodes(orderModel),
        insuranceApplied: session.custom.insuranceApplied,
        step: stepMapping[page]
    };

    return data;
}

module.exports = {
    getOrderData: getOrderData,
    getBillingData: getBillingData,
    getShippingData: getShippingData,
    getOrderProductData: getOrderProductData
};
