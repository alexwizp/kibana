/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { SavedObjectsType } from '../../../../../../src/core/server';

import { savedQuerySavedObjectType, packSavedObjectType } from '../../../common/types';

export const savedQuerySavedObjectMappings: SavedObjectsType['mappings'] = {
  properties: {
    description: {
      type: 'text',
    },
    id: {
      type: 'keyword',
    },
    query: {
      type: 'text',
    },
    created_at: {
      type: 'date',
    },
    created_by: {
      type: 'text',
    },
    platform: {
      type: 'keyword',
    },
    version: {
      type: 'keyword',
    },
    updated_at: {
      type: 'date',
    },
    updated_by: {
      type: 'text',
    },
    interval: {
      type: 'keyword',
    },
    ecs_mapping: {
      type: 'object',
      enabled: false,
    },
  },
};

export const savedQueryType: SavedObjectsType = {
  name: savedQuerySavedObjectType,
  hidden: false,
  namespaceType: 'multiple-isolated',
  mappings: savedQuerySavedObjectMappings,
};

export const packSavedObjectMappings: SavedObjectsType['mappings'] = {
  properties: {
    description: {
      type: 'text',
    },
    name: {
      type: 'text',
    },
    created_at: {
      type: 'date',
    },
    created_by: {
      type: 'keyword',
    },
    updated_at: {
      type: 'date',
    },
    updated_by: {
      type: 'keyword',
    },
    enabled: {
      type: 'boolean',
    },
    queries: {
      properties: {
        id: {
          type: 'keyword',
        },
        query: {
          type: 'text',
        },
        interval: {
          type: 'text',
        },
        platform: {
          type: 'keyword',
        },
        version: {
          type: 'keyword',
        },
        ecs_mapping: {
          type: 'object',
          enabled: false,
        },
      },
    },
  },
};

export const packType: SavedObjectsType = {
  name: packSavedObjectType,
  hidden: false,
  namespaceType: 'multiple-isolated',
  mappings: packSavedObjectMappings,
};
