import { organizeMetadataForTreeView } from '../utils/metadataUtils';

/**
 * Recursively generates the HTML for the metadata tree view.
 * @param node The current node in the tree to render.
 * @param level The current depth in the tree, for indentation.
 * @returns An HTML string for the node and its children.
 */
function generateTreeHtml(node: any, level: number = 0): string {
    const hasChildren = node.children && node.children.length > 0;

    // A selectable leaf node (an actual metadata component)
    if (!hasChildren && node.selectable) {
        return `
            <div class="tree-item tree-leaf" style="padding-left: ${level * 20}px;" data-name="${node.displayName.toLowerCase()}">
                <label>
                    <input type="checkbox" data-type="${node.type}" value="${node.name}"> 
                    <span class="tree-label">${node.displayName}</span>
                </label>
            </div>`;
    } 
    // A branch node (a folder or a component with children like a Custom Object)
    else if (hasChildren) {
        const childrenHtml = node.children.map((child: any) => generateTreeHtml(child, level + 1)).join('');
        const selectAllHtml = node.selectable 
            ? `<input type="checkbox" class="parent-checkbox" data-type="${node.type}" value="${node.name}">` 
            : `<input type="checkbox" class="select-all">`;
        const topLevelClass = level === 0 ? 'top-level-node' : '';

        return `
            <details class="tree-node ${topLevelClass}">
                <summary style="padding-left: ${level * 20}px;">
                    <span class="tree-toggle"></span>
                    <label class="summary-label" onclick="event.stopPropagation()">
                        ${selectAllHtml}
                        <span class="tree-label">${node.name}</span>
                    </label>
                </summary>
                <div class="tree-children">
                    ${childrenHtml}
                </div>
            </details>`;
    }
    
    return ''; // Should not happen for well-formed data
}


/**
 * Generates the complete HTML content for the webview UI.
 * @param metadata A map where keys are Metadata API names and values are arrays of component names.
 * @returns A string containing the full HTML document.
 */
