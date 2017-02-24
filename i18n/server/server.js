/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
'use strict';
const vscode_languageserver_1 = require("vscode-languageserver");
const fs = require("fs");
const path = require("path");
const filter = require("filter-files");
// Create a connection for the server. The connection uses Node's IPC as a transport
let connection = vscode_languageserver_1.createConnection(new vscode_languageserver_1.IPCMessageReader(process), new vscode_languageserver_1.IPCMessageWriter(process));
// Create a simple text document manager. The text document manager
// supports full document sync only
let documents = new vscode_languageserver_1.TextDocuments();
// Make the text document manager listen on the connection
// for open, change and close text document events
documents.listen(connection);
// After the server has started the client sends an initialize request. The server receives
// in the passed params the rootPath of the workspace plus the client capabilities. 
let workspaceRoot;
connection.onInitialize((params) => {
    debugger;
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
    };
});
// The content of a text document has changed. This event is emitted
// when the text document first opened or when its content has changed.
documents.onDidChangeContent((change) => {
    validateTextDocument(change.document);
});
let i18nDirs;
let i18nFileMap = {};
// The settings have changed. Is send on server activation
// as well.
connection.onDidChangeConfiguration((change) => {
    let settings = change.settings.i18n;
    settings.dirs.forEach(dir => {
        let i18nDir = path.join(workspaceRoot, dir);
        filter(i18nDir, filename => path.extname(filename) === '.json', (err, filePaths) => {
            filePaths.forEach(filePath => {
                fs.readFile(filePath, 'utf-8', (err, text) => {
                    i18nFileMap[filePath] = {
                        path: filePath,
                        content: JSON.parse(text)
                    };
                });
            });
        });
    });
    // Revalidate any open text documents
    documents.all().forEach(validateTextDocument);
});
const i18nFunReg = /__\('(.+?)'\)/g;
function parseI18nSyntax(text) {
    let syntax;
    // TODO:应该是返回多个对象
    text.replace(i18nFunReg, (matching, capture, startIndex, content) => {
        syntax = {
            start: startIndex + 3,
            end: startIndex + matching.length - 1,
            capture: capture
        };
        return matching;
    });
    return syntax;
}
function validateTextDocument(textDocument) {
    let diagnostics = [];
    let lines = textDocument.getText().split(/\r?\n/g);
    for (var i = 0; i < lines.length; i++) {
        let line = lines[i];
        let i18nSyntax = parseI18nSyntax(line);
        if (i18nSyntax) {
            let isMatchTranslateFile = false;
            for (var mapkey in i18nFileMap) {
                let i18n = i18nFileMap[mapkey];
                for (let key in i18n.content) {
                    if (key === i18nSyntax.capture) {
                        isMatchTranslateFile = true;
                        let pathParse = path.parse(i18n.path);
                        diagnostics.push({
                            severity: vscode_languageserver_1.DiagnosticSeverity.Information,
                            range: {
                                start: { line: i, character: i18nSyntax.start },
                                end: { line: i, character: i18nSyntax.end }
                            },
                            message: `${pathParse.name}${pathParse.ext}: ${i18n.content[key]}`,
                            source: 'i18n'
                        });
                    }
                }
            }
            let isReciveI18NMap = Object.keys(i18nFileMap).length > 0;
            if (isReciveI18NMap && isMatchTranslateFile === false) {
                diagnostics.push({
                    severity: vscode_languageserver_1.DiagnosticSeverity.Error,
                    range: {
                        start: { line: i, character: i18nSyntax.start },
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
connection.onCompletion((textDocumentPosition) => {
    // The pass parameter contains the position of the text document in 
    // which code complete got requested. For the example we ignore this
    // info and always provide the same completion items.
    return [
        {
            label: 'TypeScript',
            kind: vscode_languageserver_1.CompletionItemKind.Text,
            data: 1
        },
        {
            label: 'JavaScript',
            kind: vscode_languageserver_1.CompletionItemKind.Text,
            data: 2
        }
    ];
});
// This handler resolve additional information for the item selected in
// the completion list.
connection.onCompletionResolve((item) => {
    if (item.data === 1) {
        item.detail = 'TypeScript details',
            item.documentation = 'TypeScript documentation 1111';
    }
    else if (item.data === 2) {
        item.detail = 'JavaScript details',
            item.documentation = 'JavaScript documentation 2222';
    }
    return item;
});
let t;
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
//# sourceMappingURL=server.js.map