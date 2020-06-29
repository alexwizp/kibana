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
import React, { useState, useMemo, useCallback } from 'react';

import { EuiComboBox, EuiSpacer, EuiFormRow, EuiComboBoxProps } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import { VegaAdapter, InspectDataSets } from '../vega_adapter';
import { InspectorDataGrid } from './inspector_data_grid';

interface DataViewerProps {
  vegaAdapter: VegaAdapter;
}

export const DataViewer = ({ vegaAdapter }: DataViewerProps) => {
  const inspectDataSets = useMemo<InspectDataSets[]>(() => vegaAdapter.getInspectDataSets(), [
    vegaAdapter,
  ]);
  const [selectedView, setSelectedView] = useState<InspectDataSets>(inspectDataSets[0]);

  const onViewChange: EuiComboBoxProps<unknown>['onChange'] = useCallback(
    (selectedOptions) => {
      const newView = inspectDataSets.find((view) => view.id === selectedOptions[0].label);

      if (newView) {
        setSelectedView(newView);
      }
    },
    [inspectDataSets]
  );

  return (
    <>
      <EuiSpacer size="s" />
      <EuiFormRow
        fullWidth
        label={i18n.translate('visTypeVega.inspector.dataViewer.view', {
          defaultMessage: 'View:',
        })}
      >
        <EuiComboBox
          placeholder="Select Vega view"
          options={inspectDataSets.map((item: any) => ({
            label: item.id,
          }))}
          onChange={onViewChange}
          isClearable={false}
          fullWidth={true}
          singleSelection={{ asPlainText: true }}
          selectedOptions={[{ label: selectedView.id }]}
        />
      </EuiFormRow>
      <EuiSpacer size="s" />
      <EuiFormRow
        fullWidth
        label={i18n.translate('visTypeVega.inspector.dataViewer.data', {
          defaultMessage: 'Data:',
        })}
      >
        <InspectorDataGrid columns={selectedView.columns} data={selectedView.data} />
      </EuiFormRow>
    </>
  );
};
