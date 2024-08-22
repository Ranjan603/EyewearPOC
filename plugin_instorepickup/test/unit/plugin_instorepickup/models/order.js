'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../mockModuleSuperModule');
var baseOrderModelMock = require('../../../mocks/models/baseOrder');

var OrderModel;

describe('OrderModel pickupInstore Property', function () {
    before(function () {
        mockSuperModule.create(baseOrderModelMock);
        OrderModel = proxyquire('../../../../cartridges/plugin_instorepickup/cartridge/models/order', {
            'dw/web/Resource': {
                msgf: function (params) { return params; },
                msg: function (params) { return params; }
            }
        });
    });

    after(function () {
        mockSuperModule.remove();
    });

    it('should return true for isPickUpInStore property ', function () {
        var options = {
            config: {
                numberOfLineItems: 'single'
            }
        };
        var lineItemContainer = {
            productLineItems: [
                {
                    shipment: {
                        shippingMethod: {
                            custom: {
                                storePickupEnabled: true
                            }
                        }
                    }
                }
            ]
        };
        var result = new OrderModel(lineItemContainer, options);
        assert.equal(result.firstLineItem.isPickUpInStore, true);
    });
});
