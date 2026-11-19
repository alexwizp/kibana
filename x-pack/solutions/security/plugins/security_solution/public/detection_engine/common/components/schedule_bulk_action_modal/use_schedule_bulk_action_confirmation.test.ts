/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import { act, renderHook } from '@testing-library/react';
import { useScheduleBulkActionConfirmation } from './use_schedule_bulk_action_confirmation';

describe('useScheduleBulkActionConfirmation', () => {
  const callReturnFocus = (
    focusTrapProps: ReturnType<typeof useScheduleBulkActionConfirmation>['focusTrapProps']
  ) => (focusTrapProps.returnFocus as () => boolean | void)();

  const showAndCancel = async (
    result: { current: ReturnType<typeof useScheduleBulkActionConfirmation> },
    triggerElement?: HTMLElement | null
  ) => {
    let promise: Promise<unknown> = Promise.resolve();
    act(() => {
      promise = result.current.showScheduleBulkActionConfirmation(triggerElement);
    });
    await act(async () => {
      result.current.cancelScheduleBulkAction();
      await promise;
    });
  };

  it('returns focus to the trigger element and skips the default behavior', async () => {
    const trigger = document.createElement('button');
    document.body.appendChild(trigger);
    const { result } = renderHook(() => useScheduleBulkActionConfirmation());

    await showAndCancel(result, trigger);

    expect(callReturnFocus(result.current.focusTrapProps)).toBe(false);
    expect(trigger).toHaveFocus();
    trigger.remove();
  });

  it('falls back to the default behavior when no trigger element was provided', async () => {
    const { result } = renderHook(() => useScheduleBulkActionConfirmation());

    await showAndCancel(result);

    expect(callReturnFocus(result.current.focusTrapProps)).toBe(true);
  });

  it('falls back to the default behavior when the trigger element is detached', async () => {
    const trigger = document.createElement('button');
    const { result } = renderHook(() => useScheduleBulkActionConfirmation());

    await showAndCancel(result, trigger);

    expect(callReturnFocus(result.current.focusTrapProps)).toBe(true);
  });
});
