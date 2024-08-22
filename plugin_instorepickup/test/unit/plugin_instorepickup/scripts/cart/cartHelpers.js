'use strict';

var assert = require('chai').assert;
var mockSuperModule = require('../../../../mockModuleSuperModule');
var baseCartHelpersMock = require('../../../../../test/mocks/scripts/cart/baseCartHelpers');
var ArrayList = require('../../../../mocks/dw.util.Collection.js');
var collections = require('../../../../mocks/util/collections');
var ShipmentModel = require('../../../../mocks/models/shipment');
var ProductLineItemModel = require('../../../../mocks/models/productLineItem/productLineItem');
var mockOptions = [{
    optionId: 'option 1',
    selectedValueId: '123'
}];

var createApiBasket = function () {
    var shipment = new ShipmentModel();
    var shipments = [shipment];
    var currentBasket = {
        shipments: shipments,
        defaultShipment: shipment,
        productLineItems: [],
        getShipments: function () {
            return this.shipments;
        },
        createShipment: function () {
            var newShipment = new ShipmentModel();
            this.shipments.push(newShipment);
            return newShipment;
        },
        createProductLineItem: function (product, optionModel, defaultShipment) {
            var newProductLineItem = new ProductLineItemModel(product, optionModel, defaultShipment);
            this.productLineItems.push(newProductLineItem);
            return newProductLineItem;
        },
        getBonusDiscountLineItems: new ArrayList([])
    };

    return currentBasket;
};

var requestMock = {
    session: {
        privacyCache: {
            set: function () {
                return 'something';
            }
        }
    }
};
var cartHelpers;

describe('cartHelpers', function () {
    before(function () {
        mockSuperModule.create(baseCartHelpersMock);
        cartHelpers = require('../../../../mocks/helpers/cartHelpers');
    });
    after(function () {
        mockSuperModule.remove();
    });
    it('should create a prodcut line itme and a new shipment with store address when add a product with a store', function () {
        var currentBasket = createApiBasket();
        var result = cartHelpers.addProductToCart(currentBasket, '000001', 1, [], mockOptions, 'store1', requestMock);
        var currentShipment = collections.find(currentBasket.getShipments(), function (s) {
            return s.custom.fromStoreId === 'store1';
        });

        var currentProductLineItem = collections.find(currentBasket.productLineItems, function (pli) {
            return pli.custom.fromStoreId === 'store1';
        });

        assert.equal(currentShipment.custom.fromStoreId, 'store1');
        assert.equal(currentProductLineItem.custom.fromStoreId, 'store1');
        assert.equal(currentProductLineItem.quantity.value, 1);
        assert.equal(currentShipment.shippingMethod.ID, '005');
        assert.equal(currentShipment.shippingAddress.firstName, 'Downtown TV Shop');
        assert.equal(currentShipment.shippingAddress.address1, '333 Washington St');
        assert.equal(currentShipment.shippingAddress.city, 'Boston');
        assert.equal(currentShipment.shippingAddress.postalCode, '01803');
        assert.equal(currentShipment.shippingAddress.stateCode, 'MA');
        assert.equal(currentShipment.shippingAddress.countryCode.value, 'us');
        assert.equal(currentShipment.shippingAddress.phone, '333-333-3333');
        assert.equal(result.uuid, 'someUUID');
    });

    it('should only add one product line item, a new shipment should not be created when add the same product with the same store twice', function () {
        var currentBasket = createApiBasket();
        cartHelpers.addProductToCart(currentBasket, '000001', 1, [], mockOptions, 'store1');
        var firstShipment = collections.find(currentBasket.getShipments(), function (s) {
            return s.custom.fromStoreId === 'store1';
        });
        var firstShipmentsCount = currentBasket.getShipments().length;
        cartHelpers.addProductToCart(currentBasket, '000001', 1, [], mockOptions, 'store1');
        var secondShipmentsCount = currentBasket.getShipments().length;
        var currentProductLineItem = collections.find(currentBasket.productLineItems, function (pli) {
            return pli.custom.fromStoreId === 'store1';
        });
        assert.equal(firstShipment.custom.fromStoreId, 'store1');
        assert.equal(firstShipmentsCount, secondShipmentsCount);
        assert.equal(firstShipment.custom.fromStoreId, 'store1');
        assert.equal(currentProductLineItem.productID, '000001');
    });

    it('should add two product line items and two new shipments when add the same product with a different store', function () {
        var currentBasket = createApiBasket();
        cartHelpers.addProductToCart(currentBasket, '000001', 1, [], mockOptions, 'store1', requestMock);
        var firstShipment = collections.find(currentBasket.getShipments(), function (s) {
            return s.custom.fromStoreId === 'store1';
        });
        var firstProductLineItem = collections.find(currentBasket.productLineItems, function (pli) {
            return pli.custom.fromStoreId === 'store1';
        });
        assert.equal(firstShipment.custom.fromStoreId, 'store1');
        assert.equal(firstProductLineItem.custom.fromStoreId, 'store1');
        assert.equal(currentBasket.productLineItems.length, 1);
        assert.equal(currentBasket.getShipments().length, 1);
        cartHelpers.addProductToCart(currentBasket, '000001', 1, [], mockOptions, 'store2', requestMock);
        var secondShipment = collections.find(currentBasket.getShipments(), function (s) {
            return s.custom.fromStoreId === 'store2';
        });
        var secondProductLineItem = collections.find(currentBasket.productLineItems, function (pli) {
            return pli.custom.fromStoreId === 'store2';
        });
        assert.equal(secondShipment.custom.fromStoreId, 'store2');
        assert.equal(secondProductLineItem.custom.fromStoreId, 'store2');
        assert.equal(currentBasket.productLineItems.length, 2);
        assert.equal(currentBasket.getShipments().length, 2);
    });
});
