'use strict';

var requestProcessor = require('../../lib/requestProcessor'),
    assert = require('chai').assert;

describe('requestProcessor', function() {
    describe('evaluate', function() {
        it('should return pre-canned response while initializing', function(done) {
            requestProcessor.evaluate({}, { initializing: true }).then(function(result) {
                assert.deepEqual(result, { body: { handle: 13131, type: 'boolean', value: true, text: 'true' }, refs: [] });
                done();
            }, done);
        });
        it('should return pre-canned response after initialization but without halted thread', function(done) {
            var fakeState = {
                initializing: false,
                currentThread: null,
                refManager: {
                    undefinedRef: 0,
                    addHandler: function(item) { item.handle = 1; return item; },
                    getRefs: function() {
                        return [{
                            handle: 0,
                            type: 'undefined',
                            text: 'undefined'
                        }];
                    },
                    resetRefTable: function() {
                        return;
                    }
                }
            };
            requestProcessor.evaluate({}, fakeState).then(function(result) {
                assert.deepEqual(result, {
                    body: {
                        handle: 1,
                        type: 'object',
                        className: 'Object',
                        constructorFunction: {
                            ref: 0
                        },
                        protoObject: {
                            ref: 0
                        },
                        prototypeObject: {
                            ref: 0
                        },
                        properties: [],
                        text: '#'
                    },
                    refs: [{
                        handle: 0,
                        type: 'undefined',
                        text: 'undefined'
                    }]
                });
                done();
            }, done);
        });
    });
    describe('listbreakpoints', function() {
        it('should return no breakpoints', function(done) {
            var serverRequestMock = {
                send: function() {
                    return Promise.resolve({ body: {} });
                }
            };

            requestProcessor.listbreakpoints(null, null, serverRequestMock).then(function(result) {
                assert.deepEqual(result, { body: { breakpoints: [], breakOnExceptions: false, breakOnUncaughtExceptions: false } });
                done();
            }, done);
        });
        it('should return one breakpint', function(done) {
            var serverRequestMock = {
                send: function() {
                    return Promise.resolve({ body: {
                        '_v': '1.0',
                        breakpoints: [{
                            id: 1,
                            line_number: 18,
                            script_path: '/app_storefront_controllers/cartridge/controllers/Cart.js'
                        }]
                    } });
                }
            }
            var options = {
                cwd: "/Users/rdivekar/sitegenesis/"
            };
            requestProcessor.listbreakpoints(null, null, serverRequestMock,options).then(function(result) {
                assert.deepEqual(result, {"body":{"breakpoints":[{"type":"scriptRegExp","number":1,"line":17,"column":"0","groupId":null,"active":true,"condition":null,"script_regexp":"^(.*[\\/\\\\])?\\/Users\\/rdivekar\\/sitegenesis\\/app_storefront_controllers\\/cartridge\\/controllers\\/Cart\\.js$","actual_locations":[{"line":17,"column":"0","script_id":"0"}]}],"breakOnExceptions":false,"breakOnUncaughtExceptions":false}});
                done();
            }, done);
        });
    });

    describe('setbreakpoint', function() {
        it('should set a new scriptregexp breakpoint', function(done) {
            var serverRequestMock = {
                send: function() {
                    return Promise.resolve({ body: {
                        breakpoints: [{
                            id: 1,
                            line_number: 2,
                            script_path: '/validate.js'
                        }]
                    } });
                }
            }
            var payload = {
                command: 'setbreakpoint',
                arguments: {
                    line: 1,
                    column: 0,
                    type: 'scriptRegExp',
                    target: '^(.*[\\/\\\\])?\\/Users\\/ivolodin\\/Documents\\/Code\\/debugger\\/validate\\.js$'
                },
                type: 'request',
                seq: 12
            };
            var stateMock = {
                activeBreakpoints: {}
            }
            requestProcessor.setbreakpoint(payload, stateMock, serverRequestMock, { cwd: process.cwd() }).then(function(result) {
                assert.deepEqual(result, { body: { type: 'scriptRegExp', breakpoint: 1, script_regexp: '^(.*[\\/\\\\])?\\/Users\\/ivolodin\\/Documents\\/Code\\/debugger\\/validate\\.js$', line: 1, column: 0, actual_locations: [{ line: 1, column: 4, script_id: 42 }] } });
                done();
            }, done);
        });

        it('should set a new script breakpoint', function(done) {
            var serverRequestMock = {
                send: function() {
                    return Promise.resolve({ body: {
                        breakpoints: [{
                            id: 1,
                            line_number: 2,
                            script_path: '/validate.js'
                        }]
                    } });
                }
            }
            var payload = {
                command: 'setbreakpoint',
                arguments: {
                    line: 1,
                    column: 0,
                    type: 'script',
                    target: '/Users/ivolodin/Documents/Code/debugger/validate.js'
                },
                type: 'request',
                seq: 12
            };
            var stateMock = {
                files: {
                    '/validate.js': 42
                },
                activeBreakpoints: {},

            }
            requestProcessor.setbreakpoint(payload, stateMock, serverRequestMock, { cwd: process.cwd() }).then(function(result) {
                assert.deepEqual(result, { body: { type: 'scriptName', breakpoint: 1, script_name: '/Users/ivolodin/Documents/Code/debugger/validate.js', line: 1, column: 0, actual_locations: [{ line: 1, column: 4, script_id: 42 }] } });
                done();
            }, done);
        });
    });

    describe('continue', function() {

    });
});