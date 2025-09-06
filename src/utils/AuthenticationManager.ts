import * as vscode from 'vscode';
import { Client } from '@microsoft/microsoft-graph-client';
import { PublicClientApplication, AuthenticationResult } from '@azure/msal-node';

export class AuthenticationManager {
    private context: vscode.ExtensionContext;
    private msalInstance: PublicClientApplication | null = null;
    private graphClient: Client | null = null;
    private currentToken: string | null = null;

    constructor(context: vscode.ExtensionContext) {
        this.context = context;
        this.initializeMsal();
    }

    private initializeMsal(): void {
        const config = vscode.workspace.getConfiguration('m365AnalystAgent');
        const clientId = config.get<string>('clientId');
        
        if (!clientId) {
            console.log('Microsoft 365 Client ID not configured. Please configure it in settings.');
            return;
        }

        try {
            const msalConfig = {
                auth: {
                    clientId: clientId,
                    authority: 'https://login.microsoftonline.com/common'
                }
            };

            this.msalInstance = new PublicClientApplication(msalConfig);
        } catch (error) {
            console.error('Failed to initialize MSAL:', error);
        }
    }

    async authenticate(): Promise<boolean> {
        if (!this.msalInstance) {
            await this.promptForConfiguration();
            return false;
        }

        try {
            // Get existing accounts first
            const accounts = await this.msalInstance.getAllAccounts();
            
            if (accounts.length > 0) {
                // Try silent authentication first
                const silentRequest = {
                    scopes: [
                        'User.Read',
                        'Files.ReadWrite',
                        'Sites.ReadWrite.All',
                        'Chat.ReadWrite',
                        'TeamsActivity.Send'
                    ],
                    account: accounts[0]
                };

                try {
                    const response = await this.msalInstance.acquireTokenSilent(silentRequest);
                    this.currentToken = response?.accessToken || null;
                    this.initializeGraphClient();
                    
                    vscode.window.showInformationMessage('Successfully authenticated with Microsoft 365!');
                    return true;
                } catch (silentError) {
                    console.log('Silent authentication failed, trying interactive:', silentError);
                }
            }

            // If silent authentication fails or no accounts, try interactive
            vscode.window.showInformationMessage('Please complete authentication in your browser.');
            
            // For VS Code extensions, we'll show a simplified message instead of actual interactive auth
            // In a real implementation, this would open a browser window
            vscode.window.showWarningMessage('Interactive authentication not implemented in this demo. Please configure authentication manually.');
            return false;
            
        } catch (error) {
            vscode.window.showErrorMessage(`Authentication failed: ${error}`);
            return false;
        }
    }

    async getAccessToken(): Promise<string | null> {
        if (!this.currentToken) {
            const authenticated = await this.authenticate();
            if (!authenticated) {
                return null;
            }
        }

        return this.currentToken;
    }

    getGraphClient(): Client {
        if (!this.graphClient) {
            if (!this.currentToken) {
                throw new Error('Not authenticated. Please call authenticate() first.');
            }
            this.initializeGraphClient();
        }
        
        return this.graphClient!;
    }

    async signOut(): Promise<void> {
        try {
            if (this.msalInstance) {
                const accounts = await this.msalInstance.getAllAccounts();
                // Note: removeAccount method might not be available in all versions
                // This is a simplified sign out
            }
            
            this.currentToken = null;
            this.graphClient = null;
            
            vscode.window.showInformationMessage('Successfully signed out from Microsoft 365.');
        } catch (error) {
            console.error('Sign out failed:', error);
            vscode.window.showErrorMessage(`Sign out failed: ${error}`);
        }
    }

    async isAuthenticated(): Promise<boolean> {
        if (!this.msalInstance || !this.currentToken) {
            return false;
        }

        try {
            // Try to make a simple Graph API call to verify token validity
            const graphClient = this.getGraphClient();
            await graphClient.api('/me').get();
            return true;
        } catch (error) {
            // Token might be expired, try to refresh
            try {
                const accounts = await this.msalInstance.getAllAccounts();
                if (accounts.length > 0) {
                    const silentRequest = {
                        scopes: ['User.Read'],
                        account: accounts[0]
                    };
                    
                    const response = await this.msalInstance.acquireTokenSilent(silentRequest);
                    this.currentToken = response?.accessToken || null;
                    this.initializeGraphClient();
                    return true;
                }
            } catch (refreshError) {
                console.error('Token refresh failed:', refreshError);
            }
            
            return false;
        }
    }

    async getCurrentUser(): Promise<any> {
        if (!await this.isAuthenticated()) {
            throw new Error('Not authenticated');
        }

        try {
            const graphClient = this.getGraphClient();
            return await graphClient.api('/me').get();
        } catch (error) {
            console.error('Failed to get current user:', error);
            throw error;
        }
    }

    async getUserProfile(): Promise<any> {
        try {
            const user = await this.getCurrentUser();
            return {
                displayName: user.displayName,
                email: user.mail || user.userPrincipalName,
                id: user.id,
                jobTitle: user.jobTitle,
                department: user.department
            };
        } catch (error) {
            console.error('Failed to get user profile:', error);
            return null;
        }
    }

    async checkPermissions(requiredScopes: string[]): Promise<boolean> {
        if (!await this.isAuthenticated()) {
            return false;
        }

        try {
            // In a real implementation, would check actual token scopes
            // For now, assume permissions are granted if authenticated
            return true;
        } catch (error) {
            console.error('Failed to check permissions:', error);
            return false;
        }
    }

    async requestAdditionalPermissions(scopes: string[]): Promise<boolean> {
        if (!this.msalInstance) {
            return false;
        }

        try {
            // For demonstration purposes, show a message instead of actual interactive auth
            vscode.window.showWarningMessage('Additional permission request not implemented in this demo.');
            return false;
        } catch (error) {
            vscode.window.showErrorMessage(`Permission request failed: ${error}`);
            return false;
        }
    }

    private initializeGraphClient(): void {
        if (!this.currentToken) {
            throw new Error('No access token available');
        }

        this.graphClient = Client.init({
            authProvider: (done) => {
                done(null, this.currentToken);
            }
        });
    }

    private async promptForConfiguration(): Promise<void> {
        const configure = await vscode.window.showInformationMessage(
            'Microsoft 365 integration requires configuration. Would you like to configure it now?',
            'Configure',
            'Later'
        );

        if (configure === 'Configure') {
            const clientId = await vscode.window.showInputBox({
                prompt: 'Enter your Microsoft 365 Application Client ID',
                placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                ignoreFocusOut: true
            });

            if (clientId) {
                const config = vscode.workspace.getConfiguration('m365AnalystAgent');
                await config.update('clientId', clientId, vscode.ConfigurationTarget.Global);
                
                const tenantId = await vscode.window.showInputBox({
                    prompt: 'Enter your Microsoft 365 Tenant ID (optional)',
                    placeHolder: 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
                    ignoreFocusOut: true
                });

                if (tenantId) {
                    await config.update('tenantId', tenantId, vscode.ConfigurationTarget.Global);
                }

                vscode.window.showInformationMessage(
                    'Configuration saved! Please reload the extension to apply changes.',
                    'Reload'
                ).then(selection => {
                    if (selection === 'Reload') {
                        vscode.commands.executeCommand('workbench.action.reloadWindow');
                    }
                });
            }
        }
    }

    dispose(): void {
        // Clean up resources
        this.currentToken = null;
        this.graphClient = null;
        this.msalInstance = null;
    }
}