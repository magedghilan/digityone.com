import * as vscode from 'vscode';
import { AnalystAgent } from '../core/AnalystAgent';

export class DataSourceProvider implements vscode.TreeDataProvider<DataSourceItem> {
    private _onDidChangeTreeData: vscode.EventEmitter<DataSourceItem | undefined | null | void> = new vscode.EventEmitter<DataSourceItem | undefined | null | void>();
    readonly onDidChangeTreeData: vscode.Event<DataSourceItem | undefined | null | void> = this._onDidChangeTreeData.event;

    private dataSources: DataSourceItem[] = [];

    constructor(private analystAgent: AnalystAgent) {
        this.initializeDataSources();
    }

    private initializeDataSources(): void {
        this.dataSources = [
            new DataSourceItem(
                'Microsoft 365',
                'microsoft365',
                vscode.TreeItemCollapsibleState.Expanded,
                'cloud',
                [
                    new DataSourceItem('Excel Online', 'excel-online', vscode.TreeItemCollapsibleState.None, 'file-excel'),
                    new DataSourceItem('SharePoint Lists', 'sharepoint', vscode.TreeItemCollapsibleState.None, 'list-tree'),
                    new DataSourceItem('OneDrive Files', 'onedrive', vscode.TreeItemCollapsibleState.None, 'cloud-download'),
                    new DataSourceItem('Teams Data', 'teams', vscode.TreeItemCollapsibleState.None, 'organization')
                ]
            ),
            new DataSourceItem(
                'Local Sources',
                'local',
                vscode.TreeItemCollapsibleState.Expanded,
                'file',
                [
                    new DataSourceItem('CSV Files', 'csv', vscode.TreeItemCollapsibleState.None, 'file-code'),
                    new DataSourceItem('Excel Files', 'xlsx', vscode.TreeItemCollapsibleState.None, 'file-excel'),
                    new DataSourceItem('JSON Files', 'json', vscode.TreeItemCollapsibleState.None, 'json')
                ]
            ),
            new DataSourceItem(
                'External Sources',
                'external',
                vscode.TreeItemCollapsibleState.Collapsed,
                'database',
                [
                    new DataSourceItem('SQL Database', 'sql', vscode.TreeItemCollapsibleState.None, 'database'),
                    new DataSourceItem('REST API', 'api', vscode.TreeItemCollapsibleState.None, 'globe'),
                    new DataSourceItem('Other Systems', 'other', vscode.TreeItemCollapsibleState.None, 'plug')
                ]
            )
        ];
    }

    refresh(): void {
        this._onDidChangeTreeData.fire();
    }

    getTreeItem(element: DataSourceItem): vscode.TreeItem {
        const item = new vscode.TreeItem(element.label, element.collapsibleState);
        item.id = element.id;
        item.tooltip = element.tooltip || element.label;
        item.iconPath = new vscode.ThemeIcon(element.iconName);
        
        if (element.collapsibleState === vscode.TreeItemCollapsibleState.None) {
            item.command = {
                command: 'm365AnalystAgent.importFromSource',
                title: 'Import Data',
                arguments: [element.id]
            };
        }

        return item;
    }

    getChildren(element?: DataSourceItem): Thenable<DataSourceItem[]> {
        if (!element) {
            return Promise.resolve(this.dataSources);
        }
        
        return Promise.resolve(element.children || []);
    }

    addDataSource(source: DataSourceItem): void {
        this.dataSources.push(source);
        this.refresh();
    }

    removeDataSource(id: string): void {
        this.dataSources = this.dataSources.filter(source => source.id !== id);
        this.refresh();
    }
}

export class DataSourceItem extends vscode.TreeItem {
    public children?: DataSourceItem[];

    constructor(
        public readonly label: string,
        public readonly id: string,
        public readonly collapsibleState: vscode.TreeItemCollapsibleState,
        public readonly iconName: string,
        children?: DataSourceItem[],
        public readonly tooltip?: string
    ) {
        super(label, collapsibleState);
        this.tooltip = tooltip || label;
        this.id = id;
        this.children = children;
    }
}