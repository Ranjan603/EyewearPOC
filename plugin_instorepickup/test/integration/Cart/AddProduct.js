'use strict';

var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

describe('Add in store product to cart', function () {
    var cookieJar = request.jar();

    it('should verify that product is added with an associated store', function () {
        var qty1 = 1;
        var variantPid = '883360492087M';
        var storeId = 'store4';
        var addToCartRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        addToCartRequest.url = config.baseUrl + '/Cart-AddProduct';
        addToCartRequest.form = {
            pid: variantPid,
            quantity: qty1,
            options: [],
            storeId: storeId
        };
        return request(addToCartRequest)
            .then(function (response) {
                var bodyAsJson = JSON.parse(response.body);
                assert.property(bodyAsJson, 'cart');
                assert.property(bodyAsJson.cart, 'items');
                assert.equal(bodyAsJson.cart.items.length, 1);
                assert.equal(bodyAsJson.cart.items[0].id, '883360492087M');
                assert.property(bodyAsJson.cart.items[0], 'fromStoreId');
                assert.equal(bodyAsJson.cart.items[0].fromStoreId, 'store4');
            });
    });

    it('should verify that two products can be added with two stores attached', function () {
        var qty = 1;
        var variantPid1 = '883360492087M';
        var variantPid2 = '883360492117M';
        var storeId1 = 'store4';
        var storeId2 = 'store6';
        var addToCartRequest = {
            url: '',
            method: 'POST',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar,
            headers: {
                'X-Requested-With': 'XMLHttpRequest'
            }
        };

        addToCartRequest.url = config.baseUrl + '/Cart-AddProduct';
        addToCartRequest.form = {
            pid: variantPid1,
            quantity: qty,
            options: [],
            storeId: storeId1
        };
        return request(addToCartRequest)
            .then(function (response) {
                var bodayAsJson2 = JSON.parse(response.body);
                assert.property(bodayAsJson2, 'cart');
                assert.property(bodayAsJson2.cart, 'items');
                assert.equal(bodayAsJson2.cart.items.length, 1);
                assert.equal(bodayAsJson2.cart.items[0].id, variantPid1);
                assert.property(bodayAsJson2.cart.items[0], 'fromStoreId');
                assert.equal(bodayAsJson2.cart.items[0].fromStoreId, storeId1);

                var addToCartRequest2 = {
                    url: '',
                    method: 'POST',
                    rejectUnauthorized: false,
                    resolveWithFullResponse: true,
                    jar: cookieJar,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                };

                addToCartRequest2.url = config.baseUrl + '/Cart-AddProduct';
                addToCartRequest2.form = {
                    pid: variantPid2,
                    quantity: qty,
                    options: [],
                    storeId: storeId2
                };
                return request(addToCartRequest2)
                    .then(function (response2) {
                        var bodyAsJson = JSON.parse(response2.body);
                        assert.property(bodyAsJson, 'cart');
                        assert.property(bodyAsJson.cart, 'items');
                        assert.equal(bodyAsJson.cart.items.length, 2);
                        assert.equal(bodyAsJson.cart.items[1].id, variantPid2);
                        assert.property(bodyAsJson.cart.items[1], 'fromStoreId');
                        assert.equal(bodyAsJson.cart.items[1].fromStoreId, storeId2);
                    });
            });
    });
});
