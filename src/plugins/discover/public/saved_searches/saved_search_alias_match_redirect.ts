/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { useEffect } from 'react';
import { i18n } from '@kbn/i18n';
import { getSavedSearchUrl } from './saved_searches_utils';

import type { SavedSearch } from './types';
import type { SpacesApi } from '../../../../../x-pack/plugins/spaces/public';

interface SavedSearchAliasMatchRedirectProps {
  savedSearch?: SavedSearch;
  spaces?: SpacesApi;
}

export const useSavedSearchAliasMatchRedirect = ({
  savedSearch,
  spaces,
}: SavedSearchAliasMatchRedirectProps) => {
  useEffect(() => {
    async function aliasMatchRedirect() {
      if (savedSearch) {
        const { aliasTargetId, outcome } = savedSearch.sharingSavedObject ?? {};

        if (spaces && aliasTargetId && outcome === 'aliasMatch') {
          await spaces.ui.redirectLegacyUrl(
            getSavedSearchUrl(aliasTargetId),
            i18n.translate('discover.savedSearchAliasMatchRedirect.objectNoun', {
              defaultMessage: '{savedSearch} search',
              values: {
                savedSearch: savedSearch.title,
              },
            })
          );
        }
      }
    }

    aliasMatchRedirect();
  }, [savedSearch, spaces]);
};
