import { ChartPoint } from 'chart.js';
import { Scale } from './chartjs_ext';
import moment_module = require('moment');
const moment = (window && (window as any).moment) ? (window as any).moment : moment_module;
import * as utils from './utils';

export type XValue = number | string | Date | moment_module.Moment;
export type Range = [XValue, XValue];

function getCompareValue(value: XValue): number {
    if (typeof value === 'number') {
        return value;
    } else if (typeof value === 'string') {
        return (new Date(value)).getTime();
    } else if (value instanceof Date) {
        return value.getTime();
    } else {
        return moment(value).toDate().getTime();
    }
}

export function rangeIsEqual(previousValue: Range, currentValue: Range): boolean {
    if (utils.isNil(previousValue) ||
        utils.isNil(currentValue) ||
        utils.isNil(previousValue[0]) ||
        utils.isNil(previousValue[1]) ||
        utils.isNil(currentValue[0]) ||
        utils.isNil(currentValue[1])
    ) {
        return false;
    }

    previousValue = [getCompareValue(previousValue[0]), getCompareValue(previousValue[1])];
    currentValue = [getCompareValue(currentValue[0]), getCompareValue(currentValue[1])];

    return previousValue[0] === currentValue[0] && previousValue[1] == currentValue[1];
}

export function getScaleRange(scale: Scale): Range {
    if (utils.isNil(scale)) return [null, null];

    const start = scale.getValueForPixel(scale.left);
    const end = scale.getValueForPixel(scale.right);

    return [start, end];
}

export function cullData(data: ChartPoint[], range: Range): ChartPoint[] {
    const startValue = getCompareValue(range[0]);
    const endValue = getCompareValue(range[1]);
    let startIndex = 0;
    let endIndex = data.length;

    for (let i = 1; i < data.length; ++i) {
        const point = data[i];
        const compareValue = getCompareValue(point.x);

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
