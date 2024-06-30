/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiFlexGroup,
  EuiFlexItem,
  EuiPageHeader,
  EuiPageSection,
  EuiSpacer,
  hexToHsv,
  hsvToHex,
} from '@elastic/eui';
import { difference } from 'lodash';
import React, { Component } from 'react';

import type { Capabilities, NotificationsStart, ScopedHistory } from '@kbn/core/public';
import { SectionLoading } from '@kbn/es-ui-shared-plugin/public';
import type { FeaturesPluginStart, KibanaFeature } from '@kbn/features-plugin/public';
import { i18n } from '@kbn/i18n';
import { FormattedMessage } from '@kbn/i18n-react';

import { ConfirmAlterActiveSpaceModal } from './confirm_alter_active_space_modal';
import { CustomizeSpace } from './customize_space';
import { DeleteSpacesButton } from './delete_spaces_button';
import { EnabledFeatures } from './enabled_features';
import { SolutionView } from './solution_view';
import type { Space } from '../../../common';
import { isReservedSpace } from '../../../common';
import { getSpacesFeatureDescription } from '../../constants';
import { getSpaceColor, getSpaceInitials } from '../../space_avatar';
import type { SpacesManager } from '../../spaces_manager';
import { UnauthorizedPrompt } from '../components';
import { toSpaceIdentifier } from '../lib';
import { SpaceValidator } from '../lib/validate_space';

export interface FormValues extends Partial<Space> {
  customIdentifier?: boolean;
  avatarType?: 'initials' | 'image';
  customAvatarInitials?: boolean;
  customAvatarColor?: boolean;
}

interface Props {
  getFeatures: FeaturesPluginStart['getFeatures'];
  notifications: NotificationsStart;
  spacesManager: SpacesManager;
  spaceId?: string;
  onLoadSpace?: (space: Space) => void;
  capabilities: Capabilities;
  history: ScopedHistory;
  allowFeatureVisibility: boolean;
  solutionNavExperiment?: Promise<boolean>;
}

interface State {
  space: FormValues;
  features: KibanaFeature[];
  originalSpace?: Partial<Space>;
  showAlteringActiveSpaceDialog: boolean;
  isLoading: boolean;
  saveInProgress: boolean;
  formError?: {
    isInvalid: boolean;
    error?: string;
  };
  isSolutionNavEnabled: boolean;
}

export class ManageSpacePage extends Component<Props, State> {
  private readonly validator: SpaceValidator;
  private initialSpaceState: State['space'] | null = null;

  constructor(props: Props) {
    super(props);
    this.validator = new SpaceValidator({ shouldValidate: false });
    this.state = {
      isLoading: true,
      showAlteringActiveSpaceDialog: false,
      saveInProgress: false,
      space: {
        color: getSpaceColor({}),
      },
      features: [],
      isSolutionNavEnabled: false,
    };
  }

  public async componentDidMount() {
    if (!this.props.capabilities.spaces.manage) {
      return;
    }

    const { spaceId, getFeatures, notifications } = this.props;

    try {
      if (spaceId) {
        await this.loadSpace(spaceId, getFeatures());
      } else {
        const features = await getFeatures();
        this.setState({ isLoading: false, features });
      }
    } catch (e) {
      notifications.toasts.addError(e, {
        title: i18n.translate('xpack.spaces.management.manageSpacePage.loadErrorTitle', {
          defaultMessage: 'Error loading available features',
        }),
      });
    }

    this.props.solutionNavExperiment?.then((isEnabled) => {
      this.setState({ isSolutionNavEnabled: isEnabled });
    });
  }

  public async componentDidUpdate(previousProps: Props) {
    if (this.props.spaceId !== previousProps.spaceId && this.props.spaceId) {
      await this.loadSpace(this.props.spaceId, Promise.resolve(this.state.features));
    }
  }

  public render() {
    if (!this.props.capabilities.spaces.manage) {
      return (
        <EuiPageSection alignment="center" color="danger">
          <UnauthorizedPrompt />
        </EuiPageSection>
      );
    }

    if (this.state.isLoading) {
      return this.getLoadingIndicator();
    }

    return (
      <EuiPageSection restrictWidth>
        <EuiPageHeader pageTitle={this.getTitle()} description={getSpacesFeatureDescription()} />
        <EuiSpacer size="l" />

        {this.getForm()}
      </EuiPageSection>
    );
  }

