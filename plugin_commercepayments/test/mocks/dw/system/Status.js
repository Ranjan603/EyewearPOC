'use strict';

function Status(status) {
    return {
        getStatus: function () {
            return status;
        }
    };
}
Status.OK = 1;
Status.ERROR = 2;

module.exports = Status;
