/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';

import {
	IPCMessageReader, IPCMessageWriter,
	createConnection, IConnection, TextDocumentSyncKind,
	TextDocuments, TextDocument, Diagnostic, DiagnosticSeverity,
	InitializeParams, InitializeResult, TextDocumentPositionParams,
	CompletionItem, CompletionItemKind, ShowMessageNotification
} from 'vscode-languageserver';
import * as fs from 'fs';
import * as path from 'path';
import * as filter from 'filter-files';



// Create a connection for the server. The connection uses Node's IPC as a transport
let connection: IConnection = createConnection(new IPCMessageReader(process), new IPCMessageWriter(process));

// Create a simple text document manager. The text document manager
// supports full document sync only
let documents: TextDocuments = new TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);

// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities. 
let workspaceRoot: string;
connection.onInitialize((params): InitializeResult => {
	debugger
	workspaceRoot = params.rootPath;
	return {
		capabilities: {
			// Tell the client that the server works in FULL text document sync mode
			textDocumentSync: documents.syncKind,
			// Tell the client that the server support code complete
			completionProvider: {
				resolveProvider: true
			}
		}
	}
});

// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
	validateTextDocument(change.document);
});

// The settings interface describe the server relevant settings part
interface Settings {
	dirs: string[];
}

interface i18nFile { 
	path: string,
	content: Object
}

let i18nDirs: string[]; 
let i18nFileMap: Object = {};

// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
	let settings = <Settings> change.settings.i18n;
	settings.dirs.forEach(dir => {
		let i18nDir = path.join(workspaceRoot, dir)
		filter(i18nDir, filename => path.extname(filename) === '.json' , (err, filePaths) => {
			filePaths.forEach(filePath => { 
				fs.readFile(filePath, 'utf-8', (err, text) => { 
					i18nFileMap[filePath] = {
						path: filePath,
						content: JSON.parse(text)
					}
				});
			})
		});
	})
	// Revalidate any open text documents
	documents.all().forEach(validateTextDocument);
});

const i18nFunReg = /__\('(.+?)'\)/g

interface I18nSyntax { 
	start: number,
	end: number,
	capture: String
}

function  parseI18nSyntax(text: string) : I18nSyntax{ 
	let syntax: I18nSyntax;
	// TODO:应该是返回多个对象
	text.replace(i18nFunReg, (matching, capture, startIndex, content) => {
		syntax = {
			start: startIndex + 3,
			end: startIndex + matching.length - 1,
			capture: capture
		}
		return matching
	})
	return syntax
}

function validateTextDocument(textDocument: TextDocument): void {
	let diagnostics: Diagnostic[] = [];
	let lines = textDocument.getText().split(/\r?\n/g);
	for (var i = 0; i < lines.length; i++) {
		let line = lines[i];
		let i18nSyntax = parseI18nSyntax(line)
		if (i18nSyntax) {
			let isMatchTranslateFile : boolean = false
			for (var mapkey in i18nFileMap) { 
				let i18n = i18nFileMap[mapkey]
				for (let key in i18n.content) {
					if (key === i18nSyntax.capture) { 
						isMatchTranslateFile = true
						let pathParse = path.parse(i18n.path)
						diagnostics.push({
							severity: DiagnosticSeverity.Information,
							range: {
								start: { line: i, character: i18nSyntax.start},
								end: { line: i, character: i18nSyntax.end }
							},
							message: `${pathParse.name}${pathParse.ext}: ${i18n.content[key]}`,
							source: 'i18n'
						});
					}
				}
			}

			let isReciveI18NMap: boolean = Object.keys(i18nFileMap).length > 0;
			if (isReciveI18NMap && isMatchTranslateFile === false) { 
				diagnostics.push({
					severity: DiagnosticSeverity.Error,
					range: {
						start: { line: i, character: i18nSyntax.start},
						end: { line: i, character: i18nSyntax.end }
					},
					message: `没有匹配到翻译文件`,
					source: 'i18n'
				});
			}
		}
	}
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles((change) => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});


// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in 
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.
	return [
		{
			label: 'TypeScript',
			kind: CompletionItemKind.Text,
			data: 1
		},
		{
			label: 'JavaScript',
			kind: CompletionItemKind.Text,
			data: 2
		}
	]
});

// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	if (item.data === 1) {
		item.detail = 'TypeScript details',
		item.documentation = 'TypeScript documentation 1111'
	} else if (item.data === 2) {
		item.detail = 'JavaScript details',
		item.documentation = 'JavaScript documentation 2222'
	}
	return item;
});

let t: Thenable<string>;

/*
connection.onDidOpenTextDocument((params) => {
	// A text document got opened in VSCode.
	// params.textDocument.uri uniquely identifies the document. For documents store on disk this is a file URI.
	// params.textDocument.text the initial full content of the document.
	// validateTextDocument(params.textDocument);
	connection.console.log(`${params.textDocument.uri} opened.`);
});

connection.onDidChangeTextDocument((params) => {
	// The content of a text document did change in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	// params.contentChanges describe the content changes to the document.
	connection.console.log(`${params.textDocument.uri} changed: ${JSON.stringify(params.contentChanges)}`);
});

connection.onDidCloseTextDocument((params) => {
	// A text document got closed in VSCode.
	// params.textDocument.uri uniquely identifies the document.
	connection.console.log(`${params.textDocument.uri} closed.`);
});
*/

// Listen on the connection
connection.listen();