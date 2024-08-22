'use strict';

/* eslint-disable new-cap */

var assert = require('chai').assert;
var sinon = require('sinon');

var Money = require('../../../../../../mocks/dw/value/Money');
var Resource = require('../../../../../../mocks/dw/web/Resource');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var amount = new Money(10, 'USD');

describe('salesforce_payments', function () {
    var basket;
    var paymentIntent;
    var paypalOrder;
    var paymentTransaction;
    var paymentInstrument;
    var paymentIntentValidation;
    var paypalOrderValidation;
    var configuration;
    var paymentDetails;
    var paymentInformation;
    var PaymentTransaction;
    var Transaction;
    var SalesforcePaymentMethod;
    var SalesforcePaymentsMgr;
    var basketValidationHelpers;
    var configurationHelper;
    var paymentHelpers;
    var payments;
    beforeEach(function () {
        basket = {};
        paymentInformation = {};
        paymentIntent = {
            ID: 'pi_123',
            amount: amount,
            paymentMethod: {
                getPaymentDetails: sinon.stub().returns(paymentDetails)
            }
        };
        paypalOrder = {
            ID: 'abc123',
            amount: amount,
            getPaymentDetails: sinon.stub().returns(paymentDetails)
        };
        paymentTransaction = {};
        paymentInstrument = {
            paymentTransaction: paymentTransaction
        };
        paymentIntentValidation = {
            paymentInstrument: paymentInstrument,
            paymentIntent: paymentIntent
        };
        paypalOrderValidation = {
            paymentInstrument: paymentInstrument,
            paypalOrder: paypalOrder
        };
        configuration = {};
        paymentDetails = {};

        PaymentTransaction = {
            TYPE_AUTH: 'auth',
            TYPE_CAPTURE: 'capture'
        };
        Transaction = {
            wrap: sinon.stub().callsArg(0)
        };
        SalesforcePaymentMethod = {
            TYPE_CARD: 'card',
            TYPE_IDEAL: 'ideal'
        };
        SalesforcePaymentsMgr = {
            setPaymentDetails: sinon.stub()
        };
        basketValidationHelpers = {
            validatePaymentIntent: sinon.stub().returns(paymentIntentValidation),
            validatePayPalOrder: sinon.stub().returns(paypalOrderValidation)
        };
        configurationHelper = {
            getConfiguration: sinon.stub().returns(configuration)
        };

        paymentHelpers = {
            getPaymentAmount: sinon.stub(),
            getPaymentIntent: sinon.stub()
        };

        payments = proxyquire('../../../../../../../cartridges/plugin_commercepayments/cartridge/scripts/hooks/payment/processor/salesforce_payments', {
            'dw/order/PaymentTransaction': PaymentTransaction,
            'dw/web/Resource': Resource,
            'dw/system/Transaction': Transaction,
            'dw/extensions/payments/SalesforcePaymentMethod': SalesforcePaymentMethod,
            'dw/extensions/payments/SalesforcePaymentsMgr': SalesforcePaymentsMgr,
            '*/cartridge/scripts/helpers/basketValidationHelpers': basketValidationHelpers,
            '~/cartridge/scripts/configurationHelper': configurationHelper,
            '*/cartridge/scripts/helpers/paymentHelpers': paymentHelpers
        });
    });

    describe('Handle', function () {
        describe('with 0 payment amount', function () {
            beforeEach(function () {
                paymentHelpers.getPaymentAmount.returns(new Money(0, 'USD'));
            });

            it('should return no errors', function () {
                var response = payments.Handle(basket, paymentInformation);
                assert.equal(false, response.error);
                assert.equal(0, Object.keys(response.fieldErrors).length);
                assert.equal(0, response.serverErrors.length);

                assert.isTrue(paymentHelpers.getPaymentAmount.calledOnce);
                assert.isTrue(paymentHelpers.getPaymentAmount.calledWith(basket));
            });
        });

        describe('with positive payment amount', function () {
            beforeEach(function () {
                paymentHelpers.getPaymentAmount.returns(amount);
            });

            describe('with Stripe Payment Intent', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(paymentIntent);
                });

                describe('with validation error truthy', function () {
                    beforeEach(function () {
                        paymentIntentValidation.error = true;
                    });

                    it('should return errors', function () {
                        var response = payments.Handle(basket, paymentInformation);
                        assert.equal(true, response.error);
                        assert.equal(0, Object.keys(response.fieldErrors).length);
                        assert.equal(1, response.serverErrors.length);
                        assert.equal('checkout:error.technical', response.serverErrors[0]);

                        assert.isTrue(basketValidationHelpers.validatePaymentIntent.calledOnce);
                        assert.isTrue(basketValidationHelpers.validatePaymentIntent.calledWith(basket));
                        assert.isFalse(Transaction.wrap.calledOnce);
                        assert.isFalse(SalesforcePaymentsMgr.setPaymentDetails.calledOnce);
                    });
                });

                describe('with validation error falsy', function () {
                    beforeEach(function () {
                        paymentIntentValidation.error = false;
                    });

                    describe('with Payment Method of type card', function () {
                        beforeEach(function () {
                            paymentIntent.paymentMethod.type = SalesforcePaymentMethod.TYPE_CARD;
                        });

                        describe('with auto capture enabled', function () {
                            beforeEach(function () {
                                configuration.cardCaptureAutomatic = true;
                            });

                            it('should set payment transaction TYPE_CAPTURE and return no errors', function () {
                                var response = payments.Handle(basket, paymentInformation);
                                assert.equal(false, response.error);
                                assert.equal(0, Object.keys(response.fieldErrors).length);
                                assert.equal(0, response.serverErrors.length);

                                assert.equal(amount, paymentTransaction.amount);
                                assert.equal(paymentIntent.ID, paymentTransaction.transactionID);
                                assert.equal(PaymentTransaction.TYPE_CAPTURE, paymentTransaction.type);

                                assert.isTrue(basketValidationHelpers.validatePaymentIntent.calledOnce);
                                assert.isTrue(basketValidationHelpers.validatePaymentIntent.calledWith(basket));
                                assert.isTrue(Transaction.wrap.calledOnce);
                                assert.isTrue(paymentIntent.paymentMethod.getPaymentDetails.calledOnce);
                                assert.isTrue(paymentIntent.paymentMethod.getPaymentDetails.calledWith(paymentInstrument));
                                assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledOnce);
                                assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledWith(paymentInstrument, paymentDetails));
                            });
                        });

                        describe('with auto capture not enabled', function () {
                            beforeEach(function () {
                                configuration.cardCaptureAutomatic = false;
                            });

                            it('should set payment transaction TYPE_AUTH and return no errors', function () {
                                var response = payments.Handle(basket, paymentInformation);
                                assert.equal(false, response.error);
                                assert.equal(0, Object.keys(response.fieldErrors).length);
                                assert.equal(0, response.serverErrors.length);

                                assert.equal(amount, paymentTransaction.amount);
                                assert.equal(paymentIntent.ID, paymentTransaction.transactionID);
                                assert.equal(PaymentTransaction.TYPE_AUTH, paymentTransaction.type);

                                assert.isTrue(basketValidationHelpers.validatePaymentIntent.calledOnce);
                                assert.isTrue(basketValidationHelpers.validatePaymentIntent.calledWith(basket));
                                assert.isTrue(Transaction.wrap.calledOnce);
                                assert.isTrue(paymentIntent.paymentMethod.getPaymentDetails.calledOnce);
                                assert.isTrue(paymentIntent.paymentMethod.getPaymentDetails.calledWith(paymentInstrument));
                                assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledOnce);
                                assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledWith(paymentInstrument, paymentDetails));
                            });
                        });
                    });

                    describe('with Payment Method of other type', function () {
                        beforeEach(function () {
                            paymentIntent.paymentMethod.type = SalesforcePaymentMethod.TYPE_IDEAL;
                        });

                        it('should set payment transaction TYPE_CAPTURE and return no errors', function () {
                            var response = payments.Handle(basket, paymentInformation);
                            assert.equal(false, response.error);
                            assert.equal(0, Object.keys(response.fieldErrors).length);
                            assert.equal(0, response.serverErrors.length);

                            assert.equal(amount, paymentTransaction.amount);
                            assert.equal(paymentIntent.ID, paymentTransaction.transactionID);
                            assert.equal(PaymentTransaction.TYPE_CAPTURE, paymentTransaction.type);

                            assert.isTrue(basketValidationHelpers.validatePaymentIntent.calledOnce);
                            assert.isTrue(basketValidationHelpers.validatePaymentIntent.calledWith(basket));
                            assert.isTrue(Transaction.wrap.calledOnce);
                            assert.isTrue(paymentIntent.paymentMethod.getPaymentDetails.calledOnce);
                            assert.isTrue(paymentIntent.paymentMethod.getPaymentDetails.calledWith(paymentInstrument));
                            assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledOnce);
                            assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledWith(paymentInstrument, paymentDetails));
                        });
                    });
                });
            });

            describe('with no Stripe Payment Intent', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent.returns(null);
                });

                describe('with validation error truthy', function () {
                    beforeEach(function () {
                        paypalOrderValidation.error = true;
                    });

                    it('should return errors', function () {
                        var response = payments.Handle(basket, paymentInformation);
                        assert.equal(true, response.error);
                        assert.equal(0, Object.keys(response.fieldErrors).length);
                        assert.equal(1, response.serverErrors.length);
                        assert.equal('checkout:error.technical', response.serverErrors[0]);

                        assert.isTrue(basketValidationHelpers.validatePayPalOrder.calledOnce);
                        assert.isTrue(basketValidationHelpers.validatePayPalOrder.calledWith(basket));
                        assert.isFalse(Transaction.wrap.calledOnce);
                        assert.isFalse(SalesforcePaymentsMgr.setPaymentDetails.calledOnce);
                    });
                });

                describe('with validation error falsy', function () {
                    beforeEach(function () {
                        paypalOrderValidation.error = false;
                    });

                    it('should set payment transaction TYPE_CAPTURE and return no errors', function () {
                        var response = payments.Handle(basket, paymentInformation);
                        assert.equal(false, response.error);
                        assert.equal(0, Object.keys(response.fieldErrors).length);
                        assert.equal(0, response.serverErrors.length);

                        assert.equal(amount, paymentTransaction.amount);
                        assert.equal(paypalOrder.ID, paymentTransaction.transactionID);
                        assert.equal(PaymentTransaction.TYPE_CAPTURE, paymentTransaction.type);

                        assert.isTrue(basketValidationHelpers.validatePayPalOrder.calledOnce);
                        assert.isTrue(basketValidationHelpers.validatePayPalOrder.calledWith(basket));
                        assert.isTrue(Transaction.wrap.calledOnce);
                        assert.isTrue(paypalOrder.getPaymentDetails.calledOnce);
                        assert.isTrue(paypalOrder.getPaymentDetails.calledWith(paymentInstrument));
                        assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledOnce);
                        assert.isTrue(SalesforcePaymentsMgr.setPaymentDetails.calledWith(paymentInstrument, paymentDetails));
                    });
                });
            });
        });
    });
});
