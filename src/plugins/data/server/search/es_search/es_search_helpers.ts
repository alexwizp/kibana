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
import { from } from 'rxjs';
import { map, mergeMap, takeWhile } from 'rxjs/operators';
import { SearchParams, SearchResponse } from 'elasticsearch';
import { ApiResponse } from '@elastic/elasticsearch';
import { IUiSettingsClient } from 'src/core/server';

import { ElasticsearchClient, SharedGlobalConfig } from 'kibana/server';
import { shimAbortSignal } from './shim_abort_signal';
import { toSnakeCase } from './to_snake_case';
import { IEsSearchRequest } from '../../../common/search/es_search';
import { IKibanaSearchResponse } from '../../../common/search/types';
import { getDefaultSearchParams } from './get_default_search_params';
import { SearchUsage } from '../collectors';

export type KibanaSearchParams = Record<string, any>;

export interface EsRawResponse extends SearchResponse<any> {
  is_partial?: boolean;
  is_running?: boolean;
}

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
  mergeMap<SharedGlobalConfig, Promise<SearchParams>>(async (config) => {
    const defaultParams = {
      ...(await getDefaultSearchParams(uiSettingsClient)),
      ...request.params,
    };

    return toSnakeCase(
      mapParamsFn
        ? mapParamsFn({
            defaultParams,
            config,
          })
        : defaultParams
    );
  });

export const doSearch = <
  Params extends KibanaSearchParams = KibanaSearchParams,
  Options = Record<string, any>
>(
  client: ElasticsearchClient,
  abortSignal?: AbortSignal,
  usage?: SearchUsage
) => (params: Params, options?: Options) =>
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

export const takeUntilPoolingAllData = () =>
  takeWhile<IKibanaSearchResponse>(
    (response) => Boolean(response.isPartial || response.isRunning),
    true
  );
