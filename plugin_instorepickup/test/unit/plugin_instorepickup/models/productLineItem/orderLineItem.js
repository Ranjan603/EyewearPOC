'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../mockModuleSuperModule');
var baseOrderLineItemMock = require('../../../../../test/mocks/models/productLineItem/baseOrderLineItem');

var productMock = {
    attributeModel: {},
    minOrderQuantity: { value: 'someValue' },
    availabilityModel: {},
    stepQuantity: { value: 'someOtherValue' },
    getPrimaryCategory: function () { return { custom: { sizeChartID: 'someID' } }; },
    getMasterProduct: function () {
        return {
            getPrimaryCategory: function () { return { custom: { sizeChartID: 'someID' } }; }
        };
    },
    ID: 'someID'
};

var optionsMock = {
    productType: 'someProductType',
    optionModel: {},
    quantity: 1,
    variationModel: {},
    promotions: [],
    variables: [],
    lineItem: {
        UUID: '123',
        custom: {
            fromStoreId: 'someStoreId'
        }
    }
};

var object = {};
var fromStoreId;
var orderLineItem;
describe('Order Line Item Model', function () {
    before(function () {
        mockSuperModule.create(baseOrderLineItemMock);
        fromStoreId = require('../../../../../cartridges/plugin_instorepickup/cartridge/models/productLineItem/decorators/fromStoreId');
        orderLineItem = proxyquire('../../../../../cartridges/plugin_instorepickup/cartridge/models/productLineItem/orderLineItem', {
            '*/cartridge/models/productLineItem/decorators/fromStoreId': fromStoreId
        });
    });
    after(function () {
        mockSuperModule.remove();
    });

    it('should set fromStoreId for order line item model', function () {
        var oli = orderLineItem(object, productMock, optionsMock);
        assert.equal(oli.fromStoreId, 'someStoreId');
    });
});
