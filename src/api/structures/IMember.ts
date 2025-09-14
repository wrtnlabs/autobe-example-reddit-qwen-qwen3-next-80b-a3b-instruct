import { tags } from "typia";

export namespace IMember {
  /**
   * Request body for member registration containing authentication
   * credentials and optional display name.
   *
   * This schema defines the data structure for user registration through the
   * member join endpoint. It captures the essential information needed to
   * create a new member account in the communitybbs_member table, including
   * mandatory authentication credentials and an optional display preference.
   * The system validates field length constraints and email format before
   * creating the account.
   */
  export type ICreate = {
    /**
     * The user's email address, used as primary identifier and login
     * credential. Must be unique and valid email format, as validated by
     * the unique constraint on communitybbs_member.email field.
     *
     * This field is required during registration and must conform to
     * standard email formatting rules. The system validates email format
     * before accepting the registration request to prevent invalid
     * entries.
     */
    email: string & tags.Format<"email">;

    /**
     * The plaintext password the user wishes to set. This will be hashed by
     * the system using BCrypt before storage in
     * communitybbs_member.password_hash. Must meet complexity requirements,
     * typically minimum length of 8 characters.
     *
     * The password must be sufficiently complex to ensure account security.
     * It will never be stored in plaintext - the system applies BCrypt
     * hashing before persistence in the database. This field is required
     * and must exceed 8 characters.
     */
    password: string & tags.MinLength<8>;

    /**
     * Optional preferred display name for the user. If not provided, system
     * defaults to email prefix (the part before @). Truncated to 32
     * characters if longer. Stored in communitybbs_member.display_name
     * field.
     *
     * This field determines how the user's name appears in post and comment
     * authorship. If not provided during registration, the system
     * automatically generates a display name from the email address (local
     * part before @). The maximum length is 32 characters as enforced by
     * the schema and UI constraints.
     */
    display_name?:
      | (string & tags.MinLength<1> & tags.MaxLength<32>)
      | undefined;
  };

  /**
   * Request body for member login containing email and password for
   * authentication.
   *
   * This schema defines the authentication parameters used to verify a
   * member's identity during login. The system validates the email against
   * registered accounts and the password against the stored hashed value
   * using BCrypt. This is the standard authentication mechanism for returning
   * members to access their account.
   */
  export type ILogin = {
    /**
     * Registered email address of the member, used as login identifier.
     * Must match an existing record in communitybbs_member.email.
     *
     * This field is used to identify the user account during
     * authentication. The system checks against the unique email constraint
     * in the communitybbs_member table to verify the existence of the
     * account. The email must be exactly as registered to be accepted for
     * login.
     */
    email: string & tags.Format<"email">;

    /**
     * Plain-text password provided by user. Verified against stored
     * password_hash in communitybbs_member using BCrypt algorithm.
     *
     * The system compares this password with the BCrypt-hashed password
     * stored in the database for the provided email. The password must
     * match the one originally set during account creation. For security,
     * the password is never stored in plaintext; only the hash is
     * maintained in the database.
     */
    password: string & tags.MinLength<8>;
  };

  /**
   * Request body for refreshing a member's authentication token.
   *
   * This object contains the refresh token that will be validated by the
   * system to issue a new access token. The refresh token is issued during
   * the initial login or join operation and is used to extend session
   * validity without requiring re-authentication with credentials.
   *
   * The refresh token is cryptographically secure and bound to the user's
   * session. It expires after a certain period and can only be used once
   * before invalidation (unless the system supports reusable refresh
   * tokens).
   *
   * This request does not include the access token - it's a standalone
   * refresh mechanism. The client must present this refresh token in the
   * Authorization header on the /auth/member/refresh endpoint.
   *
   * This type is used exclusively for POST /auth/member/refresh and ensures
   * secure token lifecycle management without exposing credentials again.
   */
  export type IRefresh = {
    /**
     * The refresh token used to obtain a new access token. This token is
     * issued during authentication and is used for token refresh
     * operations. It must be securely stored by the client and presented in
     * subsequent refresh requests.
     */
    refresh_token: string;
  };
}
