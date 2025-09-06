import { AuthenticationManager } from '../utils/AuthenticationManager';

export interface CollaborationSession {
    id: string;
    title: string;
    participants: string[];
    data: any;
    createdAt: Date;
    lastModified: Date;
}

export class CollaborationManager {
    private authManager: AuthenticationManager;
    private activeSessions: Map<string, CollaborationSession>;

    constructor(authManager: AuthenticationManager) {
        this.authManager = authManager;
        this.activeSessions = new Map();
    }

    async shareInsightsToTeams(insights: any[], channelId?: string): Promise<boolean> {
        try {
            const token = await this.authManager.getAccessToken();
            if (!token) {
                throw new Error('Authentication required for Teams integration');
            }

            const graphClient = this.authManager.getGraphClient();
            
            // Create adaptive card with insights
            const adaptiveCard = this.createInsightsCard(insights);
            
            const message = {
                body: {
                    contentType: 'application/vnd.microsoft.card.adaptive',
                    content: JSON.stringify(adaptiveCard)
                }
            };

            if (channelId) {
                // Send to specific channel
                await graphClient.api(`/teams/${channelId}/channels/general/messages`).post(message);
            } else {
                // Send to default chat or channel
                // This would require user to select a channel/chat
                const selectedChannel = await this.selectTeamsChannel();
                if (selectedChannel) {
                    await graphClient.api(`/teams/${selectedChannel}/channels/general/messages`).post(message);
                }
            }

            return true;
        } catch (error) {
            console.error('Failed to share insights to Teams:', error);
            throw error;
        }
    }

    async createCollaborationSession(title: string, data: any): Promise<CollaborationSession> {
        const session: CollaborationSession = {
            id: `session-${Date.now()}`,
            title,
            participants: [await this.getCurrentUser()],
            data,
            createdAt: new Date(),
            lastModified: new Date()
        };

        this.activeSessions.set(session.id, session);
        
        // In a real implementation, this would sync with SharePoint or Teams
        await this.saveSessionToSharePoint(session);
        
        return session;
    }

