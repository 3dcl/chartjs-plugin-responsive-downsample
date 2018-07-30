/**
 * A chart scale
 */
export interface Scale {
    left: number;
    right: number;
    top: number;
    bottom: number;
    /**
     * Returns the location of the given data point. Value can either be an index or a numerical value
     * The coordinate (0, 0) is at the upper-left corner of the canvas
     * @param value
     * @param index
     * @param datasetIndex
     */
    getPixelForValue(value: any, index?: number, datasetIndex?: number): number;
    /**
     * Used to get the data value from a given pixel. This is the inverse of getPixelForValue
     * The coordinate (0, 0) is at the upper-left corner of the canvas
     * @param pixel
     */
    getValueForPixel(pixel: number): any;
}
/**
 * A time-based chart scale
 */
export interface TimeScale extends Scale {
    /**
     * Returns the location of the given data point. Value can either be an index or a numerical value
     * The coordinate (0, 0) is at the upper-left corner of the canvas
     * @param value
     * @param index
     * @param datasetIndex
     */
    getPixelForValue(value: Date, index?: number, datasetIndex?: number): number;
    /**
     * Used to get the data value from a given pixel. This is the inverse of getPixelForValue
     * The coordinate (0, 0) is at the upper-left corner of the canvas
     * @param pixel
     */
    getValueForPixel(pixel: number): Date;
}
/**
 * Interface for a chart.js plugin
 */
export interface IChartPlugin {
    beforeInit?: (chartInstance: Chart) => void;
    afterInit?: (chartInstance: Chart) => void;
    resize?: (chartInstance: Chart, newChartSize: [number, number]) => void;
    beforeUpdate?: (chartInstance: Chart) => void | boolean;
    afterScaleUpdate?: (charInstance: Chart) => void;
    afterLayout?: (charInstance: Chart) => void;
    beforeDatasetsUpdate?: (charInstance: Chart) => void | boolean;
    afterDatasetsUpdate?: (charInstance: Chart) => void;
    afterUpdate?: (charInstance: Chart) => void;
    beforeRender?: (charInstance: Chart) => void | boolean;
    beforeDraw?: (charInstance: Chart, easing: string) => void | boolean;
    afterDraw?: (charInstance: Chart, easing: string) => void;
    beforeDatasetsDraw?: (charInstance: Chart, easing: string) => void | boolean;
    afterDatasetsDraw?: (charInstance: Chart, easing: string) => void;
    destroy?: (charInstance: Chart) => void;
    beforeEvent?: (charInstance: Chart, event: any) => void | boolean;
    afterEvent?: (charInstance: Chart, event: any) => void;
}
