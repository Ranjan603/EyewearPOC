'use strict';

var myShipment = {
    default: true,
    shippingMethod: {
        ID: '001',
        custom: {
            storePickupEnabled: false
        }
    },
    custom: {
        fromStoreId: '',
        shipmentType: ''
    },

    shippingAddress: {},
    setShippingMethod: function (shippingMethod) {
        this.shippingMethod = shippingMethod;
    },
    createShippingAddress: function () {
        this.shippingAddress = {
            firstName: '',
            lastName: '',
            address1: '',
            address2: '',
            city: '',
            postalCode: '',
            countryCode: { value: '' },
            phone: '',
            stateCode: '',
            setFirstName: function (firstNameInput) { this.firstName = firstNameInput; },
            setLastName: function (lastNameInput) { this.lastName = lastNameInput; },
            setAddress1: function (address1Input) { this.address1 = address1Input; },
            setAddress2: function (address2Input) { this.address2 = address2Input; },
            setCity: function (cityInput) { this.city = cityInput; },
            setPostalCode: function (postalCodeInput) { this.postalCode = postalCodeInput; },
            setStateCode: function (stateCodeInput) { this.stateCode = stateCodeInput; },
            setCountryCode: function (countryCodeInput) { this.countryCode.value = countryCodeInput; },
            setPhone: function (phoneInput) { this.phone = phoneInput; }
        };
        return this.shippingAddress;
    }
};

function ShipmentModel() {
    var shipmentModel = myShipment;
    shipmentModel.createShippingAddress();
    return shipmentModel;
}

module.exports = ShipmentModel;
