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

import { CreateManagementItemArgs, MANAGEMENT_SECTION_TYPE, Mount } from './types';

export class ManagementItem {
  public readonly id: string = '';
  public readonly title: string = '';
  public readonly apps: any[] = [];
  public readonly order: number;
  public readonly euiIconType?: string;
  public readonly icon?: string;
  public readonly mount?: Mount;

  public enabled: boolean = true;
  public basePath?: string;
  public type: MANAGEMENT_SECTION_TYPE;

  constructor({
    id,
    title,
    order = 100,
    euiIconType,
    basePath,
    icon,
    mount,
    type,
  }: CreateManagementItemArgs) {
    this.id = id;
    this.title = title;
    this.order = order;
    this.euiIconType = euiIconType;
    this.icon = icon;
    this.basePath = basePath;
    this.mount = mount;
    this.type = type || MANAGEMENT_SECTION_TYPE.SECTION;
  }

  registerApp(args: CreateManagementItemArgs) {
    if (this.getApp(args.id)) {
      throw new Error(`Management app already registered - id: ${args.id}, title: ${args.title}`);
    }
    const basePath = `/${this.id}/${args.id}`;

    const section = new ManagementItem({
      ...args,
      type: MANAGEMENT_SECTION_TYPE.APP,
      basePath,
    });

    this.apps.push(section);

    return section;
  }

  getApp(id: string) {
    return this.apps.find(app => app.id === id);
  }

  getEnabledItems() {
    return this.apps.filter(app => app.enabled).sort((a, b) => a.order - b.order);
  }

  disable() {
    this.enabled = false;
  }

  enable() {
    this.enabled = true;
  }
}
