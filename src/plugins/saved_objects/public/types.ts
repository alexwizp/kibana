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

import {
  ChromeStart,
  OverlayStart,
  SavedObjectsClientContract,
  SavedObjectAttributes,
  SavedObjectReference,
  CoreStart,
} from 'kibana/public';
import {
  DataPublicPluginStart,
  IIndexPattern,
  IndexPatternsContract,
  ISearchSource,
} from '../../data/public';

export interface SavedObject {
  _serialize: () => { attributes: SavedObjectAttributes; references: SavedObjectReference[] };
  _source: Record<string, unknown>;
  applyESResp: (resp: EsResponse) => Promise<SavedObject>;
  copyOnSave: boolean;
  creationOpts: (opts: SavedObjectCreationOpts) => Record<string, unknown>;
  defaults: any;
  delete?: () => Promise<{}>;
  destroy: () => void;
  getDisplayName: () => string;
  getEsType: () => string;
  getFullPath: () => string;
  hydrateIndexPattern?: (id?: string) => Promise<null | IIndexPattern>;
  id?: string;
  init?: () => Promise<SavedObject>;
  isSaving: boolean;
  isTitleChanged: () => boolean;
  lastSavedTitle: string;
  migrationVersion?: Record<string, any>;
  save: (saveOptions: SavedObjectSaveOpts) => Promise<string>;
  searchSource?: ISearchSource;
  showInRecentlyAccessed: boolean;
  title: string;
  unresolvedIndexPatternReference?: SavedObjectReference;
}

export interface SavedObjectSaveOpts {
  confirmOverwrite?: boolean;
  isTitleDuplicateConfirmed?: boolean;
  onTitleDuplicate?: () => void;
}

export interface SavedObjectCreationOpts {
  references?: SavedObjectReference[];
  overwrite?: boolean;
}

export interface SavedObjectKibanaServices {
  savedObjectsClient: SavedObjectsClientContract;
  indexPatterns: IndexPatternsContract;
  search: DataPublicPluginStart['search'];
  chrome: ChromeStart;
  overlays: OverlayStart;
  uiSettings: CoreStart['uiSettings'];
  injectedMetadata: CoreStart['injectedMetadata'];
}

export interface SavedObjectConfig {
  // is only used by visualize
  afterESResp?: (savedObject: SavedObject) => Promise<SavedObject>;
  defaults?: any;
  extractReferences?: (opts: {
    attributes: SavedObjectAttributes;
    references: SavedObjectReference[];
  }) => {
    attributes: SavedObjectAttributes;
    references: SavedObjectReference[];
  };
  id?: string;
  init?: () => void;
  indexPattern?: IIndexPattern;
  injectReferences?: any;
  mapping?: any;
  migrationVersion?: Record<string, any>;
  path?: string;
  searchSource?: ISearchSource | boolean;
  type?: string;
}

export type EsResponse = Record<string, any>;
