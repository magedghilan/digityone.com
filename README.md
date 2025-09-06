# Microsoft 365 Analyst Agent

An advanced AI-powered data analysis extension for Visual Studio Code that integrates with Microsoft 365 services to provide comprehensive data analytics capabilities.

## Features

### 🔍 Data Integration and Cleaning
- **Microsoft 365 Integration**: Import data directly from Excel Online, SharePoint Lists, OneDrive files, and Teams
- **Multi-format Support**: Handle CSV, Excel, JSON, and other common data formats
- **Automatic Data Cleaning**: Identify and correct inconsistencies, missing values, and formatting errors
- **Smart Data Structure**: Recommend optimal data structures based on analysis requirements

### 🧠 Advanced Analysis and Insights
- **Natural Language Queries**: Ask questions in plain English like "What's driving the increase in revenue this quarter?"
- **Trend Identification**: Automatically highlight patterns and trends in historical data
- **Predictive Modeling**: Use AI algorithms to forecast future outcomes
- **Data Segmentation**: Group data into meaningful categories for targeted analysis
- **Correlation Analysis**: Identify relationships between variables

### 📊 Visual Storytelling
- **Interactive Charts**: Generate charts, graphs, and dashboards automatically
- **PowerPoint Integration**: Create polished presentations with data visualizations
- **Customizable Visuals**: Tailor visualizations to match your needs and branding
- **Real-time Updates**: Keep dashboards current with live data connections

### 🤝 Real-Time Collaboration
- **Microsoft Teams Integration**: Share insights directly in Teams channels
- **Collaborative Analysis**: Work on datasets with team members in real-time
- **Version Control**: Track changes and maintain data integrity
- **Permission Management**: Control who can access and modify analyses

### ⚡ Automation of Repetitive Tasks
- **Scheduled Reports**: Generate weekly, monthly, or custom reports automatically
- **Anomaly Alerts**: Set up notifications for unusual data patterns
- **Dashboard Updates**: Keep visualizations current with automated refreshes
- **KPI Monitoring**: Track key performance indicators with automated alerts

## Getting Started

### Prerequisites
- Visual Studio Code 1.74.0 or higher
- Microsoft 365 account with appropriate permissions
- Node.js (for development)

### Installation
1. Install the extension from the VS Code marketplace
2. Configure your Microsoft 365 connection in settings
3. Authenticate with your Microsoft 365 account
4. Start analyzing data!

### Configuration
1. Open VS Code Settings (Ctrl/Cmd + ,)
2. Search for "Microsoft 365 Analyst Agent"
3. Configure the following settings:
   - **Tenant ID**: Your Microsoft 365 tenant ID
   - **Client ID**: Your Azure AD application client ID
   - **Default Visualization Type**: Choose your preferred chart type
   - **Enable Auto Analysis**: Automatically analyze imported data

### Authentication Setup
To use Microsoft 365 integration features:
1. Register an application in Azure AD
2. Configure required permissions:
   - User.Read
   - Files.ReadWrite
   - Sites.ReadWrite.All
   - Chat.ReadWrite
   - TeamsActivity.Send
3. Add the Client ID to extension settings

## Usage

### Importing Data
1. Open the M365 Analyst Agent sidebar
2. Navigate to "Data Sources"
3. Select your source (Excel Online, SharePoint, etc.)
4. Follow the prompts to import your data

### Analyzing Data
1. Open a data file in VS Code
2. Use Command Palette (Ctrl/Cmd + Shift + P)
3. Run "M365 Analyst: Analyze Data"
4. View insights in the results panel

### Creating Dashboards
1. Use "M365 Analyst: Create Dashboard" command
2. Select data sources and chart types
3. Customize layout and styling
4. Share with team members

### Setting Up Automation
1. Open the Analyst Panel
2. Configure automated reports or alerts
3. Set schedules and recipients
4. Monitor execution in the activity log

## Commands

- `M365 Analyst: Analyze Data` - Analyze the current data file
- `M365 Analyst: Import Data from Microsoft 365` - Import from various M365 sources
- `M365 Analyst: Create Dashboard` - Build interactive dashboards
- `M365 Analyst: Generate Report` - Create comprehensive reports
- `M365 Analyst: Open Analyst Panel` - Access the main interface

## Extension Settings

* `m365AnalystAgent.tenantId`: Microsoft 365 Tenant ID
* `m365AnalystAgent.clientId`: Application Client ID for Microsoft Graph API
* `m365AnalystAgent.enableAutoAnalysis`: Enable automatic analysis of imported data
* `m365AnalystAgent.defaultVisualizationType`: Default visualization type for data analysis

## Supported Data Sources

### Microsoft 365
- Excel Online workbooks
- SharePoint lists and libraries
- OneDrive files
- Microsoft Teams data

### Local Sources
- CSV files
- Excel files (.xlsx, .xls)
- JSON files
- Tab-separated values (TSV)

### External Sources
- SQL databases (with configuration)
- REST APIs
- Other cloud storage services

## Development

### Building from Source
```bash
git clone https://github.com/magedghilan/digityone.com.git
cd digityone.com
npm install
npm run compile
```

### Running Tests
```bash
npm run test
```

### Contributing
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Requirements

- Visual Studio Code ^1.74.0
- Microsoft 365 subscription
- Internet connection for cloud features

## Known Issues

- Large datasets may require additional memory
- Some advanced Excel features are not yet supported
- PowerBI integration is planned for future releases

## Release Notes

### 1.0.0
- Initial release
- Core data analysis capabilities
- Microsoft 365 integration
- Basic visualization engine
- Automation framework

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue on GitHub
- Check the documentation
- Contact the development team

---

**Enjoy analyzing your data with the power of AI and Microsoft 365!** 🚀