# digityone.com Repository Instructions

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Repository Overview
This is a minimal repository for digityone.com containing only basic structure with no active build process or source code. The repository currently contains:
- README.md (minimal content: "# digityone.com")
- .github/ISSUE_TEMPLATE/bug_report.md (standard GitHub issue template)

## Working Effectively

### Initial Repository Setup
Since this repository has minimal content, most development work will involve setting up a new web project structure. The following steps will help you get oriented:

1. **Explore the repository structure:**
   ```bash
   ls -la
   find . -type f | grep -v ".git" | sort
   ```

2. **Check git status and branch:**
   ```bash
   git --no-pager status
   git --no-pager branch -a
   ```

### Development Environment Setup
The following tools are available in the development environment:
- Node.js and npm (for JavaScript/TypeScript web development)
- Python 3 with pip (for Python-based tools or build scripts)
- Git (for version control)
- Docker (for containerized development)
- Standard build tools (make, gcc, g++)

### Common Development Scenarios

#### Setting Up a Static Website
If developing a static website for digityone.com:

1. **Initialize a basic web project:**
   ```bash
   # For a simple static site
   mkdir -p src css js images
   touch src/index.html css/style.css js/main.js
   ```

2. **Or initialize a Node.js project:**
   ```bash
   npm init -y
   # Then install common web development dependencies as needed
   ```

#### Setting Up a React/Next.js Project
If this will become a React-based website:

1. **Create a new Next.js project:**
   ```bash
   npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
   ```
   Note: This command takes approximately 45 seconds to complete. NEVER CANCEL. Set timeout to 120+ seconds.

2. **Or create a React project:**
   ```bash
   npx create-react-app . --template typescript
   ```
   Note: This command takes approximately 95 seconds to complete. NEVER CANCEL. Set timeout to 180+ seconds.

### Validation Scenarios

#### Current Repository Validation
Since this repository has minimal content, validation focuses on basic operations:

1. **File structure validation:**
   ```bash
   # Verify expected files exist
   ls -la
   find . -name "*.md" | sort
   
   # Expected output should include:
   # README.md
   # .github/copilot-instructions.md  
   # .github/ISSUE_TEMPLATE/bug_report.md
   ```

2. **Content validation:**
   ```bash
   # Verify README contains expected content
   cat README.md
   # Should output: # digityone.com
   
   # Check file has no line terminators (single line)
   wc -l README.md
   # Should output: 0 README.md
   ```

3. **Git operations validation:**
   ```bash
   # Verify git is working properly
   git --no-pager status
   git --no-pager log --oneline -3
   git --no-pager diff
   ```

#### Future Development Validation
Once development begins and content is added:

1. **Build process validation:**
   - Once package.json exists, run `npm install` and time the operation
   - Test all build commands and document actual execution times
   - Verify build artifacts are created in expected locations

2. **Web application validation:**
   - If this becomes a web application, test that it starts successfully
   - Navigate to localhost and verify content loads correctly
   - Test key user paths (home page, navigation, forms, etc.)
   - Take screenshots to verify UI appears correctly

3. **Static site validation:**
   - If this becomes a static site, verify HTML files are valid
   - Test that all links work and resources load correctly
   - Verify responsive design on different viewport sizes

### Git Operations
Standard git operations work normally:

```bash
# Check status
git --no-pager status

# View recent commits
git --no-pager log --oneline -10

# View differences
git --no-pager diff
```

### Common Commands Reference

## Common Commands Reference

### Repository root contents
Current structure (minimal repository):
```
.
├── README.md                           # Basic repository description
├── .git/                              # Git repository data  
└── .github/                           # GitHub configuration
    ├── copilot-instructions.md        # This instructions file
    └── ISSUE_TEMPLATE/
        └── bug_report.md              # Standard GitHub issue template
```

### File contents reference

#### README.md content
```
# digityone.com
```
Note: This is a single line with no line terminators (0 lines per `wc -l`).

#### .github/ISSUE_TEMPLATE/bug_report.md
Standard GitHub issue template for bug reports with sections for:
- Bug description
- Reproduction steps  
- Expected behavior
- Screenshots
- Environment details (Desktop/Mobile)
- Additional context

## Troubleshooting

### Common Issues
1. **"No build process found"** - This is expected for the current repository state
2. **"No package.json"** - Normal for current minimal setup
3. **Git operations failing** - Verify you're in the repository root directory
4. **Permission errors** - Ensure you have write permissions to the repository directory

### Development Setup Issues
When setting up a new project:
1. **npm/npx commands fail** - Verify Node.js and npm are properly installed
2. **Create-app commands timeout** - Always use generous timeouts (180+ seconds for React, 120+ seconds for Next.js)
3. **Git conflicts** - The repository is minimal, so conflicts are unlikely unless multiple developers are working simultaneously

## Important Notes

1. **No current build process** - This repository does not have package.json, build scripts, or source code yet
2. **Minimal content** - Development work will likely involve setting up project structure from scratch  
3. **No testing framework** - Tests will need to be set up as part of development
4. **No CI/CD** - GitHub Actions workflows will need to be created if automated builds are needed

## Build and Test Expectations

Currently there are no build or test commands since no build process exists. Once development begins:

- Always document actual build times and add 50% buffer for timeout recommendations
- Include explicit "NEVER CANCEL" warnings for any command taking more than 2 minutes
- Test all build commands before documenting them
- Validate that the application actually functions after building

## Manual Validation Checklist

When working with this repository, use this checklist to verify your changes:

### Pre-Development Validation
- [ ] Repository structure matches expected layout (README.md, .github/ folder)
- [ ] Git status shows clean working directory or expected untracked files
- [ ] All documented commands execute successfully without errors
- [ ] README.md contains exactly "# digityone.com" with no line terminators

### During Development Validation  
- [ ] New files are created in appropriate locations
- [ ] Git tracking is working properly (`git status` shows expected changes)
- [ ] Any new build commands are tested and timed accurately
- [ ] Dependencies install successfully without errors

### Post-Development Validation
- [ ] All build processes complete successfully (when applicable)
- [ ] Application starts and serves content correctly (when applicable)
- [ ] All documented commands still work as expected
- [ ] Instructions are updated to reflect any new processes or commands
- [ ] Timeout values are documented with 50% safety buffer based on actual measured times

## Next Steps for Development

If you are setting up this repository for active development:

1. **Determine the project type** (static site, React app, Next.js, etc.)
2. **Run the appropriate setup commands** from the "Common Development Scenarios" section
3. **Update these instructions** to reflect the new build processes and validation steps
4. **Test all commands thoroughly** and document actual execution times
5. **Add specific validation scenarios** for the type of application being built

Remember: These instructions should be updated as the repository evolves to ensure they remain accurate and helpful for future developers.