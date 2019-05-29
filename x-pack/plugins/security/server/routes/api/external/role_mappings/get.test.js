/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */
import Hapi from 'hapi';
import Boom from 'boom';
import { initGetRoleMappingsApi } from './get';

const createMockServer = () => {
  return new Hapi.Server({ debug: false, port: 8080 });
};

describe('GET role mappings', () => {
  const getRoleMappingsTest = (
    description,
    {
      preCheckLicenseImpl = () => null,
      callWithRequestImpl,
      asserts,
    },
  ) => {
    test(description, async () => {
      const mockServer = createMockServer();
      const pre = jest.fn().mockImplementation(preCheckLicenseImpl);
      const mockCallWithRequest = jest.fn();
      if (callWithRequestImpl) {
        mockCallWithRequest.mockImplementation(callWithRequestImpl);
      }
      initGetRoleMappingsApi(mockServer, mockCallWithRequest);
      const headers = {
        authorization: 'foo',
      };

      const request = {
        method: 'GET',
        url: '/api/security/role_mapping',
        headers,
      };
      const { result, statusCode } = await mockServer.inject(request);

      expect(pre).toHaveBeenCalled();
      if (callWithRequestImpl) {
        expect(mockCallWithRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: expect.objectContaining({
              authorization: headers.authorization,
            }),
          }),
          'shield.getRoleMapping',
        );
      } else {
        expect(mockCallWithRequest).not.toHaveBeenCalled();
      }
      expect(statusCode).toBe(asserts.statusCode);
      expect(result).toEqual(asserts.result);
    });
  };

  describe('failure', () => {
    getRoleMappingsTest(`returns result of routePreCheckLicense`, {
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

    getRoleMappingsTest(`returns error from callWithRequest`, {
      callWithRequestImpl: async () => {
        throw Boom.notAcceptable('test not acceptable message');
      },
      asserts: {
        statusCode: 406,
        result: {
          error: 'Not Acceptable',
          statusCode: 406,
          message: 'test not acceptable message',
        },
      },
    });
  });

  describe('success', () => {
    getRoleMappingsTest(`transforms role mapping`, {
      callWithRequestImpl: async () => ({
        first_role_mapping: {
          enabled: true,
          roles: ['role1'],
          rules: {
            field: {
              groups: [
                'group 1',
              ],
            },
          },
          metadata: {},
        },
      }),
      asserts: {
        statusCode: 200,
        result: [
          {
            name: 'first_role_mapping',
            enabled: true,
            roles: ['role1'],
            rules: {
              field: {
                groups: [
                  'group 1',
                ],
              },
            },
            metadata: {},
          },
        ],
      },
    });

  });
});

describe('GET role mapping', () => {
  const getRoleMappingTest = (
    description,
    {
      name,
      preCheckLicenseImpl = () => null,
      callWithRequestImpl,
      asserts,
    },
  ) => {
    test(description, async () => {
      const mockServer = createMockServer();
      const pre = jest.fn().mockImplementation(preCheckLicenseImpl);
      const mockCallWithRequest = jest.fn();
      if (callWithRequestImpl) {
        mockCallWithRequest.mockImplementation(callWithRequestImpl);
      }
      initGetRoleMappingsApi(mockServer, mockCallWithRequest);
      const headers = {
        authorization: 'foo',
      };

      const request = {
        method: 'GET',
        url: `/api/security/role_mapping/${name}`,
        headers,
      };
      const { result, statusCode } = await mockServer.inject(request);

      expect(pre).toHaveBeenCalled();
      if (callWithRequestImpl) {
        expect(mockCallWithRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: expect.objectContaining({
              authorization: headers.authorization,
            }),
          }),
          'shield.getRoleMapping',
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
    getRoleMappingTest(`returns result of routePreCheckLicense`, {
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

    getRoleMappingTest(`returns error from callWithRequest`, {
      name: 'first_role_mapping',
      callWithRequestImpl: async () => {
        throw Boom.notAcceptable('test not acceptable message');
      },
      asserts: {
        statusCode: 406,
        result: {
          error: 'Not Acceptable',
          statusCode: 406,
          message: 'test not acceptable message',
        },
      },
    });


    describe('success', () => {
      getRoleMappingTest(`get role mapping`, {
        name: 'first_role_mapping',
        callWithRequestImpl: async () => ({
          first_role_mapping: {
            enabled: true,
            roles: ['role1'],
            rules: {
              field: {
                groups: [
                  'group 1',
                ],
              },
            },
            metadata: {},
          },
        }),
        asserts: {
          statusCode: 200,
          result: {
            name: 'first_role_mapping',
            enabled: true,
            roles: ['role1'],
            rules: {
              field: {
                groups: [
                  'group 1',
                ],
              },
            },
            metadata: {},
          },
        },
      });
    });
  });
});
