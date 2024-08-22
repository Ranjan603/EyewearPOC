'use strict';

var assert = require('chai').assert;
var mockSuperModule = require('../../../../mockModuleSuperModule');
var baseShippingMethodMock = require('../../../../mocks/models/shipping/baseShippingMethod');

describe('shipping model', function () {
    var ShippingMethodModel;

    before(function () {
        mockSuperModule.create(baseShippingMethodMock);
        ShippingMethodModel = require('../../../../../cartridges/plugin_instorepickup/cartridge/models/shipping/shippingMethod');
    });

    after(function () {
        mockSuperModule.remove();
    });

    it('should return the shipping method model with storePickupEnabled property as true for pickup in store method', function () {
        var shippingMethod = {
            description: 'Store Pickup ',
            displayName: 'Store Pickup',
            ID: '005',
            shippingCost: '$0.00',
            custom: {
                storePickupEnabled: true
            }
        };

        var shipments = {
            productLineItems: [
                {
                    product: { ID: '0001' },
                    quantity: { value: 2 }
                },
                {
                    product: { ID: '0002' },
                    quantity: { value: 1 }
                }
            ]
        };

        var shipping = new ShippingMethodModel(shippingMethod, shipments);
        assert.equal(shipping.storePickupEnabled, true);
    });

    it('should return the shipping method model with storePickupEnabled property as false for non-pickup in store method', function () {
        var shippingMethod = {
            description: 'Order received within 7-10 business days',
            displayName: 'Ground',
            ID: '001',
            custom: {
                estimatedArrivalTime: '7-10 Business Days'
            }
        };

        var shipments = {
            productLineItems: [
                {
                    product: { ID: '0001' },
                    quantity: { value: 2 }
                },
                {
                    product: { ID: '0002' },
                    quantity: { value: 1 }
                }
            ]
        };

        var shipping = new ShippingMethodModel(shippingMethod, shipments);
        assert.equal(shipping.storePickupEnabled, false);
    });
});
