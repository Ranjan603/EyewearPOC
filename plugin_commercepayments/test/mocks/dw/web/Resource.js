'use strict';

module.exports = {
    msg: function (key, bundle, defaultText) {
        return defaultText || (bundle + ':' + key);
    },
    msgf: function (key, bundle, defaultText) {
        var params = Array.prototype.slice.call(arguments, 3);
        if (defaultText) {
            var msg = defaultText;
            params.forEach(function (param, index) {
                msg = msg.replace('{' + index + '}', param);
            });
            return msg;
        }

        return bundle + ':' + key + (params.length ? JSON.stringify(params) : '');
    }
};
