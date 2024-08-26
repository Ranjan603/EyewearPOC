'use strict';

/**
 * @namespace Insurance
 */

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');


server.get('Show', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');

    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);

    var myForm = server.forms.getForm('insurance');
    myForm.clear();

    res.render('insurance/insurance',
        {insuranceForm : myForm});

    next();
});

server.post('UpdatePrices', consentTracking.consent, cache.applyDefaultCache, function (req, res, next) {
    var Site = require('dw/system/Site');
    var URLUtils = require('dw/web/URLUtils');
    var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
    var PriceBookMgr = require('dw/catalog/PriceBookMgr');
    var Transaction = require('dw/system/Transaction');
 
    pageMetaHelper.setPageMetaTags(req.pageMetaData, Site.current);
 
    var insValue = req.form.insurance;
    var priceBook;
    if (insValue === 'VSP'){
        priceBook = PriceBookMgr.getPriceBook('usd-demo-insurance-prices-VSP');
    }
    else if (insValue === 'METLIFE' || insValue === 'CIGNA VISION'){
        priceBook = PriceBookMgr.getPriceBook('usd-demo-insurance-prices-METLIFE');
    }
 
    var defPriceBook = PriceBookMgr.getPriceBook('usd-m-list-prices');
   
    if (priceBook) {
        // Set the applicable price books for the session
        Transaction.wrap(function() {
            PriceBookMgr.setApplicablePriceBooks([priceBook,defPriceBook]);
        });
    }
 
    session.custom.insuranceApplied = insValue;
 
    var currentUrl = req.httpHeaders.referer;
 
    if (currentUrl) {
        res.redirect(currentUrl);
    } else {
        res.redirect(URLUtils.url('Home-Show'));
    }
 
    next();
});

module.exports = server.exports();