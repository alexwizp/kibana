/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { Logger } from 'kibana/server';
import { switchMap } from 'rxjs/operators';
import { search, getAsyncOptions } from '../../../../../src/plugins/data/server';

import type { ISearchStrategy } from '../../../../../src/plugins/data/server';
import type {
  EqlSearchStrategyRequest,
  EqlSearchStrategyResponse,
} from '../../common/search/types';

export const eqlSearchStrategyProvider = (
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

      const {
        getSearchArgs,
        doPartialSearch,
        toKibanaSearchResponse,
        takeUntilPollingComplete,
      } = search.esSearch;
      const asyncOptions = getAsyncOptions();

      return config$.pipe(
        getSearchArgs(
          request,
          context.core.uiSettings.client,
          ({ ignoreThrottled, ignoreUnavailable }) => {
            return {
              params: {
                ignoreThrottled,
                ignoreUnavailable,
                ...asyncOptions,
                ...request.params,
              },
              options: { ...request.options },
            };
          }
        ),
        switchMap(
          doPartialSearch(
            context.core.elasticsearch.client.asCurrentUser.eql,
            request,
            asyncOptions,
            options?.abortSignal
          )
        ),
        toKibanaSearchResponse(),
        takeUntilPollingComplete(asyncOptions.waitForCompletion)
      );
    },
  };
};
