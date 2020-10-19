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
import { Logger } from 'kibana/server';
import { Observable } from 'rxjs';
import { switchMap, first } from 'rxjs/operators';

import type { SharedGlobalConfig } from 'kibana/server';

import { SearchUsage } from '../collectors/usage';
import {
  getSearchArgs,
  doSearch,
  includeTotalLoaded,
  toKibanaSearchResponse,
} from './es_search_rxjs_helpers';
import { getShardTimeout } from '..';

import type { ISearchStrategy } from '..';

export const esSearchStrategyProvider = (
  config$: Observable<SharedGlobalConfig>,
  logger: Logger,
  usage?: SearchUsage
): ISearchStrategy => ({
  search: (request, { abortSignal }, context) => {
    // Only default index pattern type is supported here.
    // See data_enhanced for other type support.
    if (!!request.indexType) {
      throw new Error(`Unsupported index pattern type ${request.indexType}`);
    }

    return config$.pipe(
      getSearchArgs(request, context.core.uiSettings.client, (defaultParams, config) => {
        delete defaultParams.ignoreThrottled;

        return {
          params: {
            ...defaultParams,
            ...getShardTimeout(config),
          },
        };
      }),
      switchMap(doSearch(context.core.elasticsearch.client.asCurrentUser, abortSignal, usage)),
      toKibanaSearchResponse(),
      includeTotalLoaded(),

      // OSS search strategy doesn't support of async search. We should complete stream on getting first response.
      first()
    );
  },
});
