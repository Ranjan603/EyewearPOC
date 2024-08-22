'use strict';

/* eslint-disable new-cap */

var assert = require('chai').assert;
var sinon = require('sinon');

var Money = require('../../../../../../mocks/dw/value/Money');
var Resource = require('../../../../../../mocks/dw/web/Resource');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var amount = new Money(10, 'USD');

describe('salesforce payments form processor', function () {
    var basket;
    var BasketMgr;
    var paymentHelpers;
    var salesforcePaymentsFormProcessor;
    var req;
    var paymentForm;
    var viewFormData;
    var paymentIntent;

    beforeEach(function () {
        basket = {};

        BasketMgr = {
            getCurrentBasket: function () {
                return basket;
            }
        };

        paymentIntent = {
            ID: 'pi_123',
            amount: amount,
            paymentMethod: {
                type: 'card'
            }
        };

        paymentHelpers = {
            getPaymentAmount: sinon.stub(),
            getPaymentIntent: sinon.stub(),
            getPayPalOrder: sinon.stub()
        };

        viewFormData = {};

        salesforcePaymentsFormProcessor = proxyquire('../../../../../../../cartridges/plugin_commercepayments/cartridge/scripts/hooks/payment/processor/salesforce_payments_form_processor', {
            'dw/web/Resource': Resource,
            'dw/order/BasketMgr': BasketMgr,
            '*/cartridge/scripts/helpers/paymentHelpers': paymentHelpers
        });
    });

    describe('processForm', function () {
        describe('Payment amount is greater than zero', function () {
            beforeEach(function () {
                paymentHelpers.getPaymentAmount.returns(new Money(20, 'USD'));
            });

            describe('Stripe payment intent exist', function () {
                it('should return error for payment intent has no payment method', function () {
                    paymentIntent = {
                        ID: 'pi_123',
                        amount: amount,
                        paymentMethod: null
                    };
                    paymentHelpers.getPaymentIntent.returns(paymentIntent);

                    var response = salesforcePaymentsFormProcessor.processForm(req, paymentForm, viewFormData);
                    assert.equal(true, response.error);
                    assert.equal(1, response.serverErrors.length);
                    assert.equal('checkout:error.technical', response.serverErrors[0]);
                });

                it('should return success for payment intent has payment method', function () {
                    paymentIntent = {
                        ID: 'pi_123',
                        amount: amount,
                        paymentMethod: {
                            type: 'card'
                        }
                    };
                    paymentHelpers.getPaymentIntent.returns(paymentIntent);

                    var response = salesforcePaymentsFormProcessor.processForm(req, paymentForm, viewFormData);
                    assert.equal(false, response.error);
                    assert.equal('payment:label.method.card', response.viewData.paymentMethod.value);
                    assert.equal('payment:label.method.card', response.viewData.paymentMethod.htmlName);
                    assert.equal('payment:label.method.card', response.viewData.paymentInformation.method.value);
                    assert.equal('payment:label.method.card', response.viewData.paymentInformation.method.htmlName);
                    assert.equal(false, response.viewData.saveCard);
                });
            });

            describe('Stripe payment intent NOT exist', function () {
                it('should return error for NO PayPal order', function () {
                    paymentHelpers.getPayPalOrder.returns(null);

                    var response = salesforcePaymentsFormProcessor.processForm(req, paymentForm, viewFormData);
                    assert.equal(true, response.error);
                    assert.equal(1, response.serverErrors.length);
                    assert.equal('checkout:error.technical', response.serverErrors[0]);
                });

                it('should return success for PayPal order', function () {
                    paymentHelpers.getPayPalOrder.returns({});

                    var response = salesforcePaymentsFormProcessor.processForm(req, paymentForm, viewFormData);
                    assert.equal(false, response.error);
                    assert.isNotNull(response.viewData);
                });
            });
        });

        describe('Payment amount is zero', function () {
            beforeEach(function () {
                paymentHelpers.getPaymentAmount.returns(new Money(0, 'USD'));
            });

            it('should return success', function () {
                var response = salesforcePaymentsFormProcessor.processForm(req, paymentForm, viewFormData);
                assert.equal(false, response.error);
                assert.isNotNull(response.viewData);
            });
        });
    });
});
