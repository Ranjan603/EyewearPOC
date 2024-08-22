'use strict';

function Money(value, currencyCode) {
    return {
        available: true,
        currencyCode: currencyCode,
        decimalValue: value,
        value: value,
        add: function (money) {
            return new Money(value + money.decimalValue, currencyCode);
        },
        subtract: function (money) {
            return new Money(value - money.decimalValue, currencyCode);
        },
        multiply: function (v) {
            return new Money(value * v, currencyCode);
        },
        addRate: function (rate) {
            return new Money(value * (1 + rate), currencyCode);
        },
        equals: function (other) {
            return other && (currencyCode === other.currencyCode) && (value === other.value);
        }
    };
}

module.exports = Money;
