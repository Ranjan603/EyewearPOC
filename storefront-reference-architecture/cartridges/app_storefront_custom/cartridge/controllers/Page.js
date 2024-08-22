var server = require('server');
server.extend(module.superModule);

server.append('IncludeHeaderMenu',function (req, res, next) {
 
    var myForm = server.forms.getForm('insurance');
 
        res.setViewData({
            insuranceForm : myForm
        });
        next();
    }
);
 
module.exports = server.exports();