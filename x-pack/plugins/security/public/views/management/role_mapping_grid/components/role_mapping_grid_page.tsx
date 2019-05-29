/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import {
  EuiButton,
  EuiIcon,
  EuiInMemoryTable,
  EuiLink,
  EuiPageContent,
  EuiPageContentBody,
  EuiPageContentHeader,
  EuiPageContentHeaderSection,
  EuiText,
  EuiTitle,
  EuiToolTip,
} from '@elastic/eui';
import { FormattedMessage, InjectedIntl, injectI18n } from '@kbn/i18n/react';
import _ from 'lodash';
import React, { Component, Fragment } from 'react';
import { toastNotifications } from 'ui/notify';
import { EDIT_ROLES_PATH } from 'plugins/security/views/management/management_urls';
import { RoleMapping } from '../../../../../common/model/role_mapping';
import { isRoleEnabled } from '../../../../lib/role_utils';
import { RoleMappingApi } from '../../../../lib/role_mapping_api';
import { ConfirmDelete } from './confirm_delete';
import { PermissionDenied } from './permission_denied';

interface Props {
  intl: InjectedIntl;
}

interface State {
  roles: RoleMapping[];
  selection: RoleMapping[];
  filter: string;
  showDeleteConfirmation: boolean;
  permissionDenied: boolean;
}

const getRoleMappingManagementHref = (name?: string) => {
  return `#/management/security/role_mapping/edit${name ? `/${name}` : ''}`;
};

