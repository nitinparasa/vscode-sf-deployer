# Salesforce Metadata Deployer

A VS Code extension to select Salesforce metadata from your SFDX project, validate (dry-run), and deploy to production. Built for a better experience than change sets.

## Features

### 🌲 **Tree View Interface**
- **Hierarchical organization**: Custom object fields, validation rules, and other components are grouped under their parent objects
- **Smart grouping**: Related metadata components are organized in an intuitive tree structure
- **Expandable/collapsible sections**: Navigate large projects easily with collapsible tree nodes

### 🎯 **Advanced Metadata Selection**
- **Tree-based selection**: Select individual components, entire custom objects, or metadata type groups
- **Smart filtering**: Filter components with real-time search that works across the tree structure  
- **Auto-expanding search**: Tree sections automatically expand to show matching search results
- **Search highlighting**: Matching terms are highlighted with visual emphasis for easy identification
- **Bulk selection**: "Select All" functionality at multiple levels (parent objects, metadata groups)
- **Parent-child relationships**: Selecting a parent automatically selects all children

### 🚀 **Deployment Features**
- **Supports all major metadata types**: Apex Classes, Triggers, LWC, Aura, Custom Objects, Fields, Validation Rules, and more
- **Correct package.xml generation**: Automatically handles proper metadata type mapping and naming conventions
- **Subfolder support**: Correctly processes classes and other components organized in subfolders
- **Real-time package.xml preview**: See exactly what will be deployed before running

### ⚙️ **Professional Deployment Workflow**
- **Validation first**: Always runs dry-run validation before actual deployment
- **Apex test level selection**: Choose appropriate test execution strategy
- **Full logging**: Complete deployment logs with real-time updates  
- **Error handling**: Clear error messages and deployment status

## Installation

1. Clone or download this repo.
2. Run `npm install` in the extension folder.
3. Run `npx vsce package` to generate a `.vsix` file.
4. In VS Code, open your SFDX project workspace.
5. Press `Cmd+Shift+P` and select `Extensions: Install from VSIX...`.
6. Choose the generated `.vsix` file.

## Usage

### Quick Start
1. Open the Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. Run `Salesforce Metadata Deployer: Open Metadata Deployment UI`
3. The extension will scan your project and organize metadata in a tree view

### Tree View Navigation
- **Expand/Collapse**: Click on tree nodes to expand or collapse sections
- **Select Components**: Use checkboxes to select individual metadata components
- **Select Groups**: Check a parent node to select all its children
- **Smart Search**: Type in the search box to filter components with automatic section expansion and highlighting

### Deployment Process
1. **Select metadata**: Choose components using the tree interface
2. **Preview**: Review the generated package.xml in the preview pane  
3. **Deploy**: Click "Validate & Deploy"
4. **Configure**: Choose Apex test level and target org
5. **Monitor**: Watch real-time deployment logs

### Tree Structure Examples
```
📁 Boat__c (Object)
  ├── 📄 CustomFields
  │   ├── ☑️ Boat_Name__c
  │   └── ☑️ Boat_Image__c
  └── 📄 ValidationRules  
      └── ☑️ ValidateBoatName
      
📁 ApexClass
  ├── ☑️ BoatController
  ├── ☑️ UtilityClass
  └── 📁 services
      └── ☑️ DatabaseService
```

### Smart Search in Action
When you search for "boat", the extension will:

**🔍 Before Search (collapsed sections):**
```
📁 Boat__c (Object) [COLLAPSED]
📁 ApexClass [COLLAPSED]
```

**✨ After Search (auto-expanded with highlights):**
```
📁 Boat__c (Object) [AUTO-EXPANDED] ✨
  ├── 📄 CustomFields [AUTO-EXPANDED]
  │   ├── ☑️ 🔶Boat🔶_Name__c     ← HIGHLIGHTED
  │   └── ☑️ 🔶Boat🔶_Image__c    ← HIGHLIGHTED
  └── 📄 ValidationRules [AUTO-EXPANDED]  
      └── ☑️ Validate🔶Boat🔶Name  ← HIGHLIGHTED
      
📁 ApexClass [AUTO-EXPANDED] ✨
  └── ☑️ 🔶Boat🔶Controller       ← HIGHLIGHTED
```

- **Auto-expansion**: All sections containing "boat" automatically open
- **Highlighting**: Search term "boat" is highlighted in bright yellow
- **Multi-level**: Works across the entire tree hierarchy
- **Real-time**: Updates instantly as you type

## Requirements

- Salesforce CLI (`sf`) installed and authenticated.
- A valid SFDX project with `sfdx-project.json` and metadata in `force-app/main/default`.

## What's New

### Version 1.1.1 - Enhanced Search Experience
- 🔍 **Auto-Expanding Search**: Tree sections automatically expand when they contain matching results - no more hunting through collapsed sections!
- ✨ **Search Highlighting**: Matching terms are highlighted in bright yellow for instant recognition
- 🎬 **Smooth Animations**: Search results appear with subtle fade-in effects for better visual feedback
- 🧭 **Smart Navigation**: Multi-level tree expansion ensures all relevant matches are visible

### Version 1.1.0 - Tree View Release
- 🌲 **New Tree View Interface**: Metadata is now organized hierarchically with custom objects as parent nodes
- 🎯 **Smart Grouping**: Custom fields, validation rules, and other components automatically grouped under parent objects  
- 🚀 **Enhanced UI**: Split-pane layout with real-time package.xml preview
- 🔧 **Improved Metadata Parsing**: Fixed subfolder handling and metadata type mapping
- 🎨 **Better UX**: Expandable/collapsible tree nodes with improved selection controls

## Troubleshooting

### Common Issues
- **No metadata showing**: Check your `sfdx-project.json` and ensure metadata is in `force-app/main/default`
- **Empty tree view**: Verify your project structure follows SFDX conventions
- **CLI errors**: Ensure you have the latest Salesforce CLI (`sf`) and are authenticated to your org
- **Permission errors**: Make sure your authenticated user has deployment permissions

### Getting Help
- Check the output log in the UI for detailed error messages
- Review the VS Code console for additional debugging information
- Ensure your project follows standard SFDX project structure

## Publisher

Nitin Parasa

## License

MIT
