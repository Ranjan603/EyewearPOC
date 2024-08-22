'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var storeMgr = require('../dw/catalog/StoreMgr');
var ShippingMgr = require('../dw/order/ShippingMgr');
var instorePickupStoreHelpersModelMock = require('../helpers/instorePickupStoreHelpers');
var arrayHelper = require('../util/array');
var collections = require('../util/collections');
var availabilityModelMock = {
    inventoryRecord: {
        ATS: {
            value: 3
        }
    }
};

function proxyModel() {
    return proxyquire('../../../cartridges/plugin_instorepickup/cartridge/scripts/cart/cartHelpers', {
        'dw/catalog/StoreMgr': storeMgr,
        'dw/catalog/ProductMgr': {
            getProduct: function (productId) {
                return {
                    productId: productId,
                    optionModel: {
                        getOption: function () {},
                        getOptionValue: function () {},
                        setSelectedOptionValue: function () {}
                    },
                    availabilityModel: availabilityModelMock
                };
            }
        },
        'dw/order/ShippingMgr': ShippingMgr,
        'dw/util/UUIDUtils': {
            createUUID: function () {
                return 'someUUID';
            }
        },
        'dw/system/Transaction': {
            wrap: function () {

            }

        },
        'dw/web/Resource': {
            msg: function () {
                return 'someString';
            },
            msgf: function () {
                return 'someString';
            }
        },
        '*/cartridge/scripts/helpers/productHelpers': {
            getOptions: function () {},
            getCurrentOptionModel: function () {
                return {
                    optionId: 'option 1',
                    selectedValueId: '123'
                };
            }
        },
        '*/cartridge/scripts/util/array': arrayHelper,
        '*/cartridge/scripts/util/collections': collections,
        '*/cartridge/scripts/helpers/instorePickupStoreHelpers': instorePickupStoreHelpersModelMock,
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            copyShippingAddressToShipment: function (shippingData, shipment) {
                var theShipment = shipment;
                var shippingAddress = theShipment.shippingAddress;
                shippingAddress.setFirstName(shippingData.address.firstName);
                shippingAddress.setLastName(shippingData.address.lastName);
                shippingAddress.setAddress1(shippingData.address.address1);
                shippingAddress.setAddress2(shippingData.address.address2);
                shippingAddress.setCity(shippingData.address.city);
                shippingAddress.setPostalCode(shippingData.address.postalCode);
                shippingAddress.setStateCode(shippingData.address.stateCode);
                shippingAddress.setCountryCode(shippingData.address.countryCode);
                shippingAddress.setPhone(shippingData.address.phone);
                theShipment.shippingMethod.ID = shippingData.shippingMethod;
            }
        }
    });
}

module.exports = proxyModel();
