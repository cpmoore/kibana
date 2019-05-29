/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License;
 * you may not use this file except in compliance with the Elastic License.
 */

import { i18n } from '@kbn/i18n';
import { RoleMapping } from '../../../../../common/model';

const validUsernameRegex = /[a-zA-Z_][a-zA-Z0-9_@\-\$\.]*/;

interface RoleMappingValidatorOptions {
  shouldValidate?: boolean;
}

export interface RoleMappingValidationResult {
  isInvalid: boolean;
  error?: string;
}

const ruleKeysAreIncorrect = (object: any) => {
  const validKeys = ['any', 'all', 'field'];
  const existingKeys = Object.keys(object);
  if (existingKeys.length === 0 || existingKeys.length > validKeys.length) {
    return true;
  }
  for (const x in object) {
    if (validKeys.indexOf(x) === -1) {
      return true;
    }
  }
  return false;
};

export class RoleMappingValidator {
  private shouldValidate?: boolean;

  constructor(options: RoleMappingValidatorOptions = {}) {
    this.shouldValidate = options.shouldValidate;
  }

  public enableValidation() {
    this.shouldValidate = true;
  }

  public disableValidation() {
    this.shouldValidate = false;
  }

  public validateName(name: string): RoleMappingValidationResult {
    if (!this.shouldValidate) {
      return valid();
    }
    if (!name) {
      return invalid(
        i18n.translate(
          'xpack.security.management.role_mappings.editRoleMapping.requiredNameErrorMessage',
          {
            defaultMessage: 'Name is required',
          }
        )
      );
    } else if (name && !name.match(validUsernameRegex)) {
      return invalid(
        i18n.translate(
          'xpack.security.management.role_mappings.editRoleMapping.nameAllowedCharactersErrorMessage',
          {
            defaultMessage:
              'Name must begin with a letter or underscore and contain only letters, underscores, and numbers',
          }
        )
      );
    }

    return valid();
  }

  public validateRoles(roles: []): RoleMappingValidationResult {
    if (!this.shouldValidate) {
      return valid();
    }
    if (!roles || !Array.isArray(roles)) {
      return invalid(
        i18n.translate(
          'xpack.security.management.role_mappings.editRoleMapping.requiredRolesErrorMessage',
          {
            defaultMessage: 'Roles are required',
          }
        )
      );
    } else if (roles.length === 0) {
      return invalid(
        i18n.translate(
          'xpack.security.management.role_mappings.editRoleMapping.minRequiredRolesErrorMessage',
          {
            defaultMessage: 'At least one role is required',
          }
        )
      );
    }

    return valid();
  }

  public validateRules(rulesJsonString): RoleMappingValidationResult {
    if (!this.shouldValidate) {
      return valid();
    }

    if (typeof rulesJsonString === 'string') {
      try {
        rulesJsonString = JSON.parse(rulesJsonString);
      } catch (e) {
        return invalid(
          i18n.translate(
            'xpack.security.management.role_mappings.editRoleMapping.invalidRulesJsonErrorMessage',
            {
              defaultMessage: 'A valid JSON object is required',
            }
          )
        );
      }
    }

    if (!rulesJsonString) {
      return invalid(
        i18n.translate(
          'xpack.security.management.role_mappings.editRoleMapping.requiredRulesErrorMessage',
          {
            defaultMessage: 'Rules are required',
          }
        )
      );
    } else if (Array.isArray(rulesJsonString)) {
      return invalid(
        i18n.translate(
          'xpack.security.management.role_mappings.editRoleMapping.invalidRulesJsonErrorMessage',
          {
            defaultMessage: 'A valid JSON object is required',
          }
        )
      );
    } else if (ruleKeysAreIncorrect(rulesJsonString)) {
      return invalid(
        i18n.translate(
          'xpack.security.management.role_mappings.editRoleMapping.invalidRuleKeysErrorMessage',
          {
            defaultMessage: 'The provided JSON object has invalid keys',
          }
        )
      );
    }

    return valid();
  }

  public validateForSave(roleMapping: RoleMapping, overrides): RoleMappingValidationResult {
    overrides = overrides || {};
    const { isInvalid: isNameInvalid } = this.validateName(overrides.name || roleMapping.name);
    const { isInvalid: areRulesInvalid } = this.validateRules(overrides.rules || roleMapping.rules);
    const { isInvalid: areRolesInvalid } = this.validateRoles(overrides.roles || roleMapping.roles);
    if (isNameInvalid || areRulesInvalid || areRolesInvalid) {
      return invalid();
    }
    return valid();
  }
}

function invalid(error?: string): RoleMappingValidationResult {
  return {
    isInvalid: true,
    error,
  };
}

function valid(): RoleMappingValidationResult {
  return {
    isInvalid: false,
  };
}
