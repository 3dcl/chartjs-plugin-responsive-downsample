import { ChartPoint } from 'chart.js';
import { Scale } from './chartjs_ext';
import moment_module = require('moment');
export declare type XValue = number | string | Date | moment_module.Moment;
export declare type Range = [XValue, XValue];
export declare function rangeIsEqual(previousValue: Range, currentValue: Range): boolean;
export declare function getScaleRange(scale: Scale): Range;
export declare function cullData(data: ChartPoint[], range: Range): ChartPoint[];
