/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { getClient } from '../../../../../../../server/lib/get_client_shield';
import { routePreCheckLicense } from '../../../../lib/route_pre_check_license';
import { initGetRoleMappingsApi } from './get';
import { initDeleteRoleMappingsApi } from './delete';
import { initPutRoleMappingsApi } from './put';

export function initExternalRoleMappingApi(server) {
  const callWithRequest = getClient(server).callWithRequest;
  const routePreCheckLicenseFn = routePreCheckLicense(server);
  initGetRoleMappingsApi(server, callWithRequest, routePreCheckLicenseFn);
  initPutRoleMappingsApi(server, callWithRequest, routePreCheckLicenseFn);
  initDeleteRoleMappingsApi(server, callWithRequest, routePreCheckLicenseFn);
}
