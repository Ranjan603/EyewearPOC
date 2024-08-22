'use strict';

var assert = require('chai').assert;

var lineItemMock = {
    custom: {
        fromStoreId: 'someStoreId'
    }
};

describe('product line item fromStoreId decorator', function () {
    var productLineItemFromStoreId = require('../../../../../../cartridges/plugin_instorepickup/cartridge/models/productLineItem/decorators/fromStoreId');

    it('should create fromStoreId property for passed in object', function () {
        var object = {};
        productLineItemFromStoreId(object, lineItemMock);

        assert.equal(object.fromStoreId, 'someStoreId');
    });
});
