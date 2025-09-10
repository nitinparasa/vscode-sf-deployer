import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { Builder } from 'xml2js';
import { spawn } from 'child_process';

export const METADATA_TYPE_MAP: { [key: string]: string } = {
    'classes': 'ApexClass',
    'triggers': 'ApexTrigger',
    'aura': 'AuraDefinitionBundle',
    'lwc': 'LightningComponentBundle',
    'pages': 'ApexPage',
    'components': 'ApexComponent',
    'staticresources': 'StaticResource',
    'objects': 'CustomObject',
    'tabs': 'CustomTab',
    'permissionsets': 'PermissionSet',
    'profiles': 'Profile',
    'workflows': 'Workflow',
    'labels': 'CustomLabels'
};

/**
 * Metadata types that preserve folder structure in their component names.
 * For these types, subfolders are part of the component identity.
 */
const FOLDER_AWARE_METADATA_TYPES = new Set([
    'Report',
    'Dashboard', 
    'EmailTemplate',
    'Document',
    'Flow',
    'Workflow'
]);

/**
 * Determines the correct metadata type and component name for a file path.
 * Handles special cases like custom object sub-components (fields, validation rules, etc.)
 */
function parseMetadataFromPath(filePath: string, baseFolderType: string): { type: string; name: string } | null {
    const fileName = path.basename(filePath);
    const relativePath = filePath;
    
    // Skip hidden files
    if (fileName.startsWith('.')) {
        return null;
    }
    
    // Handle custom object sub-components
    if (baseFolderType === 'CustomObject') {
        // Check if this is a custom field
        if (relativePath.includes('/fields/') && fileName.endsWith('.field-meta.xml')) {
            const fieldName = fileName.replace('.field-meta.xml', '');
            return { type: 'CustomField', name: fieldName };
        }
        
        // Check if this is a validation rule
        if (relativePath.includes('/validationRules/') && fileName.endsWith('.validationRule-meta.xml')) {
            const ruleName = fileName.replace('.validationRule-meta.xml', '');
            return { type: 'ValidationRule', name: ruleName };
        }
        
        // Check if this is a list view
        if (relativePath.includes('/listViews/') && fileName.endsWith('.listView-meta.xml')) {
            const listViewName = fileName.replace('.listView-meta.xml', '');
            return { type: 'ListView', name: listViewName };
        }
        
        // Check if this is a web link
        if (relativePath.includes('/webLinks/') && fileName.endsWith('.webLink-meta.xml')) {
            const webLinkName = fileName.replace('.webLink-meta.xml', '');
            return { type: 'WebLink', name: webLinkName };
        }
        
        // Check if this is a record type
        if (relativePath.includes('/recordTypes/') && fileName.endsWith('.recordType-meta.xml')) {
            const recordTypeName = fileName.replace('.recordType-meta.xml', '');
            return { type: 'RecordType', name: recordTypeName };
        }
        
        // Check if this is a compact layout
        if (relativePath.includes('/compactLayouts/') && fileName.endsWith('.compactLayout-meta.xml')) {
            const layoutName = fileName.replace('.compactLayout-meta.xml', '');
            return { type: 'CompactLayout', name: layoutName };
        }
        
        // Check if this is a business process
        if (relativePath.includes('/businessProcesses/') && fileName.endsWith('.businessProcess-meta.xml')) {
            const processName = fileName.replace('.businessProcess-meta.xml', '');
            return { type: 'BusinessProcess', name: processName };
        }
        
        // Check if this is the custom object itself
        if (fileName.endsWith('.object-meta.xml')) {
            const objectName = fileName.replace('.object-meta.xml', '');
            return { type: 'CustomObject', name: objectName };
        }
    }
    
    // Handle other metadata types
    let componentName: string;
    
    if (relativePath.endsWith('-meta.xml')) {
        // Remove -meta.xml suffix first
        componentName = relativePath.slice(0, -'-meta.xml'.length);
    } else if (relativePath.endsWith('.meta.xml')) {
        // Remove .meta.xml suffix first  
        componentName = relativePath.slice(0, -'.meta.xml'.length);
    } else {
        componentName = relativePath;
    }
    
    // Remove file extension for most types (like .cls, .trigger, etc.)
    const extension = path.extname(componentName);
    if (extension) {
        componentName = componentName.substring(0, componentName.length - extension.length);
    }
    
    // For most metadata types, we only want the filename, not the full path
    // Only preserve folder structure for specific metadata types that require it
    if (!FOLDER_AWARE_METADATA_TYPES.has(baseFolderType)) {
        componentName = path.basename(componentName);
    }
    
    // Handle specific type exceptions
    if (baseFolderType === 'CustomLabels') {
        componentName = 'CustomLabels'; // There is only one CustomLabels component per org
    }
    
    // Convert to forward-slash format
    const finalName = componentName.replace(/\\/g, '/');
    
    return finalName ? { type: baseFolderType, name: finalName } : null;
}

function findFilesRecursively(dir: string): string[] {
    if (!fs.existsSync(dir)) {
        return [];
    }
    let results: string[] = [];
    const list = fs.readdirSync(dir, { withFileTypes: true });
    for (const dirent of list) {
        const fullPath = path.join(dir, dirent.name);
        if (dirent.isDirectory()) {
            results = results.concat(findFilesRecursively(fullPath));
        } else {
            results.push(fullPath);
        }
    }
    return results;
}

