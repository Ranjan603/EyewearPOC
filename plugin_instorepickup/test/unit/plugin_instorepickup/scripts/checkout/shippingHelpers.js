'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var collections = require('../../../../mocks/util/collections');
var mockSuperModule = require('../../../../mockModuleSuperModule');
var ArrayList = require('../../../../mocks/dw.util.Collection');
var baseShippingHelpersMock = require('../../../../../test/mocks/scripts/checkout/baseShippingHelpers');

var shippingMethodModel = function (method) {
    this.description = method.description;
    this.displayName = method.displayName;
    this.ID = method.ID;
};

describe('shippingHelpers', function () {
    describe('getApplicableShippingMethods', function () {
        var shippingHelpers;

        before(function () {
            mockSuperModule.create(baseShippingHelpersMock);

            shippingHelpers = proxyquire('../../../../../cartridges/plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers', {
                '*/cartridge/scripts/util/collections': collections,
                'dw/order/ShippingMgr': require('../../../../mocks/dw/order/ShippingMgr'),
                '*/cartridge/models/shipping/shippingMethod': shippingMethodModel
            });
        });

        after(function () {
            mockSuperModule.remove();
        });

        it('should return null when there is no shipment', function () {
            var shipment = null;
            var address = {};
            var shippingMethods = shippingHelpers.getApplicableShippingMethods(shipment, address);
            assert.isNull(shippingMethods);
        });

        it('should return a list of applicable shipping methods for non null address with store pickup at the last item.', function () {
            var shipment = {};
            var address = {};
            var applicableShippingMethods = shippingHelpers.getApplicableShippingMethods(shipment, address);

            assert.equal(
                applicableShippingMethods[0].description,
                'Order received within 7-10 business days'
            );
            assert.equal(applicableShippingMethods[0].displayName, 'Ground');
            assert.equal(applicableShippingMethods[0].ID, '001');

            assert.equal(applicableShippingMethods[1].displayName, '2-Day Express');
            assert.equal(applicableShippingMethods[1].ID, '002');

            assert.equal(applicableShippingMethods[2].displayName, 'Store Pickup');
            assert.equal(applicableShippingMethods[2].ID, '005');
        });

        it('should return a list of applicable shipping methods for null address with store pickup at the last item', function () {
            var shipment = {};
            var address = null;
            var applicableShippingMethods = shippingHelpers.getApplicableShippingMethods(shipment, address);

            assert.equal(
                applicableShippingMethods[0].description,
                'Order received within 7-10 business days'
            );
            assert.equal(applicableShippingMethods[0].displayName, 'Ground');
            assert.equal(applicableShippingMethods[0].ID, '001');

            assert.equal(applicableShippingMethods[1].displayName, '2-Day Express');
            assert.equal(applicableShippingMethods[1].ID, '002');

            assert.equal(applicableShippingMethods[2].displayName, 'Store Pickup');
            assert.equal(applicableShippingMethods[2].ID, '005');
        });
    });

    describe('markShipment', function () {
        var shippingHelpers;
        var shipment;

        before(function () {
            mockSuperModule.create(baseShippingHelpersMock);

            shippingHelpers = proxyquire('../../../../../cartridges/plugin_instorepickup/cartridge/scripts/checkout/shippingHelpers', {
                '*/cartridge/scripts/util/collections': collections,
                'dw/catalog/StoreMgr': { getStore: function (storeId) { this.storeId = storeId; return this; }, custom: { inventoryListId: 10 } },
                'dw/catalog/ProductInventoryMgr': { getInventoryList: function (inventoryId) { return inventoryId; } },
                'dw/system/Transaction': { wrap: function (callback) { callback.call(this); } }
            });

            shipment = {
                productLineItems: new ArrayList([{
                    custom: { fromStoreId: null },
                    setProductInventoryList: function (storeInventory) {
                        this.storeInventory = storeInventory;
                    }
                }]),
                custom: { fromStoreId: null }
            };
        });

        it('should mark shipment for pickup instore', function () {
            shippingHelpers.markShipmentForPickup(shipment, 22);

            assert.equal(shipment.custom.fromStoreId, 22);
            assert.equal(shipment.productLineItems.toArray()[0].storeInventory, 10);
            assert.equal(shipment.productLineItems.toArray()[0].custom.fromStoreId, 22);
        });

        it('should remove pickup instore marks from the shipment', function () {
            shippingHelpers.markShipmentForShipping(shipment);

            assert.isNull(shipment.custom.fromStoreId);
            assert.isNull(shipment.productLineItems.toArray()[0].storeInventory);
            assert.isNull(shipment.productLineItems.toArray()[0].custom.fromStoreId);
        });

        after(function () {
            mockSuperModule.remove();
        });
    });
});
