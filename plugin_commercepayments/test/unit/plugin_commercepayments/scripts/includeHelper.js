'use strict';

var assert = require('chai').assert;

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('includeHelper', function () {
    var includeHelper;
    beforeEach(function () {
        includeHelper = proxyquire('../../../../cartridges/plugin_commercepayments/cartridge/scripts/includeHelper', {
        });
    });

    describe('conditional', function () {
        describe('condition is true', function () {
            it('should return the commercepayments template path', function () {
                var conditionalTemplatePath = includeHelper.conditional(5 > 2, 'template');
                assert.equal('_commercepayments/template', conditionalTemplatePath);
            });
        });

        describe('condition is false', function () {
            it('should return the base template path', function () {
                var conditionalTemplatePath = includeHelper.conditional('team'.indexOf('I') !== -1, 'path/to/template');
                assert.equal('_base/path/to/template', conditionalTemplatePath);
            });
        });

        describe('condition is undefined', function () {
            it('should return the base template path', function () {
                var something;
                var conditionalTemplatePath = includeHelper.conditional(something, 'a/template');
                assert.equal('_base/a/template', conditionalTemplatePath);
            });
        });
    });
});
