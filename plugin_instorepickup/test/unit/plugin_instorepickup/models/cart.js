'use strict';

var assert = require('chai').assert;
var mockSuperModule = require('../../../mockModuleSuperModule');
var baseCartModelMock = require('../../../mocks/models/baseCart');

var CartModel;

describe('cartModel', function () {
    before(function () {
        mockSuperModule.create(baseCartModelMock);
        CartModel = require('../../../../cartridges/plugin_instorepickup/cartridge/models/cart');
    });

    after(function () {
        mockSuperModule.remove();
    });

    describe('Cart with store inventory', function () {
        it('should have disableShippingMethod property set to "disabled"', function () {
            var basketMock = {
                productLineItems: [
                    { productInventoryListID: 'inventoryListId0001' },
                    { productInventoryListID: 'inventoryListId0002' }
                ]
            };

            var cart = new CartModel(basketMock);

            assert.equal(cart.disableShippingMethod, 'disabled');
        });
    });

    describe('Cart with no store inventory', function () {
        it('should have disableShippingMethod property set to blank', function () {
            var basketMock = {
                productLineItems: [
                    { product: { ID: '000001' } },
                    { product: { ID: '000002' } }
                ]
            };

            var cart = new CartModel(basketMock);

            assert.equal(cart.disableShippingMethod, '');
        });
    });
});
