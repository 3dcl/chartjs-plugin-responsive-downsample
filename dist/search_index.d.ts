/// <reference types="chart.js" />
import { ChartPoint } from "chart.js";
export declare type IndexType = 'number' | 'date';
export declare class SearchIndex {
    private endIndex;
    private index;
    static toNumericValue(point: ChartPoint): number;
    constructor(data: ChartPoint[], bucketSize?: number);
    getSearchRange(data: ChartPoint): [number, number];
    private createIndex(data);
}
