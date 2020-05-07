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

import { i18n } from '@kbn/i18n';
import { INDEX_PATTERN_MANAGEMENT_SECTION_PATH } from '../../../data/public';

export function getListBreadcrumbs() {
  return [
    {
      text: i18n.translate('indexPatternManagement.indexPatterns.listBreadcrumb', {
        defaultMessage: 'Index patterns',
      }),
      href: `${INDEX_PATTERN_MANAGEMENT_SECTION_PATH}/patterns`,
    },
  ];
}

export function getCreateBreadcrumbs() {
  return [
    ...getListBreadcrumbs(),
    {
      text: i18n.translate('indexPatternManagement.indexPatterns.createBreadcrumb', {
        defaultMessage: 'Create index pattern',
      }),
      href: `${INDEX_PATTERN_MANAGEMENT_SECTION_PATH}/create`,
    },
  ];
}

export function getEditBreadcrumbs($route) {
  const { indexPattern } = $route.current.locals;

  return [
    ...getListBreadcrumbs(),
    {
      text: indexPattern.title,
      href: `${INDEX_PATTERN_MANAGEMENT_SECTION_PATH}/patterns/${indexPattern.id}`,
    },
  ];
}

export function getEditFieldBreadcrumbs($route) {
  const { fieldName } = $route.current.params;

  return [
    ...getEditBreadcrumbs($route),
    {
      text: fieldName,
    },
  ];
}

export function getCreateFieldBreadcrumbs($route) {
  return [
    ...getEditBreadcrumbs($route),
    {
      text: i18n.translate('indexPatternManagement.indexPatterns.createFieldBreadcrumb', {
        defaultMessage: 'Create field',
      }),
    },
  ];
}
