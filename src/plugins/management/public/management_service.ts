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

import { ManagementItem } from './management_item';
import { CreateManagementItemArgs, SectionsServiceSetup, SectionsServiceStart } from './types';

const getSectionByName = (sections: ManagementItem[], sectionId: ManagementItem['id']) => {
  return sections.find(section => section.id === sectionId);
};

export class ManagementService {
  private sections: ManagementItem[] = [];

  private getSection = (sectionId: ManagementItem['id']) =>
    getSectionByName(this.sections, sectionId);

  private register = (section: CreateManagementItemArgs) => {
    if (getSectionByName(this.sections, section.id)) {
      throw Error(`ManagementSection '${section.id}' already registered`);
    }

    const newSection = new ManagementItem(section);

    this.sections.push(newSection);
    return newSection;
  };

  setup(): SectionsServiceSetup {
    this.register({ id: 'kibana', title: 'Kibana', order: 30, euiIconType: 'logoKibana' });

    this.register({
      id: 'elasticsearch',
      title: 'Elasticsearch',
      order: 20,
      euiIconType: 'logoElasticsearch',
    });

    return {
      register: this.register,
      getSection: this.getSection,
    };
  }

  start(): SectionsServiceStart {
    return {
      getSections: () => this.sections,
      getSectionsEnabled: () =>
        this.sections
          .filter(section => section.enabled && section.apps.length)
          .sort((a, b) => a.order - b.order),
      getSection: this.getSection,
    };
  }
}
