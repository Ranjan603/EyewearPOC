'use strict';

var storeMgr = {
    getStore: function (storeId) {
        var store1 = {
            ID: 'store1',
            name: 'Downtown TV Shop',
            address1: '333 Washington St',
            address2: '',
            city: 'Boston',
            postalCode: '01803',
            phone: '333-333-3333',
            stateCode: 'MA',
            countryCode: {
                value: 'us'
            },
            latitude: 42.5273334,
            longitude: -71.13758250000001,
            custom: {
                inventoryListId: 'inventoryListId0001',
                countryCodeValue: 'us'
            }
        };
        var store2 = {
            ID: 'store2',
            name: 'Short Electro',
            address1: '584 Columbus Ave',
            address2: '',
            city: 'Boston',
            postalCode: '02118',
            phone: '1-617-888-7276',
            stateCode: 'MA',
            countryCode: {
                value: 'us'
            },
            latitude: 42.3403189,
            longitude: -71.0817859,
            custom: {
                inventoryListId: 'inventoryListId0002',
                countryCodeValue: 'us'
            }
        };
        var storeWithNoInventory = {
            ID: 'storeWithNoInventory',
            custom: {}
        };
        var storeWithNoRecord = {
            ID: 'storeWithNoRecord',
            custom: {
                inventoryListId: 'inventoryListIdNoRecord',
                countryCodeValue: 'us'
            }
        };

        if (storeId === 'store1') {
            return store1;
        } if (storeId === 'store2') {
            return store2;
        } if (storeId === 'storeWithNoInventory') {
            return storeWithNoInventory;
        } if (storeId === 'storeWithNoRecord') {
            return storeWithNoRecord;
        }

        return {};
    }
};

module.exports = {
    getStore: storeMgr.getStore
};
