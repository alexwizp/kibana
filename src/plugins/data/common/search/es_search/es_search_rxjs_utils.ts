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

import { from, Observable, of, timer } from 'rxjs';
import { expand, map, mergeMap, switchMap, takeWhile } from 'rxjs/operators';

import type { ShardsResponse } from 'elasticsearch';
import type { TransportRequestPromise } from '@elastic/elasticsearch/lib/Transport';
import type { Assign } from 'utility-types';

import { ApiResponse } from '@elastic/elasticsearch';
import { shimAbortSignal } from './shim_abort_signal';
import { toSnakeCase } from './to_snake_case';
import { getTotalLoaded } from './get_total_loaded';
import { isCompleteResponse } from './utils';

import type { IEsRawSearchResponse, IPartialSearchOptions } from './types';
import type { IKibanaSearchRequest, IKibanaSearchResponse } from '../types';

type SearchMethod = <SearchResponse extends IEsRawSearchResponse = IEsRawSearchResponse>(
  params: any,
  options?: any
) => TransportRequestPromise<ApiResponse<SearchResponse>>;

export interface DoSearchFnArgs {
  params: Record<string, any>;
  options?: Record<string, any>;
}

export const doSearch = <SearchResponse extends IEsRawSearchResponse = IEsRawSearchResponse>(
  searchMethod: SearchMethod,
  abortSignal?: AbortSignal
) => ({ params, options }: DoSearchFnArgs) =>
  from(
    new Promise<ApiResponse<SearchResponse>>(async (resolve, reject) => {
      try {
        const apiResponse = await shimAbortSignal(
          searchMethod<SearchResponse>(toSnakeCase(params), options && toSnakeCase(options)),
          abortSignal
        );
        resolve(apiResponse);
      } catch (e) {
        reject(e);
      }
    })
  );

export const doPartialSearch = <SearchResponse extends IEsRawSearchResponse = IEsRawSearchResponse>(
  searchMethod: SearchMethod,
  partialSearchMethod: SearchMethod,
  requestId: IKibanaSearchRequest['id'],
  asyncOptions: Record<string, any>,
  { abortSignal, waitForCompletion, pollInterval }: IPartialSearchOptions
) => ({ params, options }: DoSearchFnArgs) => {
  const isCompleted = (response: SearchResponse) =>
    !Boolean(response.is_partial || response.is_running);

  const partialSearch = (id: string): Observable<ApiResponse<SearchResponse>> =>
    from(
      partialSearchMethod<SearchResponse>(
        {
          id,
          ...toSnakeCase(asyncOptions),
        },
        options
      )
    ).pipe(
      expand((r) => {
        if (waitForCompletion && !isCompleted(r.body) && r.body.id) {
          return timer(pollInterval ?? 1000).pipe(switchMap(() => partialSearch(r.body.id!)));
        }
        return of(r);
      })
    );

  return requestId
    ? partialSearch(requestId)
    : of({ params, options }).pipe(
        switchMap(doSearch<SearchResponse>(searchMethod, abortSignal)),
        mergeMap((response) =>
          waitForCompletion && !isCompleted(response.body) && response.body.id
            ? partialSearch(response.body.id)
            : of(response)
        )
      );
};

export const toKibanaSearchResponse = <
  SearchResponse extends IEsRawSearchResponse = IEsRawSearchResponse,
  KibanaResponse extends IKibanaSearchResponse = IKibanaSearchResponse<SearchResponse>
>() =>
  map<ApiResponse<SearchResponse>, KibanaResponse>(
    (response) =>
      ({
        id: response.body.id,
        isPartial: response.body.is_partial || false,
        isRunning: response.body.is_running || false,
        rawResponse: response.body,
      } as KibanaResponse)
  );

export const includeTotalLoaded = () =>
  map(
    (response: IKibanaSearchResponse) =>
      ({
        ...response,
        ...(response.rawResponse._shards && getTotalLoaded(response.rawResponse._shards)),
      } as Assign<IKibanaSearchResponse, ShardsResponse>)
  );

export const takeUntilPollingComplete = (waitForCompletion: boolean = false) =>
  takeWhile(
    (response: IKibanaSearchResponse) => waitForCompletion && !isCompleteResponse(response),
    true
  );
