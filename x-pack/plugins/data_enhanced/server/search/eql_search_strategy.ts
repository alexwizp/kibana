/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Logger, SharedGlobalConfig } from 'kibana/server';
import { switchMap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { search, getAsyncOptions } from '../../../../../src/plugins/data/server';

import type { ISearchStrategy } from '../../../../../src/plugins/data/server';
import type {
  EqlSearchStrategyRequest,
  EqlSearchStrategyResponse,
} from '../../common/search/types';

export const eqlSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger
): ISearchStrategy<EqlSearchStrategyRequest, EqlSearchStrategyResponse> => {
  return {
    cancel: async (context, id) => {
      logger.debug(`_eql/delete ${id}`);
      await context.core.elasticsearch.client.asCurrentUser.eql.delete({
        id,
      });
    },

    search: (request, options, context) => {
      logger.debug(`_eql/search ${JSON.stringify(request.params) || request.id}`);

      const { esSearch } = search;
      const asyncOptions = getAsyncOptions();

      return config$.pipe(
        esSearch.getSearchArgs(
          context.core.uiSettings.client,
          ({ ignoreThrottled, ignoreUnavailable }) => ({
            params: {
              ignoreThrottled,
              ignoreUnavailable,
              ...asyncOptions,
              ...request.params,
            },
            options: { ...request.options },
          })
        ),
        switchMap(
          esSearch.doPartialSearch(
            (...args) => context.core.elasticsearch.client.asCurrentUser.eql.search(...args),
            (...args) => context.core.elasticsearch.client.asCurrentUser.eql.get(...args),
            request.id,
            asyncOptions,
            options
          )
        ),
        esSearch.toKibanaSearchResponse(),
        esSearch.takeUntilPollingComplete(options.waitForCompletion)
      );
    },
  };
};
