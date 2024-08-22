'use strict';

/**
 * The purpose of this module is to collect and preparae tracking data which will then be injected into the site.
 * Conceptionally the goal is to use objects we already have at certain places in our application and put them into the datalayer.
 * This way we avoid fetching additional information, which might turn out expensive.
 *
 */
var datalayerEvent = [];
var datalayerView = [];

/**
 * datalayerUtils is used to provide the individual helper functionality for various dataobjects being invoked from the page.
 */
var datalayerUtils = {};

/**
 * Retrieve global tracking data
 * @param {Object} req - current request object
 * @param {string} pageType - allows identification of current page context
 * @param {string} event - event identifier
 * @return {Object} - tracking data
 */
datalayerUtils.getGlobalData = function (req, pageType, event) {
    var commonDataHelper = require('./helpers/commonDataHelper');
    var data = commonDataHelper.getGlobalData(req, pageType, event);

    return data;
};

/**
 * Function being used to collect some personalized information linked to the customer/session.
 * This is causing the need to have this being executed from a uncached remote include, hence it is IMPORTANT to keep logic here to a minimum.
 * IT IS NOT ALLOWED to fetch additional objects from the database and data is limited to what is provided by the request/session.
 * @param {Object} req The request
 * @returns {Object} created data tracking object including personalized user specific infortmation related information
 */
datalayerUtils.getPersonalizedData = function (req) {
    var commonDataHelper = require('./helpers/commonDataHelper');
    var data = {};

    if (req.currentCustomer.profile) {
        data = commonDataHelper.getCustomerData(req.currentCustomer);
    } else {
        data.userLoggedIn = false;
    }

    return data;
};

/**
 * Function being used to collect basket data being fetched already for the cart page.
 * @param {Object} req The current request
 * @param {Object} cartModel The cartModel model
 * @returns {Object} created data tracking object
 */
datalayerUtils.getBasketData = function (req, cartModel) {
    var commonDataHelper = require('./helpers/commonDataHelper');
    var basketDataHelper = require('./helpers/basketDataHelper');

    var data = commonDataHelper.getGlobalData(req, 'basket', 'cart-view');
    data.cart = basketDataHelper.getBasketTrackingData(cartModel);

    return data;
};

/**
 * Function being used to collect product data being fetched already for the product detail page.
 * @param {Object} req The current request
 * @param {Object} product The product model
 * @returns {Object} created data tracking object
 */
datalayerUtils.getProductData = function (req, product) {
    var productDataHelper = require('./helpers/productDataHelper');
    var commonDataHelper = require('./helpers/commonDataHelper');
    var categoryDataHelper = require('./helpers/categoryDataHelper');

    var data = commonDataHelper.getGlobalData(req, 'pdp', 'product-detail-view');

    data.products = [];

    var productData = productDataHelper.handleProduct(product);
    data.products.push(productData);

    // add category information
    categoryDataHelper.addCategoryInformation(data, null, product.id);

    return data;
};

/**
 * Function being used to collect data on the homepage.
 * @param {Object} req The current request
 * @returns {Object} created data tracking object
 */
datalayerUtils.getHomepageData = function (req) {
    var commonDataHelper = require('./helpers/commonDataHelper');
    var data = commonDataHelper.getGlobalData(req, 'home', 'homepage-view');
    return data;
};

/**
 * Function being used to collect data on the login page.
 * @param {Object} req The current request
 * @returns {Object} created data tracking object
 */
datalayerUtils.getLoginData = function (req) {
    var commonDataHelper = require('./helpers/commonDataHelper');
    var data = commonDataHelper.getGlobalData(req, 'login');
    return data;
};

/**
 * Function being used to collect data on the error page.
 * @param {Object} req The current request
 * @returns {Object} created data tracking object
 */
datalayerUtils.getErrorData = function (req) {
    var commonDataHelper = require('./helpers/commonDataHelper');
    var data = commonDataHelper.getGlobalData(req, 'error-general');
    return data;
};

/**
 * Function being used to collect data on 404 error pages.
 * @param {Object} req The current request
 * @param {Object} pageType pageType
 * @returns {Object} created data tracking object
 */
datalayerUtils.getErrorNotFoundData = function (req, pageType) {
    var commonDataHelper = require('./helpers/commonDataHelper');
    var data = commonDataHelper.getGlobalData(req, pageType);
    return data;
};

/**
 * Function being used to collect data on the content page.
 * @param {Object} req The current request
 * @returns {Object} created data tracking object
 */
datalayerUtils.getContentData = function (req) {
    var commonDataHelper = require('./helpers/commonDataHelper');
    var data = commonDataHelper.getGlobalData(req, 'content');

    return data;
};

