import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { getWorkspaceMetadata, buildPackageXml, streamCommandExecution } from './utils/metadataUtils';
import { getWebviewHtml } from './ui/webview';

// --- Main Extension Activation ---
export function activate(context: vscode.ExtensionContext) {

    console.log('Congratulations, your extension "salesforce-metadata-deployer" is now active!');

    const openWebviewDisposable = vscode.commands.registerCommand('salesforce-metadata-deployer.openWebview', async () => {

        const panel = vscode.window.createWebviewPanel(
            'salesforceMetadataWebview',
            'Salesforce Metadata Deployer',
            vscode.ViewColumn.One,
            { 
                enableScripts: true,
                localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, 'src')]
            }
        );

        const log = (text: string) => panel.webview.postMessage({ command: 'log', text });

        log('Fetching metadata from project...');
        const { metadata, apiVersion } = await getWorkspaceMetadata();
        if (Object.keys(metadata).length === 0) {
            log('No metadata found. Make sure your sfdx-project.json is configured correctly.');
        } else {
            log('Metadata loaded successfully.');
        }

        panel.webview.html = getWebviewHtml(metadata);

        panel.webview.onDidReceiveMessage(async (message: any) => {
            // --- Handle Package.xml Preview Request ---
            if (message.command === 'previewPackageXml') {
                const packageXml = buildPackageXml(message.selected || [], apiVersion);
                panel.webview.postMessage({ command: 'packageXmlPreview', packageXml });
                return;
            }

            // --- Handle Deploy Request ---
            if (message.command === 'deploy') {
                const workspaceFolders = vscode.workspace.workspaceFolders;
                if (!workspaceFolders) { return; }
                const workspaceRoot = workspaceFolders[0].uri.fsPath;
                const packageXmlPath = path.join(workspaceRoot, 'package.xml');

                try {
                    const checked = message.selected;
                    if (checked.length === 0) {
                        vscode.window.showWarningMessage('No metadata components were selected.');
                        log('Deployment cancelled: No metadata selected.');
                        return;
                    }

                    log('--- Starting Deployment Process ---');
                    log(`Selected ${checked.length} component(s).`);

                    // --- APEX TEST LEVEL LOGIC ---
                    let testLevelFlag = '';
                    const hasApex = checked.some((item: { type: string; }) => item.type === 'ApexClass' || item.type === 'ApexTrigger');

                    if (hasApex) {
                        log('Apex components detected. Please specify Apex test level.');
                        const testLevelOptions = [
                            { label: 'NoTestRun', description: 'No tests are run. (For non-production orgs)' },
                            { label: 'RunSpecifiedTests', description: 'Only run specified tests.' },
                            { label: 'RunLocalTests', description: 'Run all local tests, excluding managed packages.' },
                            { label: 'RunAllTestsInOrg', description: 'Run all tests in the org, including managed packages.' }
                        ];
                        const selectedLevel = await vscode.window.showQuickPick(testLevelOptions, {
                            placeHolder: 'Select Apex test level for deployment',
                            ignoreFocusOut: true
                        });

                        if (!selectedLevel) {
                            log('Deployment cancelled: No test level selected.');
                            return;
                        }

                        testLevelFlag = `--test-level ${selectedLevel.label}`;
                        log(`Test level selected: ${selectedLevel.label}`);

                        if (selectedLevel.label === 'RunSpecifiedTests') {
                            const specifiedTests = await vscode.window.showInputBox({
                                prompt: 'Enter comma-separated list of test class names to run',
                                placeHolder: 'MyTestClass1,MyTestClass2',
                                ignoreFocusOut: true
                            });

                            if (specifiedTests === undefined) {
                                log('Deployment cancelled: No specified tests provided.');
                                return;
                            }

                            if (specifiedTests) {
                                testLevelFlag += ` --tests ${specifiedTests}`;
                                log(`Specified tests: ${specifiedTests}`);
                            } else {
                                log('Error: "Run Specified Tests" was selected, but no test classes were provided. Cancelling deployment.');
                                vscode.window.showErrorMessage('You must specify test classes for the "RunSpecifiedTests" level.');
                                return;
                            }
                        }
                    }
                    
                    log('Building package.xml...');
                    const packageXml = buildPackageXml(checked, apiVersion);
                    fs.writeFileSync(packageXmlPath, packageXml);
                    log('package.xml created successfully.');
                    log(`\n${packageXml}\n`);

                    const orgAlias = await vscode.window.showInputBox({
                        prompt: 'Enter target org alias (e.g., my-prod-org)',
                        placeHolder: 'Leave blank to use default org'
                    });

                    if (orgAlias === undefined) {
                        log('Deployment cancelled by user.');
                        return;
                    }

                    const targetOrg = orgAlias ? `--target-org "${orgAlias}"` : '';

                    const validateCommand = `sf project deploy validate ${targetOrg} --manifest package.xml ${testLevelFlag}`.trim();
                    const deployCommand = `sf project deploy start ${targetOrg} --manifest package.xml ${testLevelFlag}`.trim();

                    log(`\n--- Starting Validation ---`);
                    const validationExitCode = await streamCommandExecution(validateCommand, workspaceRoot, log);
                    log(`--- Validation Finished (Exit Code: ${validationExitCode}) ---`);

                    if (validationExitCode !== 0) {
                         vscode.window.showErrorMessage('Validation failed. Check the output log in the deployer UI.');
                         log('\nValidation failed. Please review errors before attempting to deploy.');
                         return;
                    }

                     vscode.window.showInformationMessage('Validation successful! Do you want to proceed with deployment?', { modal: true }, 'Deploy')
                        .then(async (choice) => {
                            if (choice === 'Deploy') {
                                log(`\n--- Starting Deployment ---`);
                                const deployExitCode = await streamCommandExecution(deployCommand, workspaceRoot, log);
                                log(`--- Deployment Finished (Exit Code: ${deployExitCode}) ---`);
                                
                                if (deployExitCode !== 0) {
                                    vscode.window.showErrorMessage('Deployment failed. Check the output log.');
                                } else {
                                    vscode.window.showInformationMessage('Deployment successful!');
                                }
                            } else {
                                log('\nDeployment cancelled by user after successful validation.');
                            }
                        });

                } catch (err: any) {
                    log(`\n--- An unexpected error occurred ---\n${err.message}`);
                    vscode.window.showErrorMessage(`An unexpected error occurred: ${err.message}`);
                }
            }
        });
    });

    context.subscriptions.push(openWebviewDisposable);
}

export function deactivate() {}

