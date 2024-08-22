'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');

var Resource = require('../../../mocks/dw/web/Resource');
var mockSuperModule = require('../../mockModuleSuperModule');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('PaymentModel', function () {
    var SalesforcePaymentMethod = {
        TYPE_CARD: 'card',
        TYPE_IDEAL: 'ideal',
        TYPE_SEPA_DEBIT: 'sepa_debit',
        TYPE_BANCONTACT: 'bancontact',
        TYPE_KLARNA: 'klarna',
        TYPE_EPS: 'eps'
    };
    var SalesforcePaymentsMgr = {
        getPaymentDetails: sinon.stub()
    };
    var SalesforcePayPalOrder = {
        TYPE_PAYPAL: 'paypal'
    };

    var currentBasket = {};
    var currentCustomer = {};
    var countryCode = 'DE';
    var paymentIntent = {
        paymentMethod: {}
    };
    var paypalOrder = {
        payer: {}
    };
    var paymentInstrument = {};
    var paymentDetails = {};

    function BasePaymentModel(basket, customer, code) {
        this.currentBasket = basket;
        this.currentCustomer = customer;
        this.countryCode = code;
    }

    before(function () {
        mockSuperModule.create(BasePaymentModel);
    });
    after(function () {
        mockSuperModule.remove();
    });

    var paymentHelpers;
    beforeEach(function () {
        paymentHelpers = {
            getPaymentIntent: sinon.stub(),
            getPayPalOrder: sinon.stub(),
            getPaymentInstrument: sinon.stub()
        };
    });

    var PaymentModel;
    beforeEach(function () {
        PaymentModel = proxyquire('../../../../cartridges/plugin_commercepayments/cartridge/models/payment', {
            'dw/web/Resource': Resource,
            'dw/extensions/payments/SalesforcePaymentMethod': SalesforcePaymentMethod,
            'dw/extensions/payments/SalesforcePaymentsMgr': SalesforcePaymentsMgr,
            'dw/extensions/payments/SalesforcePayPalOrder': SalesforcePayPalOrder,
            '*/cartridge/scripts/helpers/paymentHelpers': paymentHelpers
        });
    });

    function assertCalledBase(model) {
        assert.equal(model.currentBasket, currentBasket);
        assert.equal(model.currentCustomer, currentCustomer);
        assert.equal(model.countryCode, countryCode);
    }

    describe('Basket has a payment instrument', function () {
        beforeEach(function () {
            paymentHelpers.getPaymentInstrument.returns(paymentInstrument);
        });

        describe('with no payment details, Stripe Payment Intent, or PayPal order', function () {
            var model;
            beforeEach(function () {
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should not contain a paymentMethod property', function () {
                assert.isUndefined(model.paymentMethod);
            });
        });

        describe('with payment details', function () {
            beforeEach(function () {
                SalesforcePaymentsMgr.getPaymentDetails.returns(paymentDetails);
            });

            describe('of type card', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = SalesforcePaymentMethod.TYPE_CARD;
                    paymentDetails.brand = 'visa';
                    paymentDetails.last4 = '1234';
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.card');
                    assert.equal(model.paymentMethod.credential, 'payment:label.credential.card["payment:label.card.brand.visa","1234"]');
                });
            });

            describe('of type ideal', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = SalesforcePaymentMethod.TYPE_IDEAL;
                    paymentDetails.bank = 'Central';
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.ideal');
                    assert.equal(model.paymentMethod.credential, 'payment:label.credential.ideal["Central"]');
                });
            });

            describe('of type sepa_debit', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = SalesforcePaymentMethod.TYPE_SEPA_DEBIT;
                    paymentDetails.last4 = '1234';
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.sepa_debit');
                    assert.equal(model.paymentMethod.credential, 'payment:label.credential.sepa_debit["1234"]');
                });
            });

            describe('of type bancontact', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = SalesforcePaymentMethod.TYPE_BANCONTACT;
                    paymentDetails.bankName = 'Central';
                    paymentDetails.last4 = '1234';
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.bancontact');
                    assert.equal(model.paymentMethod.credential, 'payment:label.credential.bancontact["Central","1234"]');
                });
            });

            describe('of type klarna - pay_in_installments', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = SalesforcePaymentMethod.TYPE_KLARNA;
                    paymentDetails.paymentMethodCategory = 'pay_in_installments';
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.klarna');
                    assert.equal(model.paymentMethod.credential, 'payment:label.credential.klarna.paymentMethodCategory.pay_in_installments');
                });
            });

            describe('of type klarna - pay_now', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = SalesforcePaymentMethod.TYPE_KLARNA;
                    paymentDetails.paymentMethodCategory = 'pay_now';
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.klarna');
                    assert.equal(model.paymentMethod.credential, 'payment:label.credential.klarna.paymentMethodCategory.pay_now');
                });
            });

            describe('of type klarna - pay_later', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = SalesforcePaymentMethod.TYPE_KLARNA;
                    paymentDetails.paymentMethodCategory = 'pay_later';
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.klarna');
                    assert.equal(model.paymentMethod.credential, 'payment:label.credential.klarna.paymentMethodCategory.pay_later');
                });
            });

            describe('of type klarna - pay_with_financing', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = SalesforcePaymentMethod.TYPE_KLARNA;
                    paymentDetails.paymentMethodCategory = 'pay_with_financing';
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.klarna');
                    assert.equal(model.paymentMethod.credential, 'payment:label.credential.klarna.paymentMethodCategory.pay_with_financing');
                });
            });

            describe('of type eps', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = SalesforcePaymentMethod.TYPE_EPS;
                    paymentDetails.bank = 'bank_austria';
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.eps');
                    assert.equal(model.paymentMethod.credential, 'payment:label.credential.eps["bank_austria"]');
                });
            });

            describe('of type afterpay', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = SalesforcePaymentMethod.TYPE_AFTERPAY_CLEARPAY;
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.afterpay_clearpay');
                    assert.equal(model.paymentMethod.credential, '');
                });
            });

            describe('of type paypal', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = SalesforcePayPalOrder.TYPE_PAYPAL;
                    paymentDetails.payerEmailAddress = 'email@tester.com';
                    paymentDetails.captureID = 'A1B2C3';
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.paypal');
                    assert.equal(model.paymentMethod.credential, 'payment:label.credential.paypal["email@tester.com"]');
                    assert.equal(model.paymentMethod.paymentId, 'payment:label.paymentid.paypal["A1B2C3"]');
                    assert.equal(model.paymentMethod.paymentIdHelpText, 'payment:helptext.paymentid.paypal');
                });
            });

            describe('of an unsupported type', function () {
                var model;
                beforeEach(function () {
                    paymentDetails.type = 'unknown';
                    model = new PaymentModel(currentBasket, currentCustomer, countryCode);
                });

                it('should call base', function () {
                    assertCalledBase(model);
                });

                it('should contain a paymentMethod property', function () {
                    assert.equal(model.paymentMethod.name, 'payment:label.method.unknown');
                    assert.equal(model.paymentMethod.credential, '');
                });
            });
        });
    });

    describe('Basket has a Stripe Payment Intent but no payment details', function () {
        describe('with no payment method', function () {
            var model;
            beforeEach(function () {
                delete paymentIntent.paymentMethod;
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should not contain a paymentMethod property', function () {
                assert.isUndefined(model.paymentMethod);
            });
        });

        describe('of type card', function () {
            var model;
            beforeEach(function () {
                paymentIntent.paymentMethod = {
                    type: SalesforcePaymentMethod.TYPE_CARD,
                    brand: 'visa',
                    last4: '1234'
                };
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.card');
                assert.equal(model.paymentMethod.credential, 'payment:label.credential.card["payment:label.card.brand.visa","1234"]');
            });
        });

        describe('of type ideal', function () {
            var model;
            beforeEach(function () {
                paymentIntent.paymentMethod = {
                    type: SalesforcePaymentMethod.TYPE_IDEAL,
                    bank: 'Central'
                };
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.ideal');
                assert.equal(model.paymentMethod.credential, 'payment:label.credential.ideal["Central"]');
            });
        });

        describe('of type sepa_debit', function () {
            var model;
            beforeEach(function () {
                paymentIntent.paymentMethod = {
                    type: SalesforcePaymentMethod.TYPE_SEPA_DEBIT,
                    last4: '1234'
                };
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.sepa_debit');
                assert.equal(model.paymentMethod.credential, 'payment:label.credential.sepa_debit["1234"]');
            });
        });

        describe('of type bancontact', function () {
            var model;
            beforeEach(function () {
                paymentIntent.paymentMethod = {
                    type: SalesforcePaymentMethod.TYPE_BANCONTACT,
                    bankName: 'Central',
                    last4: '1234'
                };
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.bancontact');
                assert.equal(model.paymentMethod.credential, 'payment:label.credential.bancontact["Central","1234"]');
            });
        });

        describe('of type klarna - pay_in_installments', function () {
            var model;
            beforeEach(function () {
                paymentIntent.paymentMethod = {
                    type: SalesforcePaymentMethod.TYPE_KLARNA,
                    paymentMethodCategory: 'pay_in_installments'
                };
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.klarna');
                assert.equal(model.paymentMethod.credential, 'payment:label.credential.klarna.paymentMethodCategory.pay_in_installments');
            });
        });

        describe('of type klarna - pay_now', function () {
            var model;
            beforeEach(function () {
                paymentIntent.paymentMethod = {
                    type: SalesforcePaymentMethod.TYPE_KLARNA,
                    paymentMethodCategory: 'pay_now'
                };
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.klarna');
                assert.equal(model.paymentMethod.credential, 'payment:label.credential.klarna.paymentMethodCategory.pay_now');
            });
        });

        describe('of type klarna - pay_later', function () {
            var model;
            beforeEach(function () {
                paymentIntent.paymentMethod = {
                    type: SalesforcePaymentMethod.TYPE_KLARNA,
                    paymentMethodCategory: 'pay_later'
                };
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.klarna');
                assert.equal(model.paymentMethod.credential, 'payment:label.credential.klarna.paymentMethodCategory.pay_later');
            });
        });

        describe('of type klarna - pay_with_financing', function () {
            var model;
            beforeEach(function () {
                paymentIntent.paymentMethod = {
                    type: SalesforcePaymentMethod.TYPE_KLARNA,
                    paymentMethodCategory: 'pay_with_financing'
                };
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.klarna');
                assert.equal(model.paymentMethod.credential, 'payment:label.credential.klarna.paymentMethodCategory.pay_with_financing');
            });
        });

        describe('of type eps', function () {
            var model;
            beforeEach(function () {
                paymentIntent.paymentMethod = {
                    type: SalesforcePaymentMethod.TYPE_EPS,
                    bank: 'bank_austria'
                };
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.eps');
                assert.equal(model.paymentMethod.credential, 'payment:label.credential.eps["bank_austria"]');
            });
        });

        describe('of type afterpay', function () {
            var model;
            beforeEach(function () {
                paymentIntent.paymentMethod = {
                    type: SalesforcePaymentMethod.TYPE_AFTERPAY_CLEARPAY
                };
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.afterpay_clearpay');
                assert.equal(model.paymentMethod.credential, '');
            });
        });

        describe('of an unsupported type', function () {
            var model;
            beforeEach(function () {
                paymentIntent.paymentMethod = {
                    type: 'unknown'
                };
                paymentHelpers.getPaymentIntent.returns(paymentIntent);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.unknown');
                assert.equal(model.paymentMethod.credential, '');
            });
        });
    });

    describe('Basket has a PayPal order but no payment details', function () {
        describe('order has a payer and capture ID', function () {
            var model;
            beforeEach(function () {
                paypalOrder.payer = {
                    emailAddress: 'email@tester.com'
                };
                paypalOrder.captureID = 'A1B2C3';
                paymentHelpers.getPayPalOrder.returns(paypalOrder);
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.paypal');
                assert.equal(model.paymentMethod.credential, 'payment:label.credential.paypal["email@tester.com"]');
                assert.equal(model.paymentMethod.paymentId, 'payment:label.paymentid.paypal["A1B2C3"]');
                assert.equal(model.paymentMethod.paymentIdHelpText, 'payment:helptext.paymentid.paypal');
            });
        });

        describe('order has no payer or capture ID', function () {
            var model;
            beforeEach(function () {
                paymentHelpers.getPayPalOrder.returns(paypalOrder);
                delete paypalOrder.payer;
                delete paypalOrder.captureID;
                model = new PaymentModel(currentBasket, currentCustomer, countryCode);
            });

            it('should call base', function () {
                assertCalledBase(model);
            });

            it('should contain a paymentMethod property with only name', function () {
                assert.equal(model.paymentMethod.name, 'payment:label.method.paypal');
                assert.isUndefined(model.paymentMethod.credential);
                assert.isUndefined(model.paymentMethod.paymentId);
                assert.isUndefined(model.paymentMethod.paymentIdHelpText);
            });
        });
    });

    describe('Basket has no Salesforce Payments payment', function () {
        var model;
        beforeEach(function () {
            model = new PaymentModel(currentBasket, currentCustomer, countryCode);
        });

        it('should call base', function () {
            assertCalledBase(model);
        });

        it('should not contain a paymentMethod property', function () {
            assert.isUndefined(model.paymentMethod);

            assert.isTrue(paymentHelpers.getPaymentIntent.calledOnce);
            assert.isTrue(paymentHelpers.getPaymentIntent.calledWith(currentBasket));
            assert.isTrue(paymentHelpers.getPayPalOrder.calledOnce);
            assert.isTrue(paymentHelpers.getPayPalOrder.calledWith(currentBasket));
        });
    });
});
