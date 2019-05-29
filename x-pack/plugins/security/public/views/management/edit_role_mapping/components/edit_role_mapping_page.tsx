/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import { get } from 'lodash';
import React, { ChangeEvent, Component } from 'react';
import {
  EuiButton,
  EuiButtonEmpty,
  EuiCodeEditor,
  EuiComboBox,
  EuiFieldText,
  EuiFlexGroup,
  EuiFlexItem,
  EuiForm,
  EuiFormRow,
  EuiHorizontalRule,
  EuiLink,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiSwitch,
  EuiText,
  EuiTitle,
} from '@elastic/eui';
import { toastNotifications } from 'ui/notify';
import { FormattedMessage, InjectedIntl, injectI18n } from '@kbn/i18n/react';
import { RoleMappingApi } from 'plugins/security/lib/role_mapping_api';
import { RolesApi } from 'plugins/security/lib/roles_api';
import { RoleMappingValidationResult, RoleMappingValidator } from '../lib/validate_role_mapping';
import { Role, RoleMapping } from '../../../../../common/model';
import { ROLE_MAPPING_PATH } from '../../../../views/management/management_urls';
import { ConfirmDelete } from '../../role_mapping_grid/components/confirm_delete';
import { documentationLinks } from '../../../../documentation_links';

interface Props {
  roleMappingName: string;
  intl: InjectedIntl;
  changeUrl: (path: string) => void;
}

interface State {
  isLoaded: boolean;
  isNewRoleMapping: boolean;
  roleMapping: RoleMapping | null;
  showDeleteConfirmation: boolean;
  roles: Role[];
  selectedRoles: Array<{ label: string }>;
  rulesString: string;
  formError: RoleMappingValidationResult | null;
}

class EditRoleMappingPageUI extends Component<Props, State> {
  private validator: RoleMappingValidator;

  constructor(props: Props) {
    super(props);
    this.validator = new RoleMappingValidator({ shouldValidate: false });
    this.state = {
      isLoaded: false,
      isNewRoleMapping: true,
      showDeleteConfirmation: false,
      roleMapping: {
        name: '',
        enabled: true,
        roles: [],
        rules: {},
        metadata: {},
      },
      roles: [],
      selectedRoles: [],
      rulesString: '',
      formError: null,
    };
  }

  public async componentDidMount() {
    const { roleMappingName } = this.props;
    let { roleMapping, selectedRoles } = this.state;
    if (roleMappingName) {
      try {
        roleMapping = await RoleMappingApi.getRoleMapping(roleMappingName);
        selectedRoles = roleMapping.roles.map(role => ({ label: role }));
      } catch (err) {
        toastNotifications.addDanger({
          title: this.props.intl.formatMessage({
            id:
              'xpack.security.management.role_mappings.editRoleMapping.errorLoadingRoleMappingTitle',
            defaultMessage: 'Error loading role mapping',
          }),
          text: get(err, 'body.message') || err.message,
        });
        return;
      }
    }

    let roles: Role[] = [];
    try {
      roles = await RolesApi.getRoles();
    } catch (err) {
      toastNotifications.addDanger({
        title: this.props.intl.formatMessage({
          id: 'xpack.security.management.role_mappings.editRoleMapping.errorLoadingRolesTitle',
          defaultMessage: 'Error loading roles',
        }),
        text: get(err, 'body.message') || err.message,
      });
    }

    this.setState({
      isLoaded: true,
      isNewRoleMapping: !roleMappingName,
      roleMapping,
      roles,
      rulesString: !roleMappingName ? '' : JSON.stringify(roleMapping.rules, null, 2),
      selectedRoles,
    });
  }

  private handleDelete = (usernames: string[], errors: string[]) => {
    if (errors.length === 0) {
      const { changeUrl } = this.props;
      changeUrl(USERS_PATH);
    }
  };

  private saveRoleMapping = async () => {
    const { changeUrl } = this.props;
    const { roleMapping, selectedRoles, rulesString } = this.state;

    this.validator.enableValidation();

    try {
      const roleMappingToSave: RoleMapping = { ...roleMapping };
      roleMappingToSave.metadata = roleMapping.metadata || {};
      roleMappingToSave.roles = selectedRoles.map(selectedRole => {
        return selectedRole.label;
      });
      const result = this.validator.validateForSave(roleMappingToSave, { rules: rulesString });
      this.setState({
        formError: result.isInvalid ? result : null,
      });
      if (!result.isInvalid) {
        roleMappingToSave.rules = JSON.parse(rulesString);
        await RoleMappingApi.putRoleMapping(roleMappingToSave);
        toastNotifications.addSuccess(
          this.props.intl.formatMessage(
            {
              id:
                'xpack.security.management.role_mappings.editRoleMapping.roleMappingSuccessfullySavedNotificationMessage',
              defaultMessage: 'Saved role mapping {message}',
            },
            { message: roleMapping.name }
          )
        );
        changeUrl(ROLE_MAPPING_PATH);
      }
    } catch (e) {
      toastNotifications.addDanger(
        this.props.intl.formatMessage(
          {
            id:
              'xpack.security.management.role_mappings.editRoleMapping.savingRoleMappingErrorMessage',
            defaultMessage: 'Error saving role mapping: {message}',
          },
          { message: get(e, 'body.message', e.message || 'Unknown error') }
        )
      );
    }
  };

