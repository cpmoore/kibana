/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { kfetch } from 'ui/kfetch';
import { RoleMapping } from '../../common/model/role_mapping';

export class RoleMappingApi {
  public static async getRoleMappings(): Promise<RoleMapping[]> {
    return kfetch({ pathname: '/api/security/role_mapping' });
  }

  public static async getRoleMapping(roleName: string): Promise<RoleMapping> {
    return kfetch({ pathname: `/api/security/role_mapping/${encodeURIComponent(roleName)}` });
  }

  public static async deleteRoleMapping(roleName: string) {
    return kfetch({
      pathname: `/api/security/role_mapping/${encodeURIComponent(roleName)}`,
      method: 'DELETE',
    });
  }

  public static async putRoleMapping(roleMapping: RoleMapping) {
    const body = { ...roleMapping };
    delete body.name;
    return kfetch({
      pathname: `/api/security/role_mapping/${encodeURIComponent(roleMapping.name)}`,
      body: JSON.stringify(body),
      method: 'PUT',
    });
  }
}
