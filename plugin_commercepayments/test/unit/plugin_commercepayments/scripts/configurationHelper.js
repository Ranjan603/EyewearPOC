'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('configurationHelper', function () {
    var PaymentInstrument = {
        METHOD_GIFT_CERTIFICATE: 'GIFT_CERTIFICATE'
    };

    var paymentIntent;
    var paypalOrder;
    var res;
    var paymentsSiteConfig;
    var SalesforcePaymentsMgr;
    var paymentHelpers;
    var Logger;
    var configurationHelper;
    var order;
    var paymentInstrument;
    var paymentDetails;
    beforeEach(function () {
        paymentIntent = {
            paymentMethod: {}
        };
        paypalOrder = {};

        res = {
            getViewData: function () {
                return {};
            },
            setViewData: sinon.stub()
        };

        paymentsSiteConfig = {
            expressCheckoutEnabled: true,
            multiStepCheckoutEnabled: false,
            cardCaptureAutomatic: true
        };

        SalesforcePaymentsMgr = {
            paymentsSiteConfig: paymentsSiteConfig,
            getPaymentsSiteConfig: function () {
                return paymentsSiteConfig;
            },
            getPaymentDetails: sinon.stub()
        };

        paymentHelpers = {
            getPaymentIntent: function () {
                return paymentIntent;
            },
            getPayPalOrder: function () {
                return paypalOrder;
            },
            getPaymentInstrument: sinon.stub()
        };

        order = {
            paymentInstruments: {
                toArray: function () {
                    return [];
                }
            }
        };
        paymentInstrument = {};
        paymentDetails = {};

        Logger = {
            error: function () {
                return '';
            }
        };

        configurationHelper = proxyquire('../../../../cartridges/plugin_commercepayments/cartridge/scripts/configurationHelper', {
            'dw/order/PaymentInstrument': PaymentInstrument,
            'dw/extensions/payments/SalesforcePaymentsMgr': SalesforcePaymentsMgr,
            'dw/system/Logger': Logger,
            '*/cartridge/scripts/helpers/paymentHelpers': paymentHelpers
        });
    });

    describe('getConfiguration', function () {
        describe('SalesforcePaymentsMgr.getPaymentsSiteConfig available', function () {
            describe('site is configured', function () {
                it('should get site configuration disabling checkout', function () {
                    paymentsSiteConfig.expressCheckoutEnabled = false;
                    paymentsSiteConfig.multiStepCheckoutEnabled = false;
                    paymentsSiteConfig.cardCaptureAutomatic = false;

                    var config = configurationHelper.getConfiguration();

                    assert.equal(config.expressCheckoutEnabled, false);
                    assert.equal(config.multiStepCheckoutEnabled, false);
                    assert.equal(config.cardCaptureAutomatic, false);
                });

                it('should get site configuration enabling checkout', function () {
                    paymentsSiteConfig.expressCheckoutEnabled = true;
                    paymentsSiteConfig.multiStepCheckoutEnabled = true;
                    paymentsSiteConfig.cardCaptureAutomatic = true;

                    var config = configurationHelper.getConfiguration();

                    assert.equal(config.expressCheckoutEnabled, true);
                    assert.equal(config.multiStepCheckoutEnabled, true);
                    assert.equal(config.cardCaptureAutomatic, true);
                });
            });

            describe('site is not configured', function () {
                it('should get site configuration disabling checkout', function () {
                    paymentsSiteConfig.expressCheckoutEnabled = false;
                    paymentsSiteConfig.multiStepCheckoutEnabled = false;
                    paymentsSiteConfig.cardCaptureAutomatic = false;

                    var config = configurationHelper.getConfiguration();

                    assert.equal(config.expressCheckoutEnabled, false);
                    assert.equal(config.multiStepCheckoutEnabled, false);
                    assert.equal(config.cardCaptureAutomatic, false);
                });
            });

            describe('SalesforcePaymentsSiteConfiguration.cardCaptureAutomatic not available', function () {
                it('should get site configuration with previous manual capture default', function () {
                    paymentsSiteConfig.expressCheckoutEnabled = true;
                    paymentsSiteConfig.multiStepCheckoutEnabled = true;
                    delete paymentsSiteConfig.cardCaptureAutomatic;

                    var config = configurationHelper.getConfiguration();

                    assert.equal(config.expressCheckoutEnabled, true);
                    assert.equal(config.multiStepCheckoutEnabled, true);
                    assert.equal(config.cardCaptureAutomatic, false);
                });
            });
        });

        describe('SalesforcePaymentsMgr.getPaymentsSiteConfig not available', function () {
            it('should get site configuration enabling checkout', function () {
                delete SalesforcePaymentsMgr.getPaymentsSiteConfig;

                var config = configurationHelper.getConfiguration();

                assert.equal(config.expressCheckoutEnabled, true);
                assert.equal(config.multiStepCheckoutEnabled, true);
                assert.equal(config.cardCaptureAutomatic, false);
            });
        });
    });

    describe('commercePaymentsOrder', function () {
        describe('has Salesforce Payments payment instrument', function () {
            beforeEach(function () {
                paymentHelpers.getPaymentInstrument.returns(paymentInstrument);
            });

            describe('with payment details', function () {
                beforeEach(function () {
                    SalesforcePaymentsMgr.getPaymentDetails.returns(paymentDetails);
                });

                it('should return true', function () {
                    assert.equal(configurationHelper.commercePaymentsOrder(order), true);

                    assert.isTrue(paymentHelpers.getPaymentInstrument.calledOnce);
                    assert.isTrue(paymentHelpers.getPaymentInstrument.calledWith(order));
                    assert.isTrue(SalesforcePaymentsMgr.getPaymentDetails.calledOnce);
                    assert.isTrue(SalesforcePaymentsMgr.getPaymentDetails.calledWith(paymentInstrument));
                });
            });
        });

        describe('no gift certificate payment instruments', function () {
            beforeEach(function () {
                order = {
                    paymentInstruments: {
                        toArray: function () {
                            return [{
                                paymentMethod: 'CREDIT_CARD'
                            }];
                        }
                    }
                };
            });

            describe('no PayPal order', function () {
                beforeEach(function () {
                    paymentHelpers.getPayPalOrder = function () {
                        return null;
                    };
                });

                describe('has no Stripe Payment Intent', function () {
                    it('should return false', function () {
                        paymentHelpers.getPaymentIntent = function () {
                            return null;
                        };
                        assert.equal(configurationHelper.commercePaymentsOrder(order), false);
                    });
                });

                describe('has Stripe Payment Intent but no payment method', function () {
                    it('should return false', function () {
                        delete paymentIntent.paymentMethod;
                        assert.equal(configurationHelper.commercePaymentsOrder(order), false);
                    });
                });

                describe('has both Stripe Payment Intent and payment method', function () {
                    it('should return true', function () {
                        assert.equal(configurationHelper.commercePaymentsOrder(order), true);
                    });
                });
            });

            describe('no Stripe Payment Intent', function () {
                beforeEach(function () {
                    paymentHelpers.getPaymentIntent = function () {
                        return null;
                    };
                });

                describe('has no PayPal order', function () {
                    it('should return false', function () {
                        paymentHelpers.getPayPalOrder = function () {
                            return null;
                        };
                        assert.equal(configurationHelper.commercePaymentsOrder(order), false);
                    });
                });

                describe('has PayPal order', function () {
                    it('should return true', function () {
                        assert.equal(configurationHelper.commercePaymentsOrder(order), true);
                    });
                });
            });
        });

        describe('only gift certificate payment instruments', function () {
            it('should return true', function () {
                order = {
                    paymentInstruments: {
                        toArray: function () {
                            return [{
                                paymentMethod: 'GIFT_CERTIFICATE'
                            }];
                        }
                    }
                };
                assert.equal(configurationHelper.commercePaymentsOrder(order), true);
            });
        });

        describe('no payment instruments', function () {
            it('should return false', function () {
                paymentHelpers.getPaymentIntent = function () {
                    return null;
                };
                paymentHelpers.getPayPalOrder = function () {
                    return null;
                };
                assert.equal(configurationHelper.commercePaymentsOrder(order), false);
            });
        });
    });

    describe('appendConfiguration', function () {
        it('should add the configuration to the response viewData', function () {
            configurationHelper.appendConfiguration(res);

            assert.isTrue(res.setViewData.calledOnce);
            assert.isTrue(res.setViewData.calledWith({
                commercePaymentsConfiguration: {
                    expressCheckoutEnabled: paymentsSiteConfig.expressCheckoutEnabled,
                    multiStepCheckoutEnabled: paymentsSiteConfig.multiStepCheckoutEnabled,
                    cardCaptureAutomatic: paymentsSiteConfig.cardCaptureAutomatic
                }
            }));
        });
    });
});
