'use strict';

var ArrayList = require('../../../mocks/dw.util.Collection');
var mockOptions = [{
    optionId: 'option 1',
    selectedValueId: '123'
}];

var availabilityModelMock = {
    inventoryRecord: {
        ATS: {
            value: 3
        }
    }
};

var myProductLineItem = {
    UUID: 'someUUID',
    productID: '',
    shipment: {},
    quantity: {
        value: 1
    },
    setQuantityValue: function (quantity) {
        return quantity;
    },
    setProductInventoryList: function (storeinventory) {
        return storeinventory;
    },
    quantityValue: 1,
    product: {
        availabilityModel: availabilityModelMock,
        custom: {
            availableForInStorePickup: true
        }
    },
    optionProductLineItems: new ArrayList(mockOptions),
    bundledProductLineItems: new ArrayList([]),
    custom: {
        fromStoreId: ''
    }
};

function ProductLineItemModel(product, optionModel, defaultShipment) {
    // Simple properties
    this.UUID = myProductLineItem.UUID;
    this.productID = product ? product.productId : myProductLineItem.productID;
    this.shipment = defaultShipment || myProductLineItem.shipment;
    this.quantity = myProductLineItem.quantity;
    this.setQuantityValue = myProductLineItem.setQuantityValue;
    this.setProductInventoryList = myProductLineItem.setProductInventoryList;
    this.quantityValue = myProductLineItem.quantityValue;
    this.product = myProductLineItem.product;
    this.custom = myProductLineItem.custom;
}

module.exports = ProductLineItemModel;
