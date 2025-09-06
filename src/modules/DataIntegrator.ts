import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import * as XLSX from 'xlsx';
import { AuthenticationManager } from '../utils/AuthenticationManager';

export class DataIntegrator {
    private authManager: AuthenticationManager;

    constructor(authManager: AuthenticationManager) {
        this.authManager = authManager;
    }

    async parseData(content: string, fileName: string): Promise<any> {
        const extension = path.extname(fileName).toLowerCase();
        
        try {
            switch (extension) {
                case '.json':
                    return JSON.parse(content);
                case '.csv':
                    return this.parseCsvContent(content);
                case '.xlsx':
                case '.xls':
                    return this.parseExcelContent(content);
                default:
                    // Try to parse as JSON first, then CSV
                    try {
                        return JSON.parse(content);
                    } catch {
                        return this.parseCsvContent(content);
                    }
            }
        } catch (error) {
            throw new Error(`Failed to parse data: ${error}`);
        }
    }

    private parseCsvContent(content: string): Promise<any[]> {
        return new Promise((resolve, reject) => {
            const results: any[] = [];
            const lines = content.split('\n');
            
            if (lines.length === 0) {
                reject(new Error('Empty CSV content'));
                return;
            }
            
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            
            for (let i = 1; i < lines.length; i++) {
                const line = lines[i].trim();
                if (line) {
                    const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                    const row: any = {};
                    
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    
                    results.push(row);
                }
            }
            
            resolve(results);
        });
    }

    private parseExcelContent(filePath: string): any[] {
        try {
            const workbook = XLSX.readFile(filePath);
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            return XLSX.utils.sheet_to_json(worksheet);
        } catch (error) {
            throw new Error(`Failed to parse Excel file: ${error}`);
        }
    }

    async importFromExcelOnline(): Promise<any> {
        try {
            const token = await this.authManager.getAccessToken();
            if (!token) {
                throw new Error('Authentication required for Excel Online access');
            }

            // Show file picker for Excel files in OneDrive/SharePoint
            const fileId = await this.showExcelFilePicker();
            if (!fileId) {
                return null;
            }

            // Use Microsoft Graph API to get Excel data
            const graphClient = this.authManager.getGraphClient();
            const workbook = await graphClient.api(`/me/drive/items/${fileId}/workbook`).get();
            const worksheets = await graphClient.api(`/me/drive/items/${fileId}/workbook/worksheets`).get();
            
            if (worksheets.value.length > 0) {
                const worksheet = worksheets.value[0];
                const range = await graphClient.api(`/me/drive/items/${fileId}/workbook/worksheets/${worksheet.id}/usedRange`).get();
                
                return this.processExcelRange(range);
            }

            return null;
        } catch (error) {
            throw new Error(`Excel Online import failed: ${error}`);
        }
    }

    async importFromSharePoint(): Promise<any> {
        try {
            const token = await this.authManager.getAccessToken();
            if (!token) {
                throw new Error('Authentication required for SharePoint access');
            }

            const siteUrl = await vscode.window.showInputBox({
                prompt: 'Enter SharePoint site URL',
                placeHolder: 'https://contoso.sharepoint.com/sites/sitename'
            });

            if (!siteUrl) {
                return null;
            }

            const listName = await vscode.window.showInputBox({
                prompt: 'Enter SharePoint list name',
                placeHolder: 'MyList'
            });

            if (!listName) {
                return null;
            }

            const graphClient = this.authManager.getGraphClient();
            const site = await graphClient.api(`/sites/${this.extractSiteId(siteUrl)}`).get();
            const lists = await graphClient.api(`/sites/${site.id}/lists`).get();
            
            const targetList = lists.value.find((list: any) => 
                list.displayName.toLowerCase() === listName.toLowerCase()
            );

            if (!targetList) {
                throw new Error(`List '${listName}' not found`);
            }

            const items = await graphClient.api(`/sites/${site.id}/lists/${targetList.id}/items?expand=fields`).get();
            
            return items.value.map((item: any) => item.fields);
        } catch (error) {
            throw new Error(`SharePoint import failed: ${error}`);
        }
    }

