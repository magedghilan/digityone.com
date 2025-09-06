import * as natural from 'natural';
import * as stats from 'simple-statistics';
import { kmeans } from 'ml-kmeans';

// Simple linear regression implementation since ml-regression has issues
class SimpleLinearRegression {
    private _slope: number = 0;
    private _intercept: number = 0;

    constructor(x: number[], y: number[]) {
        this.fit(x, y);
    }

    private fit(x: number[], y: number[]): void {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((total, xi, i) => total + xi * y[i], 0);
        const sumXX = x.reduce((total, xi) => total + xi * xi, 0);
        
        this._slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        this._intercept = (sumY - this._slope * sumX) / n;
    }

    predict(x: number): number {
        return this._slope * x + this._intercept;
    }

    score(x: number[], y: number[]): number {
        const yPred = x.map(xi => this.predict(xi));
        const yMean = y.reduce((a, b) => a + b, 0) / y.length;
        
        const ssRes = y.reduce((total, yi, i) => total + Math.pow(yi - yPred[i], 2), 0);
        const ssTot = y.reduce((total, yi) => total + Math.pow(yi - yMean, 2), 0);
        
        return 1 - (ssRes / ssTot);
    }

    get slope(): number {
        return this._slope;
    }

    get intercept(): number {
        return this._intercept;
    }
}

export interface AnalysisInsight {
    type: 'trend' | 'correlation' | 'anomaly' | 'prediction' | 'segment';
    title: string;
    description: string;
    confidence: number;
    data: any;
}

export class AnalysisEngine {
    private nlpTokenizer: natural.WordTokenizer;
    private sentiment: typeof natural.SentimentAnalyzer;

    constructor() {
        this.nlpTokenizer = new natural.WordTokenizer();
        this.sentiment = natural.SentimentAnalyzer;
    }

    async generateInsights(data: any[]): Promise<AnalysisInsight[]> {
        if (!Array.isArray(data) || data.length === 0) {
            return [];
        }

        const insights: AnalysisInsight[] = [];

        // Generate different types of insights
        try {
            insights.push(...await this.identifyTrends(data));
            insights.push(...await this.findCorrelations(data));
            insights.push(...await this.detectAnomalies(data));
            insights.push(...await this.performSegmentation(data));
            insights.push(...await this.generatePredictions(data));
        } catch (error) {
            console.error('Error generating insights:', error);
        }

        return insights.sort((a, b) => b.confidence - a.confidence);
    }

    async identifyTrends(data: any[]): Promise<AnalysisInsight[]> {
        const insights: AnalysisInsight[] = [];
        const numericColumns = this.getNumericColumns(data);
        const dateColumn = this.getDateColumn(data);

        if (!dateColumn || numericColumns.length === 0) {
            return insights;
        }

        for (const column of numericColumns) {
            try {
                const timeSeriesData = this.prepareTimeSeriesData(data, dateColumn, column);
                if (timeSeriesData.length < 3) {
                    continue;
                }

                const trend = this.calculateTrend(timeSeriesData);
                if (Math.abs(trend.slope) > 0.01) {
                    insights.push({
                        type: 'trend',
                        title: `${trend.direction} Trend in ${column}`,
                        description: `${column} shows a ${trend.direction.toLowerCase()} trend with a ${trend.direction === 'Upward' ? 'growth' : 'decline'} rate of ${Math.abs(trend.slope).toFixed(4)} per time period. R² = ${trend.rSquared.toFixed(3)}`,
                        confidence: Math.min(trend.rSquared * 100, 95),
                        data: {
                            column,
                            slope: trend.slope,
                            rSquared: trend.rSquared,
                            timeSeriesData
                        }
                    });
                }
            } catch (error) {
                console.error(`Error analyzing trend for ${column}:`, error);
            }
        }

        return insights;
    }

