/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Hapi from 'hapi';
import Boom from 'boom';
import { initDeleteRoleMappingsApi } from './delete';

const createMockServer = () => {
  const mockServer = new Hapi.Server({ debug: false, port: 8080 });
  return mockServer;
};

const defaultPreCheckLicenseImpl = () => null;

describe('DELETE role', () => {
  const deleteRoleMappingTest = (
    description,
    {
      name,
      preCheckLicenseImpl,
      callWithRequestImpl,
      asserts,
    }
  ) => {
    test(description, async () => {
      const mockServer = createMockServer();
      const pre = jest.fn().mockImplementation(preCheckLicenseImpl);
      const mockCallWithRequest = jest.fn();
      if (callWithRequestImpl) {
        mockCallWithRequest.mockImplementation(callWithRequestImpl);
      }
      initDeleteRoleMappingsApi(mockServer, mockCallWithRequest);
      const headers = {
        authorization: 'foo',
      };

      const request = {
        method: 'DELETE',
        url: `/api/security/role_mapping/${name}`,
        headers,
      };
      const { result, statusCode } = await mockServer.inject(request);

      if (preCheckLicenseImpl) {
        expect(pre).toHaveBeenCalled();
      } else {
        expect(pre).not.toHaveBeenCalled();
      }

      if (callWithRequestImpl) {
        expect(mockCallWithRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: expect.objectContaining({
              authorization: headers.authorization,
            }),
          }),
          'shield.deleteRoleMapping',
          { name },
        );
      } else {
        expect(mockCallWithRequest).not.toHaveBeenCalled();
      }
      expect(statusCode).toBe(asserts.statusCode);
      expect(result).toEqual(asserts.result);
    });
  };

  describe('failure', () => {
    deleteRoleMappingTest(`requires name in params`, {
      name: '',
      asserts: {
        statusCode: 404,
        result: {
          error: 'Not Found',
          message: 'Not Found',
          statusCode: 404,
        },
      },
    });

    deleteRoleMappingTest(`returns result of routePreCheckLicense`, {
      preCheckLicenseImpl: () => Boom.forbidden('test forbidden message'),
      asserts: {
        statusCode: 403,
        result: {
          error: 'Forbidden',
          statusCode: 403,
          message: 'test forbidden message',
        },
      },
    });

    deleteRoleMappingTest(`returns error from callWithRequest`, {
      name: 'foo-role-mapping',
      preCheckLicenseImpl: defaultPreCheckLicenseImpl,
      callWithRequestImpl: async () => {
        throw Boom.notFound('test not found message');
      },
      asserts: {
        statusCode: 404,
        result: {
          error: 'Not Found',
          statusCode: 404,
          message: 'test not found message',
        },
      },
    });
  });

  describe('success', () => {
    deleteRoleMappingTest(`deletes role mapping`, {
      name: 'foo-role-mapping',
      preCheckLicenseImpl: defaultPreCheckLicenseImpl,
      callWithRequestImpl: async () => {},
      asserts: {
        statusCode: 204,
        result: null
      }
    });
  });
});
