'use strict';

var server = require('server');
server.extend(module.superModule);

server.append(
    'Show',
    server.middleware.https,
    function (req, res, next) {
        var cartModel = res.getViewData();
        var datalayer = require('*/cartridge/scripts/datalayer.js');
        datalayer.populate(datalayer.CONTEXT.BASKET, req, cartModel);
        next();
    }
);

module.exports = server.exports();
