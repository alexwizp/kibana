/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */
import { monaco } from './monaco_imports';
import type { LangModuleType } from './types';

export function registerLanguage(language: LangModuleType) {
  const { ID, lexerRules, languageConfiguration, onLanguage } = language;

  monaco.languages.register({ id: ID });

  monaco.languages.onLanguage(ID, async () => {
    if (lexerRules) {
      monaco.languages.setMonarchTokensProvider(ID, lexerRules);
    }

    if (languageConfiguration) {
      monaco.languages.setLanguageConfiguration(ID, languageConfiguration);
    }

    await onLanguage?.();
  });
}

export function registerTheme(id: string, themeData: monaco.editor.IStandaloneThemeData) {
  try {
    monaco.editor.defineTheme(id, themeData);
  } catch (e) {
    // nothing to be here
  }
}
