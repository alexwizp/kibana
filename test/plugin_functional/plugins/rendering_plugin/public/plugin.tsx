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

import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { Plugin, CoreSetup } from 'kibana/public';

export class RenderingPlugin implements Plugin {
  public setup(core: CoreSetup) {
    core.application.register({
      id: 'rendering',
      title: 'Rendering',
      appRoute: '/render',
      async mount(context, { element }) {
        render(<h1 data-test-subj="renderingHeader">rendering service</h1>, element);

        return () => unmountComponentAtNode(element);
      },
    });
  }

  public start() {}

  public stop() {}
}
