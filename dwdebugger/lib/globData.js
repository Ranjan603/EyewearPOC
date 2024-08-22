'use strict';
var fileList;
var fileName = [];
var fileSource = [];
var path = require('path');
module.exports = {
    readFileList: function readFileList() {
        return fileList;
    },

    writeFileList: function writeFileList(newData) {
        fileList = newData;
    },

    writeFileSource: function writeFileSource(state, source, file, cwd) {
        var index = state.files[path.join(cwd, file)] || state.addFile(path.join(cwd, file));
        fileSource[index] = source;
        fileName[index] = path.join(cwd, file);
        return index;
    },

    readFileSource: function readFileSource(index) {
        var escapedSource = fileSource[index].replace(/^\#\!.*/, '');
        var formattedReturn = [{
            name: fileName[index],
            lineOffset: 0,
            columnOffset: 0,
            compilationType: 0,
            type: 'script',
            id: index,
            scriptType: 4,
            sourceLength: escapedSource.length,
            handle: 2,
            source: '(function (exports, require, module, __filename, __dirname) { ' + escapedSource + '\n});'
        }];
        var stringified = formattedReturn;
        return stringified;
    }
}