/**
 * Retrieve myaccount tracking data
 * @param {Object} req - current request object
 * @return {Object} - created data tracking object
 */
datalayerUtils.getAccountData = function (req) {
    var commonDataHelper = require('./helpers/commonDataHelper');
    var data = commonDataHelper.getGlobalData(req, 'account');

    return data;
};

/**
 * Function being used to collect search data being fetched already on the plp pages.
 * @param {Object} req The current request
 * @param {Object} productSearch The search model
 * @returns {Object} created data tracking object
 */
datalayerUtils.getSearchData = function (req, productSearch) {
    var commonDataHelper = require('./helpers/commonDataHelper');
    var categoryDataHelper = require('./helpers/categoryDataHelper');
    var data = commonDataHelper.getGlobalData(req, 'product listing', 'search-view');

    // add category information
    categoryDataHelper.addCategoryInformation(data, productSearch.isCategorySearch ? productSearch.category.id : null);

    data.searchResults = productSearch.count;
    data.isCategorySearch = productSearch.isCategorySearch;
    data.isRefinedCategorySearch = productSearch.refinedCategorySearch;
    data.searchTerm = productSearch.searchKeywords;

    return data;
};

/**
 * Function being used to collect tracking info per search hit tile
 * @param {Object} req The current request
 * @param {Object} tileModel The product tile model
 * @returns {Object} created data tracking object
 */
datalayerUtils.getTileData = function (req, tileModel) {
    var productDataHelper = require('./helpers/productDataHelper');
    var productData = productDataHelper.handleProduct(tileModel);

    return productData;
};

datalayerUtils.getRegisterSuccessEventData = function () {
    var data = {
        event: 'customer-registration',
        payload: 'Account Registration'
    };
    return data;
};

datalayerUtils.getSearchPaginationEventData = function () {
    var data = {
        event: 'product-list',
        products: []

    };
    return data;
};

datalayerUtils.getCheckoutData = function (req, orderModel, page) {
    var commonDataHelper = require('./helpers/commonDataHelper');
    var orderHelper = require('./helpers/orderDataHelper');

    const event = 'checkout-view';
    const pageType = 'checkout';
    var data;

    data = commonDataHelper.getGlobalData(req, pageType, event);

    data.userEmail = orderModel.orderEmail;
    data.currency = req.session.currency.currencyCode;
    data.orderInfo = orderHelper.getOrderData(orderModel, page);
    data.products = orderHelper.getOrderProductData(orderModel);
    data.shippingInfo = orderHelper.getShippingData(orderModel);
    data.billingInfo = orderHelper.getBillingData(orderModel);

    return data;
};

module.exports = {
    populate: function () {
        var args = [].slice.call(arguments);
        var context = args.shift();
        var methodName = 'get' + context;
        if (typeof datalayerUtils[methodName] === 'function') {
            var dataObj = datalayerUtils[methodName].apply(datalayerUtils, args);
            if ([this.CONTEXT.GLOBAL,
                this.CONTEXT.PERSONALIZED,
                this.CONTEXT.PRODUCT,
                this.CONTEXT.HOMEPAGE,
                this.CONTEXT.SEARCH,
                this.CONTEXT.TILE,
                this.CONTEXT.BASKET,
                this.CONTEXT.ACCOUNT,
                this.CONTEXT.LOGIN,
                this.CONTEXT.ERROR,
                this.CONTEXT.ERRORNOTFOUND,
                this.CONTEXT.CHECKOUT,
                this.CONTEXT.CONTENT].indexOf(context) > -1) {
                // page view data population
                datalayerView.push(dataObj);
            } else {
                // anything else is handled here as general event
                // this mainly links to server side event (ex: REGISTERSUCCESS, SORTING)
                datalayerEvent.push(dataObj);
            }
        }
    },
    // we allow to override the view value to be flexible on every datalayer
    updateView: function (view) {
        datalayerView = view;
    },
    getDatalayerView: function () {
        return datalayerView;
    },
    getDatalayerEvent: function () {
        return datalayerEvent;
    },
    CONTEXT: {
        GLOBAL: 'GlobalData',
        BASKET: 'BasketData',
        HOMEPAGE: 'HomepageData',
        PERSONALIZED: 'PersonalizedData',
        PRODUCT: 'ProductData',
        ACCOUNT: 'AccountData',
        SEARCH: 'SearchData',
        TILE: 'TileData',
        LOGIN: 'LoginData',
        ERROR: 'ErrorData',
        ERRORNOTFOUND: 'ErrorNotFoundData',
        CONTENT: 'ContentData',
        CHECKOUT: 'CheckoutData'

    },
    EVENT: {
        SEARCHPAGINATION: 'SearchPaginationEventData',
        REGISTERSUCCESS: 'RegisterSuccessEventData'
    }
};
