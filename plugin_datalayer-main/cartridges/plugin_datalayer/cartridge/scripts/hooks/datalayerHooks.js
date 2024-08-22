'use strict';

/**
 * Injects the datalayer data snippet in the ISML template
 * @return {string} - render template string
 */
function renderHeaderSnippets() {
    const Template = require('dw/util/Template');
    return new Template('/common/datalayerHeaderScripts').render().text;
}

/**
 * Injects the datalayer data snippet in the ISML template
 * @return {string} - render template string
 */
function renderBodySnippets() {
    const Template = require('dw/util/Template');
    return new Template('/common/datalayerBodyScripts').render().text;
}

/**
 * Injects tracking data for each product tile
 * @return {string} - render template string
 */
function productTileDataAttribute() {
    const Template = require('dw/util/Template');
    return new Template('/product/productTileTracking').render().text;
}

/**
 * Injects tracking data for collecting all the tile information
 * @return {string} - render template string
 */
function productTilesInclude() {
    const Template = require('dw/util/Template');
    return new Template('/product/productTilesTracking').render().text;
}

/**
 * Injects tracking data for product tile click tracking
 * @param {Object} product - product object
 * @returns {string} - render template string
 */
function productClickDataAttribute(product) {
    const Template = require('dw/util/Template');
    const HashMap = require('dw/util/HashMap');

    var productDataHelper = require('../helpers/productDataHelper');
    var productData = productDataHelper.handleProductClick(product);

    var map = new HashMap();
    map.payload = {
        click: productData
    };
    map.event = 'product-click';

    return new Template('common/clickTracking').render(map).text;
}

/**
 * Injects tracking data for collecting the availability info on the pdp
 * @return {string} - render template string
 */
function datalayerEvent() {
    const Template = require('dw/util/Template');
    return new Template('common/datalayerEvent').render().text;
}

/**
 * Injects tracking data for general event tracking
 * @param {Object} eventDetails - eventDetails object
 * @returns {string} - render template string
 */
function generalEventDataAttribute(eventDetails) {
    const Template = require('dw/util/Template');
    const HashMap = require('dw/util/HashMap');

    var map = new HashMap();
    map.event = eventDetails.event;
    map.payload = eventDetails.payload;
    return new Template('common/clickTracking').render(map).text;
}

module.exports = {
    renderHeaderSnippets: renderHeaderSnippets,
    renderBodySnippets: renderBodySnippets,
    productTileDataAttribute: productTileDataAttribute,
    productTilesInclude: productTilesInclude,
    datalayerEvent: datalayerEvent,
    productClickDataAttribute: productClickDataAttribute,
    generalEventDataAttribute: generalEventDataAttribute
};
