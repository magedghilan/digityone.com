import * as vscode from 'vscode';
import { AnalystAgent } from '../core/AnalystAgent';

export class InsightsProvider implements vscode.TreeDataProvider<InsightItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<InsightItem | undefined | null | void> = new vscode.EventEmitter<InsightItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<InsightItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private insights: InsightItem[] = [];

    constructor(private analystAgent: AnalystAgent) {
        this.initializeSampleInsights();
    }

    private initializeSampleInsights(): void {
        this.insights = [
            new InsightItem(
                'Recent Analysis',
                'recent',
                vscode.TreeItemCollapsibleState.Expanded,
                'graph-line',
                [
                    new InsightItem('Trend: Sales Increasing', 'trend-sales', vscode.TreeItemCollapsibleState.None, 'trending-up', undefined, 'Sales data shows 15% growth trend over last quarter'),
                    new InsightItem('Correlation: Marketing & Revenue', 'corr-marketing', vscode.TreeItemCollapsibleState.None, 'link', undefined, 'Strong positive correlation (r=0.82) between marketing spend and revenue'),
                    new InsightItem('Anomaly: Unusual Spike on 3/15', 'anomaly-spike', vscode.TreeItemCollapsibleState.None, 'warning', undefined, 'Data point significantly higher than expected pattern')
                ]
            ),
            new InsightItem(
                'Predictions',
                'predictions',
                vscode.TreeItemCollapsibleState.Expanded,
                'graph-scatter',
                [
                    new InsightItem('Next Month Revenue: $125K', 'pred-revenue', vscode.TreeItemCollapsibleState.None, 'arrow-right', undefined, 'Based on historical trends and seasonal patterns'),
                    new InsightItem('Customer Growth: +12%', 'pred-customers', vscode.TreeItemCollapsibleState.None, 'person-add', undefined, 'Projected customer base expansion'),
                ]
            ),
            new InsightItem(
                'Segments',
                'segments',
                vscode.TreeItemCollapsibleState.Collapsed,
                'organization',
                [
                    new InsightItem('High Value Customers (23%)', 'segment-high', vscode.TreeItemCollapsibleState.None, 'star-full'),
                    new InsightItem('Regular Customers (54%)', 'segment-regular', vscode.TreeItemCollapsibleState.None, 'person'),
                    new InsightItem('New Customers (23%)', 'segment-new', vscode.TreeItemCollapsibleState.None, 'person-add')
                ]
            ),
            new InsightItem(
                'Recommendations',
                'recommendations',
                vscode.TreeItemCollapsibleState.Collapsed,
                'lightbulb',
                [
                    new InsightItem('Focus on Q2 Marketing', 'rec-marketing', vscode.TreeItemCollapsibleState.None, 'megaphone'),
                    new InsightItem('Optimize Customer Retention', 'rec-retention', vscode.TreeItemCollapsibleState.None, 'heart'),
                    new InsightItem('Investigate Data Quality', 'rec-quality', vscode.TreeItemCollapsibleState.None, 'search')
                ]
            )
        ];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: InsightItem): vscode.TreeItem {
        const item = new vscode.TreeItem(element.label, element.collapsibleState);
        item.id = element.id;
        item.tooltip = element.tooltip || element.label;
        item.iconPath = new vscode.ThemeIcon(element.iconName);
        item.description = element.description;
        
        if (element.collapsibleState === vscode.TreeItemCollapsibleState.None) {
            item.command = {
                command: 'm365AnalystAgent.showInsightDetail',
                title: 'Show Detail',
                arguments: [element]
            };
        }

        return item;
    }

    getChildren(element?: InsightItem): Thenable<InsightItem[]> {
        if (!element) {
            return Promise.resolve(this.insights);
        }
        
        return Promise.resolve(element.children || []);
    }

    addInsight(insight: InsightItem): void {
        // Add to recent analysis
        const recentCategory = this.insights.find(item => item.id === 'recent');
        if (recentCategory && recentCategory.children) {
            recentCategory.children.unshift(insight);
            // Keep only last 10 insights
            if (recentCategory.children.length > 10) {
                recentCategory.children = recentCategory.children.slice(0, 10);
            }
        }
        this.refresh();
    }

    addPrediction(prediction: InsightItem): void {
        const predictionsCategory = this.insights.find(item => item.id === 'predictions');
        if (predictionsCategory && predictionsCategory.children) {
            predictionsCategory.children.unshift(prediction);
        }
        this.refresh();
    }

    updateSegments(segments: InsightItem[]): void {
        const segmentsCategory = this.insights.find(item => item.id === 'segments');
        if (segmentsCategory) {
            segmentsCategory.children = segments;
        }
        this.refresh();
    }

    addRecommendation(recommendation: InsightItem): void {
        const recommendationsCategory = this.insights.find(item => item.id === 'recommendations');
        if (recommendationsCategory && recommendationsCategory.children) {
            recommendationsCategory.children.unshift(recommendation);
        }
        this.refresh();
    }

    clearInsights(): void {
        this.insights.forEach(category => {
            if (category.children) {
                category.children = [];
            }
        });
        this.refresh();
    }

    getInsightsByType(type: 'trend' | 'correlation' | 'anomaly' | 'prediction' | 'segment'): InsightItem[] {
        const allInsights: InsightItem[] = [];
        
        this.insights.forEach(category => {
            if (category.children) {
                allInsights.push(...category.children);
            }
        });

        return allInsights.filter(insight => insight.id.startsWith(type));
    }

    exportInsights(): any {
        return {
            timestamp: new Date().toISOString(),
            insights: this.insights.map(category => ({
                category: category.label,
                id: category.id,
                items: category.children?.map(item => ({
                    label: item.label,
                    id: item.id,
                    tooltip: item.tooltip,
                    description: item.description
                })) || []
            }))
        };
    }

    importInsights(data: any): void {
        if (data && data.insights) {
            // Clear existing insights
            this.clearInsights();
            
            // Import new insights
            data.insights.forEach((categoryData: any) => {
                const category = this.insights.find(cat => cat.id === categoryData.id);
                if (category && categoryData.items) {
                    category.children = categoryData.items.map((itemData: any) => 
                        new InsightItem(
                            itemData.label,
                            itemData.id,
                            vscode.TreeItemCollapsibleState.None,
                            this.getIconForInsightType(itemData.id),
                            undefined,
                            itemData.tooltip,
                            itemData.description
                        )
                    );
                }
            });
            
            this.refresh();
        }
    }

    private getIconForInsightType(id: string): string {
        if (id.startsWith('trend')) return 'trending-up';
        if (id.startsWith('corr')) return 'link';
        if (id.startsWith('anomaly')) return 'warning';
        if (id.startsWith('pred')) return 'arrow-right';
        if (id.startsWith('segment')) return 'organization';
        if (id.startsWith('rec')) return 'lightbulb';
        return 'info';
    }
}

export class InsightItem extends vscode.TreeItem {
    public children?: InsightItem[];

    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconName: string,
        children?: InsightItem[],
        public readonly tooltip?: string,
        public readonly description?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip || label;
        this.id = id;
        this.description = description;
        this.children = children;
    }
}