class RoleMappingGridPageUI extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      roles: [],
      selection: [],
      filter: '',
      showDeleteConfirmation: false,
      permissionDenied: false,
    };
  }

  public componentDidMount() {
    this.loadRoleMappings();
  }

  public render() {
    const { permissionDenied } = this.state;

    return permissionDenied ? <PermissionDenied /> : this.getPageContent();
  }

  private getPageContent = () => {
    const { roles } = this.state;
    const { intl } = this.props;
    return (
      <EuiPageContent>
        <EuiPageContentHeader>
          <EuiPageContentHeaderSection>
            <EuiTitle>
              <h2>
                <FormattedMessage
                  id="xpack.security.management.role_mappings.title"
                  defaultMessage="Role Mappings"
                />
              </h2>
            </EuiTitle>
            <EuiText color="subdued" size="s">
              <p>
                <FormattedMessage
                  id="xpack.security.management.role_mappings.subtitle"
                  defaultMessage="Manage role mappings for external authentication realms."
                />
              </p>
            </EuiText>
          </EuiPageContentHeaderSection>
          <EuiPageContentHeaderSection>
            <EuiButton
              data-test-subj="createRoleMappingButton"
              href={getRoleMappingManagementHref()}
            >
              <FormattedMessage
                id="xpack.security.management.role_mappings.createRoleMappingButtonLabel"
                defaultMessage="Create role mapping"
              />
            </EuiButton>
          </EuiPageContentHeaderSection>
        </EuiPageContentHeader>
        <EuiPageContentBody>
          {this.state.showDeleteConfirmation ? (
            <ConfirmDelete
              onCancel={this.onCancelDelete}
              mappingsToDelete={this.state.selection.map(mapping => mapping.name)}
              callback={this.handleDelete}
            />
          ) : null}

          {
            // @ts-ignore missing rowProps typedef
            <EuiInMemoryTable
              itemId="name"
              responsive={false}
              columns={this.getColumnConfig(intl)}
              selection={{
                itemId: 'name',
                onSelectionChange: (selection: RoleMapping[]) => this.setState({ selection }),
              }}
              pagination={{
                initialPageSize: 20,
                pageSizeOptions: [10, 20, 30, 50, 100],
              }}
              items={this.getVisbileRoleMappings()}
              loading={roles.length === 0}
              search={{
                toolsLeft: this.renderToolsLeft(),
                box: {
                  incremental: true,
                },
                onChange: (query: Record<string, any>) => {
                  this.setState({
                    filter: query.queryText,
                  });
                },
              }}
              sorting={{
                sort: {
                  field: 'name',
                  direction: 'asc',
                },
              }}
              // @ts-ignore missing rowProps typedef
              rowProps={() => {
                return {
                  'data-test-subj': 'roleRow',
                };
              }}
              isSelectable
            />
          }
        </EuiPageContentBody>
      </EuiPageContent>
    );
  };

  private getColumnConfig = (intl: InjectedIntl) => {
    const enabledRoleDesc = intl.formatMessage({
      id: 'xpack.security.management.role_mappings.disabledColumnDescription',
      defaultMessage:
        'Mappings that have enabled set to false are ignored when role mapping is performed.',
    });
    return [
      {
        field: 'name',
        name: intl.formatMessage({
          id: 'xpack.security.management.role_mappings.nameColumnName',
          defaultMessage: 'Name',
        }),
        sortable: true,
        truncateText: true,
        render: (name: string, record: RoleMapping) => {
          return (
            <EuiText color="subdued" size="s">
              <EuiLink
                data-test-subj="roleMappingRowName"
                href={getRoleMappingManagementHref(name)}
              >
                {name}
              </EuiLink>
              {!isRoleEnabled(record) && (
                <FormattedMessage
                  id="xpack.security.management.role_mappings.disabledTooltip"
                  defaultMessage=" (disabled)"
                />
              )}
            </EuiText>
          );
        },
      },
      {
        field: 'roles',
        name: intl.formatMessage({
          id: 'xpack.security.management.role_mappings.rolesColumnName',
          defaultMessage: 'Roles',
        }),
        render: (names: string[]) => {
          const links = names.map((name, index) => {
            return (
              <Fragment key={name}>
                <EuiLink href={`#${EDIT_ROLES_PATH}/${name}`}>{name}</EuiLink>
                {index === names.length - 1 ? null : ', '}
              </Fragment>
            );
          });
          return <div data-test-subj="roleMappingRowRoles">{links}</div>;
        },
      },
      {
        field: 'enabled',
        name: (
          <EuiToolTip content={enabledRoleDesc}>
            <span className="rolesGridPage__enabledRoleTooltip">
              <FormattedMessage
                id="xpack.security.management.role_mappings.enabledColumnName"
                defaultMessage="Enabled"
              />
              <EuiIcon size="s" color="subdued" type="questionInCircle" className="eui-alignTop" />
            </span>
          </EuiToolTip>
        ),
        dataType: 'boolean',
        align: 'right',
        sortable: true,
        description: enabledRoleDesc,
        render: (enabled: boolean | undefined) => {
          const label = intl.formatMessage({
            id: 'xpack.security.management.role_mappings.enabledRoleIconLabel',
            defaultMessage: 'Mapping is enabled',
          });

          return enabled ? (
            <span title={label}>
              <EuiIcon aria-label={label} data-test-subj="roleMappingRowEnabled" type="check" />
            </span>
          ) : null;
        },
      },
    ];
  };
  //
  // private get = () => {
  //   const { roles, filter } = this.state;
  //
  //   return filter
  //     ? roles.filter(({ name }) => {
  //         const normalized = `${name}`.toLowerCase();
  //         const normalizedQuery = filter.toLowerCase();
  //         return normalized.indexOf(normalizedQuery) !== -1;
  //       })
  //     : roles;
  // };

  private handleDelete = () => {
    this.setState({
      selection: [],
      showDeleteConfirmation: false,
    });
    this.loadRoleMappings();
  };

  private getVisbileRoleMappings = () => {
    const { roles, filter } = this.state;

    return filter
      ? roles.filter(({ name }) => {
          const normalized = `${name}`.toLowerCase();
          const normalizedQuery = filter.toLowerCase();
          return normalized.indexOf(normalizedQuery) !== -1;
        })
      : roles;
  };
  private async loadRoleMappings() {
    try {
      const roles = await RoleMappingApi.getRoleMappings();

      this.setState({ roles });
    } catch (e) {
      if (_.get(e, 'body.statusCode') === 403) {
        this.setState({ permissionDenied: true });
      } else {
        toastNotifications.addDanger(
          this.props.intl.formatMessage(
            {
              id: 'xpack.security.management.role_mappings.fetchingRoleMappingErrorMessage',
              defaultMessage: 'Error fetching role mappings: {message}',
            },
            { message: _.get(e, 'body.message', e.message || '') }
          )
        );
      }
    }
  }

  private renderToolsLeft() {
    const { selection } = this.state;
    if (selection.length === 0) {
      return;
    }
    const numSelected = selection.length;
    return (
      <EuiButton
        data-test-subj="deleteRoleMappingButton"
        color="danger"
        onClick={() => this.setState({ showDeleteConfirmation: true })}
      >
        <FormattedMessage
          id="xpack.security.management.role_mappings.deleteSelectedRolesButtonLabel"
          defaultMessage="Delete {numSelected} mapping{numSelected, plural, one { } other {s}}"
          values={{
            numSelected,
          }}
        />
      </EuiButton>
    );
  }
  private onCancelDelete = () => {
    this.setState({ showDeleteConfirmation: false });
  };
}

export const RoleMappingGridPage = injectI18n(RoleMappingGridPageUI);
