'use strict';

/* global request */

var HashMap = require('dw/util/HashMap');
var configurationHelper = require('~/cartridge/scripts/configurationHelper');

/**
 * Render logic for the storefront.popularCategories.
 * @param {dw.experience.ComponentScriptContext} context The Component script context object.
 * @param {dw.util.Map} [modelIn] Additional model values created by another cartridge. This will not be passed in by Commcerce Cloud Plattform.
 *
 * @returns {string} The markup to be displayed
 */
module.exports.render = function (context, modelIn) {
    var model = modelIn || new HashMap();

    model.commercePaymentsConfiguration = configurationHelper.getConfiguration();

    return module.superModule.render(context, model);
};
