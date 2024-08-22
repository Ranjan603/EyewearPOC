'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var productInventoryMgr = require('../dw/catalog/ProductInventoryMgr');

function proxyModel() {
    return proxyquire('../../../cartridges/plugin_instorepickup/cartridge/scripts/helpers/storeHelpers', {
        'dw/catalog/ProductInventoryMgr': productInventoryMgr
    });
}

module.exports = proxyModel();
