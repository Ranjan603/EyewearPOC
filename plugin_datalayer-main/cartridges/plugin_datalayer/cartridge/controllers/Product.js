'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var viewData = res.getViewData();
    var product = viewData.product;

    var datalayer = require('*/cartridge/scripts/datalayer.js');

    if (product && product.online) {
        datalayer.populate(datalayer.CONTEXT.PRODUCT, req, product);
    } else {
        datalayer.populate(datalayer.CONTEXT.ERRORNOTFOUND, req, 'error-productpage');
    }

    next();
});

module.exports = server.exports();
