/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { useKibana } from '../../../../kibana_react/public';
import { UnifiedSearchTopNav } from './nav_component';
import type { UnifiedSearchServices } from '../types';
import type { UnifiedSearchAppProps } from '../app';
import { useChromeVisibility } from '../utils/use_chrome_visibility';
import { useContextAppState } from '../utils/use_app_state';

export const UnifiedSearchWrapper = ({ onAppLeave }: UnifiedSearchAppProps) => {
  const { services } = useKibana<UnifiedSearchServices>();
  const { appState, setAppState } = useContextAppState({ services });
  setAppState({
    query: services.data.query.queryString.getQuery(),
    timeRange: services.data.query.timefilter.timefilter.getTime(),
  });

  const isChromeVisible = useChromeVisibility(services.chrome);

  return (
    <div>
      <UnifiedSearchTopNav
        isChromeVisible={isChromeVisible}
        currentAppState={appState}
        setAppState={setAppState}
        onAppLeave={onAppLeave}
      />
      <div>Hello world!</div>
    </div>
  );
};
