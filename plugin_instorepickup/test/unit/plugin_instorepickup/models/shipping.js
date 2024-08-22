'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../mockModuleSuperModule');
var baseShippingMock = require('../../../mocks/models/baseShipping');

var collections = require('../../../mocks/util/collections');
var URLUtils = {
    url: function (endPoint, param1, value1, param2, value2, param3, value3) {
        return endPoint + '?'
            + param1 + '=' + value1 + '&'
            + param2 + '=' + value2 + '&'
            + param3 + '=' + value3;
    }
};

describe('shipping model', function () {
    var ShippingModel;

    before(function () {
        mockSuperModule.create(baseShippingMock);
        ShippingModel = proxyquire('../../../../cartridges/plugin_instorepickup/cartridge/models/shipping', {
            '*/cartridge/scripts/util/collections': collections,
            'dw/web/URLUtils': URLUtils
        });
    });

    after(function () {
        mockSuperModule.remove();
    });

    it('should return the shipping model with pickupInstoreUrl property', function () {
        var shipments = {
            productLineItems: [
                {
                    product: { ID: '0001' },
                    quantity: { value: 2 }
                },
                {
                    product: { ID: '0002' },
                    quantity: { value: 1 }
                },
                {
                    product: { ID: '0003' },
                    quantity: { value: 5 }
                }
            ]
        };

        var shipping = new ShippingModel(shipments);
        assert.equal(shipping.pickupInstoreUrl, 'Stores-InventorySearch?showMap=false&products=0001:2,0002:1,0003:5&isForm=false');
    });
});
