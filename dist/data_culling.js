"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var moment_module = require("moment");
var moment = (window && window.moment) ? window.moment : moment_module;
var utils = require("./utils");
function getCompareValue(value) {
    if (typeof value === 'number') {
        return value;
    }
    else if (typeof value === 'string') {
        return (new Date(value)).getTime();
    }
    else if (value instanceof Date) {
        return value.getTime();
    }
    else {
        return moment(value).toDate().getTime();
    }
}
function rangeIsEqual(previousValue, currentValue) {
    if (utils.isNil(previousValue) ||
        utils.isNil(currentValue) ||
        utils.isNil(previousValue[0]) ||
        utils.isNil(previousValue[1]) ||
        utils.isNil(currentValue[0]) ||
        utils.isNil(currentValue[1])) {
        return false;
    }
    previousValue = [getCompareValue(previousValue[0]), getCompareValue(previousValue[1])];
    currentValue = [getCompareValue(currentValue[0]), getCompareValue(currentValue[1])];
    return previousValue[0] === currentValue[0] && previousValue[1] == currentValue[1];
}
exports.rangeIsEqual = rangeIsEqual;
function getScaleRange(scale) {
    if (utils.isNil(scale))
        return [null, null];
    var start = scale.getValueForPixel(scale.left);
    var end = scale.getValueForPixel(scale.right);
    return [start, end];
}
exports.getScaleRange = getScaleRange;
function cullData(data, range) {
    var startValue = getCompareValue(range[0]);
    var endValue = getCompareValue(range[1]);
    var startIndex = 0;
    var endIndex = data.length;
    for (var i = 1; i < data.length; ++i) {
        var point = data[i];
        var compareValue = getCompareValue(point.x || point.t);
        if (compareValue <= startValue) {
            startIndex = i;
        }
        if (compareValue >= endValue) {
            endIndex = i + 1;
            break;
        }
    }
    return data.slice(startIndex, endIndex);
}
exports.cullData = cullData;
