/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { EuiTextColor, EuiButtonIcon, EuiPopover, EuiButton, EuiCallOut } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n/react';
import { i18n } from '@kbn/i18n';
import { getCoreStart, getDataStart } from '../../../../services';
import type { IndexPatternObject } from '../../../../../common/types';
import { SelectIndexComponentProps } from './types';

type LegacyModePopoverProps = Pick<SelectIndexComponentProps, 'onModeChange'> & {
  index: string;
};

const getDeprecationCallOut = () => (
  <EuiCallOut
    title={i18n.translate('visTypeTimeseries.indexPatternSelect.deprecationCallOut.title', {
      defaultMessage: 'Text indices are deprecated.',
    })}
    color="warning"
    iconType="alert"
    size="s"
  >
    <p>
      <FormattedMessage
        id="visTypeTimeseries.indexPatternSelect.deprecationCallOut.text"
        defaultMessage="To enable support for all features, we recommend switching to using Kibana indices."
      />
    </p>
  </EuiCallOut>
);

const getReadyToMigrateCallOut = (index: string, switchToUseKibanaIndices: () => void) => (
  <EuiCallOut
    title={i18n.translate('visTypeTimeseries.indexPatternSelect.readyToMigrateCallOut.title', {
      defaultMessage: 'You are ready for switching mode.',
    })}
    color="success"
    iconType="cheer"
    size="s"
  >
    <p>
      <FormattedMessage
        id="visTypeTimeseries.indexPatternSelect.readyToMigrateCallOut.text"
        defaultMessage="We found that you have already created a '{index}' index on your instance."
        values={{
          index: <EuiTextColor color="secondary">{index}</EuiTextColor>,
        }}
      />
    </p>
    <EuiButton fullWidth={true} iconType="gear" size="s" onClick={switchToUseKibanaIndices}>
      <FormattedMessage
        id="visTypeTimeseries.indexPatternSelect.useKibanaIndex.label"
        defaultMessage="Use Kibana index"
      />
    </EuiButton>
  </EuiCallOut>
);

const getNoMatchedIndicesCallOut = (index: string, onCreateIndexClick: () => void) => (
  <EuiCallOut
    title={i18n.translate('visTypeTimeseries.indexPatternSelect.noMatchedIndicesCallOut.title', {
      defaultMessage: "Your text index doesn't match any created Kibana indices.",
    })}
    color="primary"
    iconType="faceSad"
    size="s"
  >
    <p>
      <FormattedMessage
        id="visTypeTimeseries.indexPatternSelect.noMatchedIndicesCallOut.text"
        defaultMessage="Before switching mode you should create a Kibana index pattern for '{index}'."
        values={{
          index: <EuiTextColor color="secondary">{index}</EuiTextColor>,
        }}
      />
    </p>
    <EuiButton fullWidth={true} iconType="plusInCircle" size="s" onClick={onCreateIndexClick}>
      <FormattedMessage
        id="visTypeTimeseries.indexPatternSelect.noMatchedIndicesCallOut.create index"
        defaultMessage="Create index pattern"
      />
    </EuiButton>
  </EuiCallOut>
);

export const LegacyModePopover = ({ index, onModeChange }: LegacyModePopoverProps) => {
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);
  const [matchedIndex, setMatchedIndex] = useState<IndexPatternObject>();

  const closePopover = useCallback(() => setIsPopoverOpen(false), []);
  const onButtonClick = useCallback(() => setIsPopoverOpen((isOpen) => !isOpen), []);

  const navigateToCreateIndexPatterns = useCallback(() => {
    const core = getCoreStart();
    core.application.navigateToApp('management', {
      path: `/kibana/indexPatterns/create?name=${index}`,
    });
  }, [index]);

  const switchToUseKibanaIndices = useCallback(() => {
    onModeChange(true, index);
  }, [onModeChange, index]);

  useEffect(() => {
    async function retrieveIndex() {
      if (index) {
        const { indexPatterns } = getDataStart();
        const mIndex = (await indexPatterns.find(index)).find((i) => i.title === index);

        setMatchedIndex(mIndex ? { id: mIndex.id!, title: mIndex.title } : undefined);
      }
    }

    retrieveIndex();
  }, [index]);

  return (
    <EuiPopover
      button={
        <EuiButtonIcon
          iconType="alert"
          color="warning"
          aria-label={i18n.translate(
            'visTypeTimeseries.indexPatternSelect.warningAlert.areaLabel',
            {
              defaultMessage: 'Text indices are deprecated.',
            }
          )}
          onClick={onButtonClick}
        />
      }
      isOpen={isPopoverOpen}
      closePopover={closePopover}
    >
      {getDeprecationCallOut()}
      {index && matchedIndex && getReadyToMigrateCallOut(index, switchToUseKibanaIndices)}
      {index && !matchedIndex && getNoMatchedIndicesCallOut(index, navigateToCreateIndexPatterns)}
    </EuiPopover>
  );
};
