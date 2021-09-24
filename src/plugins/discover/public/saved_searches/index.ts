/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

export { getSavedSearch } from './get_saved_searches';
export { getSavedSearchUrl, getSavedSearchFullPathUrl } from './saved_searches_utils';
export type { SavedSearch } from './types';

import { createSavedSearchesLoader } from './legacy/saved_searches';
export type { LegacySavedSearch, SavedSearchLoader, SortOrder } from './legacy/types';

/** @deprecated __LEGACY object will be removed in v8**/
export const __LEGACY = {
  createSavedSearchesLoader,
};