    async importFromOneDrive(): Promise<any> {
        try {
            const token = await this.authManager.getAccessToken();
            if (!token) {
                throw new Error('Authentication required for OneDrive access');
            }

            const graphClient = this.authManager.getGraphClient();
            const files = await graphClient.api('/me/drive/root/children').get();
            
            const dataFiles = files.value.filter((file: any) => 
                file.name.match(/\.(csv|xlsx|json)$/i)
            );

            if (dataFiles.length === 0) {
                throw new Error('No data files found in OneDrive root');
            }

            const selectedFile = await vscode.window.showQuickPick(
                dataFiles.map((file: any) => ({
                    label: file.name,
                    description: `Size: ${file.size} bytes`,
                    detail: file.id
                })),
                { placeHolder: 'Select a file from OneDrive' }
            ) as any;

            if (!selectedFile) {
                return null;
            }

            const fileContent = await graphClient.api(`/me/drive/items/${selectedFile.detail}/content`).get();
            
            return this.parseData(fileContent, selectedFile.label);
        } catch (error) {
            throw new Error(`OneDrive import failed: ${error}`);
        }
    }

    async importFromTeams(): Promise<any> {
        try {
            vscode.window.showInformationMessage('Teams integration requires additional setup. Please configure Teams app permissions.');
            
            // Placeholder for Teams data import
            // This would require Teams app manifest and additional permissions
            return {
                message: 'Teams integration placeholder',
                data: []
            };
        } catch (error) {
            throw new Error(`Teams import failed: ${error}`);
        }
    }

    async importFromLocalFile(): Promise<any> {
        try {
            const fileUri = await vscode.window.showOpenDialog({
                filters: {
                    'Data Files': ['csv', 'xlsx', 'xls', 'json', 'tsv'],
                    'CSV Files': ['csv'],
                    'Excel Files': ['xlsx', 'xls'],
                    'JSON Files': ['json'],
                    'All Files': ['*']
                },
                canSelectMany: false
            });

            if (!fileUri || fileUri.length === 0) {
                return null;
            }

            const filePath = fileUri[0].fsPath;
            const content = fs.readFileSync(filePath, 'utf-8');
            
            return this.parseData(content, filePath);
        } catch (error) {
            throw new Error(`Local file import failed: ${error}`);
        }
    }

    async importFromDatabase(): Promise<any> {
        try {
            const connectionString = await vscode.window.showInputBox({
                prompt: 'Enter database connection string (placeholder)',
                placeHolder: 'Server=localhost;Database=mydb;...'
            });

            if (!connectionString) {
                return null;
            }

            // Placeholder for database connectivity
            // Would require additional dependencies like tedious for SQL Server, mysql2 for MySQL, etc.
            vscode.window.showInformationMessage('Database connectivity requires additional setup and drivers.');
            
            return {
                message: 'Database import placeholder',
                connectionString: connectionString,
                data: []
            };
        } catch (error) {
            throw new Error(`Database import failed: ${error}`);
        }
    }

    async cleanData(data: any[]): Promise<any[]> {
        if (!Array.isArray(data)) {
            throw new Error('Data must be an array');
        }

        return data.map(row => {
            const cleanedRow: any = {};
            
            Object.keys(row).forEach(key => {
                let value = row[key];
                
                // Remove extra whitespace
                if (typeof value === 'string') {
                    value = value.trim();
                }
                
                // Handle empty strings and nulls
                if (value === '' || value === null || value === undefined) {
                    value = null;
                }
                
                // Try to convert numeric strings to numbers
                if (typeof value === 'string' && !isNaN(Number(value)) && value !== '') {
                    value = Number(value);
                }
                
                cleanedRow[key] = value;
            });
            
            return cleanedRow;
        }).filter(row => {
            // Remove rows that are completely empty
            return Object.values(row).some(value => value !== null && value !== '');
        });
    }

    private async showExcelFilePicker(): Promise<string | null> {
        // Simplified file picker - in real implementation, would show OneDrive/SharePoint files
        const fileId = await vscode.window.showInputBox({
            prompt: 'Enter Excel file ID from OneDrive/SharePoint',
            placeHolder: 'File ID (for demo purposes)'
        });
        
        return fileId || null;
    }

    private extractSiteId(siteUrl: string): string {
        // Extract site identifier from SharePoint URL
        // This is a simplified version
        const match = siteUrl.match(/\/sites\/([^\/]+)/);
        return match ? match[1] : '';
    }

    private processExcelRange(range: any): any[] {
        if (!range || !range.values) {
            return [];
        }

        const [headers, ...rows] = range.values;
        
        return rows.map((row: any[]) => {
            const rowData: any = {};
            headers.forEach((header: string, index: number) => {
                rowData[header] = row[index];
            });
            return rowData;
        });
    }
}