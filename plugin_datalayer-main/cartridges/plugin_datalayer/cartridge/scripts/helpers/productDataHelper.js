'use strict';

var URLUtils = require('dw/web/URLUtils');

/**
 * Check if the product instance is an API object
 * or a model represenation
 *
 * @param {Object} product - product instance to be checked
 * @returns {boolean} true if the product is an API instance, false if not
 */
function isAPIProduct(product) {
    var Product = require('dw/catalog/Product');
    return product instanceof Product;
}

/**
 * Get the master product ID, if applicable.
 * If there is no master product, this product ID is returned
 *
 * @param {Object} product - API product or product model
 * @returns {string} master product ID
 */
function getMasterProductId(product) {
    var masterId;
    if (isAPIProduct(product)) {
        // get master ID from the the API product master, or
        // this API product ID
        masterId = product.isVariant() ? product.masterProduct.ID : product.ID;
    } else {
        // get master ID from the model, if  applicable
        masterId = product.masterId ? product.masterId : product.id;
    }
    return masterId;
}

/**
 * Get the product name
 *
 * @param {Object} product - API product or product model
 * @returns {string} product name
 */
function getProductName(product) {
    var name;
    // Check if we are reading name from the model or the API object
    if (product.name) {
        // API
        name = product.name;
    } else {
        // model
        name = product.productName;
    }

    return name;
}

/**
 * Get a custom attribute value from the mode or api object
 * This method assumes a common attribute name
 *
 * @param {Object} product - API product or product model
 * @param {string} attributeName - attribute name
 * @returns {string} attribute value
 */
function getCustomAttributeValue(product, attributeName) {
    var attrValue;
    var attrName = attributeName;
    if (isAPIProduct(product)) {
        attrValue = attrName in product.custom ? product.custom[attrName] : null;
    } else {
        attrValue = attrName in product ? product[attrName] : null;
    }
    return attrValue;
}

/**
 * Get the product price data
 *
 * @param {Object} product - API product or product model
 * @returns {number} product price data
 */
function getProductPrice(product) {
    var price;
    if (product.priceModel) {
        price = product.priceModel.price.decimalValue
            ? JSON.parse(product.priceModel.price.decimalValue) : null;
        if (!price) {
            price = product.priceModel.maxPrice.decimalValue
                ? JSON.parse(product.priceModel.maxPrice.decimalValue) : null;
        }
    } else if (product.price) {
        price = product.price.sales ? product.price.sales.value : null;
    }

    return price;
}

/**
 * get orderable status from a product
 *
 * @param {Object} product - API product or product model
 * @returns {string} available status
 */
function getAvailabilityStatus(product) {
    var availabilityStatus;
    if (isAPIProduct(product)) {
        availabilityStatus = product.availabilityModel.isOrderable() ? 'available' : 'soldout';
    } else {
        availabilityStatus = product.available ? 'available' : 'soldout';
    }
    return availabilityStatus;
}

/**
 * Assemble product data
 *
 * @param {Object} product - The product object
 * @return {Object} Product Data
 */
function assembleTrackingDataProduct(product) {
    var productJSON = {};
    const productId = product.ID || product.id;
    if (product) {
        productJSON.id = productId;
        productJSON.masterId = getMasterProductId(product);
        productJSON.name = getProductName(product);
        productJSON.price = getProductPrice(product);
        productJSON.isSale = getCustomAttributeValue(product, 'isSale');
        productJSON.url = URLUtils.url('Product-Show', 'pid', productId).abs().toString();
        productJSON.available = getAvailabilityStatus(product);
    }

    return !empty(productJSON) ? productJSON : '';
}

/**
 * Assemble product data
 *
 * @param {Object} product - The product object
 * @return {Object} Product Data
 */
function assembleTrackingDataProductClick(product) {
    var productJSON = {};
    const productId = product.ID || product.id;
    if (product) {
        productJSON.id = productId;
        productJSON.isSale = getCustomAttributeValue(product, 'isSale');
        productJSON.available = getAvailabilityStatus(product);
    }

    return !empty(productJSON) ? productJSON : '';
}

/**
 * Create product data
 *
 * @param {Object} product - The product object
 * @return {Object} Product Data
 */
function handleProduct(product) {
    var productData;
    productData = assembleTrackingDataProduct(product);
    return productData;
}

/**
 * Create product data
 *
 * @param {Object} product - The product object
 * @return {Object} Product Data
 */
function handleProductClick(product) {
    var productData;
    productData = assembleTrackingDataProductClick(product);
    return productData;
}

module.exports = {
    handleProduct: handleProduct,
    handleProductClick: handleProductClick
};
