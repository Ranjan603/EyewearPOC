'use strict';

var BaseCartHelpers = {
    addLineItem: function (
        currentBasket,
        product,
        quantity,
        childProducts,
        optionModel,
        defaultShipment
    ) {
        var productLineItem = currentBasket.createProductLineItem(
            product,
            optionModel,
            defaultShipment
        );

        productLineItem.setQuantityValue(quantity);
        return productLineItem;
    },
    getQtyAlreadyInCart: function () { return 1; },
    getExistingProductLineItemsInCart: function () { return []; }
};

module.exports = BaseCartHelpers;
