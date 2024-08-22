'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../mockModuleSuperModule');
var baseFullProductMock = require('../../../../../test/mocks/models/product/baseFullProduct');

var productMock = {
    custom: {
        availableForInStorePickup: true
    },
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

var productMock2 = {
    custom: {
        availableForInStorePickup: false
    },
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

var productMock3 = {
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
    variationModel: {
        selectedVariant: {
            custom: {
                availableForInStorePickup: true
            }
        }
    },
    promotions: [],
    variables: [],
    lineItem: {}
};

var optionsMock2 = {
    productType: 'someProductType',
    optionModel: {},
    quantity: 1,
    variationModel: {
        selectedVariant: {
            custom: {
                availableForInStorePickup: false
            }
        }
    },
    promotions: [],
    variables: [],
    lineItem: {}
};

var optionsMock3 = {
    productType: 'someProductType',
    optionModel: {},
    quantity: 1,
    variationModel: {
    },
    promotions: [],
    variables: [],
    lineItem: {}
};

var availableForInStorePickup;
var fullProduct;

describe('full product Model', function () {
    before(function () {
        mockSuperModule.create(baseFullProductMock);
        availableForInStorePickup = require('../../../../../cartridges/plugin_instorepickup/cartridge/models/product/decorators/availableForInStorePickup');
        fullProduct = proxyquire('../../../../../cartridges/plugin_instorepickup/cartridge/models/product/fullProduct', {
            '*/cartridge/models/product/decorators/availableForInStorePickup': availableForInStorePickup
        });
    });
    after(function () {
        mockSuperModule.remove();
    });

    it('should return true for availableForInStorePickup in full product model when selectedVarian is true', function () {
        var object = {};
        fullProduct(object, productMock, optionsMock);
        assert.equal(object.availableForInStorePickup, true);
    });

    it('should return false for availableForInStorePickup in full product model when selectedVariant is false', function () {
        var object = {};
        fullProduct(object, productMock, optionsMock2);
        assert.equal(object.availableForInStorePickup, false);
    });

    it('should return true for availableForInStorePickup in full product model when product is true and selectedVariant is undefined', function () {
        var object = {};
        fullProduct(object, productMock, optionsMock3);
        assert.equal(object.availableForInStorePickup, true);
    });

    it('should return false for availableForInStorePickup in full product model when product is false and selectedVariant is undefined', function () {
        var object = {};
        fullProduct(object, productMock2, optionsMock3);
        assert.equal(object.availableForInStorePickup, false);
    });

    it('should return false for availableForInStorePickup in full product model when both are undefined ', function () {
        var object = {};
        fullProduct(object, productMock3, optionsMock3);
        assert.equal(object.availableForInStorePickup, false);
    });
});
