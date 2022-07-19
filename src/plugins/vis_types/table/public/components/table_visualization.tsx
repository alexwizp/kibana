/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import './table_visualization.scss';
import React, { useLayoutEffect } from 'react';
import classNames from 'classnames';
import { METRIC_TYPE } from '@kbn/analytics';
import { CoreStart, KibanaExecutionContext } from '@kbn/core/public';
import { IInterpreterRenderHandlers } from '@kbn/expressions-plugin';
import type { PersistedState } from '@kbn/visualizations-plugin/public';
import { KibanaContextProvider } from '@kbn/kibana-react-plugin/public';
import { getUsageCollectionStart } from '../services';
import { TableVisConfig, TableVisData } from '../types';
import { TableVisBasic } from './table_vis_basic';
import { TableVisSplit } from './table_vis_split';
import { useUiState } from '../utils';

interface TableVisualizationComponentProps {
  core: CoreStart;
  handlers: IInterpreterRenderHandlers;
  visData: TableVisData;
  visConfig: TableVisConfig;
}

/** @internal **/
const extractContainerType = (context?: KibanaExecutionContext): string | undefined => {
  if (context) {
    const recursiveGet = (item: KibanaExecutionContext): KibanaExecutionContext | undefined => {
      if (item.type) {
        return item;
      } else if (item.child) {
        return recursiveGet(item.child);
      }
    };
    return recursiveGet(context)?.type;
  }
};

const TableVisualizationComponent = ({
  core,
  handlers,
  visData: { direction, table, tables },
  visConfig,
}: TableVisualizationComponentProps) => {
  useLayoutEffect(() => {
    // Temporary solution: DataGrid should provide onRender callback
    setTimeout(() => {
      const usageCollection = getUsageCollectionStart();
      const containerType = extractContainerType(handlers.getExecutionContext());
      const visualizationType = 'agg_based';

      if (usageCollection && containerType) {
        const counterEvents = [
          `render_${visualizationType}_table`,
          !table ? `render_${visualizationType}_table_split` : undefined,
        ].filter(Boolean) as string[];

        usageCollection.reportUiCounter(containerType, METRIC_TYPE.COUNT, counterEvents);
      }
      handlers.done();
    }, 300);
  }, [handlers, table]);

  const uiStateProps = useUiState(handlers.uiState as PersistedState);

  const className = classNames('tbvChart', {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    tbvChart__splitColumns: direction === 'column',
  });

  return (
    <core.i18n.Context>
      <KibanaContextProvider services={core}>
        <div className={className} data-test-subj="tbvChart">
          {table ? (
            <TableVisBasic
              fireEvent={handlers.event}
              table={table}
              visConfig={visConfig}
              uiStateProps={uiStateProps}
            />
          ) : (
            <TableVisSplit
              fireEvent={handlers.event}
              tables={tables}
              visConfig={visConfig}
              uiStateProps={uiStateProps}
            />
          )}
        </div>
      </KibanaContextProvider>
    </core.i18n.Context>
  );
};

// default export required for React.Lazy
// eslint-disable-next-line import/no-default-export
export { TableVisualizationComponent as default };
