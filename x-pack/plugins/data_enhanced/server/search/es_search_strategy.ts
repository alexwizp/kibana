/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { from } from 'rxjs';
import { first, switchMap, map, mergeMap } from 'rxjs/operators';
import { SearchResponse } from 'elasticsearch';
import { Observable } from 'rxjs';

import {
  getShardTimeout,
  shimHitsTotal,
  search,
  DoSearchFnArgs,
} from '../../../../../src/plugins/data/server';

import { getDefaultSearchParams, getAsyncOptions } from './get_default_search_params';

import type { ISearchStrategy, SearchUsage } from '../../../../../src/plugins/data/server';
import type { IEnhancedEsSearchRequest } from '../../common';
import { shimAbortSignal } from '../../../../../src/plugins/data/common/search';
import type {
  ISearchOptions,
  IEsSearchResponse,
} from '../../../../../src/plugins/data/common/search';
import type {
  SharedGlobalConfig,
  RequestHandlerContext,
  Logger,
} from '../../../../../src/core/server';

const { esSearch } = search;

export const enhancedEsSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  usage?: SearchUsage
): ISearchStrategy => {
  function asyncSearch(
    request: IEnhancedEsSearchRequest,
    options: ISearchOptions,
    context: RequestHandlerContext
  ) {
    const asyncOptions = getAsyncOptions();

    return config$.pipe(
      mergeMap(
        () =>
          new Promise<DoSearchFnArgs>(async (resolve) => {
            const defaultParams = await getDefaultSearchParams(context.core.uiSettings.client);

            resolve({
              params: {
                ...defaultParams,
                batchedReduceSize: 64,
                ...asyncOptions,
                ...request.params,
              },
            });
          })
      ),
      switchMap(
        esSearch.doPartialSearch(
          (...args) => context.core.elasticsearch.client.asCurrentUser.asyncSearch.submit(...args),
          (...args) => context.core.elasticsearch.client.asCurrentUser.asyncSearch.get(...args),
          request.id,
          asyncOptions,
          options
        )
      ),
      esSearch.trackSearchStatus(logger, usage),
      esSearch.toKibanaSearchResponse(),
      esSearch.includeTotalLoaded(),
      map((response) => ({
        ...response,
        rawResponse: shimHitsTotal(response.rawResponse.response),
      })),
      esSearch.takeUntilPollingComplete(options.waitForCompletion)
    );
  }

  const rollupSearch = async function (
    request: IEnhancedEsSearchRequest,
    options: ISearchOptions,
    context: RequestHandlerContext
  ): Promise<IEsSearchResponse> {
    const esClient = context.core.elasticsearch.client.asCurrentUser;
    const uiSettingsClient = await context.core.uiSettings.client;
    const config = await config$.pipe(first()).toPromise();
    const { body, index, ...params } = request.params!;
    const method = 'POST';
    const path = encodeURI(`/${index}/_rollup_search`);
    const querystring = esSearch.toSnakeCase({
      ...getShardTimeout(config),
      ...(await getDefaultSearchParams(uiSettingsClient)),
      ...params,
    });

    const promise = esClient.transport.request({
      method,
      path,
      body,
      querystring,
    });

    const esResponse = await shimAbortSignal(promise, options?.abortSignal);

    const response = esResponse.body as SearchResponse<any>;
    return {
      rawResponse: response,
      ...esSearch.getTotalLoaded(response._shards),
    };
  };

  return {
    search: (
      request: IEnhancedEsSearchRequest,
      options: ISearchOptions,
      context: RequestHandlerContext
    ) => {
      logger.debug(`search ${JSON.stringify(request.params) || request.id}`);

      const isAsync = request.indexType !== 'rollup';
      return isAsync
        ? asyncSearch(request, options, context)
        : from(rollupSearch(request, options, context));
    },
    cancel: async (context: RequestHandlerContext, id: string) => {
      logger.debug(`cancel ${id}`);

      await context.core.elasticsearch.client.asCurrentUser.asyncSearch.delete({
        id,
      });
    },
  };
};
