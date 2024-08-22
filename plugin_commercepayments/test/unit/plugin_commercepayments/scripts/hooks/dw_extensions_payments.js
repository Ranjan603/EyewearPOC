'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');

var Money = require('../../../../mocks/dw/value/Money');
var Status = require('../../../../mocks/dw/system/Status');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('dw_extensions_payments', function () {
    var SalesforcePaymentMethod = {
        TYPE_CARD: 'card',
        TYPE_IDEAL: 'ideal'
    };

    var PaymentTransaction = {
        TYPE_AUTH: 'auth',
        TYPE_CAPTURE: 'capture'
    };

    var paymentTransaction;
    var paymentInstrument;
    var paymentDetails;
    var paymentIntent;
    var order;
    var checkoutHelpers;
    var validationHelpers;
    var paymentHelpers;
    var OrderMgr;
    var Transaction;
    var SalesforcePaymentsMgr;
    var payments;
    var request;

    beforeEach(function () {
        paymentTransaction = {};
        paymentInstrument = {
            paymentTransaction: paymentTransaction
        };
        paymentDetails = {};
        paymentIntent = {
            amount: new Money(10, 'USD'),
            ID: 'ABC123',
            paymentMethod: {
                type: SalesforcePaymentMethod.TYPE_CARD,
                getPaymentDetails: sinon.stub().returns(paymentDetails)
            }
        };
        order = {
            customerLocaleID: 'en_US'
        };

        checkoutHelpers = {
            handleCommercePayments: function () {
                return {};
            },
            placeOrder: function () {
                return {};
            },
            sendConfirmationEmail: sinon.stub()
        };

        validationHelpers = {
            validatePaymentIntent: function () {
                return {
                    paymentInstrument: paymentInstrument,
                    paymentIntent: paymentIntent
                };
            }
        };

        paymentHelpers = {
            reversePaymentIfNecessary: sinon.stub()
        };

        OrderMgr = {
            failOrder: sinon.stub()
        };

        Transaction = {
            wrap: sinon.stub().callsArg(0)
        };

        SalesforcePaymentsMgr = {
            setPaymentDetails: sinon.stub()
        };

        request = {
            setLocale: function () {
            }
        };
        global.request = request;

        payments = proxyquire('../../../../../cartridges/plugin_commercepayments/cartridge/scripts/hooks/dw_extensions_payments', {
            'dw/order/OrderMgr': OrderMgr,
            'dw/order/PaymentTransaction': PaymentTransaction,
            'dw/system/Status': Status,
            'dw/system/Transaction': Transaction,
            'dw/extensions/payments/SalesforcePaymentMethod': SalesforcePaymentMethod,
            'dw/extensions/payments/SalesforcePaymentsMgr': SalesforcePaymentsMgr,
            '*/cartridge/scripts/checkout/checkoutHelpers': checkoutHelpers,
            '*/cartridge/scripts/helpers/basketValidationHelpers': validationHelpers,
            '*/cartridge/scripts/helpers/paymentHelpers': paymentHelpers
        });
    });

    describe('asyncPaymentSucceeded', function () {
        describe('payment validation error', function () {
            it('should fail the order and return error status', function () {
                validationHelpers.validatePaymentIntent = function () {
                    return {
                        error: true
                    };
                };

                var status = payments.asyncPaymentSucceeded(order);
                assert.equal(Status.ERROR, status.getStatus());

                assert.isFalse(Transaction.wrap.calledOnce);
                assert.isFalse(SalesforcePaymentsMgr.setPaymentDetails.calledOnce);
                assert.isTrue(paymentHelpers.reversePaymentIfNecessary.calledOnce);
                assert.isTrue(paymentHelpers.reversePaymentIfNecessary.calledWith(order));
                assert.isTrue(OrderMgr.failOrder.calledOnce);
                assert.isTrue(OrderMgr.failOrder.calledWith(order, true));
                assert.isNotTrue(checkoutHelpers.sendConfirmationEmail.calledAtLeastOnce);
            });
        });

        describe('payment validation success', function () {
            describe('handle payments error', function () {
                it('should return error status', function () {
                    checkoutHelpers.handleCommercePayments = function () {
                        return {
                            error: true
                        };
                    };

                    var status = payments.asyncPaymentSucceeded(order);
                    assert.equal(Status.ERROR, status.getStatus());

                    assert.equal(paymentTransaction.amount, paymentIntent.amount);
                    assert.equal(paymentTransaction.transactionID, paymentIntent.ID);
                    assert.equal(paymentTransaction.type, PaymentTransaction.TYPE_AUTH);

                    assert.isTrue(Transaction.wrap.calledOnce);
                    assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledOnce);
                    assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledWith(paymentInstrument, paymentDetails));
                    assert.isNotTrue(paymentHelpers.reversePaymentIfNecessary.calledAtLeastOnce);
                    assert.isNotTrue(OrderMgr.failOrder.calledAtLeastOnce);
                    assert.isNotTrue(checkoutHelpers.sendConfirmationEmail.calledAtLeastOnce);
                });
            });

            describe('place order error', function () {
                it('should return error status', function () {
                    checkoutHelpers.placeOrder = function () {
                        return {
                            error: true
                        };
                    };

                    var status = payments.asyncPaymentSucceeded(order);
                    assert.equal(Status.ERROR, status.getStatus());

                    assert.equal(paymentTransaction.amount, paymentIntent.amount);
                    assert.equal(paymentTransaction.transactionID, paymentIntent.ID);
                    assert.equal(paymentTransaction.type, PaymentTransaction.TYPE_AUTH);

                    assert.isTrue(Transaction.wrap.calledOnce);
                    assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledOnce);
                    assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledWith(paymentInstrument, paymentDetails));
                    assert.isNotTrue(paymentHelpers.reversePaymentIfNecessary.calledAtLeastOnce);
                    assert.isNotTrue(OrderMgr.failOrder.calledAtLeastOnce);
                    assert.isNotTrue(checkoutHelpers.sendConfirmationEmail.calledAtLeastOnce);
                });
            });

            describe('place order success', function () {
                it('should set type capture and return ok status', function () {
                    paymentIntent.paymentMethod.type = SalesforcePaymentMethod.TYPE_IDEAL;

                    var status = payments.asyncPaymentSucceeded(order);
                    assert.equal(Status.OK, status.getStatus());

                    assert.equal(paymentTransaction.amount, paymentIntent.amount);
                    assert.equal(paymentTransaction.transactionID, paymentIntent.ID);
                    assert.equal(paymentTransaction.type, PaymentTransaction.TYPE_CAPTURE);

                    assert.isTrue(Transaction.wrap.calledOnce);
                    assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledOnce);
                    assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledWith(paymentInstrument, paymentDetails));
                    assert.isNotTrue(paymentHelpers.reversePaymentIfNecessary.calledAtLeastOnce);
                    assert.isNotTrue(OrderMgr.failOrder.calledAtLeastOnce);
                    assert.isTrue(checkoutHelpers.sendConfirmationEmail.calledOnce);
                    assert.isTrue(checkoutHelpers.sendConfirmationEmail.calledWith(order, 'en_US'));
                });
            });
        });
    });
});
