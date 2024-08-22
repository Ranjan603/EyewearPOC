'use strict';

var assert = require('chai').assert;

var productMock = {
    custom: {
        availableForInStorePickup: true
    }
};

var productMock2 = {
    custom: {
        availableForInStorePickup: false
    }
};

var productMock3 = {
    custom: {}
};

var selectedVariantMock = {
    selectedVariant: {
        custom: {
            availableForInStorePickup: true
        }
    }
};

var selectedVariantMock2 = {
    selectedVariant: {
        custom: {
            availableForInStorePickup: false
        }
    }
};
var selectedVariantMock3 = {
};

describe('product availableForInStorePickup decorator', function () {
    var availableForInStorePickup = require('../../../../../../cartridges/plugin_instorepickup/cartridge/models/product/decorators/availableForInStorePickup');

    it('should return true for availableForInStorePickup when selectedVariant is ture', function () {
        var object = {};
        availableForInStorePickup(object, productMock, selectedVariantMock);
        assert.equal(object.availableForInStorePickup, true);
    });

    it('should return false for availableForInStorePickup when selectedVariant is false', function () {
        var object = {};
        availableForInStorePickup(object, productMock, selectedVariantMock2);
        assert.equal(object.availableForInStorePickup, false);
    });

    it('should return true for availableForInStorePickup when selectedVariant is undefined and product is true', function () {
        var object = {};
        availableForInStorePickup(object, productMock, selectedVariantMock3);
        assert.equal(object.availableForInStorePickup, true);
    });

    it('should return false for availableForInStorePickup when selectedVariant is undefined and product is false', function () {
        var object = {};
        availableForInStorePickup(object, productMock2, selectedVariantMock3);
        assert.equal(object.availableForInStorePickup, false);
    });

    it('should return false for availableForInStorePickup when both are undefined', function () {
        var object = {};
        availableForInStorePickup(object, productMock3, selectedVariantMock3);
        assert.equal(object.availableForInStorePickup, false);
    });
});
