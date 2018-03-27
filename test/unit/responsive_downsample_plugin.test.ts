import mocha = require('mocha');
import chai = require('chai');
import chai_datatime = require('chai-datetime');
chai.use(chai_datatime);
const expect = chai.expect;

import { Chart, ChartPoint } from 'chart.js';
import { ResponsiveDownsamplePlugin } from '../../src/responsive_downsample_plugin';
import { LTTBDataMipmap } from '../../src/lttb_data_mipmap';
import { DataMipmap } from '../../src/data_mipmap';

describe('ResponsiveDownsamplePlugin', function () {
    describe('getPluginOptions', function () {
        it('should be disabled if plugin options are not set', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions({
                options: {}
            });

            expect(options.enabled).to.be.false;
        });

        it('should use default options', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions({
                options: {
                    responsiveDownsample: {
                        enabled: true
                    }
                }
            });

            expect(options).to.deep.equal({
                enabled: true,
                aggregationAlgorithm: 'LTTB',
                desiredDataPointDistance: 1,
                minNumPoints: 100,
                needsUpdate: true
            });
        });

        it('should override default options', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions({
                options: {
                    responsiveDownsample: {
                        enabled: true,
                        aggregationAlgorithm: 'AVG',
                        desiredDataPointDistance: 5,
                        minNumPoints: 2
                    }
                }
            });

            expect(options).to.deep.equal({
                enabled: true,
                aggregationAlgorithm: 'AVG',
                desiredDataPointDistance: 5,
                minNumPoints: 2,
                needsUpdate: true
            });
        });
    });

    describe('hasDataChanged', function () {
        let mockChart: Chart;

        beforeEach(function () {
            mockChart = {
                options: {
                    responsiveDownsample: {
                        enabled: true
                    }
                },
                data: {
                    datasets: [
                        {
                            data: [
                                { x: '2018-01-01T12:00:00.000Z', y: 100 },
                                { x: '2018-01-01T13:00:00.000Z', y: 200 },
                                { x: '2018-01-01T13:30:00.000Z', y: 300 },
                                { x: '2018-01-01T14:15:00.000Z', y: 400 }
                            ]
                        }
                    ]
                }
            } as any;
        });

        it('should return true if data set was not intialized', function () {
            expect(ResponsiveDownsamplePlugin.hasDataChanged(mockChart)).to.be.true;
        });

        it('should return false if data set was initialized', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            ResponsiveDownsamplePlugin.createDataMipMap(mockChart, options);
            expect(ResponsiveDownsamplePlugin.hasDataChanged(mockChart)).to.be.false;
        });

        it('should return true if a new data set was added', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            ResponsiveDownsamplePlugin.createDataMipMap(mockChart, options);

            mockChart.data.datasets.push({
                data: [
                    { x: '2018-01-02T12:00:00.000Z', y: 400 },
                    { x: '2018-01-02T13:00:00.000Z', y: 300 },
                    { x: '2018-01-02T13:30:00.000Z', y: 200 },
                    { x: '2018-01-02T14:15:00.000Z', y: 100 }
                ]
            });

            expect(ResponsiveDownsamplePlugin.hasDataChanged(mockChart)).to.be.true;
        });

        it('should return true if data was replaced', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            ResponsiveDownsamplePlugin.createDataMipMap(mockChart, options);

            mockChart.data.datasets[0] = {
                data: [
                    { x: '2018-01-02T12:00:00.000Z', y: 400 },
                    { x: '2018-01-02T13:00:00.000Z', y: 300 },
                    { x: '2018-01-02T13:30:00.000Z', y: 200 },
                    { x: '2018-01-02T14:15:00.000Z', y: 100 }
                ]
            };

            expect(ResponsiveDownsamplePlugin.hasDataChanged(mockChart)).to.be.true;
        });
    });

    describe('createDataMipMap', function () {
        let testData: ChartPoint[];
        let mockChart: Chart;

        beforeEach(function () {
            const startTime = Date.parse("2018-01-01T12:00:00.000Z");

            testData = [];
            for (let i = 0; i < 128; ++i) {
                // 1 data point per minute
                testData.push({
                    x: new Date(startTime + i * 60000).toISOString(),
                    y: i
                });
            }

            mockChart = {
                options: {
                    responsiveDownsample: {
                        enabled: true
                    }
                },
                data: {
                    datasets: [
                        {
                            data: testData
                        }
                    ]
                }
            } as any;
        });

        it('should create mip map data', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            ResponsiveDownsamplePlugin.createDataMipMap(mockChart, options);

            expect(mockChart.data.datasets[0]).to.have.property('originalData', testData);
            expect(mockChart.data.datasets[0])
                .to.have.property('mipMap')
                .that.is.instanceof(LTTBDataMipmap);

            const mipmap: DataMipmap = mockChart.data.datasets[0]['mipMap'];
            expect(mipmap.getMipMaps()).to.have.length(2);
        });

        it('should create mip map data using options', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            options.aggregationAlgorithm = 'AVG';
            options.minNumPoints = 2;
            ResponsiveDownsamplePlugin.createDataMipMap(mockChart, options);

            expect(mockChart.data.datasets[0]).to.have.property('originalData', testData);
            expect(mockChart.data.datasets[0])
                .to.have.property('mipMap')
                .that.is.instanceof(DataMipmap)
                .and.not.instanceof(LTTBDataMipmap);

            const mipmap: DataMipmap = mockChart.data.datasets[0]['mipMap'];
            expect(mipmap.getMipMaps()).to.have.length(7);
        });
    });
});

