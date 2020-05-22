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
import React, { useState, useEffect, useCallback } from 'react';
import { Route, Router, Switch } from 'react-router-dom';
import {
  AppMountContext,
  AppMountParameters,
  ChromeBreadcrumb,
  ScopedHistory,
} from 'kibana/public';
import { I18nProvider } from '@kbn/i18n/react';
import { EuiPage, EuiPageBody } from '@elastic/eui';
import { ManagementStart } from '../../types';
import { ManagementSection, MANAGEMENT_BREADCRUMB } from '../../utils';

import { ManagementLandingPage } from '../langing';
import { ManagementSidebarNav } from '../management_sidebar_nav';
import { ManagementAppWrapper } from '../management_app_wrapper';

import { reactRouterNavigate } from '../../../../kibana_react/public';

import './_management_app.scss';

interface ManagementAppProps {
  appBasePath: string;
  context: AppMountContext;
  history: AppMountParameters['history'];
  dependencies: ManagementAppDependencies;
}

export interface ManagementAppDependencies {
  management: ManagementStart;
  kibanaVersion: string;
}

export const ManagementApp = ({ context, dependencies, history }: ManagementAppProps) => {
  const [selectedId, setSelectedId] = useState<string>('');
  const [sections, setSections] = useState<ManagementSection[]>();

  const onAppMounted = useCallback((id: string) => {
    setSelectedId(id);
    window.scrollTo(0, 0);
  }, []);

  const setBreadcrumbs = useCallback(
    (crumbs: ChromeBreadcrumb[] = [], appHistory?: ScopedHistory) => {
      const wrapBreadcrumb = (item: ChromeBreadcrumb, scopedHistory: ScopedHistory) => ({
        ...item,
        ...(item.href ? reactRouterNavigate(scopedHistory, item.href) : {}),
      });

      context.core.chrome.setBreadcrumbs([
        wrapBreadcrumb(MANAGEMENT_BREADCRUMB, history),
        ...crumbs.map((item) => wrapBreadcrumb(item, appHistory || history)),
      ]);
    },
    [context.core.chrome, history]
  );

  useEffect(() => {
    setSections(dependencies.management.sections.getSectionsEnabled());
  }, [dependencies.management.sections]);

  if (!sections) {
    return null;
  }

  return (
    <I18nProvider>
      <Router history={history}>
        <EuiPage>
          <ManagementSidebarNav selectedId={selectedId} sections={sections} history={history} />
          <EuiPageBody restrictWidth={true} className="mgtPage__body">
            <Switch>
              {sections.map((section) =>
                section.apps.map((app) => (
                  <Route
                    path={`${app.basePath}`}
                    component={() => (
                      <ManagementAppWrapper
                        app={app}
                        setBreadcrumbs={setBreadcrumbs}
                        onAppMounted={onAppMounted}
                        history={history.createSubHistory(app.basePath)}
                      />
                    )}
                  />
                ))
              )}
              <Route
                path={'/'}
                component={() => (
                  <ManagementLandingPage
                    version={dependencies.kibanaVersion}
                    setBreadcrumbs={setBreadcrumbs}
                  />
                )}
              />
            </Switch>
          </EuiPageBody>
        </EuiPage>
      </Router>
    </I18nProvider>
  );
};
