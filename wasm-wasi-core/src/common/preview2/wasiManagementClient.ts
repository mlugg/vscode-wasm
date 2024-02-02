/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ------------------------------------------------------------------------------------------ */
import RAL from './ral';

import { AnyConnection, BaseConnection, type ConnectionPort } from './connection';
import { WorkerClientBase } from './workerClient';
import type { Client } from './workerMessages';

type ConnectionType = BaseConnection<Client.AsyncCalls, undefined, undefined, undefined, undefined, undefined>;

type WasiConnectionInfo = {
	id: number;
	port: ConnectionPort;
};

class _WasiManagementClient extends WorkerClientBase {

	private static id: number = 1;

	private _connection: ConnectionType | undefined;

	constructor() {
		super();
	}

	protected setConnection(connection: AnyConnection): void {
		this._connection = AnyConnection.cast<ConnectionType>(connection);
	}

	protected get connection(): ConnectionType {
		if (this._connection === undefined) {
			throw new Error('Connection is not initialized.');
		}
		return this._connection;
	}

	public async createConnection(): Promise<WasiConnectionInfo> {
		const [port1, port2] = await RAL().MessageChannel.create();
		const id = _WasiManagementClient.id++;
		await this.connection.callAsync('connection/create', { id, port: port2 }, [port2]);
		return { id, port: port1 };
	}

	public async dropConnection(id: number): Promise<void> {
		await this.connection.callAsync('connection/drop', { id });
	}
}
export const WasiManagementClient = RAL().WorkerClient<_WasiManagementClient>(_WasiManagementClient, './wasiWorker.js');