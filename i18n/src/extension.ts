/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import * as path from 'path';

import { window, workspace, Disposable, commands, ExtensionContext } from 'vscode';
import { LanguageClient, LanguageClientOptions, SettingMonitor, ServerOptions, TransportKind } from 'vscode-languageclient';

// The settings interface describe the server relevant settings part
interface Settings {
  dirs: string[],
  showMatchInfo: boolean
}


/*
function disable() {
	if (!workspace.rootPath) {
		window.showErrorMessage('ESLint can only be disabled if VS Code is opened on a workspace folder.');
		return;
	}

	workspace.getConfiguration('eslint').
	// workspace.getConfiguration('18n').update('showMatchInfo', false, false);
}
*/

export function activate(context: ExtensionContext) {
	// The server is implemented in node
	let serverModule = context.asAbsolutePath(path.join('server', 'server.js'));
	// The debug options for the server
	// let debugOptions = { execArgv: ["--nolazy", "--debug=6009"] };
	let debugOptions = { };
	// If the extension is launched in debug mode then the debug server options are used
	// Otherwise the run options are used
	let serverOptions: ServerOptions = {
		run : { module: serverModule, transport: TransportKind.ipc},
		debug: { module: serverModule, transport: TransportKind.ipc, options: debugOptions }
	}
	// Options to control the language client
	let clientOptions: LanguageClientOptions = {
		// Register the server for plain text documents
		documentSelector: ['javascript'],
		synchronize: {
			// Synchronize the setting section 'languageServerExample' to the server
			configurationSection: 'i18n',
			// Notify the server about file changes to '.clientrc files contain in the workspace
			fileEvents: workspace.createFileSystemWatcher('**/.clientrc')
		}
	}
	
	// Create the language client and start the client.
	let disposable = new LanguageClient('i18n', 'i18n example', serverOptions, clientOptions).start();
	
	// Push the disposable to the context's subscriptions so that the 
	// client can be deactivated on extension deactivation
	context.subscriptions.push(disposable);
	context.subscriptions.push(
		commands.registerCommand('i18n.showMatchInfo', () => workspace.getConfiguration("i18n").update('showMatchInfo', true )),
		commands.registerCommand('i18n.hideMatchInfo', () => workspace.getConfiguration("i18n").update('showMatchInfo', false ))
	);
}