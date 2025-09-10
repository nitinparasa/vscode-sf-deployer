# Change Log

All notable changes to the "salesforce-metadata-deployer" extension will be documented in this file.

## [1.1.1] - 2025-09-10

### Added
- 🔍 **Auto-Expanding Search**: Tree sections automatically expand when they contain matching search results
- **Search Highlighting**: Matching search terms are visually highlighted in yellow for easy identification
- **Smart Search Animation**: Matched items fade in with smooth animations for better visual feedback

### Improved
- **Search UX**: Enhanced filtering logic that traverses the entire tree hierarchy to find and expose matches
- **Multi-level Expansion**: Parent nodes automatically open to reveal child matches at any depth
- **State Restoration**: Clean restoration of original tree state when search is cleared

## [1.1.0] - 2025-09-09

### Added
- 🌲 **Tree View Interface**: Metadata is now organized hierarchically with expandable/collapsible nodes
- **Smart Grouping**: Custom fields, validation rules, and other components automatically grouped under parent custom objects
- **Enhanced UI Layout**: Split-pane design with dedicated metadata tree and output panels
- **Real-time Package.xml Preview**: Live preview of generated package.xml as you select components
- **Parent-Child Selection**: Selecting a parent object automatically selects all its children
- **Multi-level Select All**: "Select All" functionality at metadata group and parent object levels

### Fixed
- **Metadata Type Mapping**: Fixed incorrect categorization of custom object sub-components (fields, validation rules, etc.)
- **Subfolder Support**: Correctly handles classes and other components organized in subfolders (now extracts just the class name, not the full path)
- **Package.xml Generation**: Ensures proper metadata type names and component references

### Changed
- **UI Layout**: Redesigned interface with tree view and split-pane layout for better usability
- **Filtering**: Enhanced search functionality that works across the hierarchical tree structure
- **Selection Model**: Improved checkbox behavior with parent-child relationships

## [1.0.0] - 2025-09-08

### Added
- Initial release with basic metadata selection and deployment functionality
- Support for major Salesforce metadata types
- Apex test level selection
- Real-time deployment logging