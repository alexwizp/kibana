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

import { AUTO_INTERVAL } from '../../../common/constants';
import { extractTimefieldName } from '../../../common/timefield_utils';

const DEFAULT_TIME_FIELD = '@timestamp';

export function getIntervalAndTimefield(panel, series = {}, indexPatternObject) {
  const getDefaultTimeField = () => indexPatternObject?.timeFieldName ?? DEFAULT_TIME_FIELD;

  const timeField =
    (series.override_index_pattern && extractTimefieldName(series.series_time_field)) ||
    extractTimefieldName(panel.time_field) ||
    getDefaultTimeField();

  let interval = panel.interval;
  let maxBars = panel.max_bars;

  if (series.override_index_pattern) {
    interval = series.series_interval;
    maxBars = series.series_max_bars;
  }

  return {
    timeField,
    interval: interval || AUTO_INTERVAL,
    maxBars,
  };
}
