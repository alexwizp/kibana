/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import type { ElasticsearchClient } from '@kbn/core-elasticsearch-server';

import { errors } from '@elastic/elasticsearch';

import { updateConnectorStatus } from './update_connector_status';
import { ConnectorStatus } from '../types/connectors';

describe('updateConnectorStatus lib function', () => {
  const mockClient = {
    transport: {
      request: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should update connector index_name', async () => {
    mockClient.transport.request.mockImplementation(() => ({ result: 'updated' }));

    await expect(
      updateConnectorStatus(
        mockClient as unknown as ElasticsearchClient,
        'connectorId',
        ConnectorStatus.CONFIGURED
      )
    ).resolves.toEqual({ result: 'updated' });
    expect(mockClient.transport.request).toHaveBeenCalledWith({
      body: {
        status: 'configured',
      },
      method: 'PUT',
      path: '/_connector/connectorId/_status',
    });
  });

  it('should not index document if there is no connector', async () => {
    mockClient.transport.request.mockImplementationOnce(() => {
      return Promise.reject(
        new errors.ResponseError({
          statusCode: 404,
          body: {
            error: {
              type: `document_missing_exception`,
            },
          },
        } as any)
      );
    });
    await expect(
      updateConnectorStatus(
        mockClient as unknown as ElasticsearchClient,
        'connectorId',
        ConnectorStatus.CONFIGURED
      )
    ).rejects.toEqual(
      new errors.ResponseError({
        statusCode: 404,
        body: {
          error: {
            type: `document_missing_exception`,
          },
        },
      } as any)
    );
  });
});
