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
import * as i18nParse from './i18nParse';

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
  dirs: string[],
  showMatchInfo: boolean,
  filterAutoCompletion: string,
  enableAutoCompletion: boolean
}

let i18nDirs: string[];
let i18nFileMap: Object = {};
let settings: Settings;
let completionList: CompletionItem[] = []
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
	settings = <Settings> change.settings.i18n;
	settings.dirs.forEach(dir => {
		let i18nDir = path.join(workspaceRoot, dir)
    filter(i18nDir, filename => path.extname(filename) === '.json', (err, filePaths) => {
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

function validateTextDocument(textDocument: TextDocument): void {
	let diagnostics: Diagnostic[] = [];
  let lines = textDocument.getText().split(/\r?\n/g);
  lines.forEach((line, i) => {
    i18nParse.parseContent(line, i18nFileMap, (token, file) => {
      if (settings.showMatchInfo) {
        let pathParse = path.parse(file.path)
        diagnostics.push({
          severity: DiagnosticSeverity.Information,
          range: {
            start: { line: i, character: token.start},
            end: { line: i, character: token.end }
          },
          message: `${pathParse.name}${pathParse.ext}: ${file.content[token.capture]}`,
          source: 'i18n'
        });
      }
    }, token => {
				diagnostics.push({
					severity: DiagnosticSeverity.Error,
					range: {
						start: { line: i, character: token.start},
						end: { line: i, character: token.end }
					},
					message: `没有匹配到翻译文件`,
					source: 'i18n'
				});
    })
  })
	// Send the computed diagnostics to VSCode.
	connection.sendDiagnostics({ uri: textDocument.uri, diagnostics });
}

connection.onDidChangeWatchedFiles((change) => {
	// Monitored files have change in VSCode
	connection.console.log('We received an file change event');
});

let isRecive = false
// This handler provides the initial list of the completion items.
connection.onCompletion((textDocumentPosition: TextDocumentPositionParams): CompletionItem[] => {
	// The pass parameter contains the position of the text document in
	// which code complete got requested. For the example we ignore this
	// info and always provide the same completion items.

  // TODO: 可以使用高阶函数
  let textDocument = documents.get(textDocumentPosition.textDocument.uri);
  let lines = textDocument.getText().split(/\r?\n/g);
  let line = lines[textDocumentPosition.position.line]
  let tokens = i18nParse.parseI18nSyntax(line)
  connection.console.log(tokens.length.toString())
  if (settings.enableAutoCompletion && tokens.length) {
    if (isRecive == false) {
      isRecive = true
      let filter = settings.filterAutoCompletion ? new RegExp(settings.filterAutoCompletion, 'i') : undefined
      let autoCompletionList = <i18nParse.AutoCompletionList[]>i18nParse.getI18nKeyList(i18nFileMap, filter)
      completionList = <CompletionItem[]>autoCompletionList.map((completion, i) => {
        return {
          label: completion.label,
          data: i,
          kind: CompletionItemKind.Text
          // detail: completion.filePath,
          // documentation: completion.message
        }
      })
    }
    return completionList
  } else {
    return []
  }


});

// This handler resolve additional information for the item selected in
// the completion list.

connection.onCompletionResolve((item: CompletionItem): CompletionItem => {
	return item;
});

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
