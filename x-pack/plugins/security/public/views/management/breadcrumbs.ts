/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { i18n } from '@kbn/i18n';
import { MANAGEMENT_BREADCRUMB } from 'ui/management/breadcrumbs';

export function getUsersBreadcrumbs() {
  return [
    MANAGEMENT_BREADCRUMB,
    {
      text: i18n.translate('xpack.security.users.breadcrumb', {
        defaultMessage: 'Users',
      }),
      href: '#/management/security/users',
    },
  ];
}

export function getEditUserBreadcrumbs($route: Record<string, any>) {
  const { username } = $route.current.params;
  return [
    ...getUsersBreadcrumbs(),
    {
      text: username,
      href: `#/management/security/users/edit/${username}`,
    },
  ];
}

export function getCreateUserBreadcrumbs() {
  return [
    ...getUsersBreadcrumbs(),
    {
      text: i18n.translate('xpack.security.users.createBreadcrumb', {
        defaultMessage: 'Create',
      }),
    },
  ];
}

export function getRolesBreadcrumbs() {
  return [
    MANAGEMENT_BREADCRUMB,
    {
      text: i18n.translate('xpack.security.roles.breadcrumb', {
        defaultMessage: 'Roles',
      }),
      href: '#/management/security/roles',
    },
  ];
}

export function getRoleMappingBreadcrumbs() {
  return [
    MANAGEMENT_BREADCRUMB,
    {
      text: i18n.translate('xpack.security.role_mappings.breadcrumb', {
        defaultMessage: 'Role Mapping',
      }),
      href: '#/management/security/role_mapping',
    },
  ];
}
export function getEditRoleBreadcrumbs($route: Record<string, any>) {
  const { name } = $route.current.params;
  return [
    ...getRolesBreadcrumbs(),
    {
      text: name,
      href: `#/management/security/roles/edit/${name}`,
    },
  ];
}

export function getEditRoleMappingBreadcrumbs($route: Record<string, any>) {
  const { roleMappingName } = $route.current.params;
  return [
    ...getRoleMappingBreadcrumbs(),
    {
      text: roleMappingName,
      href: `#/management/security/role_mapping/edit/${roleMappingName}`,
    },
  ];
}

export function getCreateRoleBreadcrumbs() {
  return [
    ...getRoleMappingBreadcrumbs(),
    {
      text: i18n.translate('xpack.security.roles.createBreadcrumb', {
        defaultMessage: 'Create',
      }),
    },
  ];
}

export function getCreateRoleMappingBreadcrumbs() {
  return [
    ...getUsersBreadcrumbs(),
    {
      text: i18n.translate('xpack.security.role_mappings.createBreadcrumb', {
        defaultMessage: 'Create',
      }),
    },
  ];
}
