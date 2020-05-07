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
import { PluginInitializerContext, CoreSetup, CoreStart, Plugin } from 'src/core/public';
import { DataPublicPluginStart } from 'src/plugins/data/public';
import {
  IndexPatternManagementService,
  IndexPatternManagementServiceSetup,
  IndexPatternManagementServiceStart,
} from './service';

import { ManagementSetup, ManagementApp } from '../../management/public';

export interface IndexPatternManagementSetupDependencies {
  management: ManagementSetup;
}

export interface IndexPatternManagementStartDependencies {
  data: DataPublicPluginStart;
}

export type IndexPatternManagementSetup = IndexPatternManagementServiceSetup;

export type IndexPatternManagementStart = IndexPatternManagementServiceStart;

const sectionsHeader = i18n.translate('indexPatternManagement.indexPattern.sectionsHeader', {
  defaultMessage: 'Index Patterns',
});

export class IndexPatternManagementPlugin
  implements
    Plugin<
      IndexPatternManagementSetup,
      IndexPatternManagementStart,
      IndexPatternManagementSetupDependencies,
      IndexPatternManagementStartDependencies
    > {
  private readonly indexPatternManagementService = new IndexPatternManagementService();
  private managementApp?: ManagementApp;

  constructor(initializerContext: PluginInitializerContext) {}

  public setup(
    core: CoreSetup<IndexPatternManagementStartDependencies, IndexPatternManagementStart>,
    { management }: IndexPatternManagementSetupDependencies
  ) {
    const kibanaSection = management.sections.getSection('kibana');

    if (!kibanaSection) {
      throw new Error('`kibana` management section not found.');
    }

    this.managementApp = kibanaSection.registerApp({
      id: 'indexPatterns',
      title: sectionsHeader,
      order: 0,
      mount: async params => {
        const { mountManagementSection } = await import('./management_app');

        return mountManagementSection(core.getStartServices, params);
      },
    });

    return this.indexPatternManagementService.setup({ httpClient: core.http });
  }

  public start(core: CoreStart, plugins: IndexPatternManagementStartDependencies) {
    if (!core.application.capabilities.management.kibana.index_patterns) {
      this.managementApp!.disable();
    }

    return this.indexPatternManagementService.start();
  }

  public stop() {
    this.indexPatternManagementService.stop();
  }
}
