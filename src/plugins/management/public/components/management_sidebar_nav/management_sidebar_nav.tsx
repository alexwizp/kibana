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

import { EuiIcon, EuiSideNav, EuiSideNavItemType, EuiScreenReaderOnly } from '@elastic/eui';
import { i18n } from '@kbn/i18n';
import React, { useState } from 'react';
import { ManagementItem } from '../../management_item';

import './_index.scss';

interface ManagementSidebarNavProps {
  sections: ManagementItem[];
  onManagementSectionSelected: (id: string, path: string) => void;
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
  onManagementSectionSelected,
}: ManagementSidebarNavProps) => {
  const HEADER_ID = 'stack-management-nav-header';
  const [isSideNavOpenOnMobile, setIsSideNavOpenOnMobile] = useState(false);
  const toggleOpenOnMobile = () => setIsSideNavOpenOnMobile(!isSideNavOpenOnMobile);

  const toNavItems = (managementSections: ManagementItem[]) => {
    if (!managementSections || !managementSections.length) {
      return undefined;
    }

    return (managementSections || [])
      .filter(section => section.getEnabledItems())
      .map(section => ({
        ...createNavItem(section),
      }));
  };

  const createNavItem = (section: ManagementItem): EuiSideNavItemType<any> => {
    const iconType = section.euiIconType || section.icon;

    return {
      id: section.id,
      name: section.title,
      isSelected: section.id === selectedId,
      icon: iconType ? <EuiIcon type={iconType} size="m" /> : undefined,
      items: toNavItems(section.apps),
      onClick: () => section.basePath && onManagementSectionSelected(section.id, section.basePath),
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
        items={toNavItems(sections)}
        className="mgtSideBarNav"
      />
    </>
  );
};