export function getWebviewHtml(metadata: { [type: string]: string[] }) {
    // ---- CSS STYLES ----
    const styles = `
        body {
            font-family: var(--vscode-font-family);
            color: var(--vscode-editor-foreground);
            background-color: var(--vscode-editor-background);
            padding: 0 1em 1em 1em;
            display: flex;
            flex-direction: column;
            height: 100vh;
            box-sizing: border-box;
        }
        .header {
            position: sticky;
            top: 0;
            background-color: var(--vscode-editor-background);
            padding-top: 1em;
            z-index: 10;
        }
        #filter-input {
            width: 100%;
            padding: 8px;
            margin-bottom: 1em;
            border-radius: 4px;
            border: 1px solid var(--vscode-input-border);
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            box-sizing: border-box;
        }

        .main-container {
            display: flex;
            gap: 1em;
            flex-grow: 1;
            overflow: hidden;
        }

        .metadata-container, .output-wrapper {
            flex: 1;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        #metadataForm {
            flex-grow: 1;
            overflow-y: auto;
            border: 1px solid var(--vscode-input-border);
            border-radius: 4px;
            padding: 0.5em;
        }
        
        /* Tree view styles */
        .top-level-node {
            border: 1px solid var(--vscode-panel-border, #80808030);
            border-radius: 4px;
            margin-bottom: 8px;
            overflow: hidden;
        }
        summary {
            font-weight: bold;
            font-size: 1.1em;
            padding: 0.4em 0.5em;
            cursor: pointer;
            display: flex;
            align-items: center;
            list-style: none; /* Hide default arrow */
            border-radius: 3px;
        }
        summary:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        summary::-webkit-details-marker {
            display: none; /* Hide default arrow for Chrome/Safari */
        }
        .tree-toggle::before {
            content: '▶';
            display: inline-block;
            margin-right: 8px;
            font-size: 0.8em;
            transition: transform 0.1s ease-in-out;
        }
        details[open] > summary .tree-toggle::before {
            transform: rotate(90deg);
        }
        .summary-label {
            display: flex;
            align-items: center;
            cursor: pointer;
        }
        .tree-children {
            padding-left: 10px;
        }
        .tree-item {
            padding: 4px 8px;
            margin-bottom: 2px;
            border-radius: 3px;
            display: block;
        }
        .tree-item:hover {
            background-color: var(--vscode-list-hoverBackground);
        }
        .tree-label {
            margin-left: 6px;
            user-select: none;
        }
        
        /* Search highlighting */
        .search-highlight {
            background-color: var(--vscode-editor-findMatchHighlightBackground, #ffff00);
            color: var(--vscode-editor-findMatchHighlightForeground, #000000);
            padding: 1px 2px;
            border-radius: 2px;
            font-weight: bold;
        }
        
        .filtered-visible {
            animation: searchFadeIn 0.2s ease-in;
        }
        
        @keyframes searchFadeIn {
            from { opacity: 0.3; }
            to { opacity: 1; }
        }
        
        button {
            margin-top: 1.5em;
            padding: 8px 16px;
            font-size: 1em;
            border-radius: 4px;
            border: 1px solid var(--vscode-button-border);
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            cursor: pointer;
        }
        button:hover {
            background: var(--vscode-button-hoverBackground);
        }
        .output-wrapper h3 {
             margin-top: 0;
             margin-bottom: 0.5em;
        }
        .output-container {
            background-color: var(--vscode-terminal-background);
            color: var(--vscode-terminal-foreground);
            padding: 1em;
            border-radius: 6px;
            font-family: var(--vscode-editor-font-family);
            white-space: pre-wrap;
            word-wrap: break-word;
            overflow-y: auto;
            border: 1px solid var(--vscode-dropdown-border);
            flex-grow: 1;
            flex-basis: 0;
        }
    `;

    // ---- HTML FOR METADATA SECTIONS ----
    const treeData = organizeMetadataForTreeView(metadata);
    const metadataHtml = Object.values(treeData).map(node => generateTreeHtml(node)).join('');
    
    // ---- FULL HTML DOCUMENT ----
    return `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Salesforce Metadata Deployer</title>
        <style>${styles}</style>
    </head>
    <body>
        <div class="header">
            <h2>Salesforce Metadata Deployer</h2>
            <p>Select metadata to validate and deploy.</p>
            <input type="text" id="filter-input" placeholder="Filter metadata components...">
        </div>
        
        <div class="main-container">
            <div class="metadata-container">
                <form id="metadataForm">
                    ${Object.keys(metadata).length > 0 ? metadataHtml : '<p>No metadata found in this project.</p>'}
                </form>
            </div>
            <div class="output-wrapper">
                <h3>Package.xml Preview</h3>
                <pre id="package-xml-preview" class="output-container"></pre>
                <h3 style="margin-top: 1em;">Output Log</h3>
                <pre id="output" class="output-container"></pre>
            </div>
        </div>
        
        <button id="deployBtn">Validate & Deploy</button>

        <script>
            const vscode = acquireVsCodeApi();
            const form = document.getElementById('metadataForm');
            const packagePreview = document.getElementById('package-xml-preview');
            const outputLog = document.getElementById('output');
            const filterInput = document.getElementById('filter-input');

            function updatePackagePreview() {
                const selected = [];
                form.querySelectorAll('input[type=checkbox]:checked:not(.select-all)').forEach(el => {
                    selected.push({ type: el.dataset.type, name: el.value });
                });
                vscode.postMessage({ command: 'previewPackageXml', selected });
            }

            form.addEventListener('change', (e) => {
                const checkbox = e.target;
                if (checkbox.type !== 'checkbox') return;

                const parentDetails = checkbox.closest('details');
                if (!parentDetails) return;

                const isChecked = checkbox.checked;
                // If a "Select All" or parent checkbox is clicked, update all children
                if (checkbox.classList.contains('select-all') || checkbox.classList.contains('parent-checkbox')) {
                    parentDetails.querySelectorAll('.tree-children input[type=checkbox]').forEach(child => {
                        child.checked = isChecked;
                    });
                }
                updatePackagePreview();
            });

            // Helper function to highlight search terms
            function highlightSearchTerm(text, searchTerm) {
                if (!searchTerm) return text;
                const regex = new RegExp('(' + searchTerm + ')', 'gi');
                return text.replace(regex, '<span class="search-highlight">$1</span>');
            }

            // Helper function to restore original text
            function restoreOriginalText(element) {
                const label = element.querySelector('.tree-label');
                if (label && label.dataset.originalText) {
                    label.innerHTML = label.dataset.originalText;
                }
            }

            filterInput.addEventListener('keyup', () => {
                const filterText = filterInput.value.toLowerCase().trim();
                
                // If search is empty, restore original state
                if (!filterText) {
                    // Show all items and restore original text
                    form.querySelectorAll('.tree-item').forEach(item => {
                        item.style.display = 'block';
                        restoreOriginalText(item);
                        item.classList.remove('filtered-visible');
                    });
                    
                    // Restore all tree nodes to visible and remove highlights
                    form.querySelectorAll('.tree-node').forEach(node => {
                        node.style.display = 'block';
                        restoreOriginalText(node);
                    });
                    return;
                }
                
                // Track which tree nodes have visible children
                const nodesWithMatches = new Set();
                
                // Filter individual items and track their parent nodes
                form.querySelectorAll('.tree-item').forEach(item => {
                    const itemName = item.dataset.name || '';
                    const hasMatch = itemName.includes(filterText);
                    
                    item.style.display = hasMatch ? 'block' : 'none';
                    
                    // Add highlighting and animation for matches
                    const label = item.querySelector('.tree-label');
                    if (label) {
                        // Store original text if not already stored
                        if (!label.dataset.originalText) {
                            label.dataset.originalText = label.textContent || '';
                        }
                        
                        if (hasMatch) {
                            // Highlight the matching text
                            label.innerHTML = highlightSearchTerm(label.dataset.originalText, filterText);
                            item.classList.add('filtered-visible');
                        } else {
                            // Restore original text for non-matches
                            label.innerHTML = label.dataset.originalText;
                            item.classList.remove('filtered-visible');
                        }
                    }
                    
                    // If this item matches, mark its parent tree nodes for expansion
                    if (hasMatch) {
                        let parent = item.closest('.tree-node');
                        while (parent) {
                            nodesWithMatches.add(parent);
                            parent = parent.parentElement?.closest('.tree-node');
                        }
                    }
                });
                
                // Show/hide tree nodes based on whether they have matches
                form.querySelectorAll('.tree-node').forEach(node => {
                    if (nodesWithMatches.has(node)) {
                        node.style.display = 'block';
                        // Auto-expand nodes with matches
                        if (!node.hasAttribute('open')) {
                            node.setAttribute('open', '');
                        }
                    } else {
                        // Check if any descendant has matches
                        const hasDescendantMatches = node.querySelectorAll('.tree-item:not([style*="display: none"])').length > 0;
                        if (hasDescendantMatches) {
                            node.style.display = 'block';
                            // Auto-expand nodes with descendant matches
                            if (!node.hasAttribute('open')) {
                                node.setAttribute('open', '');
                            }
                        } else {
                            node.style.display = 'none';
                        }
                    }
                });
            });

            document.getElementById('deployBtn').addEventListener('click', () => {
                const selected = [];
                form.querySelectorAll('input[type=checkbox]:checked:not(.select-all)').forEach(el => {
                    selected.push({ type: el.dataset.type, name: el.value });
                });
                outputLog.textContent = '';
                vscode.postMessage({ command: 'deploy', selected });
            });

            window.addEventListener('message', event => {
                const msg = event.data;
                if (msg.command === 'log') {
                    const isScrolledToBottom = outputLog.scrollHeight - outputLog.clientHeight <= outputLog.scrollTop + 10;
                    
                    outputLog.appendChild(document.createTextNode(msg.text));

                    if (isScrolledToBottom) {
                        outputLog.scrollTop = outputLog.scrollHeight;
                    }
                }
                if (msg.command === 'packageXmlPreview') {
                    packagePreview.textContent = msg.packageXml;
                }
            });
            
            updatePackagePreview();
        </script>
    </body>
    </html>`;
}

