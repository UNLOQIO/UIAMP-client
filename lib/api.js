'use strict';
/**
 * The Client API Extends the client, adding function-action mapping
 */

const Client = require('./client');

class APIClient extends Client {

  /**
   * Verifies the IAM permissions for the given userId,roleId
   * ARGUMENTS:
   *  - accessId - the access object we want to perform against.
   *  - payload.user_id - the user we want to check.
   *
   * */
  verify(accessId, payload) {
    payload.access_id = accessId;
    return this.dispatch('iam.verify', payload);
  }

  /**
   * Returns the entire IAM list for a given role_id
   * */
  getRoleIAM(accessId, roleId) {
    let payload = {
      access_id: accessId,
      role_id: roleId
    };
    return this.dispatch('iam.verify', payload);
  }

  /**
   * Grants access to the given user/role inside an access
   * ARGUMENTS:
   *  payload.user_id - the user we want to give access
   *  payload.role or payload.role_id - the role we want to associate.
   *  payload.category_id - if specified, grant access to that specific category id.
   * */
  grantAccess(accessId, payload) {
    payload.access_id = accessId;
    return this.dispatch('iam.grant', payload);
  }

  /**
   * Revokes the access from the given user/role inside an access
   * ARGUMENTS
   *  payload.user_id - the user we want to remove access from
   *  payload.role - the role we want to remove from.
   * */
  revokeAccess(accessId, payload) {
    payload.access_id = accessId;
    return this.dispatch('iam.revoke', payload);
  }

  /**
   * Grants permission to the role/category/user to a given access
   * ARGUMENTS
   *  - create (bool) - CREATE access
   *  - read (bool) - READ access
   *  - update (bool) - UPDATE access
   *  - delete (bool) - DELETE access
   *  - role_id or role - the role to apply (not required when giving to specific users.
   *  - category_id - the category to apply
   * OPTIONAL: if user_id is specified, the permission will be given to the single user inside the category.
   *  - user_id - give permission ti this specific user
   *  - entity_id(optional) - if specified, give access to specific entity.
   * */
  grantPermission(accessId, payload) {
    payload.access_id = accessId;
    return this.dispatch('permission.grant', payload);
  }

  /**
   * This will essentially revoke any given permissions with the same arguments as above.
   * */
  revokePermission(accessId, payload) {
    payload.access_id = accessId;
    return this.dispatch('permission.revoke', payload);
  }

}

module.exports = APIClient;

