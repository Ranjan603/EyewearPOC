'use strict';

var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

/**
 * Test cases :
 * 1. When Product with variant 883360520391M is selected, Inventory Search should return the following stores with radius and long/lat
 * 2. When Product with variant 883360352442M is selected, Inventory Search should return the following stores with radius and postal code
 */

describe('Select a postal code on the in-store pick-up pop up', function () {
    this.timeout(5000);

    var cookieJar = request.jar();

    it('should return a store with radius and long/lat', function () {
        var myRequest = {
            url: '',
            method: 'GET',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar
        };
        myRequest.url = config.baseUrl + '/Stores-InventorySearch?pid=883360520391M&radius=15&lat=42.340319&long=-71.081786';

        var ExpectedResBody = {
            'stores': [

                {
                    'ID': 'store5',
                    'name': 'Short Electro',
                    'address1': '584 Columbus Ave',
                    'city': 'Boston',
                    'postalCode': '02118',
                    'latitude': 42.3403189,
                    'longitude': -71.0817859,
                    'phone': '+1-617-888-7276',
                    'stateCode': 'MA',
                    'countryCode': 'US',
                    'storeHours': 'Mon - Sat: 10am - 9pm<br />\r\n            Sun: 12pm - 6pm',
                    'inventoryListId': 'inventory_m_store_store5'
                },
                {
                    'ID': 'store10',
                    'name': 'Downtown TV Shop',
                    'address1': '333 Washington St',
                    'city': 'Boston',
                    'postalCode': '02108',
                    'latitude': 42.3569512,
                    'longitude': -71.05902600000002,
                    'phone': '+1-617-695-1565',
                    'stateCode': 'MA',
                    'countryCode': 'US',
                    'storeHours': 'Mon - Sat: 10am - 9pm<br />\r\n            Sun: 12pm - 6pm',
                    'inventoryListId': 'inventory_m_store_store10'
                },
                {
                    'ID': 'store4',
                    'name': 'Champaign Electronic Shop',
                    'address1': '1001 Cambridge St',
                    'city': 'Cambridge',
                    'postalCode': '02141',
                    'latitude': 42.3729794,
                    'longitude': -71.09346089999997,
                    'phone': '+1-617-714-2640',
                    'stateCode': 'MA',
                    'countryCode': 'US',
                    'inventoryListId': 'inventory_m_store_store4'
                },
                {
                    'ID': 'store3',
                    'name': 'Wire-Wire',
                    'address1': '363 Hancock St',
                    'city': 'North Quincy',
                    'postalCode': '02171',
                    'latitude': 42.27451190000001,
                    'longitude': -71.02692050000002,
                    'phone': '+1-617-318-2860',
                    'stateCode': 'MA',
                    'countryCode': 'US',
                    'inventoryListId': 'inventory_m_store_store3'
                },
                {
                    'ID': 'store1',
                    'name': 'Commerce Cloud',
                    'address1': '10 Presidential Way',
                    'city': 'Woburn',
                    'postalCode': '01801',
                    'latitude': 42.5273334,
                    'longitude': -71.13758250000001,
                    'stateCode': 'MA',
                    'countryCode': 'US',
                    'storeHours': 'Mon - Sat: 10am - 9pm<br />\r\nSun: 12pm - 6pm',
                    'inventoryListId': 'inventory_m_store_store1'
                }
            ],
            'radius': 15,
            'radiusOptions': [
                15,
                30,
                50,
                100,
                300
            ]

        };

        request(myRequest, function (error, response) {
            assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');

            var bodyAsJson = JSON.parse(response.body);
            assert.containSubset(bodyAsJson.stores, ExpectedResBody.stores, 'Actual response.stores not as expected.');
            assert.deepEqual(bodyAsJson.radius, ExpectedResBody.radius, 'Actual response.radius not as expected.');
        });
    });
    it('should return a store with radius and postalCode', function () {
        var myRequest = {
            url: '',
            method: 'GET',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar
        };
        myRequest.url = config.baseUrl + '/Stores-InventorySearch?pid=883360352442M&postalCode=01803&radius=15';

        var ExpectedResBody = {

            'stores': [

                {
                    'ID': 'store1',
                    'name': 'Commerce Cloud',
                    'address1': '10 Presidential Way',
                    'city': 'Woburn',
                    'postalCode': '01801',
                    'latitude': 42.5273334,
                    'longitude': -71.13758250000001,
                    'stateCode': 'MA',
                    'countryCode': 'US',
                    'storeHours': 'Mon - Sat: 10am - 9pm<br />\r\nSun: 12pm - 6pm',
                    'inventoryListId': 'inventory_m_store_store1'
                },
                {
                    'ID': 'store4',
                    'name': 'Champaign Electronic Shop',
                    'address1': '1001 Cambridge St',
                    'city': 'Cambridge',
                    'postalCode': '02141',
                    'latitude': 42.3729794,
                    'longitude': -71.09346089999997,
                    'phone': '+1-617-714-2640',
                    'stateCode': 'MA',
                    'countryCode': 'US',
                    'inventoryListId': 'inventory_m_store_store4'
                },
                {
                    'ID': 'store10',
                    'name': 'Downtown TV Shop',
                    'address1': '333 Washington St',
                    'city': 'Boston',
                    'postalCode': '02108',
                    'latitude': 42.3569512,
                    'longitude': -71.05902600000002,
                    'phone': '+1-617-695-1565',
                    'stateCode': 'MA',
                    'countryCode': 'US',
                    'storeHours': 'Mon - Sat: 10am - 9pm<br />\r\n            Sun: 12pm - 6pm',
                    'inventoryListId': 'inventory_m_store_store10'
                },
                {
                    'ID': 'store5',
                    'name': 'Short Electro',
                    'address1': '584 Columbus Ave',
                    'city': 'Boston',
                    'postalCode': '02118',
                    'latitude': 42.3403189,
                    'longitude': -71.0817859,
                    'phone': '+1-617-888-7276',
                    'stateCode': 'MA',
                    'countryCode': 'US',
                    'storeHours': 'Mon - Sat: 10am - 9pm<br />\r\n            Sun: 12pm - 6pm',
                    'inventoryListId': 'inventory_m_store_store5'
                },
                {
                    'ID': 'store6',
                    'name': 'Khale Street Electronics',
                    'address1': '150 Winthrop Ave',
                    'city': 'Lawrence',
                    'postalCode': '01843',
                    'latitude': 42.6895548,
                    'longitude': -71.14878340000001,
                    'stateCode': 'MA',
                    'countryCode': 'US',
                    'inventoryListId': 'inventory_m_store_store6'
                }
            ],
            'radius': 15,
            'radiusOptions': [
                15,
                30,
                50,
                100,
                300
            ]

        };
        request(myRequest, function (error, response) {
            assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');

            var bodyAsJson = JSON.parse(response.body);
            assert.containSubset(bodyAsJson.stores, ExpectedResBody.stores, 'Actual response.stores not as expected.');
            assert.containSubset(bodyAsJson.radius, ExpectedResBody.radius, 'Actual response.radius not as expected.');
            assert.containSubset(bodyAsJson.postalCode, ExpectedResBody.postalCode, 'Actual response.radius not as expected.');
        });
    });
});
