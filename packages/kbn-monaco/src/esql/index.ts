/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { LangModuleType } from '../types';
import { ID } from './constants';

const getRuleGroup = (tokens: string[], color: string) =>
  tokens.map((i) => ({
    token: i + '.esql',
    foreground: color,
  }));

export const ESQLLang: LangModuleType = {
  ID,
  tokensProvider: async () => {
    const { ESQLTokensProvider } = await import('./lib/monaco/esql_tokens_provider');

    return new ESQLTokensProvider();
  },
  customTheme: {
    ID: 'testTheme',
    themeData: {
      base: 'vs',
      inherit: false,
      rules: [
        ...getRuleGroup(
          [
            'unquoted_identifier',
            'eval',
            'explain',
            'from',
            'row',
            'stats',
            'where',
            'sort',
            'limit',
            'project',
          ],
          '#1d67bd'
        ),
        ...getRuleGroup(['eq', 'minus', 'by', 'lp'], '#bd781d'),
      ],
      colors: {
        'by.esql': '#ff0000',
      },
    },
  },
};
