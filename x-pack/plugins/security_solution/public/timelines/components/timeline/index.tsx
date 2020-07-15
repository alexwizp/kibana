/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { isEmpty } from 'lodash/fp';
import React, { useEffect, useCallback, useMemo } from 'react';
import { connect, ConnectedProps } from 'react-redux';
import deepEqual from 'fast-deep-equal';

import { NO_ALERT_INDEX } from '../../../../common/constants';
import { useWithSource } from '../../../common/containers/source';
import { useSignalIndex } from '../../../detections/containers/detection_engine/alerts/use_signal_index';
import { inputsModel, inputsSelectors, State } from '../../../common/store';
import { timelineActions, timelineSelectors } from '../../store/timeline';
import { ColumnHeaderOptions, TimelineModel } from '../../../timelines/store/timeline/model';
import { timelineDefaults } from '../../../timelines/store/timeline/defaults';
import { defaultHeaders } from './body/column_headers/default_headers';
import {
  OnChangeItemsPerPage,
  OnDataProviderRemoved,
  OnDataProviderEdited,
  OnToggleDataProviderEnabled,
  OnToggleDataProviderExcluded,
  OnToggleDataProviderType,
} from './events';
import { Timeline } from './timeline';

export interface OwnProps {
  id: string;
  onClose: () => void;
  usersViewing: string[];
}

export type Props = OwnProps & PropsFromRedux;