  public getLoadingIndicator = () => (
    <EuiPageSection alignment="center" color="subdued">
      <SectionLoading>
        <FormattedMessage
          id="xpack.spaces.management.manageSpacePage.loadingMessage"
          defaultMessage="Loading…"
        />
      </SectionLoading>
    </EuiPageSection>
  );

  public getForm = () => {
    const { showAlteringActiveSpaceDialog } = this.state;

    return (
      <div data-test-subj="spaces-edit-page">
        <CustomizeSpace
          space={this.state.space}
          onChange={this.onSpaceChange}
          editingExistingSpace={this.editingExistingSpace()}
          validator={this.validator}
        />

        {this.state.isSolutionNavEnabled && (
          <>
            <EuiSpacer size="l" />
            <SolutionView space={this.state.space} onChange={this.onSpaceChange} />
          </>
        )}

        {this.props.allowFeatureVisibility && (
          <>
            <EuiSpacer />
            <EnabledFeatures
              space={this.state.space}
              features={this.state.features}
              onChange={this.onSpaceChange}
            />
          </>
        )}

        <EuiSpacer />

        {this.getFormButtons()}

        {showAlteringActiveSpaceDialog && (
          <ConfirmAlterActiveSpaceModal
            onConfirm={() => this.performSave(true)}
            onCancel={() => {
              this.setState({ showAlteringActiveSpaceDialog: false });
            }}
          />
        )}
      </div>
    );
  };

  public getTitle = () => {
    if (this.editingExistingSpace()) {
      return (
        <FormattedMessage
          id="xpack.spaces.management.manageSpacePage.editSpaceTitle"
          defaultMessage="Edit space"
        />
      );
    }
    return (
      <FormattedMessage
        id="xpack.spaces.management.manageSpacePage.createSpaceTitle"
        defaultMessage="Create space"
      />
    );
  };

  public getFormButtons = () => {
    const createSpaceText = i18n.translate(
      'xpack.spaces.management.manageSpacePage.createSpaceButton',
      {
        defaultMessage: 'Create space',
      }
    );

    const updateSpaceText = i18n.translate(
      'xpack.spaces.management.manageSpacePage.updateSpaceButton',
      {
        defaultMessage: 'Update space',
      }
    );

    const cancelButtonText = i18n.translate(
      'xpack.spaces.management.manageSpacePage.cancelSpaceButton',
      {
        defaultMessage: 'Cancel',
      }
    );

    const saveText = this.editingExistingSpace() ? updateSpaceText : createSpaceText;
    return (
      <EuiFlexGroup responsive={false}>
        <EuiFlexItem grow={false}>
          <EuiButton
            fill
            onClick={this.saveSpace}
            data-test-subj="save-space-button"
            isLoading={this.state.saveInProgress}
          >
            {saveText}
          </EuiButton>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <EuiButtonEmpty onClick={this.backToSpacesList} data-test-subj="cancel-space-button">
            {cancelButtonText}
          </EuiButtonEmpty>
        </EuiFlexItem>
        <EuiFlexItem grow={true} />
        {this.getActionButton()}
      </EuiFlexGroup>
    );
  };

  public getActionButton = () => {
    if (this.state.space && this.editingExistingSpace() && !isReservedSpace(this.state.space)) {
      return (
        <EuiFlexItem grow={false}>
          <DeleteSpacesButton
            data-test-subj="delete-space-button"
            space={this.state.space as Space}
            spacesManager={this.props.spacesManager}
            onDelete={this.backToSpacesList}
            notifications={this.props.notifications}
          />
        </EuiFlexItem>
      );
    }

    return null;
  };

  public onSpaceChange = (updatedSpace: FormValues) => {
    this.setState({
      space: updatedSpace,
    });
  };

