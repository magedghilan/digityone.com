import * as vscode from 'vscode';
import { AnalystAgent } from './core/AnalystAgent';
import { DataSourceProvider } from './views/DataSourceProvider';
import { InsightsProvider } from './views/InsightsProvider';
import { ReportsProvider } from './views/ReportsProvider';

let analystAgent: AnalystAgent;

export function activate(context: vscode.ExtensionContext) {
    console.log('Microsoft 365 Analyst Agent is now active!');
    
    // Initialize the main Analyst Agent
    analystAgent = new AnalystAgent(context);
    
    // Set context for when the extension is activated
    vscode.commands.executeCommand('setContext', 'm365AnalystAgent.activated', true);
    
    // Register tree data providers
    const dataSourceProvider = new DataSourceProvider(analystAgent);
    const insightsProvider = new InsightsProvider(analystAgent);
    const reportsProvider = new ReportsProvider(analystAgent);
    
    vscode.window.createTreeView('m365AnalystDataSources', {
        treeDataProvider: dataSourceProvider,
        showCollapseAll: true
    });
    
    vscode.window.createTreeView('m365AnalystInsights', {
        treeDataProvider: insightsProvider,
        showCollapseAll: true
    });
    
    vscode.window.createTreeView('m365AnalystReports', {
        treeDataProvider: reportsProvider,
        showCollapseAll: true
    });
    
    // Register commands
    const commands = [
        vscode.commands.registerCommand('m365AnalystAgent.analyzeData', async () => {
            await analystAgent.analyzeData();
        }),
        
        vscode.commands.registerCommand('m365AnalystAgent.importData', async () => {
            await analystAgent.importData();
        }),
        
        vscode.commands.registerCommand('m365AnalystAgent.createDashboard', async () => {
            await analystAgent.createDashboard();
        }),
        
        vscode.commands.registerCommand('m365AnalystAgent.generateReport', async () => {
            await analystAgent.generateReport();
        }),
        
        vscode.commands.registerCommand('m365AnalystAgent.openAnalystPanel', async () => {
            await analystAgent.openAnalystPanel();
        })
    ];
    
    // Add all commands to context subscriptions
    commands.forEach(command => context.subscriptions.push(command));
    
    // Show welcome message
    vscode.window.showInformationMessage(
        'Microsoft 365 Analyst Agent is ready! Use commands from the Command Palette or the Activity Bar.',
        'Open Panel'
    ).then(selection => {
        if (selection === 'Open Panel') {
            vscode.commands.executeCommand('m365AnalystAgent.openAnalystPanel');
        }
    });
}

export function deactivate() {
    console.log('Microsoft 365 Analyst Agent is now deactivated.');
    if (analystAgent) {
        analystAgent.dispose();
    }
}