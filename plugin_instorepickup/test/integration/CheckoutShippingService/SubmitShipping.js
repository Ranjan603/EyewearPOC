'use strict';

var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('Submit the shipping form with store attached', function () {
    this.timeout(5000);
    var shipmentUUID;
    var cookieJar = request.jar();
    var cookieString;

    var myRequest = {
        url: config.baseUrl + '/Cart-AddProduct',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    before(function () {
        var qty1 = 1;
        var variantPid = '883360492087M';
        var storeId = 'store4';
        myRequest.form = {
            pid: variantPid,
            quantity: qty1,
            storeId: storeId
        };
        // step1 : Add a product to Cart with Pick up in store selected
        return request(myRequest)
            .then(function (addToCartResponse) {
                var addToCartJsonResponse = JSON.parse(addToCartResponse.body);
                assert.equal(addToCartResponse.statusCode, 200, 'Expected add to Cart request statusCode to be 200.');
                cookieString = cookieJar.getCookieString(myRequest.url);
                shipmentUUID = addToCartJsonResponse.cart.items[0].shipmentUUID;
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                // step2 : get shipping UUID, get cookies, Generate CSRF, then set cookies
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                // step3 : submit shipping request with token acquired in step 2
                myRequest.url = config.baseUrl + '/CheckoutShippingServices-SubmitShipping?'
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = {
                    shipmentUUID: shipmentUUID,
                    dwfrm_shipping_shippingAddress_shippingMethodID: '005',
                    storeId: 'store4',
                    dwfrm_shipping_shippingAddress_addressFields_firstName: 'Champaign Electronic Shop',
                    dwfrm_shipping_shippingAddress_addressFields_lastName: '',
                    dwfrm_shipping_shippingAddress_addressFields_address1: '1001 Cambridge St',
                    dwfrm_shipping_shippingAddress_addressFields_address2: '',
                    dwfrm_shipping_shippingAddress_addressFields_country: 'US',
                    dwfrm_shipping_shippingAddress_addressFields_states_stateCode: 'MA',
                    dwfrm_shipping_shippingAddress_addressFields_city: 'Cambridge',
                    dwfrm_shipping_shippingAddress_addressFields_postalCode: '02141',
                    dwfrm_shipping_shippingAddress_addressFields_phone: '1-617-714-2640'
                };
            });
    });

    it('should verify that the shipping address has been submitted with the proper store information.', function () {
        return request(myRequest)
            .then(function (submitShippingResponse) {
                assert.equal(submitShippingResponse.statusCode, 200, 'Expected submit shipping request statusCode to be 200.');
                var bodyAsJson = JSON.parse(submitShippingResponse.body);
                assert.equal(bodyAsJson.shippingMethod, '005', 'shippingMethod should be pickupInStore-005');
                assert.equal(bodyAsJson.storeId, 'store4', 'The store to pick up should be store4');
                assert.equal(bodyAsJson.form.shippingAddress.addressFields.address1.htmlValue, '1001 Cambridge St', 'address1 should 1001 Cambridge St');
                assert.equal(bodyAsJson.form.shippingAddress.addressFields.city.htmlValue, 'Cambridge', 'city should be Cambridge');
            });
    });
});

describe('Submit the shipping form without store attached', function () {
    this.timeout(5000);
    var shipmentUUID;
    var cookieJar = request.jar();
    var cookieString;

    var myRequest = {
        url: config.baseUrl + '/Cart-AddProduct',
        method: 'POST',
        rejectUnauthorized: false,
        resolveWithFullResponse: true,
        jar: cookieJar,
        headers: {
            'X-Requested-With': 'XMLHttpRequest'
        }
    };

    before(function () {
        var qty1 = 1;
        var variantPid = '883360492087M';
        myRequest.form = {
            pid: variantPid,
            quantity: qty1
        };
        // step1 : Add a product to Cart
        return request(myRequest)
            .then(function (addToCartResponse) {
                var addToCartJsonResponse = JSON.parse(addToCartResponse.body);
                assert.equal(addToCartResponse.statusCode, 200, 'Expected add to Cart request statusCode to be 200.');
                cookieString = cookieJar.getCookieString(myRequest.url);
                shipmentUUID = addToCartJsonResponse.cart.items[0].shipmentUUID;
                myRequest.url = config.baseUrl + '/CSRF-Generate';
                var cookie = request.cookie(cookieString);
                cookieJar.setCookie(cookie, myRequest.url);
                // step2 : get shipping UUID, get cookies, Generate CSRF, then set cookies
                return request(myRequest);
            })
            .then(function (csrfResponse) {
                var csrfJsonResponse = JSON.parse(csrfResponse.body);
                // step3 : submit shipping request with token acquired in step 2
                myRequest.url = config.baseUrl + '/CheckoutShippingServices-SubmitShipping?'
                    + csrfJsonResponse.csrf.tokenName + '='
                    + csrfJsonResponse.csrf.token;
                myRequest.form = {
                    shipmentUUID: shipmentUUID,
                    dwfrm_shipping_shippingAddress_shippingMethodID: '001',
                    dwfrm_shipping_shippingAddress_addressFields_firstName: 'Shipping Firstname',
                    dwfrm_shipping_shippingAddress_addressFields_lastName: 'Shipping Lastname',
                    dwfrm_shipping_shippingAddress_addressFields_address1: '1001 Cambridge St',
                    dwfrm_shipping_shippingAddress_addressFields_address2: '',
                    dwfrm_shipping_shippingAddress_addressFields_country: 'US',
                    dwfrm_shipping_shippingAddress_addressFields_states_stateCode: 'MA',
                    dwfrm_shipping_shippingAddress_addressFields_city: 'Cambridge',
                    dwfrm_shipping_shippingAddress_addressFields_postalCode: '02141',
                    dwfrm_shipping_shippingAddress_addressFields_phone: '1-617-714-2640'
                };
            });
    });

    it('should verify that the shipping address has been submitted without a store ID.', function () {
        return request(myRequest)
            .then(function (submitShippingResponse) {
                assert.equal(submitShippingResponse.statusCode, 200, 'Expected submit shipping request statusCode to be 200.');
                var bodyAsJson = JSON.parse(submitShippingResponse.body);
                assert.equal(bodyAsJson.shippingMethod, '001', 'shippingMethod should be Ground-001');
                assert.equal(bodyAsJson.storeId, null, 'The store to pick up should be empty');
                assert.equal(bodyAsJson.form.shippingAddress.addressFields.address1.htmlValue, '1001 Cambridge St', 'address1 should 1001 Cambridge St');
                assert.equal(bodyAsJson.form.shippingAddress.addressFields.city.htmlValue, 'Cambridge', 'city should be Cambridge');
            });
    });
});
