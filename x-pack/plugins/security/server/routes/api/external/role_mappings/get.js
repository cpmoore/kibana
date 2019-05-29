/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import _ from 'lodash';
import Boom from 'boom';
import { wrapError } from '../../../../lib/errors';

export function initGetRoleMappingsApi(server, callWithRequest, routePreCheckLicenseFn) {
  const transformRoleMappingFromEs = (role, name) => {
    return {
      name,
      ...role
    };
  };

  const transformRoleMappingsFromEs = (roles) => {
    return _.map(roles, (role, name) => transformRoleMappingFromEs(role, name));
  };

  server.route({
    method: 'GET',
    path: '/api/security/role_mapping',
    async handler(request) {
      try {
        const response = await callWithRequest(request, 'shield.getRoleMapping');
        return _.sortBy(transformRoleMappingsFromEs(response), 'name');
      } catch (error) {
        return wrapError(error);
      }
    },
    config: {
      pre: [routePreCheckLicenseFn]
    }
  });

  server.route({
    method: 'GET',
    path: '/api/security/role_mapping/{name}',
    async handler(request) {
      const name = request.params.name;
      try {
        const response = await callWithRequest(request, 'shield.getRoleMapping', { name });
        if (response[name]) {
          return transformRoleMappingFromEs(response[name], name);
        }

        return Boom.notFound();
      } catch (error) {
        return wrapError(error);
      }
    },
    config: {
      pre: [routePreCheckLicenseFn]
    }
  });
}
