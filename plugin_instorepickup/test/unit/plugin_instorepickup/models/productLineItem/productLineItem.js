'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../mockModuleSuperModule');
var baseProductLineItemMock = require('../../../../../test/mocks/models/productLineItem/baseProductLineItem');

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
var productLineItem;
describe('Product Line Item Model', function () {
    before(function () {
        mockSuperModule.create(baseProductLineItemMock);
        fromStoreId = require('../../../../../cartridges/plugin_instorepickup/cartridge/models/productLineItem/decorators/fromStoreId');
        productLineItem = proxyquire('../../../../../cartridges/plugin_instorepickup/cartridge/models/productLineItem/productLineItem', {
            '*/cartridge/models/productLineItem/decorators/fromStoreId': fromStoreId
        });
    });
    after(function () {
        mockSuperModule.remove();
    });

    it('should set fromStoreId for product line item model', function () {
        var pli = productLineItem(object, productMock, optionsMock);
        assert.equal(pli.fromStoreId, 'someStoreId');
    });
});
