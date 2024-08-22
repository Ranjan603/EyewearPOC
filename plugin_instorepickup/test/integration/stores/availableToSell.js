'use strict';

var assert = require('chai').assert;
var request = require('request-promise');
var config = require('../it.config');
var chai = require('chai');
var chaiSubset = require('chai-subset');
chai.use(chaiSubset);

/**
 * Test cases :
 * 1. When Product with variant 883360352077M is selected, ATS should 2
 * 2. When Product with variant 883360520964M is selected, ATS should 2
 */

describe('Select a store on the in-store pick-up pop up', function () {
    this.timeout(5000);

    var cookieJar = request.jar();

    it('should select a store with ATS value 2', function () {
        var myRequest = {
            url: '',
            method: 'GET',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar
        };
        myRequest.url = config.baseUrl + '/Stores-getAtsValue?pid=883360352077M&storeId=store6';

        var expectedAtsValue = 2;

        return request(myRequest)
        // Handle response from request
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');

                var bodyAsJson = JSON.parse(response.body);
                assert.equal(bodyAsJson.atsValue, expectedAtsValue);
            });
    });

    it('should select a store with ATS value 3', function () {
        var myRequest = {
            url: '',
            method: 'GET',
            rejectUnauthorized: false,
            resolveWithFullResponse: true,
            jar: cookieJar
        };
        myRequest.url = config.baseUrl + '/Stores-getAtsValue?pid=883360520964M&storeId=store5';

        var expectedAtsValue = 3;

        return request(myRequest)
        // Handle response from request
            .then(function (response) {
                assert.equal(response.statusCode, 200, 'Expected statusCode to be 200.');

                var bodyAsJson = JSON.parse(response.body);
                assert.equal(bodyAsJson.atsValue, expectedAtsValue);
            });
    });
});
