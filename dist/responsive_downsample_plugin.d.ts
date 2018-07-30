import { IChartPlugin } from './chartjs_ext';
import * as data_culling from './data_culling';
export interface ResponsiveDownsamplePluginOptions {
    /**
     * Enable/disable plugin
     */
    enabled?: boolean;
    /**
     * The aggregation algorithm to thin out data. Default: LTTB
     */
    aggregationAlgorithm?: 'AVG' | 'LTTB';
    /**
     * Desired mininmal distance between data points in pixels. Default: 1 pixel
     */
    desiredDataPointDistance?: number;
    /**
     * Minimal number of data points. Limits
     */
    minNumPoints?: number;
    /**
     * Cull data to displayed range of x scale
     */
    cullData?: boolean;
    /**
     * Flag is set by plugin to trigger reload of data
     */
    needsUpdate?: boolean;
    /**
     * Current target resolution(Set by plugin)
     */
    targetResolution?: number;
    /**
     * Scale range of x axis
     */
    scaleRange?: data_culling.Range;
}
/**
 * Chart js Plugin for downsampling data
 */
export declare class ResponsiveDownsamplePlugin implements IChartPlugin {
    static getPluginOptions(chart: any): ResponsiveDownsamplePluginOptions;
    static hasDataChanged(chart: Chart): boolean;
    static createDataMipMap(chart: Chart, options: ResponsiveDownsamplePluginOptions): void;
    static restoreOriginalData(chart: Chart): boolean;
    static getTargetResolution(chart: Chart, options: ResponsiveDownsamplePluginOptions): number;
    static updateMipMap(chart: Chart, options: ResponsiveDownsamplePluginOptions, rangeChanged: boolean): boolean;
    beforeInit(chart: Chart): void;
    beforeDatasetsUpdate(chart: Chart): void;
    beforeRender(chart: Chart): boolean;
}
