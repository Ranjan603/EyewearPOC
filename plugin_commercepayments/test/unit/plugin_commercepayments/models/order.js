'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../mockModuleSuperModule');

var OrderModel;

describe('OrderModel', function () {
    var orderNumber;
    var configurationHelper = {
        commercePaymentsOrder: sinon.stub()
    };

    function BaseOrderModel() {
        this.orderNumber = orderNumber;
    }

    before(function () {
        mockSuperModule.create(BaseOrderModel);
    });
    after(function () {
        mockSuperModule.remove();
    });

    beforeEach(function () {
        OrderModel = proxyquire('../../../../cartridges/plugin_commercepayments/cartridge/models/order', {
            '~/cartridge/scripts/configurationHelper': configurationHelper
        });
    });

    describe('Basket lineItemContainer', function () {
        it('should not contain commercePaymentsOrder property ', function () {
            var result = new OrderModel();
            assert.isUndefined(result.commercePaymentsOrder);
        });
    });

    describe('Order lineItemContainer', function () {
        orderNumber = 'SFRA-12345';

        it('should contain commercePaymentsOrder true', function () {
            configurationHelper.commercePaymentsOrder.returns(true);
            var result = new OrderModel();
            assert.isTrue(result.commercePaymentsOrder);
        });

        it('should contain commercePaymentsOrder false', function () {
            configurationHelper.commercePaymentsOrder.returns(false);
            var result = new OrderModel();
            assert.isFalse(result.commercePaymentsOrder);
        });
    });
});
