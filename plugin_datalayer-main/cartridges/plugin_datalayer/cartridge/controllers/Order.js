'use strict';

var server = require('server');
server.extend(module.superModule);

server.append(
    'Confirm',
    server.middleware.https,
    function (req, res, next) {
        const viewData = res.getViewData();
        const orderModel = viewData.order;
        const datalayer = require('*/cartridge/scripts/datalayer.js');

        // this is to ensure that we only send this one time and not again on reload
        if (!session.privacy.trackingOrderSubmitted || session.privacy.trackingOrderSubmitted !== orderModel.orderNumber) {
            datalayer.populate(datalayer.CONTEXT.CHECKOUT, req, orderModel, 'order-confirmation');
            session.privacy.trackingOrderSubmitted = orderModel.orderNumber;
        } else {
            // at least add global info
            datalayer.populate(datalayer.CONTEXT.GLOBAL, req, 'order-confirmation');
        }
        next();
    }
);

module.exports = server.exports();
