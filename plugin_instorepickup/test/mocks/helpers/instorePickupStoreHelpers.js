'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var storeMgr = require('../dw/catalog/StoreMgr');
var productInventoryMgr = require('../dw/catalog/ProductInventoryMgr');

function proxyModel() {
    return proxyquire('../../../cartridges/plugin_instorepickup/cartridge/scripts/helpers/instorePickupStoreHelpers', {
        'dw/catalog/StoreMgr': storeMgr,
        'dw/catalog/ProductInventoryMgr': productInventoryMgr,
        'dw/system/Transaction': {
            wrap: function (item) {
                item();
            }
        }
    });
}

module.exports = proxyModel();
