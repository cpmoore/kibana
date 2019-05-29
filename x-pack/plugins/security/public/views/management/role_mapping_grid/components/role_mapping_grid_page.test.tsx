/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

let mockSimulate403 = false;
const mock403 = () => ({ body: { statusCode: 403 } });
jest.mock('../../../../lib/roles_api', () => {
  return {
    RolesApi: {
      async getRoleMappings() {
        if (mockSimulate403) {
          throw mock403();
        }
        return [
          {
            name: 'mapping1',
            enabled: true,
            roles: ['role1'],
            rules: {
              field: {
                groups: ['group 1'],
              },
            },
            metadata: {},
          },
          {
            name: 'mapping2',
            enabled: false,
            roles: ['role1'],
            rules: {
              field: {
                groups: ['group 1'],
              },
            },
            metadata: {},
          },
        ];
      },
    },
  };
});

import { EuiIcon } from '@elastic/eui';
import { ReactWrapper } from 'enzyme';
import React from 'react';
import { mountWithIntl } from 'test_utils/enzyme_helpers';
import { PermissionDenied } from './permission_denied';
import { RoleMappingGridPage } from './role_mapping_grid_page';

const waitForRender = async (
  wrapper: ReactWrapper<any>,
  condition: (wrapper: ReactWrapper<any>) => boolean
) => {
  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      await Promise.resolve();
      wrapper.update();
      if (condition(wrapper)) {
        resolve();
      }
    }, 10);

    setTimeout(() => {
      clearInterval(interval);
      reject(new Error('waitForRender timeout after 2000ms'));
    }, 2000);
  });
};

describe('<RoleMappingGridPage />', () => {
  beforeEach(() => {
    mockSimulate403 = false;
  });

  it(`renders enabled roles as such`, async () => {
    const wrapper = mountWithIntl(<RoleMappingGridPage />);
    const initialIconCount = wrapper.find(EuiIcon).length;

    await waitForRender(wrapper, updatedWrapper => {
      return updatedWrapper.find(EuiIcon).length > initialIconCount;
    });
    expect(wrapper.find(PermissionDenied)).toHaveLength(0);
    expect(wrapper.find('EuiIcon[data-test-subj="roleMappingRowEnabled"]')).toHaveLength(1);
  });

  it('renders permission denied if required', async () => {
    mockSimulate403 = true;
    const wrapper = mountWithIntl(<RoleMappingGridPage />);
    await waitForRender(wrapper, updatedWrapper => {
      return updatedWrapper.find(PermissionDenied).length > 0;
    });
    expect(wrapper.find(PermissionDenied)).toMatchSnapshot();
  });
});
