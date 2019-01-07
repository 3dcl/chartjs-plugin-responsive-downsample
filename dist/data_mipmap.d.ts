import { ChartPoint } from 'chart.js';
/**
 * A mipmap data structure for line chart data. Uses averages to downsample data.
 */
export declare class DataMipmap {
    protected minNumPoints: number;
    protected mipMaps: ChartPoint[][];
    protected originalData: ChartPoint[];
    protected resolution: number;
    /**
     * Create a data mipmap
     * @param data The orignal line chart data
     * @param minNumPoints Minimal number of points on lowest mipmap level(limits number of levels)
     */
    constructor(data: ChartPoint[], minNumPoints?: number);
    /**
     * Set the line chart data and update mipmap level.
     * @param data The orignal line chart data
     */
    setData(data: ChartPoint[]): void;
    /**
     * Set the minimal number of points
     * @param minNumPoints Minimal number of points on lowest mipmap level(limits number of levels)
     */
    setMinNumPoints(minNumPoints: number): void;
    /**
     * Get the best fitting mipmap level for a certain scale resolution
     * @param resolution Desired resolution in ms per pixel
     */
    getMipMapForResolution(resolution: number): ChartPoint[];
    /**
     * Computes the index of the best fitting mipmap level for a certain scale resolution
     * @param resolution Desired resolution in ms per pixel
     */
    getMipMapIndexForResolution(resolution: number): number;
    /**
     * Get a mipmap level by index
     * @param level The index of the mipmap level
     */
    getMipMapLevel(level: number): ChartPoint[];
    /**
     * Get all mipmap level
     */
    getMipMaps(): ChartPoint[][];
    /**
     * Get the number of available mipmap level
     */
    getNumLevel(): number;
    protected computeResolution(data: ChartPoint[]): number;
    protected createMipMap(): void;
    protected downsampleToResolution(data: ChartPoint[], targetResolution: number, targetLength: number): ChartPoint[];
    protected getAverage(aggregationValues: ChartPoint[]): ChartPoint;
    protected getTime(point: ChartPoint): number;
}
