'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var Money = require('../../../../mocks/dw/value/Money');
var Resource = require('../../../../mocks/dw/web/Resource');
var SalesforcePaymentRequest = require('../../../../mocks/dw/extensions/payments/SalesforcePaymentRequest');

describe('Payment Helpers', function () {
    var paypalOrder = {};
    var payNowOptions = {};
    var createdPaymentIntent = {};

    var paymentIntent;
    var request;
    var paymentInstrument;
    var giftCertificatePaymentInstrument;
    var basket;
    var BasketMgr;
    var Transaction;
    var SalesforcePaymentsMgr;
    var paymentHelpers;
    var Logger;
    beforeEach(function () {
        paymentIntent = {
            isRefundable: sinon.stub(),
            isCancelable: sinon.stub()
        };
        request = {
            custom: {}
        };
        paymentInstrument = {};
        giftCertificatePaymentInstrument = {
            paymentTransaction: {
                amount: new Money(5, 'USD')
            }
        };
        basket = {
            totalGrossPrice: new Money(10, 'USD'),
            giftCertificatePaymentInstruments: {
                toArray: function () {
                    return [];
                }
            },
            getPaymentInstruments: function (method) {
                var array = [];
                if (method === 'Salesforce Payments') {
                    array.push(paymentInstrument);
                }
                return {
                    toArray: function () {
                        return array;
                    }
                };
            },
            removePaymentInstrument: sinon.stub(),
            getUUID: function () {
                return 'basketUUID_123456';
            },
            defaultShipment: {}
        };
        BasketMgr = {
            currentBasket: basket
        };
        Transaction = {
            wrap: sinon.stub().callsArg(0)
        };
        SalesforcePaymentsMgr = {
            getPaymentIntent: sinon.stub(),
            getPayPalOrder: sinon.stub(),
            createPaymentIntent: sinon.stub().returns(createdPaymentIntent),
            refundPaymentIntent: sinon.stub(),
            cancelPaymentIntent: sinon.stub()
        };

        Logger = {
            error: function () {
                return '';
            }
        };

        global.request = request;
        paymentHelpers = proxyquire('../../../../../cartridges/plugin_commercepayments/cartridge/scripts/helpers/paymentHelpers', {
            'dw/value/Money': Money,
            'dw/web/Resource': Resource,
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                calculateBuyNowData: function () {
                    return 'Calculated Buy now data';
                },
                calculatePayNowOptions: function () {
                    return payNowOptions;
                }
            },
            'dw/order/BasketMgr': BasketMgr,
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'uid12345';
                }
            },
            'dw/system/Transaction': Transaction,
            'dw/extensions/payments/SalesforcePaymentRequest': SalesforcePaymentRequest,
            'dw/extensions/payments/SalesforcePaymentsMgr': SalesforcePaymentsMgr,
            'dw/system/Logger': Logger
        });
    });

    describe('getPaymentAmount', function () {
        beforeEach(function () {
            basket.giftCertificatePaymentInstruments.toArray = function () {
                return [giftCertificatePaymentInstrument];
            };
        });

        it('should return the basket total less gift certificates', function () {
            var amount = paymentHelpers.getPaymentAmount(basket);
            assert.equal(amount.value, 5);
        });
    });

    describe('getPaymentInstrument', function () {
        it('should return Salesforce Payments payment instrument', function () {
            assert.equal(paymentInstrument, paymentHelpers.getPaymentInstrument(basket));
        });

        it('should return undefined', function () {
            basket.getPaymentInstruments = function () {
                return {
                    toArray: function () {
                        return [];
                    }
                };
            };
            assert.isUndefined(paymentHelpers.getPaymentInstrument(basket));
        });
    });

    describe('removePaymentInstruments', function () {
        it('should remove Salesforce Payments payment instruments in a transaction', function () {
            paymentHelpers.removePaymentInstruments(basket);
            assert.isTrue(Transaction.wrap.calledOnce);
            assert.isTrue(basket.removePaymentInstrument.calledOnce);
            assert.isTrue(basket.removePaymentInstrument.calledWith(paymentInstrument));
        });
    });

    describe('getBuyNowData', function () {
        describe('product master', function () {
            it('should return default Buy now data', function () {
                var product = {
                    price: {
                        sales: {
                            value: '10.99',
                            currency: 'USD'
                        }
                    },
                    productType: 'master',
                    selectedQuantity: 1
                };
                var buyNowData = paymentHelpers.getBuyNowData(product);
                assert.deepEqual(buyNowData.basketData, {});
                assert.deepEqual(buyNowData.options, {
                    currency: 'USD',
                    total: {
                        label: Resource.msg('label.order.grand.total', 'confirmation', null),
                        amount: '10.99'
                    },
                    displayItems: [],
                    shippingOptions: []
                });
            });
        });

        describe('not product master or set', function () {
            it('should return the calculated Buy now data', function () {
                var product = {
                    price: {
                        sales: {
                            value: '10.99',
                            currency: 'USD'
                        }
                    },
                    selectedQuantity: 1
                };
                var buyNowData = paymentHelpers.getBuyNowData(product);
                assert.equal(buyNowData, 'Calculated Buy now data');
            });
        });
    });

    describe('createPaymentRequestData', function () {
        describe('current basket', function () {
            it('should return the payment request data with basket payment amount total', function () {
                var paymentRequestData = paymentHelpers.createPaymentRequestData();
                assert.equal(paymentRequestData.paymentRequestId, 'paymentrequest-uid12345');
                assert.equal(paymentRequestData.elementClass, 'salesforce-paymentrequest-element-uid12345');
                assert.equal(paymentRequestData.errorsClass, 'salesforce-paymentrequest-element-errors-uid12345');
                assert.isNotNull(paymentRequestData.paymentRequest);
                assert.equal(paymentRequestData.messagesElementClass, 'salesforce-payment-messages-element-uid12345');
                assert.isNotNull(paymentRequestData.messagesPaymentRequest);
                assert.equal(paymentRequestData.total, basket.totalGrossPrice.value);

                assert.equal(paymentRequestData.paymentRequest.id, 'paymentrequest-uid12345');
                assert.equal(paymentRequestData.paymentRequest.selector, '.salesforce-paymentrequest-element-uid12345');
                assert.equal(paymentRequestData.paymentRequest.addInclude.callCount, 4);
                assert.isTrue(paymentRequestData.paymentRequest.addInclude.calledWith(SalesforcePaymentRequest.ELEMENT_TYPE_APPLEPAY));
                assert.isTrue(paymentRequestData.paymentRequest.addInclude.calledWith(SalesforcePaymentRequest.ELEMENT_TYPE_PAYMENTREQUEST));
                assert.isTrue(paymentRequestData.paymentRequest.addInclude.calledWith(SalesforcePaymentRequest.ELEMENT_TYPE_PAYPAL_EXPRESS));
                assert.isTrue(paymentRequestData.paymentRequest.addInclude.calledWith(SalesforcePaymentRequest.ELEMENT_TYPE_VENMO_EXPRESS));
                assert.isTrue(paymentRequestData.paymentRequest.setPayPalButtonsOptions.calledWith({
                    style: {
                        height: 40,
                        label: 'pay'
                    }
                }));
                assert.isTrue(paymentRequestData.paymentRequest.setOptions.calledWith(payNowOptions));

                assert.equal(paymentRequestData.messagesPaymentRequest.id, 'paymentrequest-uid12345-messages');
                assert.equal(paymentRequestData.messagesPaymentRequest.selector, '.salesforce-payment-messages-element-uid12345');
                assert.isTrue(paymentRequestData.messagesPaymentRequest.setOptions.calledWith(payNowOptions));
            });
        });

        describe('no current basket', function () {
            beforeEach(function () {
                delete BasketMgr.currentBasket;
            });

            it('should return the payment request data with 0 total', function () {
                var paymentRequestData = paymentHelpers.createPaymentRequestData();
                assert.equal(paymentRequestData.paymentRequestId, 'paymentrequest-uid12345');
                assert.equal(paymentRequestData.elementClass, 'salesforce-paymentrequest-element-uid12345');
                assert.equal(paymentRequestData.errorsClass, 'salesforce-paymentrequest-element-errors-uid12345');
                assert.isNotNull(paymentRequestData.paymentRequest);
                assert.isTrue(paymentRequestData.paymentRequest.setOptions.calledWith(payNowOptions));
                assert.equal(paymentRequestData.messagesElementClass, 'salesforce-payment-messages-element-uid12345');
                assert.isNotNull(paymentRequestData.messagesPaymentRequest);
                assert.equal(paymentRequestData.total, 0);

                assert.equal(paymentRequestData.messagesPaymentRequest.id, 'paymentrequest-uid12345-messages');
                assert.equal(paymentRequestData.messagesPaymentRequest.selector, '.salesforce-payment-messages-element-uid12345');
                assert.isTrue(paymentRequestData.messagesPaymentRequest.setOptions.calledWith(payNowOptions));
            });
        });

        describe('payment amount is N/A', function () {
            beforeEach(function () {
                basket.totalGrossPrice = {
                    available: false
                };
                basket.giftCertificatePaymentInstruments = {
                    toArray: function () {
                        return [];
                    }
                };
            });

            it('should return the payment request data with 0 total', function () {
                var paymentRequestData = paymentHelpers.createPaymentRequestData();
                assert.equal(paymentRequestData.paymentRequestId, 'paymentrequest-uid12345');
                assert.equal(paymentRequestData.elementClass, 'salesforce-paymentrequest-element-uid12345');
                assert.equal(paymentRequestData.errorsClass, 'salesforce-paymentrequest-element-errors-uid12345');
                assert.isNotNull(paymentRequestData.paymentRequest);
                assert.isTrue(paymentRequestData.paymentRequest.setOptions.calledWith(payNowOptions));
                assert.equal(paymentRequestData.messagesElementClass, 'salesforce-payment-messages-element-uid12345');
                assert.isNotNull(paymentRequestData.messagesPaymentRequest);
                assert.equal(paymentRequestData.total, 0);

                assert.equal(paymentRequestData.messagesPaymentRequest.id, 'paymentrequest-uid12345-messages');
                assert.equal(paymentRequestData.messagesPaymentRequest.selector, '.salesforce-payment-messages-element-uid12345');
                assert.isTrue(paymentRequestData.messagesPaymentRequest.setOptions.calledWith(payNowOptions));
            });
        });
    });

    describe('getPaymentIntent', function () {
        describe('basket has no payment intent', function () {
            beforeEach(function () {
                SalesforcePaymentsMgr.getPaymentIntent.returns(null);
            });

            it('should return null', function () {
                var cacheKey = '__commercepayments_paymentintent_basketUUID_123456';
                assert.isNull(paymentHelpers.getPaymentIntent(basket));
                assert.isNull(request.custom[cacheKey]);    // eslint-disable-line
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledWith(basket));

                // Null order is not cached
                assert.isNull(paymentHelpers.getPaymentIntent(basket));
                assert.isNull(request.custom[cacheKey]);    // eslint-disable-line
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledTwice);
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledWith(basket));
            });
        });

        describe('basket has payment intent', function () {
            beforeEach(function () {
                SalesforcePaymentsMgr.getPaymentIntent.returns(paymentIntent);
            });

            it('should return the payment intent and cache it', function () {
                var cacheKey = '__commercepayments_paymentintent_basketUUID_123456';
                assert.equal(paymentHelpers.getPaymentIntent(basket), paymentIntent);
                assert.equal(request.custom[cacheKey], paymentIntent);    // eslint-disable-line
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledWith(basket));

                // 2nd time is cached, still only called once
                assert.equal(paymentHelpers.getPaymentIntent(basket), paymentIntent);
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledWith(basket));
            });
        });

        describe('error getting payment intent', function () {
            beforeEach(function () {
                SalesforcePaymentsMgr.getPaymentIntent.throws(new Error());
            });

            it('should return null', function () {
                var cacheKey = '__commercepayments_paymentintent_basketUUID_123456';
                assert.isNull(paymentHelpers.getPaymentIntent(basket));
                assert.isUndefined(request.custom[cacheKey]);    // eslint-disable-line
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledWith(basket));

                // Error response is not cached
                assert.isNull(paymentHelpers.getPaymentIntent(basket));
                assert.isUndefined(request.custom[cacheKey]);    // eslint-disable-line
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledTwice);
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledWith(basket));
            });
        });
    });

    describe('getPayPalOrder', function () {
        describe('basket has no order', function () {
            beforeEach(function () {
                SalesforcePaymentsMgr.getPayPalOrder.returns(null);
            });

            it('should return null', function () {
                var cacheKey = '__commercepayments_paypalorder_basketUUID_123456';
                assert.isNull(paymentHelpers.getPayPalOrder(basket));
                assert.isNull(request.custom[cacheKey]);    // eslint-disable-line
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledWith(basket));

                // Null order is not cached
                assert.isNull(paymentHelpers.getPayPalOrder(basket));
                assert.isNull(request.custom[cacheKey]);    // eslint-disable-line
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledTwice);
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledWith(basket));
            });
        });

        describe('basket has order', function () {
            beforeEach(function () {
                SalesforcePaymentsMgr.getPayPalOrder.returns(paypalOrder);
            });

            it('should return the order and cache it', function () {
                var cacheKey = '__commercepayments_paypalorder_basketUUID_123456';
                assert.equal(paymentHelpers.getPayPalOrder(basket), paypalOrder);
                assert.equal(request.custom[cacheKey], paypalOrder);    // eslint-disable-line
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledWith(basket));

                // 2nd time is cached, still only called once
                assert.equal(paymentHelpers.getPayPalOrder(basket), paypalOrder);
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledWith(basket));
            });
        });

        describe('error getting PayPal order', function () {
            beforeEach(function () {
                SalesforcePaymentsMgr.getPayPalOrder.throws(new Error());
            });

            it('should return null', function () {
                var cacheKey = '__commercepayments_paypalorder_basketUUID_123456';
                assert.isNull(paymentHelpers.getPayPalOrder(basket));
                assert.isUndefined(request.custom[cacheKey]);    // eslint-disable-line
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledWith(basket));

                // Error response is not cached
                assert.isNull(paymentHelpers.getPayPalOrder(basket));
                assert.isUndefined(request.custom[cacheKey]);    // eslint-disable-line
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledTwice);
                assert.isTrue(SalesforcePaymentsMgr.getPayPalOrder.calledWith(basket));
            });
        });
    });

    describe('reversePaymentIfNecessary', function () {
        describe('basket has no payment intent', function () {
            beforeEach(function () {
                SalesforcePaymentsMgr.getPaymentIntent.returns(null);
            });

            it('should neither cancel nor refund payment', function () {
                paymentHelpers.reversePaymentIfNecessary(basket);

                assert.isFalse(SalesforcePaymentsMgr.refundPaymentIntent.called);
                assert.isFalse(SalesforcePaymentsMgr.cancelPaymentIntent.called);
            });
        });

        describe('basket has payment intent', function () {
            beforeEach(function () {
                SalesforcePaymentsMgr.getPaymentIntent.returns(paymentIntent);
            });

            describe('payment intent is refundable', function () {
                beforeEach(function () {
                    paymentIntent.isRefundable.returns(true);
                });

                it('should refund payment', function () {
                    paymentHelpers.reversePaymentIfNecessary(basket);

                    assert.isTrue(SalesforcePaymentsMgr.refundPaymentIntent.calledOnce);
                    assert.isTrue(SalesforcePaymentsMgr.refundPaymentIntent.calledWith(paymentIntent, null, {}));
                });
            });

            describe('payment intent is cancelable but not refundable', function () {
                beforeEach(function () {
                    paymentIntent.isRefundable.returns(false);
                    paymentIntent.isCancelable.returns(true);
                });

                it('should cancel payment', function () {
                    paymentHelpers.reversePaymentIfNecessary(basket);

                    assert.isTrue(SalesforcePaymentsMgr.cancelPaymentIntent.calledOnce);
                    assert.isTrue(SalesforcePaymentsMgr.cancelPaymentIntent.calledWith(paymentIntent, {}));
                });
            });

            describe('payment intent not cancelable nor refundable', function () {
                beforeEach(function () {
                    paymentIntent.isRefundable.returns(false);
                    paymentIntent.isCancelable.returns(false);
                });

                it('should neither refund nor cancel payment', function () {
                    paymentHelpers.reversePaymentIfNecessary(basket);

                    assert.isFalse(SalesforcePaymentsMgr.refundPaymentIntent.called);
                    assert.isFalse(SalesforcePaymentsMgr.cancelPaymentIntent.called);
                });
            });
        });
    });

    describe('preparePaymentIntent', function () {
        describe('has existing payment intent', function () {
            beforeEach(function () {
                SalesforcePaymentsMgr.getPaymentIntent.returns(paymentIntent);
                paymentIntent.isRefundable.returns(true);
            });

            it('should reverse existing payment and create new payment intent', function () {
                assert.equal(createdPaymentIntent, paymentHelpers.preparePaymentIntent(basket, 'MyZone', 'card', true, 'MYBRAND', true));

                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.getPaymentIntent.calledWith(basket));

                assert.isTrue(basket.removePaymentInstrument.calledOnce);
                assert.isTrue(basket.removePaymentInstrument.calledWith(paymentInstrument));

                assert.isTrue(SalesforcePaymentsMgr.refundPaymentIntent.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.refundPaymentIntent.calledWith(paymentIntent, null, {}));

                assert.isTrue(SalesforcePaymentsMgr.createPaymentIntent.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.createPaymentIntent.calledWith(basket, basket.defaultShipment, 'MyZone',
                    basket.totalGrossPrice, true, {
                        type: 'card',
                        statementDescriptor: 'MYBRAND',
                        cardCaptureAutomatic: true
                    }));
            });
        });

        describe('no existing payment intent', function () {
            beforeEach(function () {
                SalesforcePaymentsMgr.getPaymentIntent.returns(null);
            });

            it('should create new payment intent', function () {
                assert.equal(createdPaymentIntent, paymentHelpers.preparePaymentIntent(basket, 'MyZone', 'card', false, null, null));

                assert.isTrue(basket.removePaymentInstrument.calledOnce);
                assert.isTrue(basket.removePaymentInstrument.calledWith(paymentInstrument));

                assert.isFalse(SalesforcePaymentsMgr.refundPaymentIntent.called);
                assert.isFalse(SalesforcePaymentsMgr.cancelPaymentIntent.called);

                assert.isTrue(SalesforcePaymentsMgr.createPaymentIntent.calledOnce);
                assert.isTrue(SalesforcePaymentsMgr.createPaymentIntent.calledWith(basket, basket.defaultShipment, 'MyZone',
                    basket.totalGrossPrice, false, {
                        type: 'card',
                        statementDescriptor: null,
                        cardCaptureAutomatic: null
                    }));
            });
        });
    });
});
