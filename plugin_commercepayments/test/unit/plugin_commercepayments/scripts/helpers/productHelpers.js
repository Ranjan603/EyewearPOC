'use strict';

var assert = require('chai').assert;
var sinon = require('sinon');

var mockSuperModule = require('../../../mockModuleSuperModule.js');
var superModule = {};

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var SalesforcePaymentRequest = require('../../../../mocks/dw/extensions/payments/SalesforcePaymentRequest');

describe('productHelpers', function () {
    before(function () {
        mockSuperModule.create(superModule);
    });
    after(function () {
        mockSuperModule.remove();
    });

    var baseResult;
    var buyNowData;
    var paymentHelpers;
    var productHelpers;
    beforeEach(function () {
        baseResult = {
            product: {}
        };
        buyNowData = {
            basketData: {},
            options: {
                total: {
                    amount: 1234
                }
            }
        };
        paymentHelpers = {
            getBuyNowData: sinon.stub().returns(buyNowData)
        };
        superModule.showProductPage = sinon.stub().returns(baseResult);
        productHelpers = proxyquire('../../../../../cartridges/plugin_commercepayments/cartridge/scripts/helpers/productHelpers', {
            'dw/extensions/payments/SalesforcePaymentRequest': SalesforcePaymentRequest,
            '*/cartridge/scripts/helpers/paymentHelpers': paymentHelpers
        });
    });

    describe('showProductPage', function () {
        describe('for a product set', function () {
            beforeEach(function () {
                baseResult.product.productType = 'set';
            });

            it('should call base', function () {
                var querystring = 'querystring';
                var reqPageMetaData = {};
                var usePageDesignerTemplates = {};
                var result = productHelpers.showProductPage(querystring, reqPageMetaData, usePageDesignerTemplates);

                assert.isTrue(superModule.showProductPage.calledOnce);
                assert.isTrue(superModule.showProductPage.calledWith(querystring, reqPageMetaData));

                assert.isUndefined(result.product.paymentRequest);
                assert.isUndefined(result.product.paymentMessagesRequest);
            });
        });

        describe('showProductPage', function () {
            it('should call base and set a payment request on the result', function () {
                var querystring = 'querystring';
                var reqPageMetaData = {};
                var usePageDesignerTemplates = {};
                var result = productHelpers.showProductPage(querystring, reqPageMetaData, usePageDesignerTemplates);

                assert.isTrue(superModule.showProductPage.calledOnce);
                assert.isTrue(superModule.showProductPage.calledWith(querystring, reqPageMetaData));

                assert.isNotNull(result.product.paymentRequest);
                assert.equal(result.product.paymentRequest.id, 'buynow');
                assert.equal(result.product.paymentRequest.selector, '.salesforce-buynow-element');
                assert.isTrue(result.product.paymentRequest.setBasketData.calledOnce);
                assert.isTrue(result.product.paymentRequest.setBasketData.calledWith(buyNowData.basketData));
                assert.isTrue(result.product.paymentRequest.setOptions.calledOnce);
                assert.isTrue(result.product.paymentRequest.setOptions.calledWith(buyNowData.options));
                assert.isTrue(result.product.paymentRequest.setPayPalShippingPreference.calledOnce);
                assert.isTrue(result.product.paymentRequest.setPayPalShippingPreference.calledWith(SalesforcePaymentRequest.PAYPAL_SHIPPING_PREFERENCE_GET_FROM_FILE));
                assert.isTrue(result.product.paymentRequest.setPayPalUserAction.calledOnce);
                assert.isTrue(result.product.paymentRequest.setPayPalUserAction.calledWith(SalesforcePaymentRequest.PAYPAL_USER_ACTION_CONTINUE));
                assert.isTrue(result.product.paymentRequest.setPayPalButtonsOptions.calledOnce);
                assert.isTrue(result.product.paymentRequest.setPayPalButtonsOptions.calledWith({
                    style: {
                        height: 40
                    }
                }));

                assert.isNotNull(result.product.paymentMessagesRequest);
                assert.equal(result.product.paymentMessagesRequest.id, 'buynowMessages');
                assert.equal(result.product.paymentMessagesRequest.selector, '.salesforce-buynow-messages-element');
            });
        });
    });
});
