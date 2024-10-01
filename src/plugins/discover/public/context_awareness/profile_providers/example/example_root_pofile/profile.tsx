/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the "Elastic License
 * 2.0", the "GNU Affero General Public License v3.0 only", and the "Server Side
 * Public License v 1"; you may not use this file except in compliance with, at
 * your election, the "Elastic License 2.0", the "GNU Affero General Public
 * License v3.0 only", or the "Server Side Public License, v 1".
 */

import { EuiBadge } from '@elastic/eui';
import { getFieldValue } from '@kbn/discover-utils';
import React from 'react';
import { RootProfileProvider, SolutionType } from '../../../profiles';

export const createExampleRootProfileProvider = (): RootProfileProvider => ({
  profileId: 'example-root-profile',
  isExperimental: true,
  profile: {
    getCellRenderers: (prev) => (params) => ({
      ...prev(params),
      '@timestamp': (props) => {
        const timestamp = getFieldValue(props.row, '@timestamp') as string;

        return (
          <EuiBadge color="hollow" title={timestamp} data-test-subj="exampleRootProfileTimestamp">
            {timestamp}
          </EuiBadge>
        );
      },
    }),
  },
  resolve: (params) => {
    if (params.solutionNavId != null) {
      return { isMatch: false };
    }

    return { isMatch: true, context: { solutionType: SolutionType.Default } };
  },
});
