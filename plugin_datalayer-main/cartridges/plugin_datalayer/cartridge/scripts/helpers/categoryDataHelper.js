'use strict';

/**
 * Determine category information.
 *
 * @param {Object} data - current data object
 * @param {Object} categoryID - the category ID
 * @param {Object} productID - the product ID
 */
function addCategoryInformation(data, categoryID, productID) {
    var productHelper = require('*/cartridge/scripts/helpers/productHelpers');

    data.breadcrumbs = categoryID || null;
    if (categoryID || productID) {
        data.breadcrumbs = productHelper.getAllBreadcrumbs(categoryID, productID, []);
    }
}

module.exports = {
    addCategoryInformation: addCategoryInformation
};
