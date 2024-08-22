'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');

var Money = require('../../../../mocks/dw/value/Money');
var Resource = require('../../../../mocks/dw/web/Resource');
var mockSuperModule = require('../../../mockModuleSuperModule.js');
var superModule = {};

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('checkoutHelpers', function () {
    var paymentInstrument = {};
    var product = {};
    var shippingMethod = {
        ID: 's1'
    };
    var shippingMethod2 = {
        ID: 's2'
    };
    var shippingMethod3 = {
        ID: 's3'
    };
    var currency = {
        defaultFractionDigits: 2
    };

    var Transaction = {
        wrap: function () {}
    };
    sinon.stub(Transaction, 'wrap', function (fn) {
        return fn();
    });

    var shipment;
    var basket;
    var order;
    var paymentRequestOptions;
    var shipmentShippingModel;
    var orderLevelDiscountTotal;
    var shippingLevelDiscountTotal;
    var optionModel;
    var productLineItem;
    var ProductMgr;
    var ShippingMgr;
    var TaxMgr;
    var BasketMgr;
    var OrderMgr;
    var SalesforcePaymentRequest;
    var Logger;
    var Currency;
    var Decimal;
    var TotalsModel;
    var checkoutHelpers;
    var shippingHelpers;
    var basketCalculationHelpers;
    before(function () {
        mockSuperModule.create(superModule);
    });
    after(function () {
        mockSuperModule.remove();
    });
    beforeEach(function () {
        shipment = {};
        basket = {
            currencyCode: 'USD',
            defaultShipment: shipment,
            totalTax: new Money(0, 'USD'),
            shippingTotalPrice: new Money(5, 'USD'),
            totalGrossPrice: new Money(20, 'USD'),
            getAdjustedMerchandizeTotalPrice: function () {
                return new Money(15, 'USD');
            },
            createProductLineItem: sinon.stub().returns(productLineItem)
        };
        order = {
            totalNetPrice: new Money(10, 'USD'),
            paymentInstruments: [paymentInstrument]
        };
        paymentRequestOptions = {};
        shipmentShippingModel = {
            getShippingCost: function (method) {
                if (method === shippingMethod) {
                    return {
                        amount: new Money(5, 'USD')
                    };
                }
                if (method === shippingMethod2) {
                    return {
                        amount: new Money(10, 'USD')
                    };
                }
                return {
                    amount: new Money(20, 'USD')
                };
            }
        };
        orderLevelDiscountTotal = new Money(0, 'USD');
        shippingLevelDiscountTotal = new Money(0, 'USD');
        optionModel = {
            getOption: sinon.stub()
        };
        productLineItem = {
            optionModel: optionModel,
            setQuantityValue: sinon.stub()
        };

        ProductMgr = {
            getProduct: function () {
                return product;
            }
        };

        ShippingMgr = {
            defaultShippingMethod: shippingMethod,
            getShippingCost: function () {
                return new Money(4, 'USD');
            },
            getProductShippingModel: function () {
                return {
                    getShippingCost: function () {
                        return null;
                    }
                };
            },
            getShipmentShippingModel: function () {
                return shipmentShippingModel;
            },
            allShippingMethods: {
                toArray: function () {
                    return [shippingMethod, shippingMethod2, shippingMethod3];
                }
            }
        };

        TaxMgr = {
            TAX_POLICY_GROSS: 'GROSS',
            defaultTaxClassID: 'taxClass',
            defaultTaxJurisdictionID: 'taxJurisdiction',
            taxationPolicy: 'GROSS',
            getTaxRate: function () {
                return 0.5;
            }
        };

        BasketMgr = {
            currentBasket: basket,
            createTemporaryBasket: function () {
                return basket;
            },
            deleteTemporaryBasket: sinon.stub()
        };

        OrderMgr = {
            failOrder: sinon.stub()
        };

        SalesforcePaymentRequest = {
            calculatePaymentRequestOptions: sinon.stub().returns(paymentRequestOptions)
        };

        Logger = {
            error: sinon.stub()
        };

        Currency = {
            getCurrency: sinon.stub().returns(currency)
        };

        Decimal = function D(value) {
            this.divide = function (divisor) {
                return new D(value / divisor);
            };
            this.toString = function () {
                return value.toString();
            };
        };

        shippingHelpers = {
            getApplicableShippingMethods: function () {
                return [{
                    ID: 's1',
                    displayName: 'Ground',
                    estimatedArrivalTime: '7-10 Days'
                }, {
                    ID: 's2',
                    displayName: 'Express',
                    estimatedArrivalTime: '2-3 Days',
                    selected: true
                }, {
                    ID: 's3',
                    displayName: 'Overnight',
                    estimatedArrivalTime: '1 Day'
                }];
            },
            selectShippingMethod: sinon.stub()
        };

        basketCalculationHelpers = {
            calculateTotals: sinon.stub()
        };

        TotalsModel = function () {
            this.orderLevelDiscountTotal = orderLevelDiscountTotal;
            this.shippingLevelDiscountTotal = shippingLevelDiscountTotal;
        };

        checkoutHelpers = proxyquire('../../../../../cartridges/plugin_commercepayments/cartridge/scripts/checkout/checkoutHelpers', {
            'dw/value/Money': Money,
            'dw/web/Resource': Resource,
            'dw/catalog/ProductMgr': ProductMgr,
            'dw/order/ShippingMgr': ShippingMgr,
            'dw/order/TaxMgr': TaxMgr,
            'dw/order/BasketMgr': BasketMgr,
            'dw/order/OrderMgr': OrderMgr,
            'dw/system/Transaction': Transaction,
            'dw/system/Logger': Logger,
            'dw/util/Currency': Currency,
            'dw/util/Decimal': Decimal,
            'dw/extensions/payments/SalesforcePaymentRequest': SalesforcePaymentRequest,
            '*/cartridge/scripts/checkout/shippingHelpers': shippingHelpers,
            '*/cartridge/scripts/helpers/basketCalculationHelpers': basketCalculationHelpers,
            '*/cartridge/models/totals': TotalsModel
        });
    });

    describe('handleCommercePayments', function () {
        describe('order with NA totalNetPrice', function () {
            it('should return an empty object', function () {
                order.totalNetPrice = {
                    available: false
                };
                assert.deepEqual(checkoutHelpers.handleCommercePayments(order), {});
            });
        });

        describe('order with zero totalNetPrice', function () {
            it('should return an empty object', function () {
                order.totalNetPrice = new Money(0, 'USD');
                assert.deepEqual(checkoutHelpers.handleCommercePayments(order), {});
            });
        });

        describe('order without payment instruments', function () {
            it('should fail the order and return error', function () {
                order.paymentInstruments = [];
                assert.deepEqual(checkoutHelpers.handleCommercePayments(order), {
                    error: true
                });

                assert.isTrue(Transaction.wrap.calledOnce);
                assert.isTrue(OrderMgr.failOrder.calledOnce);
                assert.isTrue(OrderMgr.failOrder.calledWith(order, true));
            });
        });

        describe('order has payment instruments', function () {
            it('should return an empty object', function () {
                assert.deepEqual(checkoutHelpers.handleCommercePayments(order), {});
            });
        });
    });

    describe('calculateBuyNowData', function () {
        describe('gross taxation', function () {
            it('should calculate data', function () {
                var data = checkoutHelpers.calculateBuyNowData('p1', 1, null);

                assert.equal(data.basketData.sku, 'p1');
                assert.equal(data.basketData.quantity, 1);
                assert.equal(data.basketData.shippingMethod, 's1');
                assert.equal(data.basketData.options.length, 0);

                assert.equal(data.options.currency, 'USD');
                assert.equal(data.options.total.label, Resource.msg('label.order.grand.total', 'confirmation', null));
                assert.equal(data.options.total.amount, '20');
                assert.equal(data.options.displayItems.length, 2);
                assert.equal(data.options.displayItems[0].label, Resource.msg('label.order.subtotal', 'confirmation', null));
                assert.equal(data.options.displayItems[0].amount, '15');
                assert.equal(data.options.displayItems[1].label, Resource.msg('label.order.shipping.cost', 'confirmation', null));
                assert.equal(data.options.displayItems[1].amount, '5');
                assert.equal(data.options.shippingOptions.length, 3);
                assert.equal(data.options.shippingOptions[0].id, shippingMethod2.ID);
                assert.equal(data.options.shippingOptions[0].label, 'Express');
                assert.equal(data.options.shippingOptions[0].detail, '2-3 Days');
                assert.equal(data.options.shippingOptions[0].amount, '10');
            });
        });

        describe('net taxation', function () {
            beforeEach(function () {
                TaxMgr.taxationPolicy = 'NET';
            });

            it('should calculate data for net taxation sites', function () {
                var data = checkoutHelpers.calculateBuyNowData('p1', 1, null);

                assert.equal(data.basketData.sku, 'p1');
                assert.equal(data.basketData.quantity, 1);
                assert.equal(data.basketData.shippingMethod, 's1');
                assert.equal(data.basketData.options.length, 0);

                assert.equal(data.options.currency, 'USD');
                assert.equal(data.options.total.label, Resource.msg('label.order.grand.total', 'confirmation', null));
                assert.equal(data.options.total.amount, '20');
                assert.equal(data.options.displayItems.length, 2);
                assert.equal(data.options.displayItems[0].label, Resource.msg('label.order.subtotal', 'confirmation', null));
                assert.equal(data.options.displayItems[0].amount, '15');
                assert.equal(data.options.displayItems[1].label, Resource.msg('label.order.shipping.cost', 'confirmation', null));
                assert.equal(data.options.displayItems[1].amount, '5');
                assert.equal(data.options.shippingOptions.length, 3);
                assert.equal(data.options.shippingOptions[0].id, shippingMethod2.ID);
                assert.equal(data.options.shippingOptions[0].label, 'Express');
                assert.equal(data.options.shippingOptions[0].detail, '2-3 Days');
                assert.equal(data.options.shippingOptions[0].amount, '10');
            });

            it('should omit zero shipping and tax line items', function () {
                TaxMgr.getTaxRate = function () {
                    return 0;
                };
                ShippingMgr.getShippingCost = function () {
                    return new Money(0, 'USD');
                };

                var data = checkoutHelpers.calculateBuyNowData('p1', 2, null);

                assert.equal(data.basketData.sku, 'p1');
                assert.equal(data.basketData.quantity, 2);
                assert.equal(data.basketData.shippingMethod, 's1');
                assert.equal(data.basketData.options.length, 0);

                assert.equal(data.options.currency, 'USD');
                assert.equal(data.options.total.label, Resource.msg('label.order.grand.total', 'confirmation', null));
                assert.equal(data.options.total.amount, '20');
                assert.equal(data.options.displayItems.length, 2);
                assert.equal(data.options.displayItems[0].label, Resource.msg('label.order.subtotal', 'confirmation', null));
                assert.equal(data.options.displayItems[0].amount, '15');
                assert.equal(data.options.shippingOptions.length, 3);
                assert.equal(data.options.shippingOptions[0].id, shippingMethod2.ID);
                assert.equal(data.options.shippingOptions[0].label, 'Express');
                assert.equal(data.options.shippingOptions[0].detail, '2-3 Days');
                assert.equal(data.options.shippingOptions[0].amount, '10');
            });

            it('should include options', function () {
                var options = [{
                    id: 'o1',
                    selectedValueId: 'ov1'
                }, {
                    id: 'o2',
                    selectedValueId: 'ov2'
                }];

                var data = checkoutHelpers.calculateBuyNowData('p1', 1, options);

                assert.equal(data.basketData.sku, 'p1');
                assert.equal(data.basketData.quantity, 1);
                assert.equal(data.basketData.shippingMethod, 's1');
                assert.equal(data.basketData.options.length, 2);
                assert.equal(data.basketData.options[0].id, options[0].id);
                assert.equal(data.basketData.options[0].valueId, options[0].selectedValueId);
                assert.equal(data.basketData.options[1].id, options[1].id);
                assert.equal(data.basketData.options[1].valueId, options[1].selectedValueId);

                assert.equal(data.options.currency, 'USD');
                assert.equal(data.options.total.label, Resource.msg('label.order.grand.total', 'confirmation', null));
                assert.equal(data.options.total.amount, '20');
                assert.equal(data.options.displayItems.length, 2);
                assert.equal(data.options.displayItems[0].label, Resource.msg('label.order.subtotal', 'confirmation', null));
                assert.equal(data.options.displayItems[0].amount, '15');
                assert.equal(data.options.displayItems[1].label, Resource.msg('label.order.shipping.cost', 'confirmation', null));
                assert.equal(data.options.displayItems[1].amount, '5');
                assert.equal(data.options.shippingOptions.length, 3);
                assert.equal(data.options.shippingOptions[0].id, shippingMethod2.ID);
                assert.equal(data.options.shippingOptions[0].label, 'Express');
                assert.equal(data.options.shippingOptions[0].detail, '2-3 Days');
                assert.equal(data.options.shippingOptions[0].amount, '10');
            });

            it('should include product specific shipping', function () {
                ShippingMgr.getProductShippingModel = function () {
                    return {
                        getShippingCost: function () {
                            return {
                                amount: new Money(2, 'USD')
                            };
                        }
                    };
                };

                var data = checkoutHelpers.calculateBuyNowData('p1', 1, null);

                assert.equal(data.basketData.sku, 'p1');
                assert.equal(data.basketData.quantity, 1);
                assert.equal(data.basketData.shippingMethod, 's1');
                assert.equal(data.basketData.options.length, 0);

                assert.equal(data.options.currency, 'USD');
                assert.equal(data.options.total.label, Resource.msg('label.order.grand.total', 'confirmation', null));
                assert.equal(data.options.total.amount, '20');
                assert.equal(data.options.displayItems.length, 2);
                assert.equal(data.options.displayItems[0].label, Resource.msg('label.order.subtotal', 'confirmation', null));
                assert.equal(data.options.displayItems[0].amount, '15');
                assert.equal(data.options.displayItems[1].label, Resource.msg('label.order.shipping.cost', 'confirmation', null));
                assert.equal(data.options.displayItems[1].amount, '5');
                assert.equal(data.options.shippingOptions.length, 3);
                assert.equal(data.options.shippingOptions[0].id, shippingMethod2.ID);
                assert.equal(data.options.shippingOptions[0].label, 'Express');
                assert.equal(data.options.shippingOptions[0].detail, '2-3 Days');
                assert.equal(data.options.shippingOptions[0].amount, '10');
            });
        });
    });

    describe('calculatePayNowOptions', function () {
        describe('no current basket', function () {
            beforeEach(function () {
                BasketMgr.currentBasket = null;
            });

            it('should return empty options', function () {
                assert.deepEqual(checkoutHelpers.calculatePayNowOptions(), {});
            });
        });

        describe('no default shipment', function () {
            beforeEach(function () {
                basket.defaultShipment = null;
            });

            it('should return empty options', function () {
                assert.deepEqual(checkoutHelpers.calculatePayNowOptions(), {});
            });
        });

        describe('gross taxation', function () {
            it('should return options without tax', function () {
                var options = checkoutHelpers.calculatePayNowOptions();

                assert.equal(options.currency, 'USD');

                assert.equal(options.total.label, 'confirmation:label.order.grand.total');
                assert.equal(options.total.amount, '20');

                assert.equal(options.displayItems.length, 2);
                assert.equal(options.displayItems[0].label, 'confirmation:label.order.subtotal');
                assert.equal(options.displayItems[0].amount, '15');
                assert.equal(options.displayItems[1].label, 'confirmation:label.order.shipping.cost');
                assert.equal(options.displayItems[1].amount, '5');

                assert.equal(options.shippingOptions.length, 3);
                assert.equal(options.shippingOptions[0].id, 's2');
                assert.equal(options.shippingOptions[0].label, 'Express');
                assert.equal(options.shippingOptions[0].detail, '2-3 Days');
                assert.equal(options.shippingOptions[0].amount, '10');
                assert.equal(options.shippingOptions[1].id, 's1');
                assert.equal(options.shippingOptions[1].label, 'Ground');
                assert.equal(options.shippingOptions[1].detail, '7-10 Days');
                assert.equal(options.shippingOptions[1].amount, '5');
                assert.equal(options.shippingOptions[2].id, 's3');
                assert.equal(options.shippingOptions[2].label, 'Overnight');
                assert.equal(options.shippingOptions[2].detail, '1 Day');
                assert.equal(options.shippingOptions[2].amount, '20');
            });
        });

        describe('net taxation', function () {
            beforeEach(function () {
                TaxMgr.taxationPolicy = 'NET';
                basket.totalTax = new Money(3, 'USD');
                basket.getAdjustedMerchandizeTotalPrice = function () {
                    return new Money(12, 'USD');
                };
            });

            describe('with nonzero tax', function () {
                it('should return options with tax', function () {
                    var options = checkoutHelpers.calculatePayNowOptions();

                    assert.equal(options.currency, 'USD');
                    assert.equal(options.total.label, 'confirmation:label.order.grand.total');
                    assert.equal(options.total.amount, '20');

                    assert.equal(options.displayItems.length, 3);
                    assert.equal(options.displayItems[0].label, 'confirmation:label.order.subtotal');
                    assert.equal(options.displayItems[0].amount, '12');
                    assert.equal(options.displayItems[1].label, 'confirmation:label.order.shipping.cost');
                    assert.equal(options.displayItems[1].amount, '5');
                    assert.equal(options.displayItems[2].label, 'confirmation:label.order.sales.tax');
                    assert.equal(options.displayItems[2].amount, '3');

                    assert.equal(options.shippingOptions.length, 3);
                    assert.equal(options.shippingOptions[0].id, 's2');
                    assert.equal(options.shippingOptions[0].label, 'Express');
                    assert.equal(options.shippingOptions[0].detail, '2-3 Days');
                    assert.equal(options.shippingOptions[0].amount, '10');
                    assert.equal(options.shippingOptions[1].id, 's1');
                    assert.equal(options.shippingOptions[1].label, 'Ground');
                    assert.equal(options.shippingOptions[1].detail, '7-10 Days');
                    assert.equal(options.shippingOptions[1].amount, '5');
                    assert.equal(options.shippingOptions[2].id, 's3');
                    assert.equal(options.shippingOptions[2].label, 'Overnight');
                    assert.equal(options.shippingOptions[2].detail, '1 Day');
                    assert.equal(options.shippingOptions[2].amount, '20');
                });
            });

            describe('with zero tax and some discounts', function () {
                beforeEach(function () {
                    basket.totalTax = new Money(0, 'USD');
                    basket.getAdjustedMerchandizeTotalPrice = function () {
                        return new Money(17, 'USD');
                    };
                    orderLevelDiscountTotal = new Money(2, 'USD');
                    shippingLevelDiscountTotal = new Money(1, 'USD');
                });

                it('should return options without tax but with discounts', function () {
                    var options = checkoutHelpers.calculatePayNowOptions();

                    assert.equal(options.currency, 'USD');
                    assert.equal(options.total.label, 'confirmation:label.order.grand.total');
                    assert.equal(options.total.amount, '20');

                    assert.equal(options.displayItems.length, 4);
                    assert.equal(options.displayItems[0].label, 'confirmation:label.order.subtotal');
                    assert.equal(options.displayItems[0].amount, '17');
                    assert.equal(options.displayItems[1].label, 'common:label.order.discount');
                    assert.equal(options.displayItems[1].amount, '-2');
                    assert.equal(options.displayItems[2].label, 'confirmation:label.order.shipping.cost');
                    assert.equal(options.displayItems[2].amount, '5');
                    assert.equal(options.displayItems[3].label, 'common:label.shipping.discount');
                    assert.equal(options.displayItems[3].amount, '-1');

                    assert.equal(options.shippingOptions.length, 3);
                    assert.equal(options.shippingOptions[0].id, 's2');
                    assert.equal(options.shippingOptions[0].label, 'Express');
                    assert.equal(options.shippingOptions[0].detail, '2-3 Days');
                    assert.equal(options.shippingOptions[0].amount, '10');
                    assert.equal(options.shippingOptions[1].id, 's1');
                    assert.equal(options.shippingOptions[1].label, 'Ground');
                    assert.equal(options.shippingOptions[1].detail, '7-10 Days');
                    assert.equal(options.shippingOptions[1].amount, '5');
                    assert.equal(options.shippingOptions[2].id, 's3');
                    assert.equal(options.shippingOptions[2].label, 'Overnight');
                    assert.equal(options.shippingOptions[2].detail, '1 Day');
                    assert.equal(options.shippingOptions[2].amount, '20');
                });
            });
        });
    });

    describe('getBillingDetails', function () {
        describe('basket has billing info', function () {
            beforeEach(function () {
                basket.customerName = 'Ima Tester';
                basket.customerEmail = 'ima@tester.com';
                basket.billingAddress = {
                    fullName: 'Ima Q. Tester',
                    phone: '4448675309',
                    address1: '1 Main St',
                    address2: 'Apt 8a',
                    city: 'New York',
                    stateCode: 'NY',
                    postalCode: '11011',
                    countryCode: {
                        value: 'US'
                    }
                };
            });

            it('should return full billing details', function () {
                var billingDetails = checkoutHelpers.getBillingDetails(basket);

                assert.equal(billingDetails.name, 'Ima Q. Tester');
                assert.equal(billingDetails.email, 'ima@tester.com');
                assert.equal(billingDetails.phone, '4448675309');
                assert.equal(billingDetails.address.line1, '1 Main St');
                assert.equal(billingDetails.address.line2, 'Apt 8a');
                assert.equal(billingDetails.address.city, 'New York');
                assert.equal(billingDetails.address.state, 'NY');
                assert.equal(billingDetails.address.postal_code, '11011');
                assert.equal(billingDetails.address.country, 'US');
            });
        });

        describe('basket has empty billing address', function () {
            beforeEach(function () {
                basket.customerName = 'Ima Tester';
                basket.customerEmail = 'ima@tester.com';
                basket.billingAddress = {};
            });

            it('should return some billing details', function () {
                var billingDetails = checkoutHelpers.getBillingDetails(basket);

                assert.equal(billingDetails.name, 'Ima Tester');
                assert.equal(billingDetails.email, 'ima@tester.com');
                assert.isUndefined(billingDetails.phone);
                assert.deepEqual(billingDetails.address, {});
            });
        });

        describe('basket has no billing address', function () {
            beforeEach(function () {
                basket.customerName = 'Ima Tester';
                basket.customerEmail = 'ima@tester.com';
            });

            it('should return some billing details', function () {
                var billingDetails = checkoutHelpers.getBillingDetails(basket);

                assert.equal(billingDetails.name, 'Ima Tester');
                assert.equal(billingDetails.email, 'ima@tester.com');
                assert.isUndefined(billingDetails.phone);
                assert.deepEqual(billingDetails.address, {});
            });
        });

        describe('basket has no billing info', function () {
            it('should return empty billing details', function () {
                var billingDetails = checkoutHelpers.getBillingDetails(basket);

                assert.isUndefined(billingDetails.name);
                assert.isUndefined(billingDetails.email);
                assert.isUndefined(billingDetails.phone);
                assert.deepEqual(billingDetails.address, {});
            });
        });
    });

    describe('calculatePaymentRequestOptions', function () {
        describe('script API function exists', function () {
            it('should call the API and return the result', function () {
                assert.equal(checkoutHelpers.calculatePaymentRequestOptions(), paymentRequestOptions);
                assert.isTrue(SalesforcePaymentRequest.calculatePaymentRequestOptions.calledOnce);
                assert.isTrue(SalesforcePaymentRequest.calculatePaymentRequestOptions.calledWith(basket, {}));
            });

            it('should call the API and log an error', function () {
                var e = new Error();
                SalesforcePaymentRequest.calculatePaymentRequestOptions.throws(e);
                assert.equal(checkoutHelpers.calculatePaymentRequestOptions(), null);
                assert.isTrue(SalesforcePaymentRequest.calculatePaymentRequestOptions.calledOnce);
                assert.isTrue(SalesforcePaymentRequest.calculatePaymentRequestOptions.calledWith(basket, {}));
                assert.isTrue(Logger.error.calledOnce);
                assert.isTrue(Logger.error.calledWith(e));
            });
        });
    });

    describe('calculatePayPalAmount', function () {
        it('should return the formatted amount for the currency', function () {
            assert.equal(checkoutHelpers.calculatePayPalAmount({
                currency: 'usd',
                total: {
                    amount: 1234
                }
            }), '12.34');
            assert.isTrue(Currency.getCurrency.calledOnce);
            assert.isTrue(Currency.getCurrency.calledWith('USD'));
        });
    });
});