export async function getWorkspaceMetadata(): Promise<{ metadata: { [type: string]: string[] }; apiVersion: string }> {
    const metadata: { [type: string]: string[] } = {};
    const defaultApiVersion = '60.0';
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders) {
        vscode.window.showErrorMessage("No workspace folder is open.");
        return { metadata: {}, apiVersion: defaultApiVersion };
    }
    const workspaceRoot = workspaceFolders[0].uri.fsPath;
    const projectJsonPath = path.join(workspaceRoot, 'sfdx-project.json');

    if (!fs.existsSync(projectJsonPath)) {
        vscode.window.showWarningMessage("sfdx-project.json not found. Could not find metadata.");
        return { metadata: {}, apiVersion: defaultApiVersion };
    }

    try {
        const projectJson = JSON.parse(fs.readFileSync(projectJsonPath, 'utf-8'));
        const apiVersion = projectJson.sourceApiVersion || defaultApiVersion;
        const packageDirs = projectJson.packageDirectories || [];

        for (const dir of packageDirs) {
            const sourcePath = path.join(workspaceRoot, dir.path, 'main', 'default');
            if (!fs.existsSync(sourcePath)) { continue; }

            const metadataFolders = fs.readdirSync(sourcePath, { withFileTypes: true })
                .filter(dirent => dirent.isDirectory())
                .map(dirent => dirent.name);

            for (const folder of metadataFolders) {
                const typePath = path.join(sourcePath, folder);
                const apiName = METADATA_TYPE_MAP[folder];
                if (!apiName) { continue; }

                let items: string[] = [];
                
                if (['AuraDefinitionBundle', 'LightningComponentBundle'].includes(apiName)) {
                    items = fs.readdirSync(typePath, { withFileTypes: true })
                        .filter(dirent => dirent.isDirectory() && !dirent.name.startsWith('.'))
                        .map(dirent => dirent.name);
                } 
                // Handle all other file-based components recursively using the proper parser
                else {
                    const allFiles = findFilesRecursively(typePath);
                    const componentsByType = new Map<string, Set<string>>();

                    allFiles.forEach(file => {
                        const relativePath = path.relative(typePath, file);
                        const parsed = parseMetadataFromPath(relativePath, apiName);
                        
                        if (parsed) {
                            if (!componentsByType.has(parsed.type)) {
                                componentsByType.set(parsed.type, new Set<string>());
                            }
                            componentsByType.get(parsed.type)!.add(parsed.name);
                        }
                    });

                    // Add components to metadata grouped by their correct type
                    componentsByType.forEach((names, type) => {
                        if (names.size > 0) {
                            const existingItems = metadata[type] || [];
                            const combinedItems = [...new Set([...existingItems, ...Array.from(names)])];
                            metadata[type] = combinedItems.sort();
                        }
                    });
                }
            }
        }
        return { metadata, apiVersion };
    } catch (error: any) {
        vscode.window.showErrorMessage(`Error reading project metadata: ${error.message}`);
    }
    return { metadata: {}, apiVersion: defaultApiVersion };
}

export function organizeMetadataForTreeView(metadata: { [type: string]: any[] }): any {
    const tree: { [key: string]: any } = {};

    for (const [type, items] of Object.entries(metadata)) {
        const typeNode = {
            name: type,
            type: type,
            selectable: false,
            children: [] as any[]
        };

        const isHierarchical = type === 'CustomObject' || type === 'ApexClass' || type === 'ApexTrigger';

        if (isHierarchical) {
            const childMap: { [key: string]: any } = {};
            for (const item of items) {
                const parts = item.split('/');
                let currentLevel = childMap;
                let currentPath = '';

                parts.forEach((part: string, index: number) => {
                    currentPath = index === 0 ? part : `${currentPath}/${part}`;
                    if (!currentLevel[part]) {
                        const isLeaf = index === parts.length - 1;
                        currentLevel[part] = {
                            name: currentPath,
                            displayName: part,
                            type: type,
                            selectable: isLeaf,
                            children: isLeaf ? [] : {}
                        };
                    }
                    currentLevel = currentLevel[part].children;
                });
            }
            const convertMapToArray = (map: any): any[] => {
                return Object.values(map).map((node: any) => {
                    if (node.children && !Array.isArray(node.children)) {
                        node.children = convertMapToArray(node.children);
                    }
                    return node;
                });
            };
            typeNode.children = convertMapToArray(childMap);

        } else {
            typeNode.children = items.map(item => ({
                name: item,
                displayName: item,
                type: type,
                selectable: true,
                children: []
            }));
        }
        tree[type] = typeNode;
    }
    return tree;
}

export function buildPackageXml(items: Array<{ type: string, name: string }>, apiVersion: string): string {
    const types: { [key: string]: string[] } = {};
    for (const item of items) {
        if (!types[item.type]) {
            types[item.type] = [];
        }
        if (!types[item.type].includes(item.name)) {
            types[item.type].push(item.name);
        }
    }

    const xmlObj = {
        Package: {
            '$': { xmlns: 'http://soap.sforce.com/2006/04/metadata' },
            types: Object.entries(types).map(([typeName, members]) => ({
                name: typeName,
                members: members.sort()
            })),
            version: apiVersion
        }
    };

    const builder = new Builder({ headless: true, renderOpts: { pretty: true, indent: '    ' } });
    return '<?xml version="1.0" encoding="UTF-8"?>\n' + builder.buildObject(xmlObj);
}

export function streamCommandExecution(command: string, cwd: string, log: (text: string) => void): Promise<number | null> {
    return new Promise((resolve) => {
        log(`\n> ${command}\n`);
        
        const parts = command.split(' ').filter(p => p.length > 0);
        const cmd = parts[0];
        const args = parts.slice(1);

        const child = spawn(cmd, args, { cwd, shell: true });

        child.stdout.on('data', (data) => log(data.toString()));
        child.stderr.on('data', (data) => log(data.toString()));

        child.on('close', (code) => {
            resolve(code);
        });
        child.on('error', (err) => {
            log(`Failed to start command: ${err.message}`);
            resolve(1);
        });
    });
}

