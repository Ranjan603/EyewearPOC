'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var transaction = {
    wrap: function (callBack) {
        return callBack.call();
    },
    begin: function () {},
    commit: function () {}
};

var instorePickupStoreHelpers = proxyquire('../../../../../cartridges/plugin_instorepickup/cartridge/scripts/helpers/instorePickupStoreHelpers', {
    'dw/catalog/StoreMgr': require('../../../../mocks/dw/catalog/StoreMgr'),
    'dw/catalog/ProductInventoryMgr': require('../../../../mocks/dw/catalog/ProductInventoryMgr'),
    'dw/system/Transaction': transaction
});

describe('instorePickupStoreHelpers', function () {
    it('should return the correct available to sell (ATS) value', function () {
        var storeId = 'store1';
        var productId = '000001';
        var atsValue = instorePickupStoreHelpers.getStoreInventory(storeId, productId);
        assert.equal(atsValue, 10);
    });

    it('should return an ATS value of 0 for store with no store invenntory', function () {
        var storeId = 'storeWithNoInventory';
        var productId = '000001';
        var atsValue = instorePickupStoreHelpers.getStoreInventory(storeId, productId);
        assert.equal(atsValue, 0);
    });

    it('should return an ATS value of 0 for store with no record', function () {
        var storeId = 'storeWithNoRecord';
        var productId = '999999';
        var atsValue = instorePickupStoreHelpers.getStoreInventory(storeId, productId);
        assert.equal(atsValue, 0);
    });
});
