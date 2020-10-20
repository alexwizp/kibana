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
import { from, of, timer, Observable } from 'rxjs';
import { map, mergeMap, switchMap, expand, takeWhile } from 'rxjs/operators';

import type { SearchResponse, ShardsResponse } from 'elasticsearch';
import type { ApiResponse } from '@elastic/elasticsearch';
import type { IUiSettingsClient } from 'src/core/server';
import type { Assign } from 'utility-types';
import type { SharedGlobalConfig } from 'kibana/server';
import type { TransportRequestPromise } from '@elastic/elasticsearch/lib/Transport';

import { shimAbortSignal } from './shim_abort_signal';
import { toSnakeCase } from './to_snake_case';
import { getAsyncOptions, getDefaultSearchParams } from './get_default_search_params';
import { getTotalLoaded } from './get_total_loaded';
import { isCompleteResponse, ISearchOptions } from '../../../common/search/es_search';

import type { IEsSearchRequest } from '../../../common/search/es_search';
import type { IKibanaSearchRequest, IKibanaSearchResponse } from '../../../common/search/types';
import type { AsyncOptions } from './get_default_search_params';
import type { SearchUsage } from '../collectors';

export type KibanaSearchParams = Record<string, any>;

export interface EsRawResponse extends SearchResponse<any> {
  id?: string;
  is_partial?: boolean;
  is_running?: boolean;
}

type MapArgsFn = (
  params: KibanaSearchParams,
  config: SharedGlobalConfig
) => SearchArgs | Promise<SearchArgs>;
type SearchMethod = (
  params: any,
  options?: any
) => TransportRequestPromise<ApiResponse<EsRawResponse>>;

const isPartialRequestData = (response: EsRawResponse) =>
  Boolean(response.is_partial || response.is_running);

export interface SearchArgs {
  params: KibanaSearchParams;
  options?: Record<string, any>;
}

export const getSearchArgs = (uiSettingsClient: IUiSettingsClient, mapArgsFn: MapArgsFn) =>
  mergeMap(async (config: SharedGlobalConfig) => {
    const params = {
      ...(await getDefaultSearchParams(uiSettingsClient)),
    };

    return mapArgsFn ? await mapArgsFn(params, config) : { params };
  });

export const doSearch = (
  searchClient: SearchMethod,
  abortSignal?: AbortSignal,
  usage?: SearchUsage
) => ({ params, options }: SearchArgs) =>
  from(
    new Promise<EsRawResponse>(async (resolve, reject) => {
      try {
        const apiResponse = await shimAbortSignal(
          searchClient(toSnakeCase(params), options && toSnakeCase(options)),
          abortSignal
        );
        const rawResponse = (apiResponse as ApiResponse<EsRawResponse>).body;

        usage?.trackSuccess(rawResponse.took);

        resolve(rawResponse);
      } catch (e) {
        usage?.trackError();
        reject(e);
      }
    })
  );

export const doPartialSearch = (
  searchClient: SearchMethod,
  partialSearchСlient: SearchMethod,
  requestId: IKibanaSearchRequest['id'],
  asyncOptions: AsyncOptions,
  { abortSignal, waitForCompletion }: ISearchOptions,
  usage?: SearchUsage
) => ({ params, options }: SearchArgs) => {
  const isCompleted = (response: EsRawResponse) =>
    waitForCompletion && isPartialRequestData(response) && response.id;

  const partialSearch = (id: string): Observable<EsRawResponse> =>
    from(
      partialSearchСlient(
        {
          id,
          ...toSnakeCase(asyncOptions),
        },
        options
      )
    ).pipe(
      expand(({ body }: ApiResponse<EsRawResponse>) =>
        isCompleted(body) ? of(body) : timer(1000).pipe(switchMap(() => partialSearch(body.id!)))
      )
    );

  return request.id
    ? partialSearch(request.id)
    : of({ params, options }).pipe(
        switchMap(doSearch(searchClient, abortSignal, usage)),
        expand((response) => (isCompleted(response) ? of(response) : partialSearch(response.id!)))
      );
};

export const toKibanaSearchResponse = <
  Input extends EsRawResponse = EsRawResponse,
  Output extends IKibanaSearchResponse<Input> = IKibanaSearchResponse<Input>
>() =>
  map<Input, Output>(
    (rawResponse: Input) =>
      ({
        isPartial: rawResponse.is_partial || false,
        isRunning: rawResponse.is_running || false,
        rawResponse,
      } as Output)
  );

export const includeTotalLoaded = () =>
  map(
    (response: IKibanaSearchResponse) =>
      ({
        ...response,
        ...(response.rawResponse._shards && getTotalLoaded(response.rawResponse._shards)),
      } as Assign<IKibanaSearchResponse, ShardsResponse>)
  );

export const takeUntilPollingComplete = (waitForCompletion: boolean) =>
  takeWhile(
    (response: IKibanaSearchResponse) => waitForCompletion && !isCompleteResponse(response),
    true
  );