  private onNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const roleMapping = {
      ...this.state.roleMapping,
      name: e.target.value || '',
    };
    this.setState({
      roleMapping,
    });
  };

  private onRulesChange = (value: string) => {
    this.setState({
      rulesString: value,
    });
  };

  private onRolesChange = (selectedRoles: Array<{ label: string }>) => {
    this.setState({
      selectedRoles,
    });
  };

  private toggleEnabled = () => {
    const roleMapping = {
      ...this.state.roleMapping,
      enabled: !this.state.roleMapping.enabled,
    };
    this.setState({
      roleMapping,
    });
  };

  private cannotSaveRoleMapping = () => {
    const { roleMapping, rulesString, selectedRoles } = this.state;
    const result = this.validator.validateForSave(roleMapping, {
      rules: rulesString,
      roles: selectedRoles,
    });
    return result.isInvalid;
  };

  private onCancelDelete = () => {
    this.setState({ showDeleteConfirmation: false });
  };

  public render() {
    const { changeUrl, intl } = this.props;
    const {
      roleMapping,
      roles,
      rulesString,
      selectedRoles,
      isNewRoleMapping,
      showDeleteConfirmation,
    } = this.state;

    if (!roleMapping || !roles) {
      return null;
    }
    if (!this.state.isLoaded) {
      return null;
    }

    return (
      <div className="secRoleMappingEditPage">
        <EuiPageContent className="secRoleMappingEditPage__content">
          <EuiPageContentHeader>
            <EuiPageContentHeaderSection>
              <EuiTitle>
                <h2>
                  {isNewRoleMapping ? (
                    <FormattedMessage
                      id="xpack.security.management.role_mappings.editRoleMapping.newRoleMappingTitle"
                      defaultMessage="New role mapping"
                    />
                  ) : (
                    <FormattedMessage
                      id="xpack.security.management.role_mappings.editRoleMapping.editRoleMappingTitle"
                      defaultMessage="Edit role mapping {roleMappingName}"
                      values={{ roleMappingName: roleMapping.name }}
                    />
                  )}
                </h2>
              </EuiTitle>
              <EuiText size="s">
                <FormattedMessage
                  id="xpack.security.management.role_mappings.editRoleMapping.editRoleMappingDescription"
                  defaultMessage="Manage the mapping of users from external authentication realms to internal roles."
                />
                <p>
                  <EuiLink
                    className="editRole__learnMore"
                    href={documentationLinks.roleMapping}
                    target={'_blank'}
                  >
                    <FormattedMessage
                      id="xpack.security.management.role_mappings.editRoleMapping.learnMoreLinkText"
                      defaultMessage="Learn more"
                    />
                  </EuiLink>
                </p>
              </EuiText>
            </EuiPageContentHeaderSection>
          </EuiPageContentHeader>
          <EuiPageContentBody>
            {showDeleteConfirmation ? (
              <ConfirmDelete
                onCancel={this.onCancelDelete}
                mappingsToDelete={[roleMapping.name]}
                callback={this.handleDelete}
              />
            ) : null}

            <form
              onSubmit={event => {
                event.preventDefault();
              }}
            >
              <EuiForm {...this.state.formError}>
                <EuiFormRow
                  {...this.validator.validateName(this.state.roleMapping.name)}
                  fullWidth
                  helpText={
                    !isNewRoleMapping
                      ? intl.formatMessage({
                          id:
                            'xpack.security.management.role_mappings.editRoleMapping.changingRoleMappingNameAfterCreationDescription',
                          defaultMessage: `Role mapping name can't be changed after creation.`,
                        })
                      : null
                  }
                  label={intl.formatMessage({
                    id: 'xpack.security.management.role_mappings.editRoleMapping.nameFormRowLabel',
                    defaultMessage: 'Name',
                  })}
                >
                  <EuiFieldText
                    fullWidth
                    value={roleMapping.name || ''}
                    name="name"
                    data-test-subj="roleMappingFormNameInput"
                    disabled={!isNewRoleMapping}
                    onChange={this.onNameChange}
                  />
                </EuiFormRow>
                <EuiFormRow fullWidth>
                  <EuiSwitch
                    data-test-subj={`roleMappingFormEnabled`}
                    label={
                      <FormattedMessage
                        id="xpack.security.management.role_mappings.editRoleMapping.enabledFormFieldLabel"
                        defaultMessage="Enabled"
                      />
                    }
                    compressed={true}
                    checked={roleMapping.enabled}
                    onChange={this.toggleEnabled}
                  />
                </EuiFormRow>
                <EuiFormRow
                  {...this.validator.validateRoles(selectedRoles)}
                  fullWidth
                  label={intl.formatMessage({
                    id: 'xpack.security.management.role_mappings.editRoleMapping.rolesFormRowLabel',
                    defaultMessage: 'Roles',
                  })}
                >
                  <EuiComboBox
                    fullWidth
                    data-test-subj="roleMappingFormRolesDropdown"
                    placeholder={intl.formatMessage({
                      id:
                        'xpack.security.management.role_mappings.editRoleMapping.addRolesPlaceholder',
                      defaultMessage: 'Add roles',
                    })}
                    onChange={this.onRolesChange}
                    options={roles.map(role => {
                      return { 'data-test-subj': `roleOption-${role.name}`, label: role.name };
                    })}
                    selectedOptions={selectedRoles}
                  />
                </EuiFormRow>

                <EuiFormRow
                  {...this.validator.validateRules(this.state.rulesString)}
                  fullWidth
                  label={
                    <FormattedMessage
                      id="xpack.security.management.role_mappings.editRoleMapping.rulesFormRowLabel"
                      defaultMessage="Rules"
                    />
                  }
                >
                  <EuiCodeEditor
                    mode="json"
                    helpText={
                      !isNewRoleMapping
                        ? intl.formatMessage({
                            id:
                              'xpack.security.management.role_mappings.editRoleMapping.changingRoleMappingNameAfterCreationDescription',
                            defaultMessage: `Role mapping name can't be changed after creation.`,
                          })
                        : null
                    }
                    theme="sense-dark"
                    width="100%"
                    height={'200px'}
                    value={rulesString}
                    setOptions={{
                      fontSize: '14px',
                      enableBasicAutocompletion: true,
                      enableSnippets: true,
                      enableLiveAutocompletion: true,
                    }}
                    onChange={this.onRulesChange}
                  />
                </EuiFormRow>

                <EuiHorizontalRule />

                <EuiFlexGroup responsive={false}>
                  <EuiFlexItem grow={false}>
                    <EuiButton
                      disabled={this.cannotSaveRoleMapping()}
                      fill
                      data-test-subj="roleMappingFormSaveButton"
                      onClick={() => this.saveRoleMapping()}
                    >
                      {isNewRoleMapping ? (
                        <FormattedMessage
                          id="xpack.security.management.role_mappings.editRoleMapping.createRoleMappingButtonLabel"
                          defaultMessage="Create mapping"
                        />
                      ) : (
                        <FormattedMessage
                          id="xpack.security.management.role_mappings.editRoleMapping.updateRoleMappingButtonLabel"
                          defaultMessage="Update mapping"
                        />
                      )}
                    </EuiButton>
                  </EuiFlexItem>
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty
                      data-test-subj="roleMappingFormCancelButton"
                      onClick={() => changeUrl(ROLE_MAPPING_PATH)}
                    >
                      <FormattedMessage
                        id="xpack.security.management.role_mappings.editRoleMapping.cancelButtonLabel"
                        defaultMessage="Cancel"
                      />
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                  <EuiFlexItem grow={true} />
                  {isNewRoleMapping ? null : (
                    <EuiFlexItem grow={false}>
                      <EuiButtonEmpty
                        onClick={() => {
                          this.setState({ showDeleteConfirmation: true });
                        }}
                        data-test-subj="roleMappingFormDeleteButton"
                        color="danger"
                      >
                        <FormattedMessage
                          id="xpack.security.management.role_mappings.editRoleMapping.deleteRoleMappingButtonLabel"
                          defaultMessage="Delete mapping"
                        />
                      </EuiButtonEmpty>
                    </EuiFlexItem>
                  )}
                </EuiFlexGroup>
              </EuiForm>
            </form>
          </EuiPageContentBody>
        </EuiPageContent>
      </div>
    );
  }
}

export const EditRoleMappingPage = injectI18n(EditRoleMappingPageUI);
