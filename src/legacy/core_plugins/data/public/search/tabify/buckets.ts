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

import { get, isPlainObject, keys, findKey } from 'lodash';
import moment from 'moment';
import { AggConfig } from '../aggs/agg_config';
import { TimeRange } from './types';
import { AggResponseBucket } from '../types';

type AggParams = AggConfig['params'] & {
  drop_partials: boolean;
  ranges: TimeRange[];
};

export class TabifyBuckets {
  length: number;
  objectMode: boolean;
  buckets: any;
  _keys: any[] = [];

  constructor(aggResp: any, aggParams?: AggParams, timeRange?: TimeRange) {
    if (aggResp.buckets) {
      this.buckets = aggResp.buckets;
    } else if (aggResp) {
      // Some Bucket Aggs only return a single bucket (like filter).
      // In those instances, the aggResp is the content of the single bucket.
      this.buckets = [aggResp];
    } else {
      this.buckets = [];
    }

    this.objectMode = isPlainObject(this.buckets);
    if (this.objectMode) {
      this._keys = keys(this.buckets);
      this.length = this._keys.length;
    } else {
      this.length = this.buckets.length;
    }

    if (this.length && aggParams) {
      this.orderBucketsAccordingToParams(aggParams);
      if (aggParams.drop_partials) {
        this.dropPartials(aggParams, timeRange);
      }
    }
  }

  forEach(fn: (bucket: any, key: any) => void) {
    const buckets = this.buckets;

    if (this.objectMode) {
      this._keys.forEach(key => {
        fn(buckets[key], key);
      });
    } else {
      buckets.forEach((bucket: AggResponseBucket) => {
        fn(bucket, bucket.key);
      });
    }
  }

  private isRangeEqual(range1: TimeRange, range2: TimeRange) {
    return (
      get(range1, 'from', null) === get(range2, 'from', null) &&
      get(range1, 'to', null) === get(range2, 'to', null)
    );
  }

  private orderBucketsAccordingToParams(params: AggParams) {
    if (params.filters && this.objectMode) {
      this._keys = params.filters.map((filter: any) => {
        const query = get(filter, 'input.query.query_string.query', filter.input.query);
        const queryString = typeof query === 'string' ? query : JSON.stringify(query);
        return filter.label || queryString || '*';
      });
    } else if (params.ranges && this.objectMode) {
      this._keys = params.ranges.map((range: TimeRange) => {
        return findKey(this.buckets, (el: TimeRange) => this.isRangeEqual(el, range));
      });
    } else if (params.ranges && params.field.type !== 'date') {
      let ranges = params.ranges;
      if (params.ipRangeType) {
        ranges = params.ipRangeType === 'mask' ? ranges.mask : ranges.fromTo;
      }
      this.buckets = ranges.map((range: any) => {
        if (range.mask) {
          return this.buckets.find((el: AggResponseBucket) => el.key === range.mask);
        }

        return this.buckets.find((el: TimeRange) => this.isRangeEqual(el, range));
      });
    }
  }

  // dropPartials should only be called if the aggParam setting is enabled,
  // and the agg field is the same as the Time Range.
  private dropPartials(params: AggParams, timeRange?: TimeRange) {
    if (
      !timeRange ||
      this.buckets.length <= 1 ||
      this.objectMode ||
      params.field.name !== timeRange.name
    ) {
      return;
    }

    const interval = this.buckets[1].key - this.buckets[0].key;

    this.buckets = this.buckets.filter((bucket: AggResponseBucket) => {
      if (moment(bucket.key).isBefore(timeRange.gte)) {
        return false;
      }
      if (moment(bucket.key + interval).isAfter(timeRange.lte)) {
        return false;
      }
      return true;
    });

    this.length = this.buckets.length;
  }
}
