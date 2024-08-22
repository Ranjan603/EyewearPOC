'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');

var Money = require('../../../../mocks/dw/value/Money');
var mockSuperModule = require('../../../mockModuleSuperModule.js');
var superModule = {};

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('Basket Validation Helpers', function () {
    var amount = new Money('USD', 10);
    var basket = {};
    var paymentInstrument = {};

    var paymentIntent;
    var paypalOrder;
    var paymentHelpers;
    var basketValidationHelpers;
    before(function () {
        mockSuperModule.create(superModule);
    });
    after(function () {
        mockSuperModule.remove();
    });
    beforeEach(function () {
        paymentIntent = {
            getPaymentInstrument: sinon.stub(),
            confirmed: true,
            amount: amount
        };
        paypalOrder = {
            getPaymentInstrument: sinon.stub(),
            completed: true,
            amount: amount
        };
        paymentHelpers = {
            getPaymentIntent: sinon.stub(),
            getPayPalOrder: sinon.stub(),
            getPaymentAmount: sinon.stub()
        };
        basketValidationHelpers = proxyquire('../../../../../cartridges/plugin_commercepayments/cartridge/scripts/helpers/basketValidationHelpers', {
            '*/cartridge/scripts/helpers/paymentHelpers': paymentHelpers
        });
    });

    describe('validatePaymentIntent', function () {
        describe('validateAmount is true', function () {
            describe('no payment intent', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(null);
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePaymentIntent(basket, true);
                    assert.equal(validation.error, true);
                    assert.isNull(validation.paymentIntent);
                    assert.isUndefined(validation.paymentInstrument);
                });
            });

            describe('payment intent with no payment instrument', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(paymentIntent);
                    paymentIntent.getPaymentInstrument.returns(null);
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePaymentIntent(basket, true);
                    assert.equal(validation.error, true);
                    assert.equal(validation.paymentIntent, paymentIntent);
                    assert.isNull(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('payment intent with unconfirmed payment instrument', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(paymentIntent);
                    paymentIntent.getPaymentInstrument.returns(paymentInstrument);
                    paymentIntent.confirmed = false;
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePaymentIntent(basket, true);
                    assert.equal(validation.error, true);
                    assert.equal(validation.paymentIntent, paymentIntent);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('payment intent with confirmed payment instrument for incorrect amount', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(paymentIntent);
                    paymentIntent.getPaymentInstrument.returns(paymentInstrument);
                    paymentHelpers.getPaymentAmount.returns(new Money('USD', 5));
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePaymentIntent(basket, true);
                    assert.equal(validation.error, true);
                    assert.equal(validation.paymentIntent, paymentIntent);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('payment intent with confirmed payment instrument for correct amount', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(paymentIntent);
                    paymentIntent.getPaymentInstrument.returns(paymentInstrument);
                    paymentHelpers.getPaymentAmount.returns(amount);
                });

                it('should return error false', function () {
                    var validation = basketValidationHelpers.validatePaymentIntent(basket, true);
                    assert.equal(validation.error, false);
                    assert.equal(validation.paymentIntent, paymentIntent);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });
        });

        describe('validateAmount is false', function () {
            describe('no payment intent', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(null);
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePaymentIntent(basket, false);
                    assert.equal(validation.error, true);
                    assert.isNull(validation.paymentIntent);
                    assert.isUndefined(validation.paymentInstrument);
                });
            });

            describe('payment intent with no payment instrument', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(paymentIntent);
                    paymentIntent.getPaymentInstrument.returns(null);
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePaymentIntent(basket, false);
                    assert.equal(validation.error, true);
                    assert.equal(validation.paymentIntent, paymentIntent);
                    assert.isNull(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('payment intent with unconfirmed payment instrument', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(paymentIntent);
                    paymentIntent.getPaymentInstrument.returns(paymentInstrument);
                    paymentIntent.confirmed = false;
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePaymentIntent(basket, false);
                    assert.equal(validation.error, true);
                    assert.equal(validation.paymentIntent, paymentIntent);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('payment intent with confirmed payment instrument for incorrect amount', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(paymentIntent);
                    paymentIntent.getPaymentInstrument.returns(paymentInstrument);
                    paymentHelpers.getPaymentAmount.returns(new Money('USD', 5));
                });

                it('should return error false', function () {
                    var validation = basketValidationHelpers.validatePaymentIntent(basket, false);
                    assert.equal(validation.error, false);
                    assert.equal(validation.paymentIntent, paymentIntent);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('payment intent with confirmed payment instrument for correct amount', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(paymentIntent);
                    paymentIntent.getPaymentInstrument.returns(paymentInstrument);
                    paymentHelpers.getPaymentAmount.returns(amount);
                });

                it('should return error false', function () {
                    var validation = basketValidationHelpers.validatePaymentIntent(basket, false);
                    assert.equal(validation.error, false);
                    assert.equal(validation.paymentIntent, paymentIntent);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });
        });
    });

    describe('validatePayPalOrder', function () {
        describe('validateAmount is true', function () {
            describe('no order', function () {
                beforeEach(function () {
                    paymentHelpers.getPayPalOrder.returns(null);
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePayPalOrder(basket, true);
                    assert.equal(validation.error, true);
                    assert.isNull(validation.paypalOrder);
                    assert.isUndefined(validation.paymentInstrument);
                });
            });

            describe('order with no payment instrument', function () {
                beforeEach(function () {
                    paymentHelpers.getPayPalOrder.returns(paypalOrder);
                    paypalOrder.getPaymentInstrument.returns(null);
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePayPalOrder(basket, true);
                    assert.equal(validation.error, true);
                    assert.equal(validation.paypalOrder, paypalOrder);
                    assert.isNull(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('incomplete order with payment instrument', function () {
                beforeEach(function () {
                    paymentHelpers.getPayPalOrder.returns(paypalOrder);
                    paypalOrder.getPaymentInstrument.returns(paymentInstrument);
                    paypalOrder.completed = false;
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePayPalOrder(basket, true);
                    assert.equal(validation.error, true);
                    assert.equal(validation.paypalOrder, paypalOrder);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('completed order with payment instrument for incorrect amount', function () {
                beforeEach(function () {
                    paymentHelpers.getPayPalOrder.returns(paypalOrder);
                    paypalOrder.getPaymentInstrument.returns(paymentInstrument);
                    paymentHelpers.getPaymentAmount.returns(new Money('USD', 5));
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePayPalOrder(basket, true);
                    assert.equal(validation.error, true);
                    assert.equal(validation.paypalOrder, paypalOrder);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('completed order with payment instrument for correct amount', function () {
                beforeEach(function () {
                    paymentHelpers.getPayPalOrder.returns(paypalOrder);
                    paypalOrder.getPaymentInstrument.returns(paymentInstrument);
                    paymentHelpers.getPaymentAmount.returns(amount);
                });

                it('should return error false', function () {
                    var validation = basketValidationHelpers.validatePayPalOrder(basket, true);
                    assert.equal(validation.error, false);
                    assert.equal(validation.paypalOrder, paypalOrder);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });
        });

        describe('validateAmount is false', function () {
            describe('no order', function () {
                beforeEach(function () {
                    paymentHelpers.getPayPalOrder.returns(null);
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePayPalOrder(basket, false);
                    assert.equal(validation.error, true);
                    assert.isNull(validation.paypalOrder);
                    assert.isUndefined(validation.paymentInstrument);
                });
            });

            describe('order with no payment instrument', function () {
                beforeEach(function () {
                    paymentHelpers.getPayPalOrder.returns(paypalOrder);
                    paypalOrder.getPaymentInstrument.returns(null);
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePayPalOrder(basket, false);
                    assert.equal(validation.error, true);
                    assert.equal(validation.paypalOrder, paypalOrder);
                    assert.isNull(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('incomplete order with payment instrument', function () {
                beforeEach(function () {
                    paymentHelpers.getPayPalOrder.returns(paypalOrder);
                    paypalOrder.getPaymentInstrument.returns(paymentInstrument);
                    paypalOrder.completed = false;
                });

                it('should return error true', function () {
                    var validation = basketValidationHelpers.validatePayPalOrder(basket, false);
                    assert.equal(validation.error, true);
                    assert.equal(validation.paypalOrder, paypalOrder);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('completed order with payment instrument for incorrect amount', function () {
                beforeEach(function () {
                    paymentHelpers.getPayPalOrder.returns(paypalOrder);
                    paypalOrder.getPaymentInstrument.returns(paymentInstrument);
                    paymentHelpers.getPaymentAmount.returns(new Money('USD', 5));
                });

                it('should return error false', function () {
                    var validation = basketValidationHelpers.validatePayPalOrder(basket, false);
                    assert.equal(validation.error, false);
                    assert.equal(validation.paypalOrder, paypalOrder);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });

            describe('completed order with payment instrument for correct amount', function () {
                beforeEach(function () {
                    paymentHelpers.getPayPalOrder.returns(paypalOrder);
                    paypalOrder.getPaymentInstrument.returns(paymentInstrument);
                    paymentHelpers.getPaymentAmount.returns(amount);
                });

                it('should return error false', function () {
                    var validation = basketValidationHelpers.validatePayPalOrder(basket, false);
                    assert.equal(validation.error, false);
                    assert.equal(validation.paypalOrder, paypalOrder);
                    assert.equal(validation.paymentInstrument, paymentInstrument);
                });
            });
        });
    });
});
