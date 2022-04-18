/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import expect from '@kbn/expect';

import type {
  UpdateExceptionListSchema,
  ExceptionListSchema,
} from '@kbn/securitysolution-io-ts-list-types';
import { EXCEPTION_LIST_URL } from '@kbn/securitysolution-list-constants';
import { getExceptionResponseMockWithoutAutoGeneratedValues } from '@kbn/lists-plugin/common/schemas/response/exception_list_schema.mock';
import { getCreateExceptionListMinimalSchemaMock } from '@kbn/lists-plugin/common/schemas/request/create_exception_list_schema.mock';
import { getUpdateMinimalExceptionListSchemaMock } from '@kbn/lists-plugin/common/schemas/request/update_exception_list_schema.mock';
import { FtrProviderContext } from '../../common/ftr_provider_context';

import { deleteAllExceptions, removeExceptionListServerGeneratedProperties } from '../../utils';

// eslint-disable-next-line import/no-default-export
export default ({ getService }: FtrProviderContext) => {
  const supertest = getService('supertest');
  const log = getService('log');

  describe('update_exception_lists', () => {
    describe('update exception lists', () => {
      afterEach(async () => {
        await deleteAllExceptions(supertest, log);
      });

      it('should update a single exception list property of name using an id', async () => {
        // create a simple exception list
        await supertest
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMock())
          .expect(200);

        // update a exception list's name
        const updatedList: UpdateExceptionListSchema = {
          ...getUpdateMinimalExceptionListSchemaMock(),
          name: 'some other name',
        };

        const { body } = await supertest
          .put(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(updatedList)
          .expect(200);

        const outputList: Partial<ExceptionListSchema> = {
          ...getExceptionResponseMockWithoutAutoGeneratedValues(),
          name: 'some other name',
          version: 2,
        };
        const bodyToCompare = removeExceptionListServerGeneratedProperties(body);
        expect(bodyToCompare).to.eql(outputList);
      });

      it('should update a single exception list property of name using an auto-generated list_id', async () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { list_id, ...listNoId } = getCreateExceptionListMinimalSchemaMock();

        // create a simple exception list
        const { body: createListBody } = await supertest
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(listNoId)
          .expect(200);

        // update a exception list's name
        const updatedList: UpdateExceptionListSchema = {
          ...getUpdateMinimalExceptionListSchemaMock(),
          id: createListBody.id,
          name: 'some other name',
        };

        const { body } = await supertest
          .put(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(updatedList)
          .expect(200);

        const outputList: Partial<ExceptionListSchema> = {
          ...getExceptionResponseMockWithoutAutoGeneratedValues(),
          name: 'some other name',
          list_id: body.list_id,
          version: 2,
        };
        const bodyToCompare = removeExceptionListServerGeneratedProperties(body);
        expect(bodyToCompare).to.eql(outputList);
      });

      it('should change the version of a list when it updates two properties', async () => {
        // create a simple exception list
        await supertest
          .post(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(getCreateExceptionListMinimalSchemaMock())
          .expect(200);

        // update a simple exception list property of name and description
        // update a exception list's name
        const updatedList: UpdateExceptionListSchema = {
          ...getUpdateMinimalExceptionListSchemaMock(),
          name: 'some other name',
          description: 'some other description',
        };

        const { body } = await supertest
          .put(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(updatedList)
          .expect(200);

        const outputList: Partial<ExceptionListSchema> = {
          ...getExceptionResponseMockWithoutAutoGeneratedValues(),
          name: 'some other name',
          description: 'some other description',
          version: 2,
        };
        const bodyToCompare = removeExceptionListServerGeneratedProperties(body);
        expect(bodyToCompare).to.eql(outputList);
      });

      it('should give a 404 if it is given a fake id', async () => {
        const updatedList: UpdateExceptionListSchema = {
          ...getUpdateMinimalExceptionListSchemaMock(),
          id: '5096dec6-b6b9-4d8d-8f93-6c2602079d9d',
        };
        delete updatedList.list_id;

        const { body } = await supertest
          .put(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(updatedList)
          .expect(404);

        expect(body).to.eql({
          status_code: 404,
          message: 'exception list id: "5096dec6-b6b9-4d8d-8f93-6c2602079d9d" does not exist',
        });
      });

      it('should give a 404 if it is given a fake list_id', async () => {
        const updatedList: UpdateExceptionListSchema = {
          ...getUpdateMinimalExceptionListSchemaMock(),
          list_id: '5096dec6-b6b9-4d8d-8f93-6c2602079d9d',
        };

        const { body } = await supertest
          .put(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(updatedList)
          .expect(404);

        expect(body).to.eql({
          status_code: 404,
          message: 'exception list list_id: "5096dec6-b6b9-4d8d-8f93-6c2602079d9d" does not exist',
        });
      });

      it('should give a 404 if both id and list_id is null', async () => {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        const { list_id, ...listNoId } = getUpdateMinimalExceptionListSchemaMock();

        const { body } = await supertest
          .put(EXCEPTION_LIST_URL)
          .set('kbn-xsrf', 'true')
          .send(listNoId)
          .expect(404);

        expect(body).to.eql({
          status_code: 404,
          message: 'either id or list_id need to be defined',
        });
      });
    });
  });
};
