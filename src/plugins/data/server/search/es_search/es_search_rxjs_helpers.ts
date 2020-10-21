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
import { from, of, timer, Observable, EMPTY } from 'rxjs';
import { map, switchMap, takeWhile, expand, mergeMap } from 'rxjs/operators';

import type { SearchResponse, ShardsResponse } from 'elasticsearch';
import type { ApiResponse } from '@elastic/elasticsearch';
import type { Assign } from 'utility-types';
import type { TransportRequestPromise } from '@elastic/elasticsearch/lib/Transport';

import { shimAbortSignal } from './shim_abort_signal';
import { toSnakeCase } from './to_snake_case';
import { getTotalLoaded } from './get_total_loaded';
import { isCompleteResponse, ISearchOptions } from '../../../common/search/es_search';

import type { IKibanaSearchRequest, IKibanaSearchResponse } from '../../../common/search/types';
import type { SearchUsage } from '../collectors';

export type KibanaSearchParams = Record<string, any>;

export interface EsRawResponse extends SearchResponse<any> {
  id?: string;
  is_partial?: boolean;
  is_running?: boolean;
}

export interface EsSearchArgs {
  params: KibanaSearchParams;
  options?: Record<string, any>;
}

type SearchMethod = (
  params: any,
  options?: any
) => TransportRequestPromise<ApiResponse<EsRawResponse>>;

export const doSearch = (
  searchClient: SearchMethod,
  abortSignal?: AbortSignal,
  usage?: SearchUsage
) => ({ params, options }: EsSearchArgs) =>
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
  asyncOptions: Record<string, any>,
  { abortSignal, waitForCompletion }: ISearchOptions,
  usage?: SearchUsage
) => ({ params, options }: EsSearchArgs) => {
  const isCompleted = (response: EsRawResponse) =>
    !Boolean(response.is_partial || response.is_running);

  const partialSearch = (id: string): Observable<ApiResponse<EsRawResponse>> =>
    from(
      partialSearchСlient(
        {
          id,
          ...toSnakeCase(asyncOptions),
        },
        options
      )
    ).pipe(
      expand(({ body }: ApiResponse<EsRawResponse>) => {
        if (waitForCompletion && !isCompleted(body) && body.id) {
          return timer(1000).pipe(mergeMap(() => partialSearch(body.id!)));
        }
        return EMPTY;
      })
    );

  return (requestId
    ? partialSearch(requestId)
    : of({ params, options }).pipe(
        switchMap(doSearch(searchClient, abortSignal, usage)),
        mergeMap((response) =>
          waitForCompletion && !isCompleted(response) && response.id
            ? partialSearch(response.id)
            : of(response)
        )
      )
  ).pipe(map(({ body }) => body));
};

export const toKibanaSearchResponse = <
  Input extends EsRawResponse = EsRawResponse,
  Output extends IKibanaSearchResponse<Input> = IKibanaSearchResponse<Input>
>() =>
  map<Input, Output>(
    (rawResponse: Input) =>
      ({
        id: rawResponse.id,
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

export const takeUntilPollingComplete = (waitForCompletion: boolean = false) =>
  takeWhile(
    (response: IKibanaSearchResponse) => waitForCompletion && !isCompleteResponse(response),
    true
  );
