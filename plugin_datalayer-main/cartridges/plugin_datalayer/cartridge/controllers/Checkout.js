'use strict';

var server = require('server');
server.extend(module.superModule);

server.append(
    'Begin',
    function (req, res, next) {
        var viewData = res.getViewData();
        var orderModel = viewData.order;
        var currentStage = viewData.currentStage;

        if (orderModel) {
            var datalayer = require('*/cartridge/scripts/datalayer.js');
            datalayer.populate(datalayer.CONTEXT.CHECKOUT, req, orderModel, currentStage);
        }
        next();
    }
);

module.exports = server.exports();
