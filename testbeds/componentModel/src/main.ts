/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
import * as fs from 'fs/promises';
import { WasmContext, ResourceManagers, Memory } from '@vscode/wasm-component-model';

import { example } from './example';
import calculator = example.calculator;

async function main(): Promise<void> {
	const bytes = await fs.readFile('./target/wasm32-unknown-unknown/debug/calculator.wasm');
	const module = await WebAssembly.compile(bytes);
	const instance = await WebAssembly.instantiate(module, {});
	const context: WasmContext = {
		options: { encoding: 'utf-8' },
		managers: ResourceManagers.createDefault(),
		getMemory: () => {
			return Memory.Null;
		}
	}
	const api = calculator._.bindExports(instance.exports as calculator.Exports, context);
	console.log(api.add(1, 2));
}

main().catch(console.error);
