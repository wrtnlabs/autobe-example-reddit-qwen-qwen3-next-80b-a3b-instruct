import { tags } from "typia";

import { IAuthorizationToken } from "./IAuthorizationToken";

export namespace ICommunitybbsAdmin {
  /**
   * Authorization response containing JWT token for authenticated
   * administrators.
   *
   * This response is returned after successful login or registration of an
   * administrator account. It contains only the essential information needed
   * for secure administrative session management: the administrator's unique
   * ID and a valid authentication token.
   *
   * This type deliberately omits sensitive information such as email and
   * password_hash to prevent credential leakage. Only the ID is exposed for
   * client-side identification with all other administrative context being
   * retrieved via protected administrative endpoints.
   *
   * This minimal design enhances security by following the principle of least
   * privilege while maintaining the operational capability for administrators
   * to perform their duties without exposing system secrets.
   */
  export type IAuthorized = {
    /**
     * Unique identifier of the authenticated administrator.
     *
     * This field references the primary key of the administrator record in
     * the communitybbs_administrator table. It uniquely identifies the
     * administrator across all administrative functions and audit logs.
     *
     * This identifier ensures proper attribution of administrative actions
     * like community deletion or member banning, enabling a complete audit
     * trail while preserving privacy by not exposing sensitive personal
     * information like email.
     */
    id: string & tags.Format<"uuid">;

    /** JWT token information for authentication */
    token: IAuthorizationToken;
  };

  /**
   * Request body for creating a new administrative account.
   *
   * This schema defines the fields accepted for creation of a system-level
   * administrative account. It includes the email address of the
   * administrator and a display name for internal identification purposes.
   *
   * No password is accepted in this request because administrative accounts
   * are created through secure, out-of-band channels with manually generated
   * passwords. The actual password is set by privileged personnel via secure
   * offline mechanisms and stored as an encrypted bcrypt hash in the
   * database.
   *
   * This design ensures that administrative credentials are never transmitted
   * over the network and are established through secure, controlled processes
   * to prevent unauthorized account creation.
   */
  export type ICreate = {
    /**
     * Email address used for administrative login and authentication.
     *
     * This field serves as the primary identifier for administrative
     * accounts in the communitybbs_administrator table. It must be valid,
     * unique, and established through secure, manual provisioning.
     *
     * Admin emails are never public and are used exclusively for
     * authentication purposes. Unlike member accounts, administrative
     * accounts are not self-registered but created manually by superusers
     * or through secure provisioning workflows.
     */
    email: string & tags.Format<"email">;

    /**
     * Display name for identifying administrators in moderation logs and
     * UI.
     *
     * This is the name that appears in admin logs, moderation actions, and
     * administrative UI panels. It helps identify which administrator
     * performed an action such as banning a user or deleting a community.
     *
     * This display name is not shown to regular members and does not affect
     * any user-facing interfaces. It is purely for internal administrative
     * purposes and audit trail clarity.
     *
     * The display name is limited to 32 characters to maintain consistency
     * with other UI elements and prevent excessive log clutter.
     */
    display_name: string & tags.MinLength<1> & tags.MaxLength<32>;
  };
}
