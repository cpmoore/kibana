/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { wrapError } from '../../../../lib/errors';
import Joi from 'joi';

export function initPutRoleMappingsApi(server, callWithRequest, routePreCheckLicenseFn) {
  const roleMappingSchema = Joi.object({
    roles: Joi.array().items(Joi.string()),
    enabled: Joi.boolean().default(true),
    rules: Joi.object(),
    metadata: Joi.object()
  });

  server.route({
    method: 'PUT',
    path: '/api/security/role_mapping/{name}',
    async handler(request, h) {
      try {
        const name = request.params.name;
        const body = request.payload;
        await callWithRequest(request, 'shield.putRoleMapping', { name, body });
        return h.response().code(204);
      }catch(err) {
        throw wrapError(err);
      }
    },
    config: {
      validate: {
        payload: roleMappingSchema
      },
      pre: [routePreCheckLicenseFn]
    }
  });

}
