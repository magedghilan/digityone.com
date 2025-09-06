import * as vscode from 'vscode';
import { AnalystAgent } from '../core/AnalystAgent';

export class ReportsProvider implements vscode.TreeDataProvider<ReportItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<ReportItem | undefined | null | void> = new vscode.EventEmitter<ReportItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<ReportItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private reports: ReportItem[] = [];

    constructor(private analystAgent: AnalystAgent) {
        this.initializeSampleReports();
    }

    private initializeSampleReports(): void {
        this.reports = [
            new ReportItem(
                'Recent Reports',
                'recent-reports',
                vscode.TreeItemCollapsibleState.Expanded,
                'file-text',
                [
                    new ReportItem(
                        'Q1 2024 Executive Summary',
                        'exec-summary-q1-2024',
                        vscode.TreeItemCollapsibleState.None,
                        'file-text',
                        undefined,
                        'Executive summary for Q1 2024 performance',
                        new Date('2024-03-31'),
                        'Executive Summary'
                    ),
                    new ReportItem(
                        'March Trends Analysis',
                        'trends-march-2024',
                        vscode.TreeItemCollapsibleState.None,
                        'graph-line',
                        undefined,
                        'Detailed trend analysis for March 2024',
                        new Date('2024-03-30'),
                        'Trend Report'
                    ),
                    new ReportItem(
                        'Customer Segmentation Report',
                        'customer-segments-2024',
                        vscode.TreeItemCollapsibleState.None,
                        'organization',
                        undefined,
                        'Customer segmentation analysis and insights',
                        new Date('2024-03-28'),
                        'Detailed Analysis'
                    )
                ]
            ),
            new ReportItem(
                'Scheduled Reports',
                'scheduled-reports',
                vscode.TreeItemCollapsibleState.Expanded,
                'calendar',
                [
                    new ReportItem(
                        'Weekly Performance Dashboard',
                        'weekly-dashboard',
                        vscode.TreeItemCollapsibleState.None,
                        'dashboard',
                        undefined,
                        'Automated weekly performance report',
                        undefined,
                        'Dashboard',
                        'Weekly'
                    ),
                    new ReportItem(
                        'Monthly Executive Brief',
                        'monthly-exec-brief',
                        vscode.TreeItemCollapsibleState.None,
                        'file-text',
                        undefined,
                        'Monthly executive summary report',
                        undefined,
                        'Executive Summary',
                        'Monthly'
                    ),
                    new ReportItem(
                        'Quarterly Analysis',
                        'quarterly-analysis',
                        vscode.TreeItemCollapsibleState.None,
                        'graph',
                        undefined,
                        'Comprehensive quarterly analysis report',
                        undefined,
                        'Detailed Analysis',
                        'Quarterly'
                    )
                ]
            ),
            new ReportItem(
                'Templates',
                'templates',
                vscode.TreeItemCollapsibleState.Collapsed,
                'file-code',
                [
                    new ReportItem(
                        'Executive Summary Template',
                        'template-exec-summary',
                        vscode.TreeItemCollapsibleState.None,
                        'file-text'
                    ),
                    new ReportItem(
                        'Trend Analysis Template',
                        'template-trend-analysis',
                        vscode.TreeItemCollapsibleState.None,
                        'graph-line'
                    ),
                    new ReportItem(
                        'Comparison Report Template',
                        'template-comparison',
                        vscode.TreeItemCollapsibleState.None,
                        'diff'
                    ),
                    new ReportItem(
                        'Custom Report Template',
                        'template-custom',
                        vscode.TreeItemCollapsibleState.None,
                        'file-plus'
                    )
                ]
            ),
            new ReportItem(
                'Shared Reports',
                'shared-reports',
                vscode.TreeItemCollapsibleState.Collapsed,
                'share',
                [
                    new ReportItem(
                        'Team Performance Report',
                        'shared-team-performance',
                        vscode.TreeItemCollapsibleState.None,
                        'organization',
                        undefined,
                        'Shared with Marketing Team',
                        new Date('2024-03-25'),
                        'Team Report'
                    ),
                    new ReportItem(
                        'Department Analysis',
                        'shared-dept-analysis',
                        vscode.TreeItemCollapsibleState.None,
                        'graph',
                        undefined,
                        'Shared with Department Heads',
                        new Date('2024-03-22'),
                        'Department Analysis'
                    )
                ]
            )
        ];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: ReportItem): vscode.TreeItem {
        const item = new vscode.TreeItem(element.label, element.collapsibleState);
        item.id = element.id;
        item.tooltip = element.tooltip || element.label;
        item.iconPath = new vscode.ThemeIcon(element.iconName);
        
        // Add description with date and type info
        let description = '';
        if (element.createdDate) {
            description += element.createdDate.toLocaleDateString();
        }
        if (element.reportType) {
            description += description ? ` • ${element.reportType}` : element.reportType;
        }
        if (element.schedule) {
            description += description ? ` • ${element.schedule}` : element.schedule;
        }
        
        item.description = description;
        
        // Add context value for context menus
        if (element.collapsibleState === vscode.TreeItemCollapsibleState.None) {
            item.contextValue = element.reportType === 'Dashboard' ? 'dashboardReport' : 'standardReport';
            
            // Add commands for leaf items
            if (element.id.startsWith('template-')) {
                item.command = {
                    command: 'm365AnalystAgent.createFromTemplate',
                    title: 'Create Report from Template',
                    arguments: [element]
                };
            } else {
                item.command = {
                    command: 'm365AnalystAgent.openReport',
                    title: 'Open Report',
                    arguments: [element]
                };
            }
        }

        return item;
    }

    getChildren(element?: ReportItem): Thenable<ReportItem[]> {
        if (!element) {
            return Promise.resolve(this.reports);
        }
        
        return Promise.resolve(element.children || []);
    }

    addReport(report: ReportItem): void {
        // Add to recent reports
        const recentCategory = this.reports.find(item => item.id === 'recent-reports');
        if (recentCategory && recentCategory.children) {
            recentCategory.children.unshift(report);
            // Keep only last 20 reports
            if (recentCategory.children.length > 20) {
                recentCategory.children = recentCategory.children.slice(0, 20);
            }
        }
        this.refresh();
    }

    addScheduledReport(report: ReportItem): void {
        const scheduledCategory = this.reports.find(item => item.id === 'scheduled-reports');
        if (scheduledCategory && scheduledCategory.children) {
            scheduledCategory.children.push(report);
        }
        this.refresh();
    }

    shareReport(reportId: string, shareInfo: any): void {
        const sharedCategory = this.reports.find(item => item.id === 'shared-reports');
        const reportToShare = this.findReportById(reportId);
        
        if (sharedCategory && reportToShare) {
            const sharedReport = new ReportItem(
                reportToShare.label,
                `shared-${reportId}`,
                vscode.TreeItemCollapsibleState.None,
                reportToShare.iconName,
                undefined,
                `Shared with ${shareInfo.recipients?.join(', ') || 'team'}`,
                new Date(),
                reportToShare.reportType
            );
            
            sharedCategory.children = sharedCategory.children || [];
            sharedCategory.children.unshift(sharedReport);
        }
        this.refresh();
    }

    removeReport(reportId: string): void {
        this.removeReportFromCategory(reportId, 'recent-reports');
        this.removeReportFromCategory(reportId, 'scheduled-reports');
        this.removeReportFromCategory(reportId, 'shared-reports');
        this.refresh();
    }

    private removeReportFromCategory(reportId: string, categoryId: string): void {
        const category = this.reports.find(item => item.id === categoryId);
        if (category && category.children) {
            category.children = category.children.filter(report => report.id !== reportId);
        }
    }

    private findReportById(reportId: string): ReportItem | undefined {
        for (const category of this.reports) {
            if (category.children) {
                const found = category.children.find(report => report.id === reportId);
                if (found) {
                    return found;
                }
            }
        }
        return undefined;
    }

    getReportsByType(type: string): ReportItem[] {
        const allReports: ReportItem[] = [];
        
        this.reports.forEach(category => {
            if (category.children) {
                allReports.push(...category.children.filter(report => report.reportType === type));
            }
        });

        return allReports;
    }

    getScheduledReports(): ReportItem[] {
        const scheduledCategory = this.reports.find(item => item.id === 'scheduled-reports');
        return scheduledCategory?.children || [];
    }

    getTemplates(): ReportItem[] {
        const templatesCategory = this.reports.find(item => item.id === 'templates');
        return templatesCategory?.children || [];
    }

    exportReportsList(): any {
        return {
            timestamp: new Date().toISOString(),
            reports: this.reports.map(category => ({
                category: category.label,
                id: category.id,
                items: category.children?.map(item => ({
                    label: item.label,
                    id: item.id,
                    reportType: item.reportType,
                    createdDate: item.createdDate?.toISOString(),
                    schedule: item.schedule,
                    tooltip: item.tooltip
                })) || []
            }))
        };
    }

    searchReports(query: string): ReportItem[] {
        const results: ReportItem[] = [];
        const searchTerm = query.toLowerCase();
        
        this.reports.forEach(category => {
            if (category.children) {
                const matches = category.children.filter(report => 
                    report.label.toLowerCase().includes(searchTerm) ||
                    report.reportType?.toLowerCase().includes(searchTerm) ||
                    report.tooltip?.toLowerCase().includes(searchTerm)
                );
                results.push(...matches);
            }
        });

        return results;
    }

    getRecentReports(limit: number = 10): ReportItem[] {
        const recentCategory = this.reports.find(item => item.id === 'recent-reports');
        return recentCategory?.children?.slice(0, limit) || [];
    }
}

export class ReportItem extends vscode.TreeItem {
    public children?: ReportItem[];

    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconName: string,
        children?: ReportItem[],
        public readonly tooltip?: string,
        public readonly createdDate?: Date,
        public readonly reportType?: string,
        public readonly schedule?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip || label;
        this.id = id;
        this.children = children;
    }
}