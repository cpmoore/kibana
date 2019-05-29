/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import routes from 'ui/routes';
import template from 'plugins/security/views/management/edit_role_mapping/edit_role_mapping.html';
import 'angular-resource';
import 'ui/angular_ui_select';
import 'plugins/security/services/shield_user';
import 'plugins/security/services/shield_role';
import { EDIT_ROLE_MAPPING_PATH } from '../management_urls';
import { EditRoleMappingPage } from './components';
import React from 'react';
import { render, unmountComponentAtNode } from 'react-dom';
import { I18nContext } from 'ui/i18n';
import { getEditRoleMappingBreadcrumbs, getCreateRoleMappingBreadcrumbs } from '../breadcrumbs';

const renderReact = (elem, httpClient, changeUrl, roleMappingName) => {
  render(
    <I18nContext>
      <EditRoleMappingPage
        changeUrl={changeUrl}
        roleMappingName={roleMappingName}
      />
    </I18nContext>,
    elem
  );
};

routes.when(`${EDIT_ROLE_MAPPING_PATH}/:roleMappingName?`, {
  template,
  k7Breadcrumbs: ($injector, $route) => $injector.invoke(
    $route.current.params.roleMappingName
      ? getEditRoleMappingBreadcrumbs
      : getCreateRoleMappingBreadcrumbs
  ),
  controllerAs: 'editRoleMapping',
  controller($scope, $route, kbnUrl, $http) {
    $scope.$on('$destroy', () => {
      const elem = document.getElementById('editRoleMappingReactRoot');
      if (elem) {
        unmountComponentAtNode(elem);
      }
    });
    $scope.$$postDigest(() => {
      const elem = document.getElementById('editRoleMappingReactRoot');
      const roleMappingName = $route.current.params.roleMappingName;
      const changeUrl = (url) => {
        kbnUrl.change(url);
        $scope.$apply();
      };
      renderReact(elem, $http, changeUrl, roleMappingName);
    });
  },
});