  public saveSpace = () => {
    this.validator.enableValidation();

    const originalSpace: Space = this.state.originalSpace as Space;
    const space: Space = this.state.space as Space;
    const result = this.validator.validateForSave(space);
    if (result.isInvalid) {
      this.setState({
        formError: result,
      });

      return;
    }

    if (this.editingExistingSpace()) {
      const { spacesManager } = this.props;

      spacesManager.getActiveSpace().then((activeSpace) => {
        const editingActiveSpace = activeSpace.id === originalSpace.id;

        const haveDisabledFeaturesChanged =
          space.disabledFeatures.length !== originalSpace.disabledFeatures.length ||
          difference(space.disabledFeatures, originalSpace.disabledFeatures).length > 0;
        const hasSolutionViewChanged =
          this.state.space.solution !== this.initialSpaceState?.solution;

        if (editingActiveSpace && (haveDisabledFeaturesChanged || hasSolutionViewChanged)) {
          this.setState({
            showAlteringActiveSpaceDialog: true,
          });

          return;
        }
        this.performSave();
      });
    } else {
      this.performSave();
    }
  };

  private loadSpace = async (spaceId: string, featuresPromise: Promise<KibanaFeature[]>) => {
    const { spacesManager, onLoadSpace } = this.props;

    try {
      const [space, features] = await Promise.all([
        spacesManager.getSpace(spaceId),
        featuresPromise,
      ]);
      if (space) {
        if (onLoadSpace) {
          onLoadSpace(space);
        }

        this.initialSpaceState = {
          ...space,
          avatarType: space.imageUrl ? 'image' : 'initials',
          initials: space.initials || getSpaceInitials(space),
          color: space.color || getSpaceColor(space),
          customIdentifier: false,
          customAvatarInitials:
            !!space.initials && getSpaceInitials({ name: space.name }) !== space.initials,
          customAvatarColor: !!space.color && getSpaceColor({ name: space.name }) !== space.color,
        };

        this.setState({
          space: { ...this.initialSpaceState },
          features,
          originalSpace: space,
          isLoading: false,
        });
      }
    } catch (error) {
      const message = error?.body?.message ?? '';

      this.props.notifications.toasts.addDanger(
        i18n.translate('xpack.spaces.management.manageSpacePage.errorLoadingSpaceTitle', {
          defaultMessage: 'Error loading space: {message}',
          values: { message },
        })
      );
      this.backToSpacesList();
    }
  };

  private performSave = (requireRefresh = false) => {
    if (!this.state.space) {
      return;
    }

    const name = this.state.space.name || '';
    const {
      id = toSpaceIdentifier(name),
      description,
      initials,
      color,
      disabledFeatures = [],
      imageUrl,
      avatarType,
      solution,
    } = this.state.space;

    const params = {
      name,
      id,
      description,
      initials: avatarType !== 'image' ? initials : '',
      color: color ? hsvToHex(hexToHsv(color)).toUpperCase() : color, // Convert 3 digit hex codes to 6 digits since Spaces API requires 6 digits
      disabledFeatures,
      imageUrl: avatarType === 'image' ? imageUrl : '',
      solution,
    };

    let action;
    if (this.editingExistingSpace()) {
      action = this.props.spacesManager.updateSpace(params);
    } else {
      action = this.props.spacesManager.createSpace(params);
    }

    this.setState({ saveInProgress: true });

    action
      .then(() => {
        this.props.notifications.toasts.addSuccess(
          i18n.translate(
            'xpack.spaces.management.manageSpacePage.spaceSuccessfullySavedNotificationMessage',
            {
              defaultMessage: `Space {name} was saved.`,
              values: { name: `'${name}'` },
            }
          )
        );

        this.backToSpacesList();

        if (requireRefresh) {
          setTimeout(() => {
            window.location.reload();
          });
        }
      })
      .catch((error) => {
        const message = error?.body?.message ?? '';

        this.setState({ saveInProgress: false });

        this.props.notifications.toasts.addDanger(
          i18n.translate('xpack.spaces.management.manageSpacePage.errorSavingSpaceTitle', {
            defaultMessage: 'Error saving space: {message}',
            values: { message },
          })
        );
      });
  };

  private backToSpacesList = () => this.props.history.push('/');

  private editingExistingSpace = () => !!this.props.spaceId;
}
