/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import Hapi from 'hapi';
import Boom from 'boom';
import { initPutRoleMappingsApi } from './put';
import { defaultValidationErrorHandler } from '../../../../../../../../src/core/server/http/http_tools';



const createMockServer = () => {
  const mockServer = new Hapi.Server({
    debug: false,
    port: 8080,
    routes: {
      validate: {
        failAction: defaultValidationErrorHandler
      }
    }
  });
  return mockServer;
};

const defaultPreCheckLicenseImpl = () => null;

const putRoleTest = (
  description,
  { name, payload, preCheckLicenseImpl, callWithRequestImpls = [], asserts }
) => {
  test(description, async () => {
    const mockServer = createMockServer();
    const mockPreCheckLicense = jest
      .fn()
      .mockImplementation(preCheckLicenseImpl);
    const mockCallWithRequest = jest.fn();
    for (const impl of callWithRequestImpls) {
      mockCallWithRequest.mockImplementationOnce(impl);
    }

    initPutRoleMappingsApi(
      mockServer,
      mockCallWithRequest,
      mockPreCheckLicense
    );
    const headers = {
      authorization: 'foo',
    };

    const request = {
      method: 'PUT',
      url: `/api/security/role_mapping/${name}`,
      headers,
      payload,
    };
    const response = await mockServer.inject(request);
    const { result, statusCode } = response;

    expect(result).toEqual(asserts.result);
    expect(statusCode).toBe(asserts.statusCode);
    if (preCheckLicenseImpl) {
      expect(mockPreCheckLicense).toHaveBeenCalled();
    } else {
      expect(mockPreCheckLicense).not.toHaveBeenCalled();
    }
    if (asserts.callWithRequests) {
      for (const args of asserts.callWithRequests) {
        expect(mockCallWithRequest).toHaveBeenCalledWith(
          expect.objectContaining({
            headers: expect.objectContaining({
              authorization: headers.authorization,
            }),
          }),
          ...args
        );
      }
    } else {
      expect(mockCallWithRequest).not.toHaveBeenCalled();
    }
  });
};

describe('PUT role mapping', () => {
  describe('failure', () => {
    putRoleTest(`requires name in params`, {
      name: '',
      payload: {},
      asserts: {
        statusCode: 404,
        result: {
          error: 'Not Found',
          message: 'Not Found',
          statusCode: 404,
        },
      },
    });

    putRoleTest(`requires name in params to not exceed 1024 characters`, {
      name: 'a'.repeat(1025),
      payload: {},
      asserts: {
        statusCode: 400,
        result: {
          error: 'Bad Request',
          message: `child "name" fails because ["name" length must be less than or equal to 1024 characters long]`,
          statusCode: 400,
          validation: {
            keys: ['name'],
            source: 'params',
          },
        },
      },
    });

    putRoleTest(`only allow if roles are set`, {
      name: 'foo_mapping',
      payload: {
        enabled: true,
        roles: [],
        rules: {
          field: {
            groups: [
              'group 1',
            ],
          },
        },
        metadata: {},
      },
      asserts: {
        statusCode: 400,
        result: {
          error: 'Bad Request',
          //eslint-disable-next-line max-len
          message: `child \"roles\" fails because [\"roles\" has a length of 0]`,
          statusCode: 400,
          validation: {
            keys: ['roles'],
            source: 'payload',
          },
        },
      },
    });

    describe('global', () => {
      putRoleTest(`only allows known rules`, {
        name: 'foo_mapping',
        payload: {
          enabled: true,
          roles: [],
          rules: {
            foo: {
              groups: [
                'group 1',
              ],
            },
          },
          metadata: {},
        },
        asserts: {
          statusCode: 400,
          result: {
            error: 'Bad Request',
            //eslint-disable-next-line max-len
            message: `child \"rules\" fails because [\"rules\" at position 0 fails because [child at position 0 fails because child must be one of [any, all, field]]]`,
            statusCode: 400,
            validation: {
              keys: ['rules.foo'],
              source: 'payload',
            },
          },
        },
      });

      putRoleTest(`returns result of routePreCheckLicense`, {
        name: 'foo_mapping',
        payload: {},
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
    });

    describe('success', () => {
      putRoleTest(`creates role mapping`, {
        name: 'foo_mapping',
        payload: {},
        preCheckLicenseImpl: defaultPreCheckLicenseImpl,
        callWithRequestImpls: [async () => ({}), async () => {
        }],
        asserts: {
          callWithRequests: [
            ['shield.getRoleMapping', { name: 'foo_mapping', ignore: [404] }],
            [
              'shield.putRoleMapping',
              {
                name: 'foo_mapping',
                body: {
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
            ],
          ],
          statusCode: 204,
          result: null,
        },
      });
    });
  });
});
