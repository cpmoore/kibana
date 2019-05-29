/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  EuiButton,
  EuiButtonEmpty,
  EuiModal,
  EuiModalBody,
  EuiModalFooter,
  EuiModalHeader,
  EuiModalHeaderTitle,
  EuiOverlayMask,
  EuiText,
} from '@elastic/eui';
import { FormattedMessage, InjectedIntl, injectI18n } from '@kbn/i18n/react';
import React, { Component, Fragment } from 'react';
import { toastNotifications } from 'ui/notify';
import { RoleMappingApi } from '../../../../../lib/role_mapping_api';

interface Props {
  mappingsToDelete: string[];
  intl: InjectedIntl;
  callback: (rolesToDelete: string[], errors: string[]) => void;
  onCancel: () => void;
}

interface State {
  deleteInProgress: boolean;
}

class ConfirmDeleteUI extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      deleteInProgress: false,
    };
  }

  public render() {
    const { mappingsToDelete, intl } = this.props;
    const moreThanOne = mappingsToDelete.length > 1;
    const title = intl.formatMessage(
      {
        id: 'xpack.security.management.role_mappings.deleteRoleMappingTitle',
        defaultMessage: 'Delete mapping{value, plural, one {{roleName}} other {s}}',
      },
      { value: mappingsToDelete.length, roleName: ` ${mappingsToDelete[0]}` }
    );

    // This is largely the same as the built-in EuiConfirmModal component, but we needed the ability
    // to disable the buttons since this could be a long-running operation

    return (
      <EuiOverlayMask>
        <EuiModal onClose={this.props.onCancel}>
          <EuiModalHeader>
            <EuiModalHeaderTitle data-test-subj="confirmModalTitleText">
              {title}
            </EuiModalHeaderTitle>
          </EuiModalHeader>
          <EuiModalBody>
            <EuiText>
              {moreThanOne ? (
                <Fragment>
                  <p>
                    <FormattedMessage
                      id="xpack.security.management.role_mappings.confirmDelete.removingRoleMappingsDescription"
                      defaultMessage="You are about to delete these mappings:"
                    />
                  </p>
                  <ul>
                    {mappingsToDelete.map(name => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </Fragment>
              ) : null}
              <p>
                <FormattedMessage
                  id="xpack.security.management.role_mappings.deletingRoleMappingsWarningMessage"
                  defaultMessage="You can't undo this operation."
                />
              </p>
            </EuiText>
          </EuiModalBody>
          <EuiModalFooter>
            <EuiButtonEmpty
              data-test-subj="confirmModalCancelButton"
              onClick={this.props.onCancel}
              isDisabled={this.state.deleteInProgress}
            >
              <FormattedMessage
                id="xpack.security.management.role_mappings.confirmDelete.cancelButtonLabel"
                defaultMessage="Cancel"
              />
            </EuiButtonEmpty>

            <EuiButton
              data-test-subj="confirmModalConfirmButton"
              onClick={this.onConfirmDelete}
              fill
              color={'danger'}
              isLoading={this.state.deleteInProgress}
            >
              <FormattedMessage
                id="xpack.security.management.role_mappings.confirmDelete.deleteButtonLabel"
                defaultMessage="Delete"
              />
            </EuiButton>
          </EuiModalFooter>
        </EuiModal>
      </EuiOverlayMask>
    );
  }

  private onConfirmDelete = () => {
    this.setState(
      {
        deleteInProgress: true,
      },
      () => {
        this.deleteRoleMappings();
      }
    );
  };

  private deleteRoleMappings = async () => {
    const { mappingsToDelete, callback } = this.props;
    const errors: string[] = [];
    const deleteOperations = mappingsToDelete.map(roleMappingName => {
      const deleteRoleMappingTask = async () => {
        try {
          await RoleMappingApi.deleteRoleMapping(roleMappingName);
          toastNotifications.addSuccess(
            this.props.intl.formatMessage(
              {
                id:
                  'xpack.security.management.role_mappings.confirmDelete.roleMappingSuccessfullyDeletedNotificationMessage',
                defaultMessage: 'Deleted mapping {roleMappingName}',
              },
              { roleName: roleMappingName }
            )
          );
        } catch (e) {
          errors.push(roleMappingName);
          toastNotifications.addDanger(
            this.props.intl.formatMessage(
              {
                id:
                  'xpack.security.management.roles.confirmDelete.roleDeletingErrorNotificationMessage',
                defaultMessage: 'Error deleting mapping {roleMappingName}',
              },
              { roleMappingName }
            )
          );
        }
      };

      return deleteRoleMappingTask();
    });

    await Promise.all(deleteOperations);

    callback(mappingsToDelete, errors);
  };
}

export const ConfirmDelete = injectI18n(ConfirmDeleteUI);
