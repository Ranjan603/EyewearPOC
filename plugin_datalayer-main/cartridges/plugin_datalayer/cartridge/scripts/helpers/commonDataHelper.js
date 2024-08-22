'use strict';

/**
 * Retrieve global tracking data
 * @param {Object} req - current request object
 * @param {string} pageType - allows identification of current page context
 * @param {string} event - event identifier
 * @return {Object} - tracking data
 */
function getGlobalData(req, pageType, event) {
    const data = {};

    var Locale = require('dw/util/Locale');
    var System = require('dw/system/System');
    var currentLocale = Locale.getLocale(req.locale.id);

    const instanceMapping = {
        0: 'development',
        1: 'staging',
        2: 'production'
    };

    data.shopEnv = instanceMapping[System.getInstanceType()];
    data.shopDomain = currentLocale.country.toUpperCase();
    data.shopLanguage = currentLocale.language;
    data.currency = req.session.currency.currencyCode;
    data.pageType = pageType;
    data.event = event;

    return data;
}
/**
 *
 * @param {Object} currentCustomer customer model
 * @returns  {Object} - customer tracking data
 */
function getCustomerData(currentCustomer) {
    var data = {};
    data.userLoggedIn = true;
    var activeData = currentCustomer.raw.activeData;
    data.customerType = (activeData && activeData.orders && activeData.orders > 0) ? 'existing' : 'new';
    data.userId = currentCustomer.profile.customerNo;
    data.userEmail = currentCustomer.profile.email || '';
    data.userName = (currentCustomer.profile.firstName || '') + ' ' + (currentCustomer.profile.lastName || '');
    if (currentCustomer.raw.customerGroups.length > 0) {
        data.customerGroups = currentCustomer.raw.customerGroups.toArray().map(function (g) { return g.ID; }).join(',');
    }
    return data;
}

module.exports = {
    getCustomerData: getCustomerData,
    getGlobalData: getGlobalData
};
