'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();
    var productSearch = viewData.productSearch;
    var datalayer = require('*/cartridge/scripts/datalayer');

    if (productSearch) {
        datalayer.populate(datalayer.CONTEXT.SEARCH, req, productSearch);
        datalayer.populate(datalayer.EVENT.SEARCHPAGINATION, req);
    }

    next();
});

server.append('UpdateGrid', function (req, res, next) {
    var datalayer = require('*/cartridge/scripts/datalayer');
    datalayer.populate(datalayer.EVENT.SEARCHPAGINATION, req);
    next();
});

module.exports = server.exports();
