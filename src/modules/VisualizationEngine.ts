import { Chart, ChartConfiguration } from 'chart.js';
import { AnalysisInsight } from './AnalysisEngine';

export interface Visualization {
    id: string;
    type: 'chart' | 'table' | 'dashboard';
    title: string;
    config: any;
    data: any;
}

export interface Dashboard {
    id: string;
    title: string;
    widgets: Visualization[];
    layout: any;
}

export class VisualizationEngine {
    private chartDefaults: any;

    constructor() {
        this.chartDefaults = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top' as const,
                },
                title: {
                    display: true,
                },
            },
        };
    }

    async createVisualizations(data: any[], insights: AnalysisInsight[]): Promise<Visualization[]> {
        const visualizations: Visualization[] = [];

        try {
            // Create visualizations based on insights
            for (const insight of insights) {
                const visualization = await this.createVisualizationFromInsight(insight, data);
                if (visualization) {
                    visualizations.push(visualization);
                }
            }

            // Add general data overview visualizations
            visualizations.push(...await this.createOverviewVisualizations(data));
        } catch (error) {
            console.error('Error creating visualizations:', error);
        }

        return visualizations;
    }

    async createVisualizationFromInsight(insight: AnalysisInsight, data: any[]): Promise<Visualization | null> {
        try {
            switch (insight.type) {
                case 'trend':
                    return this.createTrendChart(insight);
                case 'correlation':
                    return this.createScatterPlot(insight, data);
                case 'segment':
                    return this.createSegmentChart(insight);
                case 'anomaly':
                    return this.createAnomalyChart(insight, data);
                case 'prediction':
                    return this.createPredictionChart(insight, data);
                default:
                    return null;
            }
        } catch (error) {
            console.error(`Error creating visualization for ${insight.type}:`, error);
            return null;
        }
    }

    private createTrendChart(insight: AnalysisInsight): Visualization {
        const { timeSeriesData, column } = insight.data;
        
        const chartConfig: ChartConfiguration = {
            type: 'line',
            data: {
                labels: timeSeriesData.map((point: any, index: number) => `Period ${index + 1}`),
                datasets: [{
                    label: column,
                    data: timeSeriesData.map((point: any) => point.value),
                    borderColor: 'rgb(75, 192, 192)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    tension: 0.1
                }]
            },
            options: {
                ...this.chartDefaults,
                plugins: {
                    ...this.chartDefaults.plugins,
                    title: {
                        display: true,
                        text: insight.title
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false
                    }
                }
            }
        };

        return {
            id: `trend-${column}`,
            type: 'chart',
            title: insight.title,
            config: chartConfig,
            data: insight.data
        };
    }

    private createScatterPlot(insight: AnalysisInsight, data: any[]): Visualization {
        const { column1, column2 } = insight.data;
        
        const scatterData = data.map(row => ({
            x: parseFloat(row[column1]) || 0,
            y: parseFloat(row[column2]) || 0
        })).filter(point => !isNaN(point.x) && !isNaN(point.y));

        const chartConfig: ChartConfiguration = {
            type: 'scatter',
            data: {
                datasets: [{
                    label: `${column1} vs ${column2}`,
                    data: scatterData,
                    backgroundColor: 'rgba(255, 99, 132, 0.6)',
                    borderColor: 'rgba(255, 99, 132, 1)',
                }]
            },
            options: {
                ...this.chartDefaults,
                plugins: {
                    ...this.chartDefaults.plugins,
                    title: {
                        display: true,
                        text: insight.title
                    }
                },
                scales: {
                    x: {
                        display: true,
                        title: {
                            display: true,
                            text: column1
                        }
                    },
                    y: {
                        display: true,
                        title: {
                            display: true,
                            text: column2
                        }
                    }
                }
            }
        };

        return {
            id: `correlation-${column1}-${column2}`,
            type: 'chart',
            title: insight.title,
            config: chartConfig,
            data: insight.data
        };
    }

    private createSegmentChart(insight: AnalysisInsight): Visualization {
        const { segments, columns } = insight.data;
        
        const chartConfig: ChartConfiguration = {
            type: 'doughnut',
            data: {
                labels: segments.map((seg: any, index: number) => `Segment ${index + 1}`),
                datasets: [{
                    data: segments.map((seg: any) => seg.size),
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 205, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)'
                    ]
                }]
            },
            options: {
                ...this.chartDefaults,
                plugins: {
                    ...this.chartDefaults.plugins,
                    title: {
                        display: true,
                        text: insight.title
                    }
                }
            }
        };

        return {
            id: `segments-${columns.join('-')}`,
            type: 'chart',
            title: insight.title,
            config: chartConfig,
            data: insight.data
        };
    }

    private createAnomalyChart(insight: AnalysisInsight, data: any[]): Visualization {
        const { column, anomalies, mean } = insight.data;
        
        const allValues = data.map((row, index) => ({
            x: index,
            y: parseFloat(row[column]) || 0,
            isAnomaly: anomalies.some((anomaly: any) => anomaly.row === row)
        }));

        const normalData = allValues.filter(point => !point.isAnomaly);
        const anomalyData = allValues.filter(point => point.isAnomaly);

        const chartConfig: ChartConfiguration = {
            type: 'scatter',
            data: {
                datasets: [
                    {
                        label: 'Normal Values',
                        data: normalData,
                        backgroundColor: 'rgba(75, 192, 192, 0.6)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                    },
                    {
                        label: 'Anomalies',
                        data: anomalyData,
                        backgroundColor: 'rgba(255, 99, 132, 0.8)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        pointRadius: 8
                    }
                ]
            },
            options: {
                ...this.chartDefaults,
                plugins: {
                    ...this.chartDefaults.plugins,
                    title: {
                        display: true,
                        text: insight.title
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Index'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: column
                        }
                    }
                }
            }
        };

        return {
            id: `anomaly-${column}`,
            type: 'chart',
            title: insight.title,
            config: chartConfig,
            data: insight.data
        };
    }

    private createPredictionChart(insight: AnalysisInsight, data: any[]): Visualization {
        const { column, prediction } = insight.data;
        
        // Get historical data
        const historicalData = data.map((row, index) => ({
            x: index,
            y: parseFloat(row[column]) || 0
        }));

        // Add prediction point
        const predictionPoint = {
            x: historicalData.length,
            y: prediction
        };

        const chartConfig: ChartConfiguration = {
            type: 'line',
            data: {
                datasets: [
                    {
                        label: 'Historical Data',
                        data: historicalData,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        backgroundColor: 'rgba(75, 192, 192, 0.2)',
                        tension: 0.1
                    },
                    {
                        label: 'Prediction',
                        data: [historicalData[historicalData.length - 1], predictionPoint],
                        borderColor: 'rgba(255, 99, 132, 1)',
                        backgroundColor: 'rgba(255, 99, 132, 0.2)',
                        borderDash: [5, 5],
                        tension: 0.1
                    }
                ]
            },
            options: {
                ...this.chartDefaults,
                plugins: {
                    ...this.chartDefaults.plugins,
                    title: {
                        display: true,
                        text: insight.title
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: 'Time Period'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: column
                        }
                    }
                }
            }
        };

        return {
            id: `prediction-${column}`,
            type: 'chart',
            title: insight.title,
            config: chartConfig,
            data: insight.data
        };
    }

    private async createOverviewVisualizations(data: any[]): Promise<Visualization[]> {
        const visualizations: Visualization[] = [];

        if (data.length === 0) {
            return visualizations;
        }

        // Create data summary table
        const summaryTable = this.createDataSummaryTable(data);
        visualizations.push(summaryTable);

        // Create distribution charts for numeric columns
        const numericColumns = this.getNumericColumns(data);
        for (const column of numericColumns.slice(0, 3)) { // Limit to first 3 columns
            const histogram = this.createHistogram(data, column);
            visualizations.push(histogram);
        }

        return visualizations;
    }

    private createDataSummaryTable(data: any[]): Visualization {
        const columns = Object.keys(data[0] || {});
        const summary = columns.map(column => {
            const values = data.map(row => row[column]).filter(v => v !== null && v !== undefined);
            const isNumeric = values.every(v => !isNaN(parseFloat(v)));
            
            let stats: any = {
                column,
                count: values.length,
                nulls: data.length - values.length
            };

            if (isNumeric) {
                const numericValues = values.map(v => parseFloat(v));
                stats.mean = this.calculateMean(numericValues);
                stats.median = this.calculateMedian(numericValues);
                stats.min = Math.min(...numericValues);
                stats.max = Math.max(...numericValues);
            } else {
                stats.unique = new Set(values).size;
                stats.mostCommon = this.getMostCommon(values);
            }

            return stats;
        });

        return {
            id: 'data-summary',
            type: 'table',
            title: 'Data Summary',
            config: {
                columns: ['Column', 'Count', 'Nulls', 'Mean', 'Median', 'Min', 'Max', 'Unique', 'Most Common'],
                responsive: true
            },
            data: summary
        };
    }

    private createHistogram(data: any[], column: string): Visualization {
        const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
        
        if (values.length === 0) {
            return {
                id: `histogram-${column}`,
                type: 'chart',
                title: `Distribution of ${column}`,
                config: {},
                data: { message: 'No numeric data available' }
            };
        }

        const bins = this.createBins(values, 10);
        
        const chartConfig: ChartConfiguration = {
            type: 'bar',
            data: {
                labels: bins.map(bin => `${bin.min.toFixed(2)} - ${bin.max.toFixed(2)}`),
                datasets: [{
                    label: 'Frequency',
                    data: bins.map(bin => bin.count),
                    backgroundColor: 'rgba(54, 162, 235, 0.8)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                ...this.chartDefaults,
                plugins: {
                    ...this.chartDefaults.plugins,
                    title: {
                        display: true,
                        text: `Distribution of ${column}`
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: column
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: 'Frequency'
                        }
                    }
                }
            }
        };

        return {
            id: `histogram-${column}`,
            type: 'chart',
            title: `Distribution of ${column}`,
            config: chartConfig,
            data: { bins, column }
        };
    }

    async createDashboard(config: any): Promise<Dashboard> {
        const widgets: Visualization[] = [];
        
        // Create sample widgets based on configuration
        if (config.charts) {
            for (const chartType of config.charts) {
                widgets.push(this.createSampleWidget(chartType));
            }
        }

        return {
            id: `dashboard-${Date.now()}`,
            title: config.title || 'Dashboard',
            widgets,
            layout: this.createDashboardLayout(widgets.length)
        };
    }

    async createReportVisuals(analysis: any): Promise<Visualization[]> {
        const visuals: Visualization[] = [];
        
        // Create visualizations based on report analysis
        if (analysis.keyMetrics) {
            visuals.push(this.createMetricsWidget(analysis.keyMetrics));
        }
        
        if (analysis.trends) {
            visuals.push(this.createTrendsWidget(analysis.trends));
        }

        return visuals;
    }

    private createSampleWidget(type: string): Visualization {
        const sampleConfig: ChartConfiguration = {
            type: type as any,
            data: {
                labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May'],
                datasets: [{
                    label: 'Sample Data',
                    data: [12, 19, 3, 5, 2],
                    backgroundColor: 'rgba(75, 192, 192, 0.6)'
                }]
            },
            options: this.chartDefaults
        };

        return {
            id: `widget-${type}-${Date.now()}`,
            type: 'chart',
            title: `${type.charAt(0).toUpperCase() + type.slice(1)} Chart`,
            config: sampleConfig,
            data: {}
        };
    }

    private createMetricsWidget(metrics: any): Visualization {
        return {
            id: 'metrics-widget',
            type: 'table',
            title: 'Key Metrics',
            config: { responsive: true },
            data: metrics
        };
    }

    private createTrendsWidget(trends: any): Visualization {
        return {
            id: 'trends-widget',
            type: 'chart',
            title: 'Trends Overview',
            config: {
                type: 'line',
                data: {
                    labels: ['Period 1', 'Period 2', 'Period 3'],
                    datasets: [{
                        label: 'Trend',
                        data: [1, 2, 3],
                        borderColor: 'rgba(75, 192, 192, 1)'
                    }]
                },
                options: this.chartDefaults
            },
            data: trends
        };
    }

    private createDashboardLayout(widgetCount: number): any {
        // Simple grid layout
        const cols = Math.ceil(Math.sqrt(widgetCount));
        const rows = Math.ceil(widgetCount / cols);
        
        return {
            type: 'grid',
            columns: cols,
            rows: rows,
            responsive: true
        };
    }

    private getNumericColumns(data: any[]): string[] {
        if (data.length === 0) {
            return [];
        }

        return Object.keys(data[0]).filter(key => {
            const value = data[0][key];
            return !isNaN(parseFloat(value)) && isFinite(value);
        });
    }

    private calculateMean(values: number[]): number {
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }

    private calculateMedian(values: number[]): number {
        const sorted = values.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
    }

    private getMostCommon(values: any[]): any {
        const counts: { [key: string]: number } = {};
        let maxCount = 0;
        let mostCommon = null;

        for (const value of values) {
            const key = String(value);
            counts[key] = (counts[key] || 0) + 1;
            if (counts[key] > maxCount) {
                maxCount = counts[key];
                mostCommon = value;
            }
        }

        return mostCommon;
    }

    private createBins(values: number[], binCount: number): Array<{min: number, max: number, count: number}> {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const binSize = (max - min) / binCount;
        
        const bins = Array.from({ length: binCount }, (_, i) => ({
            min: min + i * binSize,
            max: min + (i + 1) * binSize,
            count: 0
        }));

        for (const value of values) {
            const binIndex = Math.min(Math.floor((value - min) / binSize), binCount - 1);
            bins[binIndex].count++;
        }

        return bins;
    }
}