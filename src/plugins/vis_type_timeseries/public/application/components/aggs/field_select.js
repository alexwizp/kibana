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

import React from 'react';
import { i18n } from '@kbn/i18n';
import PropTypes from 'prop-types';
import { EuiComboBox } from '@elastic/eui';

import { METRIC_TYPES } from '../../../../common/metric_types';
import { isFieldEnabled } from '../../lib/check_ui_restrictions';
import { extractTimefieldLabel } from '../../../../common/timefield_utils';

const isFieldTypeEnabled = (fieldRestrictions, fieldType) =>
  fieldRestrictions.length ? fieldRestrictions.includes(fieldType) : true;

export function FieldSelect({
  type,
  fields,
  indexPattern,
  value,
  onChange,
  disabled,
  restrict,
  placeholder,
  uiRestrictions,
  ...rest
}) {
  if (type === METRIC_TYPES.COUNT) {
    return null;
  }
  const selectedOptions = [];

  const options = Object.values(
    (fields[indexPattern] || []).reduce((acc, field) => {
      if (placeholder === field?.name) {
        placeholder = field.label;
      }

      if (
        isFieldTypeEnabled(restrict, field.type) &&
        isFieldEnabled(field.name, type, uiRestrictions)
      ) {
        const item = {
          value: field.name,
          label: field.label ?? field.name,
        };

        if (acc[field.type]) {
          acc[field.type].options.push(item);
        } else {
          acc[field.type] = {
            options: [item],
            label: field.type,
          };
        }

        if (extractTimefieldLabel(value) === item.label) {
          selectedOptions.push(item);
        }
      }

      return acc;
    }, {})
  );

  if (value && !selectedOptions.length) {
    onChange([]);
  }

  return (
    <EuiComboBox
      placeholder={placeholder}
      isDisabled={disabled}
      options={options}
      selectedOptions={selectedOptions}
      onChange={onChange}
      singleSelection={{ asPlainText: true }}
      {...rest}
    />
  );
}

FieldSelect.defaultProps = {
  indexPattern: '',
  disabled: false,
  restrict: [],
  placeholder: i18n.translate('visTypeTimeseries.fieldSelect.selectFieldPlaceholder', {
    defaultMessage: 'Select field...',
  }),
};

FieldSelect.propTypes = {
  disabled: PropTypes.bool,
  fields: PropTypes.object,
  id: PropTypes.string,
  indexPattern: PropTypes.string,
  onChange: PropTypes.func,
  restrict: PropTypes.array,
  type: PropTypes.string,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  uiRestrictions: PropTypes.object,
  placeholder: PropTypes.string,
};
