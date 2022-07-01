/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { lazy } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';

import { ExpressionRenderDefinition } from '@kbn/expressions-plugin';
import { RangeFilterParams } from '@kbn/es-query';
import { KibanaContextProvider, KibanaThemeProvider } from '@kbn/kibana-react-plugin/public';
import { VisualizationContainer } from '@kbn/visualizations-plugin/public';
import { TimelionVisDependencies } from './plugin';
import { TimelionRenderValue } from './timelion_vis_fn';

const LazyTimelionVisComponent = lazy(() =>
  import('./async_services').then(({ TimelionVisComponent }) => ({ default: TimelionVisComponent }))
);
export const getTimelionVisRenderer: (
  deps: TimelionVisDependencies
) => ExpressionRenderDefinition<TimelionRenderValue> = (deps) => ({
  name: 'timelion_vis',
  displayName: 'Timelion visualization',
  reuseDomNode: true,
  render: (domNode, { visData, visParams, syncTooltips }, handlers) => {
    handlers.onDestroy(() => {
      unmountComponentAtNode(domNode);
    });

    const seriesList = visData?.sheet[0];
    const showNoResult = !seriesList || !seriesList.list.length;

    const onBrushEvent = (rangeFilterParams: RangeFilterParams) => {
      handlers.event({
        name: 'applyFilter',
        data: {
          timeFieldName: '*',
          filters: [
            {
              query: {
                range: {
                  '*': rangeFilterParams,
                },
              },
            },
          ],
        },
      });
    };

    render(
      <VisualizationContainer handlers={handlers} showNoResult={showNoResult}>
        <KibanaThemeProvider theme$={deps.theme.theme$}>
          <KibanaContextProvider services={{ ...deps }}>
            {seriesList && (
              <LazyTimelionVisComponent
                interval={visParams.interval}
                ariaLabel={visParams.ariaLabel}
                seriesList={seriesList}
                renderComplete={() =>
                  handlers.done({ renderTelemetry: { visType: 'timelion', visGroup: 'agg_based' } })
                }
                onBrushEvent={onBrushEvent}
                syncTooltips={syncTooltips}
              />
            )}
          </KibanaContextProvider>
        </KibanaThemeProvider>
      </VisualizationContainer>,
      domNode
    );
  },
});
