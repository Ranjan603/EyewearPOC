'use strict';

function BaseOrderModel() {
    this.firstLineItem = {
        isPickUpInStore: false
    };
    this.resources = {
        storeAddress: null
    };
}
module.exports = BaseOrderModel;
