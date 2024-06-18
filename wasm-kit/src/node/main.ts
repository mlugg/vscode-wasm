/* --------------------------------------------------------------------------------------------
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License. See License.txt in the project root for license information.
 * ----------------------------------------------------------------------------------------- */
import RIL from './ril';

// Install the node runtime abstract.
RIL.install();

export * from '../common/api';
export * from '../common/workerMain';