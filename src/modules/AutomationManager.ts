import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export interface AutomationRule {
    id: string;
    name: string;
    trigger: 'schedule' | 'data-change' | 'threshold' | 'manual';
    action: 'report' | 'alert' | 'dashboard-update' | 'analysis';
    config: any;
    enabled: boolean;
    lastRun?: Date;
    nextRun?: Date;
}

export class AutomationManager {
    private context: vscode.ExtensionContext;
    private rules: Map<string, AutomationRule>;
    private timers: Map<string, NodeJS.Timeout>;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.rules = new Map();
        this.timers = new Map();
        this.loadRules();
        this.initializeScheduler();
    }

    async createAutomationRule(rule: Omit<AutomationRule, 'id'>): Promise<string> {
        const id = `rule-${Date.now()}`;
        const automationRule: AutomationRule = {
            id,
            ...rule
        };

        this.rules.set(id, automationRule);
        await this.saveRules();
        
        if (automationRule.enabled) {
            await this.scheduleRule(automationRule);
        }

        vscode.window.showInformationMessage(`Automation rule "${automationRule.name}" created successfully.`);
        return id;
    }

    async scheduleWeeklyReports(reportConfig: any): Promise<string> {
        return this.createAutomationRule({
            name: 'Weekly Analysis Report',
            trigger: 'schedule',
            action: 'report',
            config: {
                schedule: {
                    frequency: 'weekly',
                    dayOfWeek: 1, // Monday
                    time: '09:00'
                },
                reportType: 'executive-summary',
                recipients: reportConfig.recipients || [],
                dataSource: reportConfig.dataSource,
                includeCharts: true
            },
            enabled: true
        });
    }

    async setupDataChangeAlerts(dataSource: string, thresholds: any): Promise<string> {
        return this.createAutomationRule({
            name: `Data Alert - ${dataSource}`,
            trigger: 'data-change',
            action: 'alert',
            config: {
                dataSource,
                thresholds,
                alertMethods: ['email', 'teams'],
                recipients: thresholds.recipients || []
            },
            enabled: true
        });
    }

    async scheduleKPIDashboardUpdates(dashboardId: string, frequency: 'hourly' | 'daily' | 'weekly'): Promise<string> {
        return this.createAutomationRule({
            name: `Dashboard Update - ${dashboardId}`,
            trigger: 'schedule',
            action: 'dashboard-update',
            config: {
                dashboardId,
                schedule: {
                    frequency,
                    interval: frequency === 'hourly' ? 1 : frequency === 'daily' ? 24 : 168
                },
                refreshData: true,
                notifyOnCompletion: true
            },
            enabled: true
        });
    }

    async createAnomalyDetectionAlert(dataSource: string, columns: string[], sensitivity: 'low' | 'medium' | 'high'): Promise<string> {
        const thresholds = {
            low: 3.0,    // 3 standard deviations
            medium: 2.5, // 2.5 standard deviations
            high: 2.0    // 2 standard deviations
        };

        return this.createAutomationRule({
            name: `Anomaly Detection - ${dataSource}`,
            trigger: 'data-change',
            action: 'analysis',
            config: {
                dataSource,
                analysisType: 'anomaly-detection',
                columns,
                threshold: thresholds[sensitivity],
                alertOnAnomaly: true,
                includeVisualization: true
            },
            enabled: true
        });
    }

    async executeRule(ruleId: string): Promise<void> {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            throw new Error(`Rule ${ruleId} not found`);
        }

        try {
            vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: `Executing automation: ${rule.name}`,
                cancellable: false
            }, async (progress) => {
                progress.report({ increment: 0, message: "Starting..." });

                switch (rule.action) {
                    case 'report':
                        await this.executeReportGeneration(rule);
                        break;
                    case 'alert':
                        await this.executeAlert(rule);
                        break;
                    case 'dashboard-update':
                        await this.executeDashboardUpdate(rule);
                        break;
                    case 'analysis':
                        await this.executeAnalysis(rule);
                        break;
                }

                progress.report({ increment: 100, message: "Completed" });
                
                // Update last run time
                rule.lastRun = new Date();
                if (rule.trigger === 'schedule') {
                    rule.nextRun = this.calculateNextRun(rule.config.schedule);
                }
                
                await this.saveRules();
            });

            vscode.window.showInformationMessage(`Automation "${rule.name}" executed successfully.`);
        } catch (error) {
            vscode.window.showErrorMessage(`Automation failed: ${error}`);
            console.error(`Error executing rule ${ruleId}:`, error);
        }
    }

    async pauseRule(ruleId: string): Promise<void> {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            return;
        }

        rule.enabled = false;
        const timer = this.timers.get(ruleId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(ruleId);
        }

        await this.saveRules();
        vscode.window.showInformationMessage(`Automation rule "${rule.name}" paused.`);
    }

    async resumeRule(ruleId: string): Promise<void> {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            return;
        }

        rule.enabled = true;
        await this.scheduleRule(rule);
        await this.saveRules();
        vscode.window.showInformationMessage(`Automation rule "${rule.name}" resumed.`);
    }

    async deleteRule(ruleId: string): Promise<void> {
        const rule = this.rules.get(ruleId);
        if (!rule) {
            return;
        }

        // Clear any scheduled timers
        const timer = this.timers.get(ruleId);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(ruleId);
        }

        this.rules.delete(ruleId);
        await this.saveRules();
        vscode.window.showInformationMessage(`Automation rule "${rule.name}" deleted.`);
    }

    getRules(): AutomationRule[] {
        return Array.from(this.rules.values());
    }

    getRule(ruleId: string): AutomationRule | undefined {
        return this.rules.get(ruleId);
    }

    private async scheduleRule(rule: AutomationRule): Promise<void> {
        if (rule.trigger !== 'schedule' || !rule.config.schedule) {
            return;
        }

        // Clear existing timer if any
        const existingTimer = this.timers.get(rule.id);
        if (existingTimer) {
            clearTimeout(existingTimer);
        }

        // Calculate next run time
        const nextRun = this.calculateNextRun(rule.config.schedule);
        const delay = nextRun.getTime() - Date.now();

        if (delay > 0) {
            const timer = setTimeout(async () => {
                await this.executeRule(rule.id);
                // Reschedule for next occurrence
                if (rule.enabled) {
                    await this.scheduleRule(rule);
                }
            }, delay);

            this.timers.set(rule.id, timer);
            rule.nextRun = nextRun;
        }
    }

    private calculateNextRun(schedule: any): Date {
        const now = new Date();
        let nextRun = new Date(now);

        switch (schedule.frequency) {
            case 'hourly':
                nextRun.setHours(nextRun.getHours() + (schedule.interval || 1));
                break;
            case 'daily':
                nextRun.setDate(nextRun.getDate() + 1);
                if (schedule.time) {
                    const [hours, minutes] = schedule.time.split(':').map(Number);
                    nextRun.setHours(hours, minutes, 0, 0);
                }
                break;
            case 'weekly':
                const daysUntilTarget = (schedule.dayOfWeek - nextRun.getDay() + 7) % 7;
                nextRun.setDate(nextRun.getDate() + (daysUntilTarget || 7));
                if (schedule.time) {
                    const [hours, minutes] = schedule.time.split(':').map(Number);
                    nextRun.setHours(hours, minutes, 0, 0);
                }
                break;
        }

        return nextRun;
    }

    private async executeReportGeneration(rule: AutomationRule): Promise<void> {
        try {
            // Load data from configured source
            const data = await this.loadDataSource(rule.config.dataSource);
            
            // Generate report based on type
            const report = await this.generateAutomatedReport(data, rule.config.reportType);
            
            // Save report
            const reportPath = await this.saveReport(report, rule.name);
            
            // Send to recipients if configured
            if (rule.config.recipients && rule.config.recipients.length > 0) {
                await this.sendReportToRecipients(reportPath, rule.config.recipients);
            }
            
            console.log(`Report generated: ${reportPath}`);
        } catch (error) {
            console.error('Failed to execute report generation:', error);
            throw error;
        }
    }

    private async executeAlert(rule: AutomationRule): Promise<void> {
        try {
            // Check data against thresholds
            const data = await this.loadDataSource(rule.config.dataSource);
            const alerts = await this.checkThresholds(data, rule.config.thresholds);
            
            if (alerts.length > 0) {
                // Send alerts
                for (const alertMethod of rule.config.alertMethods) {
                    await this.sendAlert(alerts, alertMethod, rule.config.recipients);
                }
            }
        } catch (error) {
            console.error('Failed to execute alert:', error);
            throw error;
        }
    }

    private async executeDashboardUpdate(rule: AutomationRule): Promise<void> {
        try {
            // Refresh dashboard data
            console.log(`Updating dashboard: ${rule.config.dashboardId}`);
            
            // In a real implementation, this would update the dashboard
            if (rule.config.notifyOnCompletion) {
                vscode.window.showInformationMessage(`Dashboard ${rule.config.dashboardId} updated successfully.`);
            }
        } catch (error) {
            console.error('Failed to execute dashboard update:', error);
            throw error;
        }
    }

    private async executeAnalysis(rule: AutomationRule): Promise<void> {
        try {
            const data = await this.loadDataSource(rule.config.dataSource);
            
            switch (rule.config.analysisType) {
                case 'anomaly-detection':
                    const anomalies = await this.detectAnomalies(data, rule.config);
                    if (anomalies.length > 0 && rule.config.alertOnAnomaly) {
                        await this.sendAnomalyAlert(anomalies, rule.config);
                    }
                    break;
                default:
                    console.log(`Unknown analysis type: ${rule.config.analysisType}`);
            }
        } catch (error) {
            console.error('Failed to execute analysis:', error);
            throw error;
        }
    }

    private async loadDataSource(dataSourceConfig: any): Promise<any[]> {
        // Simplified data loading - in real implementation would connect to actual sources
        return [
            { id: 1, value: 100, timestamp: new Date() },
            { id: 2, value: 150, timestamp: new Date() },
            { id: 3, value: 75, timestamp: new Date() }
        ];
    }

    private async generateAutomatedReport(data: any[], reportType: string): Promise<any> {
        return {
            type: reportType,
            generated: new Date(),
            data: data,
            summary: `Report with ${data.length} records`
        };
    }

    private async saveReport(report: any, ruleName: string): Promise<string> {
        const reportDir = path.join(this.context.extensionPath, 'reports');
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        const fileName = `${ruleName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.json`;
        const filePath = path.join(reportDir, fileName);
        
        fs.writeFileSync(filePath, JSON.stringify(report, null, 2));
        return filePath;
    }

    private async sendReportToRecipients(reportPath: string, recipients: string[]): Promise<void> {
        // In a real implementation, would send via email or Teams
        console.log(`Sending report ${reportPath} to:`, recipients);
    }

    private async checkThresholds(data: any[], thresholds: any): Promise<any[]> {
        const alerts: any[] = [];
        
        // Simplified threshold checking
        for (const item of data) {
            if (item.value > thresholds.max) {
                alerts.push({
                    type: 'threshold-exceeded',
                    item,
                    threshold: thresholds.max,
                    message: `Value ${item.value} exceeds maximum threshold ${thresholds.max}`
                });
            }
        }
        
        return alerts;
    }

    private async sendAlert(alerts: any[], method: string, recipients: string[]): Promise<void> {
        console.log(`Sending ${alerts.length} alerts via ${method} to:`, recipients);
    }

    private async detectAnomalies(data: any[], config: any): Promise<any[]> {
        // Simplified anomaly detection
        const anomalies: any[] = [];
        
        for (const column of config.columns) {
            const values = data.map(row => parseFloat(row[column])).filter(v => !isNaN(v));
            if (values.length === 0) continue;

            const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
            const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            
            data.forEach((row, index) => {
                const value = parseFloat(row[column]);
                if (!isNaN(value) && Math.abs(value - mean) > config.threshold * stdDev) {
                    anomalies.push({
                        column,
                        index,
                        value,
                        deviation: Math.abs(value - mean) / stdDev,
                        row
                    });
                }
            });
        }
        
        return anomalies;
    }

    private async sendAnomalyAlert(anomalies: any[], config: any): Promise<void> {
        console.log(`Detected ${anomalies.length} anomalies in data`);
        vscode.window.showWarningMessage(`Anomaly detected! Found ${anomalies.length} unusual data points.`);
    }

    private initializeScheduler(): void {
        // Restore scheduled rules on startup
        for (const rule of this.rules.values()) {
            if (rule.enabled && rule.trigger === 'schedule') {
                this.scheduleRule(rule);
            }
        }
    }

    private loadRules(): void {
        try {
            const rulesPath = path.join(this.context.globalStoragePath, 'automation-rules.json');
            if (fs.existsSync(rulesPath)) {
                const rulesData = JSON.parse(fs.readFileSync(rulesPath, 'utf-8'));
                for (const rule of rulesData) {
                    this.rules.set(rule.id, rule);
                }
            }
        } catch (error) {
            console.error('Failed to load automation rules:', error);
        }
    }

    private async saveRules(): Promise<void> {
        try {
            const rulesPath = path.join(this.context.globalStoragePath, 'automation-rules.json');
            const rulesDir = path.dirname(rulesPath);
            
            if (!fs.existsSync(rulesDir)) {
                fs.mkdirSync(rulesDir, { recursive: true });
            }
            
            const rulesData = Array.from(this.rules.values());
            fs.writeFileSync(rulesPath, JSON.stringify(rulesData, null, 2));
        } catch (error) {
            console.error('Failed to save automation rules:', error);
        }
    }

    dispose(): void {
        // Clear all timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
    }
}