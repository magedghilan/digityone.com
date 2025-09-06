# Microsoft 365 Analyst Agent - Examples

This directory contains example files and workflows to demonstrate the capabilities of the Microsoft 365 Analyst Agent.

## Sample Data Files

### sales-data.csv
A sample sales dataset with the following columns:
- **Date**: Daily dates for January 2024
- **Sales**: Number of units sold
- **Marketing_Spend**: Marketing budget spent per day
- **Customer_Count**: Number of active customers
- **Revenue**: Total revenue generated

This dataset demonstrates various analysis capabilities including:
- Trend identification (sales growth over time)
- Correlation analysis (marketing spend vs revenue)
- Anomaly detection (unusual sales patterns)
- Predictive modeling (future sales forecasting)

## Getting Started with Examples

### 1. Basic Data Analysis
1. Open the sample CSV file in VS Code
2. Use Command Palette (Ctrl+Shift+P)
3. Run "M365 Analyst: Analyze Data"
4. View insights in the results panel

Expected insights:
- Upward trend in sales over the month
- Strong positive correlation between marketing spend and revenue
- Customer count growth correlating with sales increase

### 2. Creating Visualizations
1. With data file open, run "M365 Analyst: Create Dashboard"
2. Select chart types (line chart for trends, scatter plot for correlations)
3. Customize layout and styling
4. Share with team members

### 3. Setting Up Automation
1. Run "M365 Analyst: Open Analyst Panel"
2. Navigate to automation section
3. Create weekly sales reports
4. Set up anomaly detection alerts

## Advanced Examples

### Microsoft 365 Integration
Once you've configured your Microsoft 365 credentials:

1. **Excel Online Import**
   - Create an Excel file with sales data in OneDrive
   - Use "M365 Analyst: Import Data from Microsoft 365"
   - Select "Excel Online" and choose your file

2. **SharePoint Lists**
   - Set up a SharePoint list with business data
   - Import directly into the analysis engine
   - Apply real-time collaboration features

3. **Teams Integration**
   - Share analysis insights directly to Teams channels
   - Collaborate on data interpretation with team members
   - Set up automated report delivery to Teams

### Automation Examples

1. **Weekly Performance Reports**
   ```typescript
   // Automatically generate weekly sales performance reports
   scheduleWeeklyReports({
     reportType: 'executive-summary',
     recipients: ['manager@company.com'],
     dataSource: 'sales-data'
   });
   ```

2. **Anomaly Detection Alerts**
   ```typescript
   // Alert when sales drop below expected levels
   setupDataChangeAlerts('sales-data', {
     thresholds: { min: 1000, max: 2000 },
     recipients: ['sales-team@company.com']
   });
   ```

3. **KPI Dashboard Updates**
   ```typescript
   // Keep dashboards updated hourly
   scheduleKPIDashboardUpdates('main-dashboard', 'hourly');
   ```

## Best Practices

### Data Preparation
- Ensure date columns are properly formatted (YYYY-MM-DD)
- Use consistent column naming (no spaces, use underscores)
- Clean data by removing empty rows and inconsistent values

### Analysis Workflow
1. Import and clean data
2. Perform exploratory analysis
3. Create meaningful visualizations
4. Generate insights and recommendations
5. Set up automation for ongoing monitoring

### Collaboration
- Share insights using meaningful titles and descriptions
- Use comments to explain analysis methodology
- Set appropriate permissions for sensitive data
- Version control important analyses

## Troubleshooting

### Common Issues
- **Authentication Failed**: Ensure Microsoft 365 credentials are correctly configured
- **Data Import Error**: Check file format and permissions
- **Analysis Takes Too Long**: Consider reducing dataset size or complexity

### Performance Tips
- Limit initial analysis to key columns
- Use data sampling for large datasets
- Cache frequently accessed data
- Optimize dashboard refresh frequencies

## Support

For questions or issues with these examples:
1. Check the main README.md file
2. Review the troubleshooting section
3. Create an issue on the GitHub repository
4. Consult the VS Code extension documentation