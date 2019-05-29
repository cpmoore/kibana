/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import routes from 'ui/routes';
import template from 'plugins/security/views/management/role_mapping_grid/role_mapping.html';
import { ROLE_MAPPING_PATH } from '../management_urls';
import { getRoleMappingBreadcrumbs } from '../breadcrumbs';
import { I18nContext } from 'ui/i18n';
import { RoleMappingGridPage } from './components';

routes.when(ROLE_MAPPING_PATH, {
  template,
  k7Breadcrumbs: getRoleMappingBreadcrumbs,
  controller($scope) {
    $scope.$$postDigest(() => {
      const domNode = document.getElementById('roleMappingGridReactRoot');

      render(
        <I18nContext>
          <RoleMappingGridPage />
        </I18nContext>, domNode);

      // unmount react on controller destroy
      $scope.$on('$destroy', () => {
        unmountComponentAtNode(domNode);
      });
    });
  },
});
