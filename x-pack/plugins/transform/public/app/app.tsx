/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import React, { useContext, FC } from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { Router, Redirect, Route, Switch } from 'react-router-dom';
import { AppMountParameters } from 'kibana/public';

import { FormattedMessage } from '@kbn/i18n/react';

import { KibanaContextProvider } from '../../../../../src/plugins/kibana_react/public';

import { API_BASE_PATH } from '../../common/constants';

import { SectionError } from './components';
import { SECTION_SLUG } from './constants';
import { AuthorizationContext, AuthorizationProvider } from './lib/authorization';
import { AppDependencies } from './app_dependencies';

import { CloneTransformSection } from './sections/clone_transform';
import { CreateTransformSection } from './sections/create_transform';
import { TransformManagementSection } from './sections/transform_management';

export const App: FC<{ history: AppMountParameters['history'] }> = ({ history }) => {
  const { apiError } = useContext(AuthorizationContext);
  if (apiError !== null) {
    return (
      <SectionError
        title={
          <FormattedMessage
            id="xpack.transform.app.checkingPrivilegesErrorMessage"
            defaultMessage="Error fetching user privileges from the server."
          />
        }
        error={apiError}
      />
    );
  }

  return (
    <div data-test-subj="transformApp">
      <Router history={history}>
        <Switch>
          <Route
            path={`/${SECTION_SLUG.CLONE_TRANSFORM}/:transformId`}
            component={CloneTransformSection}
          />
          <Route
            path={`/${SECTION_SLUG.CREATE_TRANSFORM}/:savedObjectId`}
            component={CreateTransformSection}
          />
          <Route exact path={`/${SECTION_SLUG.HOME}`} component={TransformManagementSection} />
          <Redirect from="" to={`/${SECTION_SLUG.HOME}`} />
          <Redirect from="/" to={`/${SECTION_SLUG.HOME}`} />
        </Switch>
      </Router>
    </div>
  );
};

export const renderApp = (element: HTMLElement, appDependencies: AppDependencies) => {
  const I18nContext = appDependencies.i18n.Context;

  render(
    <KibanaContextProvider services={appDependencies}>
      <AuthorizationProvider privilegesEndpoint={`${API_BASE_PATH}privileges`}>
        <I18nContext>
          <App history={appDependencies.history} />
        </I18nContext>
      </AuthorizationProvider>
    </KibanaContextProvider>,
    element
  );

  return () => {
    unmountComponentAtNode(element);
  };
};
