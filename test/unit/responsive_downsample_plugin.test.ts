global.window = {};
import mocha = require('mocha');
import chai = require('chai');
import chai_datatime = require('chai-datetime');
chai.use(chai_datatime);
const expect = chai.expect;

import { Chart, ChartPoint } from 'chart.js';
import { ResponsiveDownsamplePlugin } from '../../src/responsive_downsample_plugin';
import { LTTBDataMipmap } from '../../src/lttb_data_mipmap';
import { DataMipmap } from '../../src/data_mipmap';
import { MockTimeScale } from '../helper/mock_time_scale';

describe('ResponsiveDownsamplePlugin', function () {
    function waitFor(duration: number): Promise<void> {
        return new Promise((resolve, reject) => {
            setTimeout(resolve, duration);
        });
    }

    let mockTimeScale: MockTimeScale;
    let testData: ChartPoint[];
    let mockChart: Chart;
    beforeEach(function () {
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
            },
            scales: {
                "x-axis-0": mockTimeScale
            },
            update: () => { }
        } as any;
    });

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
                filterXRange: true
            });
        });

        it('should override default options', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions({
                options: {
                    responsiveDownsample: {
                        enabled: true,
                        aggregationAlgorithm: 'AVG',
                        desiredDataPointDistance: 5,
                        minNumPoints: 2,
                        filterXRange: false
                    }
                }
            });

            expect(options).to.deep.equal({
                enabled: true,
                aggregationAlgorithm: 'AVG',
                desiredDataPointDistance: 5,
                minNumPoints: 2,
                filterXRange: false
            });
        });
    });

    describe('hasDataChanged', function () {
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

        it('should handle empty dataset', function () {
            mockChart.data.datasets[0] = {
                data: []
            };
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            ResponsiveDownsamplePlugin.createDataMipMap(mockChart, options);

            expect(mockChart.data.datasets[0]).to.have.property('originalData').that.is.empty;
            expect(mockChart.data.datasets[0])
                .to.have.property('mipMap')
                .that.is.instanceof(LTTBDataMipmap);

            const mipmap: DataMipmap = mockChart.data.datasets[0]['mipMap'];
            expect(mipmap.getMipMaps()).to.have.length(1);
            expect(mipmap.getMipMaps()[0]).to.have.length(0);
        });

        it('should handle undefined dataset', function () {
            mockChart.data.datasets[0] = {
                data: undefined
            };
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            ResponsiveDownsamplePlugin.createDataMipMap(mockChart, options);

            expect(mockChart.data.datasets[0]).to.have.property('originalData').that.is.undefined;
            expect(mockChart.data.datasets[0])
                .to.have.property('mipMap')
                .that.is.instanceof(LTTBDataMipmap);

            const mipmap: DataMipmap = mockChart.data.datasets[0]['mipMap'];
            expect(mipmap.getMipMaps()).to.have.length(1);
            expect(mipmap.getMipMaps()[0]).to.have.length(0);
        });
    });

    describe('getTargetResolution', function () {
        it('should compute a target resolution depending on the time scale', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            expect(
                ResponsiveDownsamplePlugin.getTargetResolution(mockChart, options)
            ).to.equal(864000);
        });

        it('should consider desiredDataPointDistance option', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            options.desiredDataPointDistance = 10;
            expect(
                ResponsiveDownsamplePlugin.getTargetResolution(mockChart, options)
            ).to.equal(8640000);
        });

        it('should handle a missig scale', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            delete mockChart['scales']['x-axis-0'];
            expect(
                ResponsiveDownsamplePlugin.getTargetResolution(mockChart, options)
            ).to.be.null;
        });
    });

    describe('updateMipMap', function () {
        it('should update mip map level', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            ResponsiveDownsamplePlugin.createDataMipMap(mockChart, options);
            ResponsiveDownsamplePlugin.updateMipMap(mockChart, 864000, options);

            return waitFor(101).then(() => {
                expect(mockChart.data.datasets[0].data).to.not.equal(mockChart.data.datasets[0]['originalData']);

                const mipmap: DataMipmap = mockChart.data.datasets[0]['mipMap'];
                expect(mockChart.data.datasets[0].data).to.deep.equal(mipmap.getMipMapLevel(1));
            });
        });
    });

    describe('beforeInit', function () {
        let plugin = new ResponsiveDownsamplePlugin();

        it('should do nothing when disabled', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            options.enabled = false;

            plugin.beforeInit(mockChart);
            expect(mockChart.data.datasets[0]).to.not.have.property('originalData');
            expect(mockChart.data.datasets[0]).to.not.have.property('mipMap');
        });

        it('should initialize plugin data structures', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);

            plugin.beforeInit(mockChart);
            expect(mockChart.data.datasets[0]).to.have.property('originalData');
            expect(mockChart.data.datasets[0]).to.have.property('mipMap');
            expect(options.needsUpdate).to.be.true;
        });
    });

    describe('beforeDatasetsUpdate', function () {
        let plugin: ResponsiveDownsamplePlugin;
        beforeEach(function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            plugin = new ResponsiveDownsamplePlugin();
            plugin.beforeInit(mockChart);
            options.needsUpdate = false;
        });

        it('should do nothing when disabled', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            options.enabled = false;

            plugin.beforeDatasetsUpdate(mockChart);
            expect(options.needsUpdate).to.be.false;
        });

        it('should do nothing when data has not changed', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            plugin.beforeDatasetsUpdate(mockChart);
            expect(options.needsUpdate).to.be.false;
        });

        it('should update new data set', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            mockChart.data.datasets.push({
                data: [
                    { x: '2018-01-02T12:00:00.000Z', y: 400 },
                    { x: '2018-01-02T13:00:00.000Z', y: 300 },
                    { x: '2018-01-02T13:30:00.000Z', y: 200 },
                    { x: '2018-01-02T14:15:00.000Z', y: 100 }
                ]
            });

            plugin.beforeDatasetsUpdate(mockChart);

            expect(mockChart.data.datasets[1]).to.have.property('originalData');
            expect(mockChart.data.datasets[1]).to.have.property('mipMap');
            expect(options.needsUpdate).to.be.true;
        });
    });

    describe('beforeDraw', function () {
        let plugin: ResponsiveDownsamplePlugin;
        beforeEach(function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            plugin = new ResponsiveDownsamplePlugin();
            plugin.beforeInit(mockChart);
        });

        it('should update selected mipmap on initial draw', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            expect(plugin.beforeDraw(mockChart)).to.be.false;

            return waitFor(101).then(() => {
                expect(options.needsUpdate).to.be.false;
                expect(options.targetResolution).to.equal(864000);

                const mipmap: DataMipmap = mockChart.data.datasets[0]['mipMap'];
                expect(mockChart.data.datasets[0])
                    .to.have.property('data')
                    .that.deep.equals(mipmap.getMipMapLevel(1));
            });
        });

        it('should update selected mipmap when time scale changes', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            expect(plugin.beforeDraw(mockChart)).to.be.false;

            return waitFor(101).then(() => {
                mockTimeScale.right = 10000;
                plugin.beforeDraw(mockChart);

                return waitFor(101);
            }).then(() => {
                expect(options.needsUpdate).to.be.false;
                expect(options.targetResolution).to.equal(8640);

                const mipmap: DataMipmap = mockChart.data.datasets[0]['mipMap'];
                expect(mockChart.data.datasets[0])
                    .to.have.property('data')
                    .that.deep.equals(mipmap.getMipMapLevel(0));
            });
        });

        it('should not update selected mipmap if resolution does not change', function () {
            const options = ResponsiveDownsamplePlugin.getPluginOptions(mockChart);
            expect(plugin.beforeDraw(mockChart)).to.be.false;

            return waitFor(101).then(() => {
                expect(plugin.beforeDraw(mockChart)).to.be.undefined;

                return waitFor(101);
            }).then(() => {
                expect(options.needsUpdate).to.be.false;
                expect(options.targetResolution).to.equal(864000);

                const mipmap: DataMipmap = mockChart.data.datasets[0]['mipMap'];
                expect(mockChart.data.datasets[0])
                    .to.have.property('data')
                    .that.deep.equals(mipmap.getMipMapLevel(1));
            });
        });
    });
});

