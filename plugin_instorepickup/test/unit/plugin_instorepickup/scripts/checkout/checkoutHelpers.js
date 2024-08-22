'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var mockSuperModule = require('../../../../mockModuleSuperModule');
var baseCheckoutHelpersMock = require('../../../../../test/mocks/scripts/checkout/baseCheckoutHelpers');
var collections = require('../../../../../test/mocks/util/collections');

describe('checkoutHelpers', function () {
    var checkoutHelpers;
    describe('validate copyBillingAddressToBasket for shipping', function () {
        var basket;
        var address = {
            firstName: 'James',
            lastName: 'Bond',
            address1: '10 Oxford St',
            address2: 'suite 20',
            city: 'London',
            postalCode: '02345',
            countryCode: { value: 'uk' },
            phone: '603-333-1212',
            stateCode: 'NH'
        };
        before(function () {
            mockSuperModule.create(baseCheckoutHelpersMock);

            checkoutHelpers = proxyquire('../../../../../cartridges/plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers', {
                'dw/system/Transaction': {
                    wrap: function (callback) {
                        callback.call(this);
                    }
                },
                '*/cartridge/scripts/util/collections': collections
            });

            function createApiBasket() {
                basket = {
                    billingAddress: null,
                    defaultShipment: {
                        custom: {
                            shipmentType: 'something'
                        }
                    },
                    createBillingAddress: function () {
                        this.billingAddress = {
                            firstName: '',
                            lastName: '',
                            address1: '',
                            address2: '',
                            city: '',
                            postalCode: '',
                            countryCode: { value: '' },
                            phone: '',
                            stateCode: '',

                            setFirstName: function (firstNameInput) {
                                this.firstName = firstNameInput;
                            },
                            setLastName: function (lastNameInput) {
                                this.lastName = lastNameInput;
                            },
                            setAddress1: function (address1Input) {
                                this.address1 = address1Input;
                            },
                            setAddress2: function (address2Input) {
                                this.address2 = address2Input;
                            },
                            setCity: function (cityInput) {
                                this.city = cityInput;
                            },
                            setPostalCode: function (postalCodeInput) {
                                this.postalCode = postalCodeInput;
                            },
                            setStateCode: function (stateCodeInput) {
                                this.stateCode = stateCodeInput;
                            },
                            setCountryCode: function (countryCodeInput) {
                                this.countryCode.value = countryCodeInput;
                            },
                            setPhone: function (phoneInput) {
                                this.phone = phoneInput;
                            }
                        };
                        return this.billingAddress;
                    }
                };
                return basket;
            }
            basket = createApiBasket();
        });

        it('should copy default shipment address to billing form for shipping', function () {
            checkoutHelpers.copyBillingAddressToBasket(address, basket);
            assert.equal(basket.billingAddress.firstName, address.firstName);
            assert.equal(basket.billingAddress.lastName, address.lastName);
            assert.equal(basket.billingAddress.address1, address.address1);
            assert.equal(basket.billingAddress.address2, address.address2);
            assert.equal(basket.billingAddress.city, address.city);
            assert.equal(basket.billingAddress.postalCode, address.postalCode);
            assert.equal(basket.billingAddress.phone, address.phone);
            assert.equal(basket.billingAddress.stateCode, address.stateCode);
            assert.equal(basket.billingAddress.countryCode.value, address.countryCode.value);
        });

        after(function () {
            mockSuperModule.remove();
        });
    });

    describe('validate copyBillingAddressToBasket for instorepickup', function () {
        var basket;
        var address = {
            firstName: 'James',
            lastName: 'Bond',
            address1: '10 Oxford St',
            address2: 'suite 20',
            city: 'London',
            postalCode: '02345',
            countryCode: { value: 'uk' },
            phone: '603-333-1212',
            stateCode: 'NH'
        };
        before(function () {
            mockSuperModule.create(baseCheckoutHelpersMock);

            checkoutHelpers = proxyquire('../../../../../cartridges/plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers', {
                'dw/system/Transaction': {
                    wrap: function (callback) {
                        callback.call(this);
                    }
                },
                '*/cartridge/scripts/util/collections': collections
            });

            function createApiBasket() {
                basket = {
                    billingAddress: null,
                    defaultShipment: {
                        custom: {
                            shipmentType: 'instore'
                        }
                    },
                    createBillingAddress: function () {
                        this.billingAddress = {
                            firstName: '',
                            lastName: '',
                            address1: '',
                            address2: '',
                            city: '',
                            postalCode: '',
                            countryCode: { value: '' },
                            phone: '',
                            stateCode: '',

                            setFirstName: function (firstNameInput) {
                                this.firstName = firstNameInput;
                            },
                            setLastName: function (lastNameInput) {
                                this.lastName = lastNameInput;
                            },
                            setAddress1: function (address1Input) {
                                this.address1 = address1Input;
                            },
                            setAddress2: function (address2Input) {
                                this.address2 = address2Input;
                            },
                            setCity: function (cityInput) {
                                this.city = cityInput;
                            },
                            setPostalCode: function (postalCodeInput) {
                                this.postalCode = postalCodeInput;
                            },
                            setStateCode: function (stateCodeInput) {
                                this.stateCode = stateCodeInput;
                            },
                            setCountryCode: function (countryCodeInput) {
                                this.countryCode.value = countryCodeInput;
                            },
                            setPhone: function (phoneInput) {
                                this.phone = phoneInput;
                            }
                        };
                        return this.billingAddress;
                    }
                };
                return basket;
            }
            basket = createApiBasket();
        });

        it('should NOT copy default shipment address to billing form for instorepickup', function () {
            checkoutHelpers.copyBillingAddressToBasket(address, basket);
            assert.equal(basket.billingAddress, null);
        });

        after(function () {
            mockSuperModule.remove();
        });
    });
    describe('validate all shipments for instorepickup', function () {
        var lineItemContainer = {
            shipments: [
                {
                    custom:
                    {
                        fromStoreId: 'store01'
                    },
                    shippingMethod: {
                        custom: {
                            storePickupEnabled: 'yes'
                        }
                    },
                    shippingAddress: {
                        address1: '100 Main St'
                    }
                },
                {
                    custom:
                    {
                        fromStoreId: 'store03'
                    },
                    shippingMethod: {
                        custom: {
                            storePickupEnabled: 'yes'
                        }
                    },
                    shippingAddress: {
                        address1: '55 King St'
                    }
                }
            ]
        };

        var lineItemContainer2 = {
            shipments: [
                {
                    custom: null,
                    shippingMethod: {
                        custom: {
                            storePickupEnabled: 'yes'
                        }
                    },
                    shippingAddress: {
                        address1: '100 Main St'
                    }
                },
                {
                    custom:
                    {
                        fromStoreId: 'store03'
                    },
                    shippingMethod: {
                        custom: {
                            storePickupEnabled: 'yes'
                        }
                    },
                    shippingAddress: {
                        address1: '55 King St'
                    }
                }
            ]
        };
        var lineItemContainer3 = {
            shipments: [null]
        };
        before(function () {
            mockSuperModule.create(baseCheckoutHelpersMock);

            checkoutHelpers = proxyquire('../../../../../cartridges/plugin_instorepickup/cartridge/scripts/checkout/checkoutHelpers', {
                'dw/system/Transaction': {
                    wrap: function (callback) {
                        callback.call(this);
                    }
                },
                '*/cartridge/scripts/util/collections': collections
            });
        });

        it('should return true for all valid shipment with storeID and storepickup enabled', function () {
            assert.isTrue(checkoutHelpers.ensureValidShipments(lineItemContainer));
        });

        it('should return false when valid shipment with storeID is null and storepickup enabled', function () {
            assert.isFalse(checkoutHelpers.ensureValidShipments(lineItemContainer2));
        });

        it('should return false when shipment is null', function () {
            assert.isFalse(checkoutHelpers.ensureValidShipments(lineItemContainer3));
        });

        after(function () {
            mockSuperModule.remove();
        });
    });
});
