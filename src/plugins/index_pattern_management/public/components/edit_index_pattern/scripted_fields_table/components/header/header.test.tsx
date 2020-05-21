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
import { render } from 'enzyme';
import { RouteComponentProps } from 'react-router-dom';
import { ScopedHistory } from 'kibana/public';

import { Header } from './header';

describe('Header', () => {
  test('should render normally', () => {
    const component = render(
      <Header.WrappedComponent
        indexPatternId="test"
        history={({} as unknown) as ScopedHistory}
        location={({} as unknown) as RouteComponentProps['location']}
        match={({} as unknown) as RouteComponentProps['match']}
      />
    );

    expect(component).toMatchSnapshot();
  });
});
