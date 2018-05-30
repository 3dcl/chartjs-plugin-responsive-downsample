global.window = {};
import mocha = require('mocha');
import chai = require('chai');
import chai_datatime = require('chai-datetime');
chai.use(chai_datatime);
const expect = chai.expect;

import moment = require('moment');
import { Chart, ChartPoint } from 'chart.js';
import * as data_culling from '../../src/data_culling';
import { MockTimeScale } from '../helper/mock_time_scale';

describe('ResponsiveDownsamplePlugin', function () {
    let mockTimeScale: MockTimeScale;
    let testData: ChartPoint[];
    let dataRange: [Date, Date];

    before(function () {
        mockTimeScale = new MockTimeScale();
        const startTime = Date.parse("2018-01-01T12:00:00.000Z");

        testData = [];
        for (let i = 0; i < 128; ++i) {
            // 1 data point per minute
            testData.push({
                x: new Date(startTime + i * 60000).toISOString(),
                y: i
            });
        }

        dataRange = [
            new Date(testData[0].x as string),
            new Date(testData[testData.length - 1].x as string)
        ];
    });

    describe('rangeIsEqual', function () {
        it('should handle null values', function () {
            expect(data_culling.rangeIsEqual(null, null)).to.be.false;
            expect(data_culling.rangeIsEqual(null, [0, 1])).to.be.false;
            expect(data_culling.rangeIsEqual([0, 1], null)).to.be.false;
            expect(data_culling.rangeIsEqual([null, 1], [0, 1])).to.be.false;
            expect(data_culling.rangeIsEqual([0, null], [0, 1])).to.be.false;
            expect(data_culling.rangeIsEqual([0, 1], [null, 1])).to.be.false;
            expect(data_culling.rangeIsEqual([0, 1], [0, null])).to.be.false;
        });

        it('should compare number ranges', function () {
            expect(data_culling.rangeIsEqual([0, 1], [0, 1])).to.be.true;
            expect(data_culling.rangeIsEqual([0, 1], [2, 1])).to.be.false;
        });

        it('should compare date ranges in string format', function () {
            expect(data_culling.rangeIsEqual(['2018-01-01T12:00:00.000Z', '2018-01-02T12:00:00.000Z'], ['2018-01-01T12:00:00.000Z', '2018-01-02T12:00:00.000Z'])).to.be.true;
            expect(data_culling.rangeIsEqual(['2018-01-01T12:00:00.000Z', '2018-01-02T12:00:00.000Z'], ['2018-01-01T12:00:00.000Z', '2018-01-01T15:00:00.000Z'])).to.be.false;
        });

        it('should compare date ranges', function () {
            const date1 = new Date('2018-01-01T12:00:00.000Z');
            const date2 = new Date('2018-01-02T12:00:00.000Z');
            const date3 = new Date('2018-01-01T15:00:00.000Z');
            expect(data_culling.rangeIsEqual([date1, date2], [date1, date2])).to.be.true;
            expect(data_culling.rangeIsEqual([date1, date2], [date1, date3])).to.be.false;
        });

        it('should compare date ranges using moment', function () {
            const date1 = moment('2018-01-01T12:00:00.000Z');
            const date2 = moment('2018-01-02T12:00:00.000Z');
            const date3 = moment('2018-01-01T15:00:00.000Z');
            expect(data_culling.rangeIsEqual([date1, date2], [date1, date2])).to.be.true;
            expect(data_culling.rangeIsEqual([date1, date2], [date1, date3])).to.be.false;
        });
    })

    describe('getScaleRange', function () {
        it('handles missing scales', function () {
            expect(data_culling.getScaleRange(null)).to.deep.equal([null, null]);
        });

        it('reads scale range', function () {
            expect(data_culling.getScaleRange(mockTimeScale)).to.deep.equal([mockTimeScale.startDate, mockTimeScale.endDate]);
        });
    });

    describe('cullData', function () {
        it('returns whole data array if date range is larger', function () {
            const culledData = data_culling.cullData(testData, ["2018-01-01T00:00:00.000Z", "2018-01-31T24:00:00.000Z"]);
            expect(culledData).to.deep.equal(testData);
        });

        it('should cull data to a date range', function () {
            const startDate = new Date("2018-01-01T12:15:00.000Z");
            const endDate = new Date("2018-01-01T12:20:00.000Z");
            const culledData = data_culling.cullData(testData, [startDate, endDate]);

            expect(culledData).to.have.length(6);
            culledData.forEach((point) => {
                const date = new Date(point.x);
                expect(testData).to.include(point);
                expect(date >= startDate).to.be.equal(true, `Expected "${date}" to be after or equal to "${startDate}"`);
                expect(date <= endDate).to.be.equal(true, `Expected "${date}" to be before or equal to "${endDate}"`);
            });
        });
    });
});