const StatefulTimelineComponent = React.memo<Props>(
  ({
    columns,
    createTimeline,
    dataProviders,
    eventType,
    end,
    filters,
    graphEventId,
    id,
    isLive,
    isSaving,
    isTimelineExists,
    itemsPerPage,
    itemsPerPageOptions,
    kqlMode,
    kqlQueryExpression,
    onClose,
    onDataProviderEdited,
    removeColumn,
    removeProvider,
    show,
    showCallOutUnauthorizedMsg,
    sort,
    start,
    status,
    timelineType,
    updateDataProviderEnabled,
    updateDataProviderExcluded,
    updateDataProviderType,
    updateItemsPerPage,
    upsertColumn,
    usersViewing,
  }) => {
    const { loading, signalIndexExists, signalIndexName } = useSignalIndex();

    const indexToAdd = useMemo<string[]>(() => {
      if (
        eventType &&
        signalIndexExists &&
        signalIndexName != null &&
        ['signal', 'alert', 'all'].includes(eventType)
      ) {
        return [signalIndexName];
      }
      return [NO_ALERT_INDEX]; // Following index does not exist so we won't show any events;
    }, [eventType, signalIndexExists, signalIndexName]);

    const onDataProviderRemoved: OnDataProviderRemoved = useCallback(
      (providerId: string, andProviderId?: string) =>
        removeProvider!({ id, providerId, andProviderId }),
      [id, removeProvider]
    );

    const onToggleDataProviderEnabled: OnToggleDataProviderEnabled = useCallback(
      ({ providerId, enabled, andProviderId }) =>
        updateDataProviderEnabled!({
          id,
          enabled,
          providerId,
          andProviderId,
        }),
      [id, updateDataProviderEnabled]
    );

    const onToggleDataProviderExcluded: OnToggleDataProviderExcluded = useCallback(
      ({ providerId, excluded, andProviderId }) =>
        updateDataProviderExcluded!({
          id,
          excluded,
          providerId,
          andProviderId,
        }),
      [id, updateDataProviderExcluded]
    );

    const onToggleDataProviderType: OnToggleDataProviderType = useCallback(
      ({ providerId, type, andProviderId }) =>
        updateDataProviderType!({
          id,
          type,
          providerId,
          andProviderId,
        }),
      [id, updateDataProviderType]
    );

    const onDataProviderEditedLocal: OnDataProviderEdited = useCallback(
      ({ andProviderId, excluded, field, operator, providerId, value }) =>
        onDataProviderEdited!({
          andProviderId,
          excluded,
          field,
          id,
          operator,
          providerId,
          value,
        }),
      [id, onDataProviderEdited]
    );

    const onChangeItemsPerPage: OnChangeItemsPerPage = useCallback(
      (itemsChangedPerPage) => updateItemsPerPage!({ id, itemsPerPage: itemsChangedPerPage }),
      [id, updateItemsPerPage]
    );

    const toggleColumn = useCallback(
      (column: ColumnHeaderOptions) => {
        const exists = columns.findIndex((c) => c.id === column.id) !== -1;

        if (!exists && upsertColumn != null) {
          upsertColumn({
            column,
            id,
            index: 1,
          });
        }

        if (exists && removeColumn != null) {
          removeColumn({
            columnId: column.id,
            id,
          });
        }
      },
      // eslint-disable-next-line react-hooks/exhaustive-deps
      [columns, id]
    );

    useEffect(() => {
      if (createTimeline != null && !isTimelineExists) {
        createTimeline({ id, columns: defaultHeaders, show: false });
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const { docValueFields, indexPattern, browserFields, loading: isLoadingSource } = useWithSource(
      'default',
      indexToAdd
    );

    return (
      <Timeline
        browserFields={browserFields}
        columns={columns}
        dataProviders={dataProviders!}
        docValueFields={docValueFields}
        end={end}
        eventType={eventType}
        filters={filters}
        graphEventId={graphEventId}
        id={id}
        indexPattern={indexPattern}
        indexToAdd={indexToAdd}
        isLive={isLive}
        isLoadingSource={isLoadingSource}
        isSaving={isSaving}
        itemsPerPage={itemsPerPage!}
        itemsPerPageOptions={itemsPerPageOptions!}
        kqlMode={kqlMode}
        kqlQueryExpression={kqlQueryExpression}
        loadingIndexName={loading}
        onChangeItemsPerPage={onChangeItemsPerPage}
        onClose={onClose}
        onDataProviderEdited={onDataProviderEditedLocal}
        onDataProviderRemoved={onDataProviderRemoved}
        onToggleDataProviderEnabled={onToggleDataProviderEnabled}
        onToggleDataProviderExcluded={onToggleDataProviderExcluded}
        onToggleDataProviderType={onToggleDataProviderType}
        show={show!}
        showCallOutUnauthorizedMsg={showCallOutUnauthorizedMsg}
        sort={sort!}
        start={start}
        status={status}
        toggleColumn={toggleColumn}
        timelineType={timelineType}
        usersViewing={usersViewing}
      />
    );
  },
  // eslint-disable-next-line complexity
  (prevProps, nextProps) => {
    return (
      prevProps.eventType === nextProps.eventType &&
      prevProps.end === nextProps.end &&
      prevProps.graphEventId === nextProps.graphEventId &&
      prevProps.id === nextProps.id &&
      prevProps.isLive === nextProps.isLive &&
      prevProps.isSaving === nextProps.isSaving &&
      prevProps.isTimelineExists === nextProps.isTimelineExists &&
      prevProps.itemsPerPage === nextProps.itemsPerPage &&
      prevProps.kqlMode === nextProps.kqlMode &&
      prevProps.kqlQueryExpression === nextProps.kqlQueryExpression &&
      prevProps.show === nextProps.show &&
      prevProps.showCallOutUnauthorizedMsg === nextProps.showCallOutUnauthorizedMsg &&
      prevProps.start === nextProps.start &&
      prevProps.timelineType === nextProps.timelineType &&
      prevProps.status === nextProps.status &&
      deepEqual(prevProps.columns, nextProps.columns) &&
      deepEqual(prevProps.dataProviders, nextProps.dataProviders) &&
      deepEqual(prevProps.filters, nextProps.filters) &&
      deepEqual(prevProps.itemsPerPageOptions, nextProps.itemsPerPageOptions) &&
      deepEqual(prevProps.sort, nextProps.sort) &&
      deepEqual(prevProps.usersViewing, nextProps.usersViewing)
    );
  }
);

StatefulTimelineComponent.displayName = 'StatefulTimelineComponent';

const makeMapStateToProps = () => {
  const getShowCallOutUnauthorizedMsg = timelineSelectors.getShowCallOutUnauthorizedMsg();
  const getTimeline = timelineSelectors.getTimelineByIdSelector();
  const getKqlQueryTimeline = timelineSelectors.getKqlFilterQuerySelector();
  const getInputsTimeline = inputsSelectors.getTimelineSelector();
  const mapStateToProps = (state: State, { id }: OwnProps) => {
    const timeline: TimelineModel = getTimeline(state, id) ?? timelineDefaults;
    const input: inputsModel.InputsRange = getInputsTimeline(state);
    const {
      columns,
      dataProviders,
      eventType,
      filters,
      graphEventId,
      itemsPerPage,
      itemsPerPageOptions,
      isSaving,
      kqlMode,
      show,
      sort,
      status,
      timelineType,
    } = timeline;
    const kqlQueryTimeline = getKqlQueryTimeline(state, id)!;
    const timelineFilter = kqlMode === 'filter' ? filters || [] : [];

    // return events on empty search
    const kqlQueryExpression =
      isEmpty(dataProviders) && isEmpty(kqlQueryTimeline) && timelineType === 'template'
        ? ' '
        : kqlQueryTimeline;
    return {
      columns,
      dataProviders,
      eventType,
      end: input.timerange.to,
      filters: timelineFilter,
      graphEventId,
      id,
      isLive: input.policy.kind === 'interval',
      isSaving,
      isTimelineExists: getTimeline(state, id) != null,
      itemsPerPage,
      itemsPerPageOptions,
      kqlMode,
      kqlQueryExpression,
      show,
      showCallOutUnauthorizedMsg: getShowCallOutUnauthorizedMsg(state),
      sort,
      start: input.timerange.from,
      status,
      timelineType,
    };
  };
  return mapStateToProps;
};

const mapDispatchToProps = {
  addProvider: timelineActions.addProvider,
  createTimeline: timelineActions.createTimeline,
  onDataProviderEdited: timelineActions.dataProviderEdited,
  removeColumn: timelineActions.removeColumn,
  removeProvider: timelineActions.removeProvider,
  updateColumns: timelineActions.updateColumns,
  updateDataProviderEnabled: timelineActions.updateDataProviderEnabled,
  updateDataProviderExcluded: timelineActions.updateDataProviderExcluded,
  updateDataProviderKqlQuery: timelineActions.updateDataProviderKqlQuery,
  updateDataProviderType: timelineActions.updateDataProviderType,
  updateHighlightedDropAndProviderId: timelineActions.updateHighlightedDropAndProviderId,
  updateItemsPerPage: timelineActions.updateItemsPerPage,
  updateItemsPerPageOptions: timelineActions.updateItemsPerPageOptions,
  updateSort: timelineActions.updateSort,
  upsertColumn: timelineActions.upsertColumn,
};

const connector = connect(makeMapStateToProps, mapDispatchToProps);

type PropsFromRedux = ConnectedProps<typeof connector>;

export const StatefulTimeline = connector(StatefulTimelineComponent);
