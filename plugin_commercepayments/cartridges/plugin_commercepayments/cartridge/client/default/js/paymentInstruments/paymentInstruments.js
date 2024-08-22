'use strict';

var base = require('base/paymentInstruments/paymentInstruments');

/**
 * Executes a controller call to remove a saved payment method.
 */
function removePaymentMethod() {
    $('.remove-payment-method').on('click', function (e) {
        e.preventDefault();
        var url = $(this).data('url') + '?ID=' + $(this).data('id');
        $('.payment-to-remove').empty().append($(this).data('description'));

        $('.delete-confirmation-btn').click(function (f) {
            f.preventDefault();
            $('.remove-payment').trigger('payment:remove', f);
            $.ajax({
                url: url,
                type: 'get',
                dataType: 'json',
                success: function (data) {
                    $('#id-' + data.ID).remove();
                    if (data.message) {
                        var toInsert = '<div class="row justify-content-center h3 no-saved-payments"><p>' +
                        data.message +
                        '</p></div>';
                        $('.paymentMethods').empty().append(toInsert);
                    }
                },
                error: function (err) {
                    if (err.responseJSON.redirectUrl) {
                        window.location.href = err.responseJSON.redirectUrl;
                    }
                    $.spinner().stop();
                }
            });
        });
    });
}

var exportPaymentInstruments = $.extend({}, base, {
    removePaymentMethod: removePaymentMethod
});

module.exports = exportPaymentInstruments;
