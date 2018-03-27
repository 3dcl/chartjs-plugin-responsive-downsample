export class MockTimeScale {
    left: number;
    right: number;
    top: number;
    bottom: number;
    startDate: Date;
    endDate: Date;

    constructor() {
        this.left = 0;
        this.right = 100;
        this.top = 0;
        this.bottom = 32;
        this.startDate = new Date("2018-01-01T00:00:00.000Z");
        this.endDate = new Date("2018-01-01T24:00:00.000Z");
    }

    getPixelForValue(value: Date, index?: number, datasetIndex?: number): number {
        const interval = this.endDate.getTime() - this.startDate.getTime();
        const width = this.right - this.left;
        const alpha = value.getTime() - this.startDate.getTime() / interval;

        return alpha * width + this.left;
    }


    getValueForPixel(pixel: number): Date {
        const width = this.right - this.left;
        const interval = this.endDate.getTime() - this.startDate.getTime();
        const alpha = (pixel - this.left) / width;

        return new Date(alpha * interval + this.startDate.getTime());
    }
}
