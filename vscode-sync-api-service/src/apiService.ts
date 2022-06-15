/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */

import * as vscode from 'vscode';

import RAL, { BaseServiceConnection, ProcExitRequest, Requests, Types } from 'vscode-sync-rpc';

const terminalRegExp = /(\r\n)|(\n)/gm;

type ApiServiceConnection<Ready extends {} | undefined = undefined> = BaseServiceConnection<Requests | ProcExitRequest, Ready>;

export class ApiService<Ready extends {} | undefined = undefined> {

	private readonly connection: ApiServiceConnection<Ready>;
	private readonly exitHandler: (rval: number) => void;
	private readonly textEncoder: RAL.TextEncoder;
	private readonly textDecoder: RAL.TextDecoder;

	private readonly pty: vscode.Pseudoterminal;
	private readonly ptyWriteEmitter: vscode.EventEmitter<string>;
	private inputBuffer: string[];
	private lineAvailable: undefined | (() => void);

	constructor(name: string, receiver: ApiServiceConnection<Ready>, exitHandler: (rval: number) => void) {
		this.connection = receiver;
		this.exitHandler = exitHandler;
		this.textEncoder = RAL().TextEncoder.create();
		this.textDecoder = RAL().TextDecoder.create();

		this.ptyWriteEmitter = new vscode.EventEmitter<string>();
		this.pty = {
			onDidWrite: this.ptyWriteEmitter.event,
			open: () => {
				this.ptyWriteEmitter.fire(`\x1b[31m${name}\x1b[0m\r\n\r\n`);
			},
			close: () => {
			},
			handleInput: (data: string) => {
				// Echo the data
				if (data === '\r') {
					data = '\n';
				}
				if (data.charCodeAt(0) === 127) {
					// Delete last character
					this.ptyWriteEmitter.fire('\x1b[D\x1b[P');
					this.inputBuffer.splice(this.inputBuffer.length - 1, 1);
				} else {
					this.ptyWriteEmitter.fire(data === '\n' ? '\r\n' : data);
					this.inputBuffer.push(data);
				}
				if (data === '\n' && this.lineAvailable !== undefined) {
					this.lineAvailable();
				}
			}
		};
		this.inputBuffer = [];

		const handleError = (error: any): { errno: number } => {
			if (error instanceof vscode.FileSystemError) {
				return { errno: this.asFileSystemError(error) };
			}
			return { errno: Types.FileSystemError.Unknown };

		};

		this.connection.onRequest('terminal/write', (params) => {
			if (params !== undefined && params.binary !== undefined) {
				const str = this.textDecoder.decode(params.binary).replace(terminalRegExp, (match: string, m1: string, m2: string) => {
					if (m1) {
						return m1;
					} else if (m2) {
						return '\r\n';
					} else {
						return match;
					}
				});
				this.ptyWriteEmitter.fire(str);
			}
			return { errno: 0 };
		});

		this.connection.onRequest('terminal/readline', async (buffer) => {
			let line = this.getLine();
			if (line !== undefined) {
				buffer.set(this.textEncoder.encode(line));
				return { errno : 0};
			}
			const wait = new Promise<void>((resolve) => {
				this.lineAvailable = resolve;
			});
			await wait;
			line = this.getLine();
			if (line === undefined) {
				return { errno: -1 };
			}
			buffer.set(this.textEncoder.encode(line));
			return { errno: 0 };
		});

		this.connection.onRequest('fileSystem/stat', async (params, resultBuffer) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				const vStat: vscode.FileStat = await vscode.workspace.fs.stat(uri);
				const stat = Types.Stat.create(resultBuffer);
				stat.type = vStat.type;
				stat.ctime = vStat.mtime;
				stat.mtime = vStat.mtime;
				stat.size = vStat.size;
				if (vStat.permissions !== undefined) {
					stat.permission = vStat.permissions;
				}
				return { errno: 0 };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/readFile', async (params) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				const contents = await vscode.workspace.fs.readFile(uri);
				return { errno: 0, data: contents };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/writeFile', async (params) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				await vscode.workspace.fs.writeFile(uri, params.binary);
				return { errno: 0 };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/readDirectory', async (params) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				const entries = await vscode.workspace.fs.readDirectory(uri);
				return { errno: 0, data: entries };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/createDirectory', async (params) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				await vscode.workspace.fs.createDirectory(uri);
				return {errno: 0 };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/delete', async (params) => {
			try {
				const uri = vscode.Uri.from(params.uri);
				await vscode.workspace.fs.delete(uri, params.options);
				return {errno: 0 };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('fileSystem/rename', async (params) => {
			try {
				const source = vscode.Uri.from(params.source);
				const target = vscode.Uri.from(params.target);
				await vscode.workspace.fs.rename(source, target, params.options);
				return {errno: 0 };
			} catch (error) {
				return handleError(error);
			}
		});

		this.connection.onRequest('$/proc_exit', (params) => {
			this.exitHandler(params.rval);
			return { errno: 0};
		});
	}

	public getPty(): vscode.Pseudoterminal {
		return this.pty;
	}

	private asFileSystemError(error: vscode.FileSystemError): Types.FileSystemError {
		switch(error.code) {
			case 'FileNotFound':
				return Types.FileSystemError.FileNotFound;
			case 'FileExists':
				return Types.FileSystemError.FileExists;
			case 'FileNotADirectory':
				return Types.FileSystemError.FileNotADirectory;
			case 'FileIsADirectory':
				return Types.FileSystemError.FileIsADirectory;
			case 'NoPermissions':
				return Types.FileSystemError.NoPermissions;
			case 'Unavailable':
				return Types.FileSystemError.Unavailable;
			default:
				return Types.FileSystemError.Unknown;
		}
	}

	private getLine(): string | undefined {
		if (this.inputBuffer.length === 0) {
			return undefined;
		}
		for (let i = 0; i < this.inputBuffer.length; i++) {
			if (this.inputBuffer[i] === '\n') {
				return this.inputBuffer.splice(0, i + 1).join('');
			}
		}
		return undefined;
	}
}