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

import { get } from 'lodash';
import React, { useEffect, useCallback } from 'react';

import { EuiFieldNumber, EuiFormRow, EuiIconTip, EuiFieldNumberProps } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n/react';
import { UI_SETTINGS } from '../../../../data/public';

import { AggParamEditorProps } from '../agg_param_props';

const label = (
  <>
    <FormattedMessage
      id="visDefaultEditor.controls.numberInterval.minimumIntervalLabel"
      defaultMessage="Minimum interval"
    />{' '}
    <EuiIconTip
      position="right"
      content={
        <FormattedMessage
          id="visDefaultEditor.controls.numberInterval.minimumIntervalTooltip"
          defaultMessage="Interval will be automatically scaled in the event that the provided value creates more buckets than specified by Advanced Setting's {histogramMaxBars}"
          values={{ histogramMaxBars: UI_SETTINGS.HISTOGRAM_MAX_BARS }}
        />
      }
      type="questionInCircle"
    />
  </>
);

const selectIntervalPlaceholder = i18n.translate(
  'visDefaultEditor.controls.numberInterval.selectIntervalPlaceholder',
  {
    defaultMessage: 'Enter an interval',
  }
);

function NumberIntervalParamEditor({
  agg,
  editorConfig,
  showValidation,
  value,
  setTouched,
  setValidity,
  setValue,
}: AggParamEditorProps<number | undefined>) {
  const base: number = get(editorConfig, 'interval.base') as number;
  const min = base || 0;
  const isValid = value !== undefined && Number(value) >= min;

  useEffect(() => {
    setValidity(isValid);
  }, [isValid, setValidity]);

  const onChange: EuiFieldNumberProps['onChange'] = useCallback(
    ({ target }) => setValue(isNaN(target.valueAsNumber) ? undefined : target.valueAsNumber),
    [setValue]
  );

  return (
    <EuiFormRow
      compressed
      label={label}
      fullWidth={true}
      isInvalid={showValidation && !isValid}
      helpText={get(editorConfig, 'interval.help')}
    >
      <EuiFieldNumber
        value={value}
        min={min}
        step={base || 'any'}
        data-test-subj={`visEditorInterval${agg.id}`}
        isInvalid={showValidation && !isValid}
        onChange={onChange}
        onBlur={setTouched}
        fullWidth={true}
        compressed
        placeholder={selectIntervalPlaceholder}
      />
    </EuiFormRow>
  );
}

export { NumberIntervalParamEditor };
