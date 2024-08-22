'use strict';

/**
 * Create the basket product line item tracking data
 *
 * @param {array} items product line item array
 * @returns {array} products
 */
function getProductData(items) {
    var products = [];
    products = items.map(function (item) {
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
 * Create the overall bakset tracking data
 *
 * @param {Object} cartModel cart data model
 * @returns {Object} cart
 */
function getBasketTrackingData(cartModel) {
    var cart = {};
    var items = cartModel ? cartModel.items : [];
    cart.products = getProductData(items);

    // TODO: In case other than product data, anything else is also required to be added to the basket tracking data

    return cart;
}

module.exports = {
    getProductData: getProductData,
    getBasketTrackingData: getBasketTrackingData
};
