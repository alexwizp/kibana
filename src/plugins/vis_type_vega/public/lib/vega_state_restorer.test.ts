/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import { createVegaStateRestorer } from './vega_state_restorer';

describe('extractIndexPatternsFromSpec', () => {
  test('should create vega state restorer ', async () => {
    expect(createVegaStateRestorer()).toMatchInlineSnapshot(`
      Object {
        "clear": [Function],
        "restore": [Function],
        "save": [Function],
      }
    `);
  });

  test('should save state', async () => {
    const vegaStateRestorer = createVegaStateRestorer();

    vegaStateRestorer.save({
      signals: { foo: 'foo' },
      data: { test: 'test' },
    });

    expect(vegaStateRestorer.restore()).toMatchInlineSnapshot(`
      Object {
        "signals": Object {
          "foo": "foo",
        },
      }
    `);
  });

  test('should restore of "data" if "restoreData" is true', () => {
    const vegaStateRestorer = createVegaStateRestorer({ restoreData: true });

    vegaStateRestorer.save({
      signals: { foo: 'foo' },
      data: { test: 'test' },
    });

    expect(vegaStateRestorer.restore()).toMatchInlineSnapshot(`
      Object {
        "data": Object {
          "test": "test",
        },
        "signals": Object {
          "foo": "foo",
        },
      }
    `);
  });

  test('should clear saved state', () => {
    const vegaStateRestorer = createVegaStateRestorer({ restoreData: true });

    vegaStateRestorer.save({
      signals: { foo: 'foo' },
      data: { test: 'test' },
    });
    vegaStateRestorer.clear();

    expect(vegaStateRestorer.restore()).toMatchInlineSnapshot(`null`);
  });

  test('should omit signals', () => {
    const vegaStateRestorer = createVegaStateRestorer({ omitSignals: ['foo'] });

    vegaStateRestorer.save({
      signals: { foo: 'foo' },
    });

    expect(vegaStateRestorer.restore()).toMatchInlineSnapshot(`
      Object {
        "signals": Object {},
      }
    `);
  });
});
