/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import expect from 'expect.js';
import { getDocCountQueryString } from '../../../../../plugins/uptime/public/components/queries/empty_state/get_doc_count';
import docCount from './fixtures/doc_count';

export default function ({ getService }) {
  describe('docCount query', () => {
    const supertest = getService('supertest');

    it(`will fetch the index's count`, async () => {
      const getDocCountQuery = {
        operationName: null,
        query: getDocCountQueryString,
        variables: {},
      };
      const {
        body: { data },
      } = await supertest
        .post('/api/uptime/graphql')
        .set('kbn-xsrf', 'foo')
        .send({ ...getDocCountQuery });

      expect(data).to.eql(docCount);
    });
  });
}
