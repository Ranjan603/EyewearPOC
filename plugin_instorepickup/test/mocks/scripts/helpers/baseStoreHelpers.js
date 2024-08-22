'use strict';

var mockStoresModel = {
    stores: [
        {
            ID: 'storeId1',
            name: 'Downtown TV Shop',
            inventoryListId: 'inventoryListId0001'
        },
        {
            ID: 'storeId2',
            name: 'Uptown TV Shop',
            inventoryListId: 'inventoryListId0002'
        },
        {
            ID: 'storeId3',
            name: 'Midtown TV Shop',
            inventoryListId: 'inventoryListId0003'
        },
        {
            ID: 'storeId4',
            name: 'No Inventory Store'
        }
    ],
    locations: '[{"name":"Downtown TV Shop","latitude":42.5273334,"longitude":-71.13758250000001,"infoWindowHtml":"someString"}]',
    searchKey: {
        'postalCode': '01803'
    },
    radius: 15,
    actionUrl: 'some URL',
    googleMapsApi: 'https://maps.googleapis.com/maps/api/js?key=SOME_API_KEY',
    radiusOptions: [15, 30, 50, 100, 300],
    showMap: false,
    storesResultsHtml: 'someString'
};

var BaseStoreHelpers = {
    getStores: function () {
        return mockStoresModel;
    }
};

module.exports = BaseStoreHelpers;
