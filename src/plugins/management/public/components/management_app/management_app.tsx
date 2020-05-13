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
import { AppMountParameters } from 'kibana/public';
import { Route, Router, Switch } from 'react-router-dom';
import { EuiPage, EuiPageBody } from '@elastic/eui';
import { ManagementStart } from '../../types';

import { ManagementLandingPage } from '../langing';
import { ManagementSidebarNav } from '../management_sidebar_nav';
import { ManagementSectionWrapper } from '../management_section_wrapper';

import { ManagementItem } from '../../management_item';

import './_management_app.scss';

interface ManagementAppProps {
  appBasePath: string;
  history: AppMountParameters['history'];
  dependencies: ManagementAppDependencies;
}

export interface ManagementAppDependencies {
  management: ManagementStart;
  kibanaVersion: string;
}

export const ManagementApp = ({ dependencies, history }: ManagementAppProps) => {
  const [selectedId, setSelectedId] = useState('');
  const [sections, setSections] = useState<ManagementItem[]>();
  const onManagementSectionSelected = useCallback(
    (id: string, path: string) => {
      setSelectedId(id);
      history.push(path);
    },
    [history]
  );

  useEffect(() => {
    setSections(dependencies.management.sections.getSectionsEnabled());
  }, [dependencies.management.sections]);

  if (!sections) {
    return null;
  }

  return (
    <Router history={history}>
      <EuiPage>
        <ManagementSidebarNav
          selectedId={selectedId}
          sections={sections}
          onManagementSectionSelected={onManagementSectionSelected}
        />
        <EuiPageBody restrictWidth={true} className="mgtPage__body">
          <Switch>
            {sections.map(section =>
              section.apps.map(app => (
                <Route
                  path={`${app.basePath}`}
                  component={() => <ManagementSectionWrapper section={app} />}
                />
              ))
            )}
            <Route
              path={'/'}
              component={() => <ManagementLandingPage version={dependencies.kibanaVersion} />}
            />
          </Switch>
        </EuiPageBody>
      </EuiPage>
    </Router>
  );
};
