/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { SavedObjectsStart } from '../../../../core/public';

import {
  injectSearchSourceReferences,
  parseSearchSourceJSON,
  DataPublicPluginStart,
} from '../../../data/public';
import { SavedSearchAttributes, SavedSearch } from './types';

import { SAVED_SEARCH_TYPE } from './constants';

interface GetSavedSearchDependencies {
  search: DataPublicPluginStart['search'];
  savedObjectsClient: SavedObjectsStart['client'];
}

const findSavedSearch = async (
  savedSearchId: string,
  savedObjectsClient: GetSavedSearchDependencies['savedObjectsClient']
) => {
  const { saved_object: savedObject } = await savedObjectsClient.resolve<SavedSearchAttributes>(
    SAVED_SEARCH_TYPE,
    savedSearchId
  );

  if (savedObject) {
    return savedObject;
  }
};

export const getSavedSearch = async (
  savedSearchId: string,
  { search, savedObjectsClient }: GetSavedSearchDependencies
): Promise<SavedSearch | undefined> => {
  const savedSearch = await findSavedSearch(savedSearchId, savedObjectsClient);

  if (savedSearch) {
    const parsedSearchSourceJSON = parseSearchSourceJSON(
      savedSearch.attributes.kibanaSavedObjectMeta.searchSourceJSON
    );
    const searchSourceValues = injectSearchSourceReferences(
      parsedSearchSourceJSON as Parameters<typeof injectSearchSourceReferences>[0],
      savedSearch.references
    );

    return {
      id: savedSearchId,
      title: savedSearch.attributes.title,
      searchSource: await search.searchSource.create(searchSourceValues),
    };
  }
};
