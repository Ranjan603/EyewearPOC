'use strict';
var globData = require('./globData.js'),
    glob = require('glob'),
    path = require('path'),
    fs = require('fs');

module.exports = {
    evaluate: function (payload, state, serverRequest, options) {
        if (typeof globData.readFileList() === 'undefined') {
            var cwdOptions = options.cwd;
            var files = glob.sync('app_storefront_*/**/*.js', { cwd: cwdOptions });
            var i = -1;
            var handles = files.map(function (file) {
                i++;
                var filePath = path.join(cwdOptions, file);
                var src = fs.readFileSync(filePath, 'utf8');
                var index = globData.writeFileSource(state, src, file, cwdOptions);
                return state.refManager.addHandler({
                    type: 'script',
                    name: path.join(cwdOptions, file),
                    id: index,
                    lineOffset: 0,
                    columnOffset: 0,
                    scriptType: 4,
                    compilationType: 0,
                    context: {},
                    handle: i
                });
            });
            globData.writeFileList(handles);
        }
        //evaluate expression
        if (state.initializing) {
            return new Promise(function (resolve) {
                resolve({
                    body: {
                        handle: 15, type: 'string',
                        value: '{ "pid": 2000, "cwd": "dummyData", "filename": "' + options.cwd + 'package.json", "nodeVersion": "v6.3.0"}',
                        length: 189,
                        text: '{"pid":2000 "cwd":"dummyData","filename":"'
                    }, refs: []
                });
            });
        } else {
            state.refManager.resetRefTable();
            return new Promise(function (resolve) {
                var item = {
                    body: state.refManager.addHandler({
                        type: 'object',
                        className: 'Object',
                        constructorFunction: {
                            ref: state.refManager.undefinedRef
                        },
                        protoObject: {
                            ref: state.refManager.undefinedRef
                        },
                        prototypeObject: {
                            ref: state.refManager.undefinedRef
                        },
                        properties: [],
                        text: '#'
                    }),
                    refs: state.refManager.getRefs()
                };
                resolve(item);
            });
        }
    }
};