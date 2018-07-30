"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var SearchIndex = /** @class */ (function () {
    function SearchIndex(data, bucketSize) {
        if (bucketSize === void 0) { bucketSize = 100; }
        this.index = [];
        this.endIndex = data.length - 1;
        this.createIndex(data);
    }
    SearchIndex.toNumericValue = function (point) {
        if (typeof point.x === 'string') {
            return new Date(point.x).getTime();
        }
        else if (typeof point.x === 'number') {
            return point.x;
        }
        else if (point.x instanceof Date) {
            return point.x.getTime();
        }
    };
    SearchIndex.prototype.getSearchRange = function (data) {
        var startIndex = 0;
        var endIndex = this.endIndex;
        for (var i = 0; i < this.index.length; ++i) {
            var entry = this.index[i];
            if (entry.x <= data.x) {
                startIndex = entry.index;
            }
            if (entry.x >= data.x) {
                endIndex = entry.index;
                break;
            }
        }
        return [startIndex, endIndex];
    };
    SearchIndex.prototype.createIndex = function (data) {
        var lastValue = SearchIndex.toNumericValue(data[0]);
        this.index.push({
            x: data[0].x,
            index: 0
        });
        for (var i = 1, end = data.length - 1; i < end; ++i) {
            var currentValue = SearchIndex.toNumericValue(data[i]);
            if (currentValue > (lastValue + 3600000)) {
                this.index.push({
                    x: data[i].x,
                    index: i
                });
                lastValue = currentValue;
            }
        }
        this.index.push({
            x: data[data.length - 1].x,
            index: data.length - 1
        });
    };
    return SearchIndex;
}());
exports.SearchIndex = SearchIndex;
