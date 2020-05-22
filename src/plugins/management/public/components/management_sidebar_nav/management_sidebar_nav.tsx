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

import { EuiIcon, EuiSideNav, EuiScreenReaderOnly } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React, { useState } from 'react';
import { AppMountParameters } from 'kibana/public';
import { ManagementApp, ManagementSection } from '../../utils';

import './_index.scss';

import { ManagementItem } from '../../utils/management_item';
import { reactRouterNavigate } from '../../../../kibana_react/public';

interface ManagementSidebarNavProps {
  sections: ManagementSection[];
  history: AppMountParameters['history'];
  selectedId: string;
}

const headerLabel = i18n.translate('management.nav.label', {
  defaultMessage: 'Management',
});

const navMenuLabel = i18n.translate('management.nav.menu', {
  defaultMessage: 'Management menu',
});

/** @internal **/
export const ManagementSidebarNav = ({
  selectedId,
  sections,
  history,
}: ManagementSidebarNavProps) => {
  const HEADER_ID = 'stack-management-nav-header';
  const [isSideNavOpenOnMobile, setIsSideNavOpenOnMobile] = useState(false);
  const toggleOpenOnMobile = () => setIsSideNavOpenOnMobile(!isSideNavOpenOnMobile);

  const sectionsToNavItems = (managementSections: ManagementSection[]) => {
    return managementSections
      .filter((section) => section.getAppsEnabled())
      .map((section) => ({
        ...createNavItem(section, {
          items: appsToNavItems(section.apps),
        }),
      }));
  };

  const appsToNavItems = (managementApps: ManagementApp[]) => {
    return managementApps
      .filter((app) => app.enabled)
      .map((app) => ({
        ...createNavItem(app, {
          ...reactRouterNavigate(history, app.basePath),
        }),
      }));
  };

  const createNavItem = <T extends ManagementItem>(
    item: T,
    customParams: Record<string, any> = {}
  ) => {
    const iconType = item.euiIconType || item.icon;

    return {
      id: item.id,
      name: item.title,
      isSelected: item.id === selectedId,
      icon: iconType ? <EuiIcon type={iconType} size="m" /> : undefined,
      'data-test-subj': item.id,
      ...customParams,
    };
  };

  return (
    <>
      <EuiScreenReaderOnly>
        <h2 id={HEADER_ID}>{headerLabel}</h2>
      </EuiScreenReaderOnly>
      <EuiSideNav
        aria-labelledby={HEADER_ID}
        mobileTitle={navMenuLabel}
        toggleOpenOnMobile={toggleOpenOnMobile}
        isOpenOnMobile={isSideNavOpenOnMobile}
        items={sectionsToNavItems(sections)}
        className="mgtSideBarNav"
      />
    </>
  );
};