    async inviteToSession(sessionId: string, userEmails: string[]): Promise<boolean> {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // Send invitation emails or Teams notifications
            for (const email of userEmails) {
                await this.sendCollaborationInvite(email, session);
            }

            // Update participant list
            session.participants.push(...userEmails);
            session.lastModified = new Date();
            
            await this.saveSessionToSharePoint(session);
            
            return true;
        } catch (error) {
            console.error('Failed to invite users to session:', error);
            return false;
        }
    }

    async shareVisualizationsToPowerPoint(visualizations: any[], templateId?: string): Promise<string> {
        try {
            const token = await this.authManager.getAccessToken();
            if (!token) {
                throw new Error('Authentication required for PowerPoint integration');
            }

            const graphClient = this.authManager.getGraphClient();
            
            // Create new PowerPoint presentation
            const presentation = await this.createPowerPointPresentation(visualizations, templateId);
            
            // Save to OneDrive/SharePoint
            const file = await graphClient
                .api('/me/drive/root:/Analyst Reports/Analysis Report.pptx:/content')
                .put(presentation);

            return file.webUrl;
        } catch (error) {
            console.error('Failed to create PowerPoint presentation:', error);
            throw error;
        }
    }

    async enableRealTimeCollaboration(sessionId: string): Promise<void> {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // In a real implementation, this would set up SignalR or similar for real-time updates
            console.log(`Real-time collaboration enabled for session: ${sessionId}`);
            
            // Set up change notifications
            await this.setupChangeNotifications(sessionId);
            
        } catch (error) {
            console.error('Failed to enable real-time collaboration:', error);
            throw error;
        }
    }

    async shareDatasetWithPermissions(datasetId: string, userEmails: string[], permissions: 'read' | 'write' | 'admin'): Promise<boolean> {
        try {
            const token = await this.authManager.getAccessToken();
            if (!token) {
                throw new Error('Authentication required');
            }

            const graphClient = this.authManager.getGraphClient();
            
            // Share dataset with specified permissions
            for (const email of userEmails) {
                const invitation = {
                    recipients: [{ email }],
                    message: 'You have been granted access to a dataset for analysis.',
                    requireSignIn: true,
                    sendInvitation: true,
                    roles: [permissions]
                };

                await graphClient
                    .api(`/me/drive/items/${datasetId}/invite`)
                    .post(invitation);
            }

            return true;
        } catch (error) {
            console.error('Failed to share dataset:', error);
            return false;
        }
    }

    async getCollaborationHistory(sessionId: string): Promise<any[]> {
        try {
            // In a real implementation, this would fetch from SharePoint or database
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            return [
                {
                    timestamp: session.createdAt,
                    user: session.participants[0],
                    action: 'Created session',
                    details: session.title
                },
                {
                    timestamp: session.lastModified,
                    user: session.participants[0],
                    action: 'Last modified',
                    details: 'Updated data analysis'
                }
            ];
        } catch (error) {
            console.error('Failed to get collaboration history:', error);
            return [];
        }
    }

    async setupVersionControl(sessionId: string): Promise<void> {
        try {
            const session = this.activeSessions.get(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            // Create version checkpoint
            const versionData = {
                sessionId,
                version: `v${Date.now()}`,
                data: JSON.parse(JSON.stringify(session.data)),
                timestamp: new Date(),
                creator: await this.getCurrentUser()
            };

            // Store version in SharePoint or database
            await this.saveVersionCheckpoint(versionData);
            
        } catch (error) {
            console.error('Failed to setup version control:', error);
            throw error;
        }
    }

    private createInsightsCard(insights: any[]): any {
        return {
            type: 'AdaptiveCard',
            version: '1.3',
            body: [
                {
                    type: 'TextBlock',
                    text: 'Data Analysis Insights',
                    weight: 'Bolder',
                    size: 'Large'
                },
                {
                    type: 'TextBlock',
                    text: `Generated ${insights.length} insights from your data analysis.`,
                    wrap: true
                },
                ...insights.slice(0, 3).map(insight => ({
                    type: 'TextBlock',
                    text: `• ${insight.title}: ${insight.description}`,
                    wrap: true,
                    spacing: 'Small'
                }))
            ],
            actions: [
                {
                    type: 'Action.OpenUrl',
                    title: 'View Full Analysis',
                    url: 'https://example.com/analysis' // Would be actual analysis URL
                }
            ]
        };
    }

    private async selectTeamsChannel(): Promise<string | null> {
        try {
            const graphClient = this.authManager.getGraphClient();
            const teams = await graphClient.api('/me/joinedTeams').get();
            
            if (teams.value.length === 0) {
                throw new Error('No Teams found');
            }

            // In VS Code, we'd show a quick pick
            // For now, return first team ID
            return teams.value[0].id;
        } catch (error) {
            console.error('Failed to get Teams channels:', error);
            return null;
        }
    }

    private async getCurrentUser(): Promise<string> {
        try {
            const graphClient = this.authManager.getGraphClient();
            const user = await graphClient.api('/me').get();
            return user.userPrincipalName || user.mail || 'unknown@example.com';
        } catch (error) {
            return 'current.user@example.com';
        }
    }

    private async saveSessionToSharePoint(session: CollaborationSession): Promise<void> {
        try {
            // In a real implementation, save to SharePoint list or document library
            console.log(`Saving session ${session.id} to SharePoint`);
        } catch (error) {
            console.error('Failed to save session to SharePoint:', error);
        }
    }

    private async sendCollaborationInvite(email: string, session: CollaborationSession): Promise<void> {
        try {
            const graphClient = this.authManager.getGraphClient();
            
            const message = {
                message: {
                    subject: `Collaboration Invitation: ${session.title}`,
                    body: {
                        contentType: 'html',
                        content: `
                            <p>You've been invited to collaborate on: <strong>${session.title}</strong></p>
                            <p>Click <a href="vscode://collaboration/${session.id}">here</a> to join the session.</p>
                        `
                    },
                    toRecipients: [
                        {
                            emailAddress: {
                                address: email
                            }
                        }
                    ]
                }
            };

            await graphClient.api('/me/sendMail').post(message);
        } catch (error) {
            console.error('Failed to send collaboration invite:', error);
        }
    }

    private async createPowerPointPresentation(visualizations: any[], templateId?: string): Promise<Buffer> {
        // Simplified PowerPoint creation
        // In a real implementation, would use Office APIs to create actual PPTX
        const presentationContent = {
            slides: visualizations.map((viz, index) => ({
                slideNumber: index + 1,
                title: viz.title,
                content: viz.config || viz.data
            }))
        };

        return Buffer.from(JSON.stringify(presentationContent, null, 2));
    }

    private async setupChangeNotifications(sessionId: string): Promise<void> {
        // Setup webhook or SignalR connection for real-time updates
        console.log(`Setting up change notifications for session: ${sessionId}`);
    }

    private async saveVersionCheckpoint(versionData: any): Promise<void> {
        // Save version checkpoint to storage
        console.log(`Saving version checkpoint: ${versionData.version}`);
    }

    dispose(): void {
        // Clean up active sessions and connections
        this.activeSessions.clear();
    }
}