    async findCorrelations(data: any[]): Promise<AnalysisInsight[]> {
        const insights: AnalysisInsight[] = [];
        const numericColumns = this.getNumericColumns(data);

        if (numericColumns.length < 2) {
            return insights;
        }

        for (let i = 0; i < numericColumns.length; i++) {
            for (let j = i + 1; j < numericColumns.length; j++) {
                try {
                    const col1 = numericColumns[i];
                    const col2 = numericColumns[j];
                    
                    const values1 = data.map(row => parseFloat(row[col1])).filter(v => !isNaN(v));
                    const values2 = data.map(row => parseFloat(row[col2])).filter(v => !isNaN(v));
                    
                    if (values1.length !== values2.length || values1.length < 3) {
                        continue;
                    }

                    const correlation = stats.sampleCorrelation(values1, values2);
                    
                    if (Math.abs(correlation) > 0.5) {
                        const strength = Math.abs(correlation) > 0.8 ? 'strong' : 'moderate';
                        const direction = correlation > 0 ? 'positive' : 'negative';
                        
                        insights.push({
                            type: 'correlation',
                            title: `${strength.charAt(0).toUpperCase() + strength.slice(1)} ${direction} correlation`,
                            description: `${col1} and ${col2} show a ${strength} ${direction} correlation (r = ${correlation.toFixed(3)}). When ${col1} ${correlation > 0 ? 'increases' : 'decreases'}, ${col2} tends to ${correlation > 0 ? 'increase' : 'decrease'} as well.`,
                            confidence: Math.abs(correlation) * 100,
                            data: {
                                column1: col1,
                                column2: col2,
                                correlation,
                                strength,
                                direction
                            }
                        });
                    }
                } catch (error) {
                    console.error(`Error calculating correlation between ${numericColumns[i]} and ${numericColumns[j]}:`, error);
                }
            }
        }

        return insights;
    }

    async detectAnomalies(data: any[]): Promise<AnalysisInsight[]> {
        const insights: AnalysisInsight[] = [];
        const numericColumns = this.getNumericColumns(data);

        for (const column of numericColumns) {
            try {
                const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
                if (values.length < 10) {
                    continue;
                }

                const mean = stats.mean(values);
                const stdDev = stats.standardDeviation(values);
                const threshold = 2 * stdDev; // 2 standard deviations

                const anomalies = data.filter((row, index) => {
                    const value = parseFloat(row[column]);
                    return !isNaN(value) && Math.abs(value - mean) > threshold;
                });

                if (anomalies.length > 0) {
                    insights.push({
                        type: 'anomaly',
                        title: `${anomalies.length} Anomal${anomalies.length === 1 ? 'y' : 'ies'} in ${column}`,
                        description: `Detected ${anomalies.length} unusual value${anomalies.length === 1 ? '' : 's'} in ${column} that deviate significantly from the mean (${mean.toFixed(2)} ± ${threshold.toFixed(2)}).`,
                        confidence: Math.min((anomalies.length / values.length) * 500, 90),
                        data: {
                            column,
                            anomalies: anomalies.map(row => ({ value: row[column], row })),
                            mean,
                            threshold
                        }
                    });
                }
            } catch (error) {
                console.error(`Error detecting anomalies in ${column}:`, error);
            }
        }

        return insights;
    }

    async performSegmentation(data: any[]): Promise<AnalysisInsight[]> {
        const insights: AnalysisInsight[] = [];
        const numericColumns = this.getNumericColumns(data);

        if (numericColumns.length < 2 || data.length < 10) {
            return insights;
        }

        try {
            // Use first two numeric columns for segmentation
            const col1 = numericColumns[0];
            const col2 = numericColumns[1];
            
            const points = data.map(row => [
                parseFloat(row[col1]) || 0,
                parseFloat(row[col2]) || 0
            ]).filter(point => !point.includes(NaN));

            if (points.length < 6) {
                return insights;
            }

            // Perform K-means clustering with 3 clusters
            const k = Math.min(3, Math.floor(points.length / 3));
            const result = kmeans(points, k, { initialization: 'random' });
            const clusters = result.clusters;

            const segments = clusters.map((cluster: any, index: number) => ({
                id: index + 1,
                size: cluster.length,
                centroid: result.centroids[index],
                points: cluster
            }));

            insights.push({
                type: 'segment',
                title: `Data Segmented into ${k} Groups`,
                description: `Based on ${col1} and ${col2}, the data naturally groups into ${k} distinct segments. ${segments.map((seg: any, i: number) => `Segment ${i + 1}: ${seg.size} records`).join(', ')}.`,
                confidence: 75,
                data: {
                    columns: [col1, col2],
                    segments,
                    k
                }
            });
        } catch (error) {
            console.error('Error performing segmentation:', error);
        }

        return insights;
    }

    async generatePredictions(data: any[]): Promise<AnalysisInsight[]> {
        const insights: AnalysisInsight[] = [];
        const numericColumns = this.getNumericColumns(data);
        const dateColumn = this.getDateColumn(data);

        if (!dateColumn || numericColumns.length === 0 || data.length < 5) {
            return insights;
        }

        for (const column of numericColumns) {
            try {
                const timeSeriesData = this.prepareTimeSeriesData(data, dateColumn, column);
                if (timeSeriesData.length < 5) {
                    continue;
                }

                const x = timeSeriesData.map((_, index) => index);
                const y = timeSeriesData.map(point => point.value);

                const regression = new SimpleLinearRegression(x, y);
                const nextPeriodPrediction = regression.predict(timeSeriesData.length);
                const rSquared = regression.score(x, y);

                if (rSquared > 0.3) { // Only include if model has reasonable fit
                    insights.push({
                        type: 'prediction',
                        title: `Predicted Next Value for ${column}`,
                        description: `Based on historical trends, the next predicted value for ${column} is ${nextPeriodPrediction.toFixed(2)}. Model accuracy: ${(rSquared * 100).toFixed(1)}%`,
                        confidence: Math.min(rSquared * 100, 85),
                        data: {
                            column,
                            prediction: nextPeriodPrediction,
                            rSquared,
                            slope: regression.slope,
                            intercept: regression.intercept
                        }
                    });
                }
            } catch (error) {
                console.error(`Error generating prediction for ${column}:`, error);
            }
        }

        return insights;
    }

