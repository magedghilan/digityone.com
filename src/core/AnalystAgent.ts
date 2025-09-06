import * as vscode from 'vscode';
import { DataIntegrator } from '../modules/DataIntegrator';
import { AnalysisEngine } from '../modules/AnalysisEngine';
import { VisualizationEngine } from '../modules/VisualizationEngine';
import { CollaborationManager } from '../modules/CollaborationManager';
import { AutomationManager } from '../modules/AutomationManager';
import { AuthenticationManager } from '../utils/AuthenticationManager';

export class AnalystAgent {
    private context: vscode.ExtensionContext;
    private authManager!: AuthenticationManager;
    private dataIntegrator!: DataIntegrator;
    private analysisEngine!: AnalysisEngine;
    private visualizationEngine!: VisualizationEngine;
    private collaborationManager!: CollaborationManager;
    private automationManager!: AutomationManager;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.initializeComponents();
    }

    private initializeComponents() {
        this.authManager = new AuthenticationManager(this.context);
        this.dataIntegrator = new DataIntegrator(this.authManager);
        this.analysisEngine = new AnalysisEngine();
        this.visualizationEngine = new VisualizationEngine();
        this.collaborationManager = new CollaborationManager(this.authManager);
        this.automationManager = new AutomationManager(this.context);
    }

    async analyzeData(): Promise<void> {
        try {
            const activeEditor = vscode.window.activeTextEditor;
            if (!activeEditor) {
                const choice = await vscode.window.showInformationMessage(
                    'No data file is currently open. Would you like to import data first?',
                    'Import Data', 'Select File'
                );
                
                if (choice === 'Import Data') {
                    await this.importData();
                    return;
                } else if (choice === 'Select File') {
                    const fileUri = await vscode.window.showOpenDialog({
                        filters: {
                            'Data Files': ['csv', 'xlsx', 'json', 'tsv'],
                            'All Files': ['*']
                        }
                    });
                    if (fileUri && fileUri[0]) {
                        const document = await vscode.workspace.openTextDocument(fileUri[0]);
                        await vscode.window.showTextDocument(document);
                    }
                }
                return;
            }

            const text = activeEditor.document.getText();
            const fileName = activeEditor.document.fileName;
            
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Analyzing Data",
                cancellable: true
            }, async (progress, token) => {
                progress.report({ increment: 0, message: "Parsing data..." });
                
                const data = await this.dataIntegrator.parseData(text, fileName);
                if (!data) {
                    throw new Error('Unable to parse data from current file');
                }

                progress.report({ increment: 30, message: "Performing analysis..." });
                
                const insights = await this.analysisEngine.generateInsights(data);
                
                progress.report({ increment: 70, message: "Creating visualizations..." });
                
                const visualizations = await this.visualizationEngine.createVisualizations(data, insights);
                
                progress.report({ increment: 100, message: "Complete!" });
                
                // Show results
                await this.showAnalysisResults(insights, visualizations);
            });

        } catch (error) {
            vscode.window.showErrorMessage(`Analysis failed: ${error}`);
        }
    }

    async importData(): Promise<void> {
        const choices = [
            'Excel Online',
            'SharePoint List',
            'OneDrive File',
            'Teams Data',
            'Local File',
            'Database Connection'
        ];

        const choice = await vscode.window.showQuickPick(choices, {
            placeHolder: 'Select data source to import from'
        });

        if (!choice) {
            return;
        }

        try {
            let data: any;
            
            switch (choice) {
                case 'Excel Online':
                    data = await this.dataIntegrator.importFromExcelOnline();
                    break;
                case 'SharePoint List':
                    data = await this.dataIntegrator.importFromSharePoint();
                    break;
                case 'OneDrive File':
                    data = await this.dataIntegrator.importFromOneDrive();
                    break;
                case 'Teams Data':
                    data = await this.dataIntegrator.importFromTeams();
                    break;
                case 'Local File':
                    data = await this.dataIntegrator.importFromLocalFile();
                    break;
                case 'Database Connection':
                    data = await this.dataIntegrator.importFromDatabase();
                    break;
            }

            if (data) {
                await this.displayImportedData(data);
                vscode.window.showInformationMessage('Data imported successfully!');
            }

        } catch (error) {
            vscode.window.showErrorMessage(`Import failed: ${error}`);
        }
    }

    async createDashboard(): Promise<void> {
        try {
            const dashboardConfig = await this.promptForDashboardConfig();
            if (!dashboardConfig) {
                return;
            }

            const dashboard = await this.visualizationEngine.createDashboard(dashboardConfig);
            await this.displayDashboard(dashboard);
            
            vscode.window.showInformationMessage('Dashboard created successfully!');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Dashboard creation failed: ${error}`);
        }
    }

    async generateReport(): Promise<void> {
        try {
            const reportType = await vscode.window.showQuickPick([
                'Executive Summary',
                'Detailed Analysis',
                'Trend Report',
                'Comparison Report',
                'Custom Report'
            ], {
                placeHolder: 'Select report type'
            });

            if (!reportType) {
                return;
            }

            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: "Generating Report",
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Collecting data..." });
                
                const reportData = await this.collectReportData();
                
                progress.report({ increment: 40, message: "Analyzing patterns..." });
                
                const analysis = await this.analysisEngine.generateReportAnalysis(reportData, reportType);
                
                progress.report({ increment: 70, message: "Creating visualizations..." });
                
                const visuals = await this.visualizationEngine.createReportVisuals(analysis);
                
                progress.report({ increment: 90, message: "Formatting report..." });
                
                const report = await this.formatReport(reportType, analysis, visuals);
                
                progress.report({ increment: 100, message: "Complete!" });
                
                await this.displayReport(report);
            });

            vscode.window.showInformationMessage('Report generated successfully!');
            
        } catch (error) {
            vscode.window.showErrorMessage(`Report generation failed: ${error}`);
        }
    }

    async openAnalystPanel(): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'analystPanel',
            'Microsoft 365 Analyst Agent',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        panel.webview.html = this.getAnalystPanelContent();
        
        // Handle messages from the webview
        panel.webview.onDidReceiveMessage(
            async message => {
                switch (message.command) {
                    case 'analyze':
                        await this.analyzeData();
                        break;
                    case 'import':
                        await this.importData();
                        break;
                    case 'dashboard':
                        await this.createDashboard();
                        break;
                    case 'report':
                        await this.generateReport();
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );
    }

    private async showAnalysisResults(insights: any, visualizations: any): Promise<void> {
        // Implementation for showing analysis results
        const resultsPanel = vscode.window.createWebviewPanel(
            'analysisResults',
            'Analysis Results',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );
        
        resultsPanel.webview.html = this.getAnalysisResultsHtml(insights, visualizations);
    }

    private async displayImportedData(data: any): Promise<void> {
        // Create a new document with the imported data
        const document = await vscode.workspace.openTextDocument({
            content: JSON.stringify(data, null, 2),
            language: 'json'
        });
        await vscode.window.showTextDocument(document);
    }

    private async displayDashboard(dashboard: any): Promise<void> {
        const panel = vscode.window.createWebviewPanel(
            'dashboard',
            'Dashboard',
            vscode.ViewColumn.Two,
            { enableScripts: true }
        );
        
        panel.webview.html = this.getDashboardHtml(dashboard);
    }

    private async displayReport(report: any): Promise<void> {
        const document = await vscode.workspace.openTextDocument({
            content: report.content,
            language: 'markdown'
        });
        await vscode.window.showTextDocument(document);
    }

    private async promptForDashboardConfig(): Promise<any> {
        // Simplified dashboard configuration
        return {
            title: await vscode.window.showInputBox({ prompt: 'Dashboard title' }),
            charts: ['line', 'bar', 'pie']
        };
    }

    private async collectReportData(): Promise<any> {
        // Collect data for report generation
        return { sampleData: 'placeholder' };
    }

    private async formatReport(type: string, analysis: any, visuals: any): Promise<any> {
        return {
            content: `# ${type}\n\n${JSON.stringify(analysis, null, 2)}`
        };
    }

    private getAnalystPanelContent(): string {
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Microsoft 365 Analyst Agent</title>
            <style>
                body { font-family: var(--vscode-font-family); padding: 20px; }
                .action-button { 
                    margin: 10px; 
                    padding: 10px 20px; 
                    background: var(--vscode-button-background); 
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                }
                .capability-section { margin: 20px 0; padding: 15px; border: 1px solid var(--vscode-panel-border); }
            </style>
        </head>
        <body>
            <h1>Microsoft 365 Analyst Agent</h1>
            
            <div class="capability-section">
                <h2>Data Integration & Cleaning</h2>
                <button class="action-button" onclick="sendMessage('import')">Import Data from Microsoft 365</button>
            </div>
            
            <div class="capability-section">
                <h2>Advanced Analysis & Insights</h2>
                <button class="action-button" onclick="sendMessage('analyze')">Analyze Current Data</button>
            </div>
            
            <div class="capability-section">
                <h2>Visual Storytelling</h2>
                <button class="action-button" onclick="sendMessage('dashboard')">Create Dashboard</button>
            </div>
            
            <div class="capability-section">
                <h2>Reporting</h2>
                <button class="action-button" onclick="sendMessage('report')">Generate Report</button>
            </div>
            
            <script>
                const vscode = acquireVsCodeApi();
                function sendMessage(command) {
                    vscode.postMessage({ command: command });
                }
            </script>
        </body>
        </html>
        `;
    }

    private getAnalysisResultsHtml(insights: any, visualizations: any): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Analysis Results</title>
        </head>
        <body>
            <h1>Analysis Results</h1>
            <div>
                <h2>Insights</h2>
                <pre>${JSON.stringify(insights, null, 2)}</pre>
            </div>
            <div>
                <h2>Visualizations</h2>
                <pre>${JSON.stringify(visualizations, null, 2)}</pre>
            </div>
        </body>
        </html>
        `;
    }

    private getDashboardHtml(dashboard: any): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <title>Dashboard</title>
        </head>
        <body>
            <h1>${dashboard.title || 'Dashboard'}</h1>
            <div>Dashboard content will be rendered here</div>
        </body>
        </html>
        `;
    }

    dispose(): void {
        // Clean up resources
        this.authManager?.dispose();
        this.automationManager?.dispose();
    }
}