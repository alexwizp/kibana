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
import { map, mergeMap, switchMap, expand } from 'rxjs/operators';
import { SearchParams, SearchResponse, ShardsResponse } from 'elasticsearch';
import { ApiResponse } from '@elastic/elasticsearch';
import { IUiSettingsClient } from 'src/core/server';
import { Assign } from 'utility-types';

import { ElasticsearchClient, SharedGlobalConfig } from 'kibana/server';
import { shimAbortSignal } from './shim_abort_signal';
import { toSnakeCase } from './to_snake_case';
import { IEsSearchRequest } from '../../../common/search/es_search';
import { IKibanaSearchRequest, IKibanaSearchResponse } from '../../../common/search/types';
import { AsyncOptions, getAsyncOptions, getDefaultSearchParams } from './get_default_search_params';
import { SearchUsage } from '../collectors';
import { getTotalLoaded } from './get_total_loaded';

export type KibanaSearchParams = Record<string, any>;

export interface EsRawResponse extends SearchResponse<any> {
  id?: string;
  is_partial?: boolean;
  is_running?: boolean;
}

const isPartialRequestData = (response: EsRawResponse) =>
  Boolean(response.is_partial || response.is_running);

export const getSearchParams = <Params extends KibanaSearchParams = KibanaSearchParams>(
  request: IEsSearchRequest,
  uiSettingsClient: IUiSettingsClient,
  mapParamsFn: ({
    defaultParams,
    config,
  }: {
    defaultParams: KibanaSearchParams;
    config: SharedGlobalConfig;
  }) => Params
) =>
  mergeMap(async (config: SharedGlobalConfig) => {
    const defaultParams = {
      ...(await getDefaultSearchParams(uiSettingsClient)),
      ...request.params,
    };

    return {
      params: toSnakeCase(
        mapParamsFn
          ? mapParamsFn({
              defaultParams,
              config,
            })
          : defaultParams
      ),
    } as SearchParams;
  });

export const doSearch = <
  Params extends KibanaSearchParams = KibanaSearchParams,
  Options = Record<string, any>
>(
  client: ElasticsearchClient,
  abortSignal?: AbortSignal,
  usage?: SearchUsage
) => ({ params, options }: { params: Params; options: Options }) =>
  from(
    new Promise<EsRawResponse>(async (resolve, reject) => {
      try {
        const apiResponse = await shimAbortSignal(client.search(params, options), abortSignal);
        const rawResponse = (apiResponse as ApiResponse<EsRawResponse>).body;

        usage?.trackSuccess(rawResponse.took);

        resolve(rawResponse);
      } catch (e) {
        usage?.trackError();
        reject(e);
      }
    })
  );

export const doAsyncSearch = <
  Params extends KibanaSearchParams = KibanaSearchParams,
  Options = Record<string, any>
>(
  client: ElasticsearchClient,
  request: IKibanaSearchRequest,
  asyncOptions: AsyncOptions = getAsyncOptions(),
  abortSignal?: AbortSignal,
  usage?: SearchUsage
) => ({ params, options }: { params: Params; options: Options }) => {
  const isCompleted = (response: EsRawResponse) =>
    asyncOptions.waitForCompletion && isPartialRequestData(response) && response.id;

  const asyncSearch = (id: string): Observable<EsRawResponse> =>
    from(
      client.asyncSearch.get<EsRawResponse>({
        id,
        ...toSnakeCase(asyncOptions),
      })
    ).pipe(
      expand(({ body }: ApiResponse<EsRawResponse>) =>
        isCompleted(body)
          ? of(body)
          : timer(asyncOptions!.pollInterval).pipe(switchMap(() => asyncSearch(body.id!)))
      )
    );

  return request.id
    ? asyncSearch(request.id)
    : of({ params, options }).pipe(
        switchMap(doSearch(client, abortSignal, usage)),
        expand((response) => (isCompleted(response) ? of(response) : asyncSearch(response.id!)))
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
        ...getTotalLoaded(response.rawResponse._shards),
      } as Assign<IKibanaSearchResponse, ShardsResponse>)
  );