    async generateReportAnalysis(data: any, reportType: string): Promise<any> {
        switch (reportType) {
            case 'Executive Summary':
                return this.generateExecutiveSummary(data);
            case 'Detailed Analysis':
                return this.generateDetailedAnalysis(data);
            case 'Trend Report':
                return this.generateTrendReport(data);
            case 'Comparison Report':
                return this.generateComparisonReport(data);
            default:
                return this.generateCustomReport(data);
        }
    }

    private generateExecutiveSummary(data: any): any {
        return {
            type: 'Executive Summary',
            keyMetrics: this.calculateKeyMetrics(data),
            insights: ['High-level insight 1', 'Key trend identified', 'Critical finding'],
            recommendations: ['Action item 1', 'Strategic recommendation', 'Next steps']
        };
    }

    private generateDetailedAnalysis(data: any): any {
        return {
            type: 'Detailed Analysis',
            methodology: 'Statistical analysis with trend identification and correlation analysis',
            findings: this.performDetailedStatistics(data),
            implications: 'Detailed implications of the findings'
        };
    }

    private generateTrendReport(data: any): any {
        return {
            type: 'Trend Report',
            timeframe: 'Analysis period',
            trends: this.identifyAllTrends(data),
            forecast: 'Projected trends for next period'
        };
    }

    private generateComparisonReport(data: any): any {
        return {
            type: 'Comparison Report',
            baseline: 'Comparison baseline',
            differences: this.calculateDifferences(data),
            significance: 'Statistical significance of differences'
        };
    }

    private generateCustomReport(data: any): any {
        return {
            type: 'Custom Report',
            sections: ['Custom analysis section 1', 'Custom analysis section 2'],
            customMetrics: this.calculateCustomMetrics(data)
        };
    }

    private getNumericColumns(data: any[]): string[] {
        if (data.length === 0) {
            return [];
        }

        const firstRow = data[0];
        return Object.keys(firstRow).filter(key => {
            const value = firstRow[key];
            return !isNaN(parseFloat(value)) && isFinite(value);
        });
    }

    private getDateColumn(data: any[]): string | null {
        if (data.length === 0) {
            return null;
        }

        const firstRow = data[0];
        for (const key of Object.keys(firstRow)) {
            const value = firstRow[key];
            if (this.isDateValue(value)) {
                return key;
            }
        }
        return null;
    }

    private isDateValue(value: any): boolean {
        if (!value) {
            return false;
        }
        
        const date = new Date(value);
        return !isNaN(date.getTime());
    }

    private prepareTimeSeriesData(data: any[], dateColumn: string, valueColumn: string): Array<{date: Date, value: number}> {
        return data
            .map(row => ({
                date: new Date(row[dateColumn]),
                value: parseFloat(row[valueColumn])
            }))
            .filter(point => !isNaN(point.date.getTime()) && !isNaN(point.value))
            .sort((a, b) => a.date.getTime() - b.date.getTime());
    }

    private calculateTrend(timeSeriesData: Array<{date: Date, value: number}>): any {
        const x = timeSeriesData.map((_, index) => index);
        const y = timeSeriesData.map(point => point.value);
        
        const regression = new SimpleLinearRegression(x, y);
        const rSquared = regression.score(x, y);
        
        return {
            slope: regression.slope,
            rSquared,
            direction: regression.slope > 0 ? 'Upward' : 'Downward'
        };
    }

    private calculateKeyMetrics(data: any): any {
        return { totalRecords: Array.isArray(data) ? data.length : 0 };
    }

    private performDetailedStatistics(data: any): any {
        return { analysis: 'Detailed statistical findings' };
    }

    private identifyAllTrends(data: any): any {
        return { trends: 'Identified trends' };
    }

    private calculateDifferences(data: any): any {
        return { differences: 'Calculated differences' };
    }

    private calculateCustomMetrics(data: any): any {
        return { customMetrics: 'Custom calculated metrics' };
    }
}