# Salesforce Metadata Deployer

A VS Code extension that provides a tree view interface to select, validate, and deploy Salesforce metadata using SFDX CLI. Built for a better experience than change sets.

## Features

- **🌲 Tree View Interface**: Hierarchical organization of metadata with custom objects, fields, validation rules grouped logically
- **🔍 Smart Search**: Real-time filtering with auto-expanding sections and search highlighting  
- **📦 Package.xml Preview**: Live preview of deployment package before running
- **✅ Validation First**: Always runs dry-run validation before deployment
- **⚙️ Apex Test Options**: Support for all test execution levels (NoTestRun, RunLocalTests, etc.)
- **📊 Real-time Logging**: Complete deployment logs with progress tracking

## Installation

1. Download the latest `.vsix` file from releases
2. In VS Code: `Cmd+Shift+P` → `Extensions: Install from VSIX...`
3. Select the downloaded `.vsix` file

## Quick Start

1. Open Command Palette (`Cmd+Shift+P`)
2. Run: `Salesforce Metadata Deployer: Open Metadata Deployment UI`
3. Select metadata components using the tree view
4. Click "Deploy Selected" to validate and deploy

## Requirements

- Salesforce CLI (`sf`) installed and authenticated
- Valid SFDX project with `sfdx-project.json`
- Metadata in standard `force-app/main/default` structure

## Supported Metadata Types

- Apex Classes & Triggers
- Lightning Web Components (LWC)
- Aura Components  
- Custom Objects, Fields, Validation Rules
- Profiles, Permission Sets
- Static Resources, Custom Labels
- And more...

## Troubleshooting

- **No metadata showing**: Check `sfdx-project.json` and project structure
- **CLI errors**: Ensure latest Salesforce CLI and valid org authentication  
- **Permission errors**: Verify deployment permissions on target org

## License

MIT - See LICENSE file for details

---

**Publisher**: Nitin Parasa
