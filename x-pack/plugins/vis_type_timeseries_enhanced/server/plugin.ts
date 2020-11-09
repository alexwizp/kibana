/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { PluginInitializerContext, Logger } from 'src/core/server';

export class VisTypeTimeseriesEnhanced {
  private logger: Logger;

  constructor(private readonly initializerContext: PluginInitializerContext) {
    this.logger = initializerContext.logger.get('vis_type_timeseries_enhanced');
  }

  public async setup() {
    this.logger.debug('Setting up VisTypeTimeseriesEnhanced');
  }

  public start() {}

  public stop() {}
}
