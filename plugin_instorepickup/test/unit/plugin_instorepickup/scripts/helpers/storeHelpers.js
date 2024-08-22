'use strict';

var assert = require('chai').assert;
var mockSuperModule = require('../../../../mockModuleSuperModule');
var baseStoreHelpersMock = require('../../../../../test/mocks/scripts/helpers/baseStoreHelpers');

describe('storeHelpers', function () {
    var storeHelpers;

    describe('getStores', function () {
        before(function () {
            mockSuperModule.create(baseStoreHelpersMock);
            storeHelpers = require('../../../../mocks/helpers/storeHelpers');
        });
        after(function () {
            mockSuperModule.remove();
        });

        var url = '/on/demandware.store/Sites-MobileFirst-Site/en_US/Stores-FindStores';
        var radius = 15;
        var postalCode = '01803';
        var geolocation = {
            countryCode: 'US'
        };
        var latitude = null;
        var longitude = null;
        var showMap = false;

        it('should return stores model where stores has been filtered, for 1 product', function () {
            var products = [
                { id: '000003', quantity: 8 }
            ];

            var storeObject = storeHelpers.getStores(radius, postalCode, latitude, longitude, geolocation, showMap, url, products);
            assert.equal(storeObject.stores.length, 2);
            assert.equal(storeObject.stores[0].ID, 'storeId2');
            assert.equal(storeObject.stores[1].ID, 'storeId3');
        });

        it('should return stores model where stores has been filtered, for multiple products', function () {
            var products = [
                { id: '000002', quantity: 8 },
                { id: '000003', quantity: 10 }
            ];

            var storeObject = storeHelpers.getStores(radius, postalCode, latitude, longitude, geolocation, showMap, url, products);
            assert.equal(storeObject.stores.length, 1);
            assert.equal(storeObject.stores[0].ID, 'storeId2');
        });
    });
});
