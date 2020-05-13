/*
 * Licensed to Elasticsearch B.V. under one or more contributor
 * license agreements. See the NOTICE file distributed with
 * this work for additional information regarding copyright
 * ownership. Elasticsearch B.V. licenses this file to you under
 * the Apache License, Version 2.0 (the "License"); you may
 * not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

import { ManagementSetup, ManagementStart } from '../types';
import { ManagementItem } from '../management_item';

const createManagementSectionMock = () =>
  (({
    disable: jest.fn(),
    enable: jest.fn(),
    registerApp: jest.fn(),
    getApp: jest.fn(),
    getEnabledItems: jest.fn().mockReturnValue([]),
  } as unknown) as ManagementItem);

const createSetupContract = () =>
  ({
    sections: {
      register: jest.fn(),
      getSection: jest.fn().mockReturnValue(createManagementSectionMock()),
    },
  } as ManagementSetup);

const createStartContract = () =>
  ({
    sections: {
      getSection: jest.fn(),
      getSections: jest.fn(),
      getSectionsEnabled: jest.fn(),
    },
  } as ManagementStart);

export const managementPluginMock = {
  createSetupContract,
  createStartContract,
};
