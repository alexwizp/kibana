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
import { ManagementItem } from './management_item';
import { ChromeBreadcrumb } from '../../../core/public/';

export interface ManagementSetup {
  sections: SectionsServiceSetup;
}

export interface ManagementStart {
  sections: SectionsServiceStart;
}

export interface SectionsServiceSetup {
  register: (args: CreateManagementItemArgs) => ManagementItem;
  getSection: (sectionId: ManagementItem['id']) => ManagementItem | undefined;
}

export interface SectionsServiceStart {
  getSection: (sectionId: ManagementItem['id']) => ManagementItem | undefined;
  getSectionsEnabled: () => ManagementItem[];
  getSections: () => ManagementItem[];
}

export type Unmount = () => Promise<void> | void;
export type Mount = (params: ManagementItemMountParams) => Unmount | Promise<Unmount>;

export enum MANAGEMENT_SECTION_TYPE {
  SECTION = 'section',
  APP = 'app',
}

export interface ManagementItemMountParams {
  basePath: string; // base path for setting up your router
  element: HTMLElement; // element the section should render into
  setBreadcrumbs: (crumbs: ChromeBreadcrumb[]) => void;
}

export interface CreateManagementItemArgs {
  id: string;
  title: string;
  order?: number;
  basePath?: string;
  mount?: Mount;
  euiIconType?: string; // takes precedence over `icon` property.
  icon?: string; // URL to image file; fallback if no `euiIconType`
  type?: MANAGEMENT_SECTION_TYPE;
}

/** @internal **/
export type CreateManagementItem = (args: CreateManagementItemArgs) => ManagementItem;

/** @public **/
export type CreateSection = CreateManagementItem;
