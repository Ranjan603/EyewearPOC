"use strict";
    
window.jQuery = window.$ = require('jquery');

//require('base/components/spinner');

$(document).ready(function () {

    $("#insBtn").on("click", function (e) {
        e.preventDefault();
        var insurURL = $("#insBtn").attr('href');
        $.ajax({
            url: insurURL,
            method: "GET",
            success: function (data) {
                //$(".modal-body").spinner().stop();
                //$('#nutritionPreferencesModal').modal('show');
                if (data) {
                    var $InsuranceFormModalContent = $(
                        "#InsuranceFormModalContent .modal-body"
                    );
                    //$nutritionPreferencesModal.empty();
                    $InsuranceFormModalContent.append(data.html);
                } else {
                    console.log('insurance modal data error');
                    if (data.redirectUrl) {
                        window.location.href = data.redirectUrl;
                    }
                }
            },
            error: function (err) {
            //$(".modal-body").spinner().stop();
            //$('#nutritionPreferencesModal').modal('hide');
            console.log(err);
                if (err.responseJSON && err.responseJSON.redirectUrl) {
                    window.location.href = err.responseJSON.redirectUrl;
                }
            }
        });
    });
});
