import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformGuest";

export async function test_api_guest_session_refresh(
  connection: api.IConnection,
) {
  // Step 1: Create initial guest session
  const initialGuestSession: ICommunityPlatformGuest.IAuthorized =
    await api.functional.auth.guest.join(connection);
  typia.assert(initialGuestSession);

  // Step 2: Refresh the guest session token
  const refreshedGuestSession: ICommunityPlatformGuest.IAuthorized =
    await api.functional.auth.guest.refresh(connection);
  typia.assert(refreshedGuestSession);

  // Step 3: Validate that session ID remained the same
  TestValidator.equals(
    "guest session ID should remain consistent after refresh",
    initialGuestSession.id,
    refreshedGuestSession.id,
  );

  // Step 4: Validate that access token has been updated
  TestValidator.notEquals(
    "access token should be different after refresh",
    initialGuestSession.token.access,
    refreshedGuestSession.token.access,
  );

  // Step 5: Validate that refresh token has been updated
  TestValidator.notEquals(
    "refresh token should be different after refresh",
    initialGuestSession.token.refresh,
    refreshedGuestSession.token.refresh,
  );

  // Step 6: Validate that expiration timestamps have been updated
  TestValidator.notEquals(
    "access token expiration should be updated after refresh",
    initialGuestSession.token.expired_at,
    refreshedGuestSession.token.expired_at,
  );

  TestValidator.notEquals(
    "refresh token expiration should be updated after refresh",
    initialGuestSession.token.refreshable_until,
    refreshedGuestSession.token.refreshable_until,
  );

  // Step 7: Validate that connection headers were updated with the new token
  // The API implementation should automatically update connection.headers with the new access token
  const currentAuthorizationHeader = connection.headers?.Authorization;
  TestValidator.equals(
    "connection headers Authorization should be updated with new token",
    currentAuthorizationHeader,
    refreshedGuestSession.token.access,
  );

  // Step 8: Validate that the refreshed token can be used for further operations
  // We'll make another refresh call to confirm token validity
  const secondRefresh: ICommunityPlatformGuest.IAuthorized =
    await api.functional.auth.guest.refresh(connection);
  typia.assert(secondRefresh);

  // Confirm we still have the same session ID and a new set of tokens
  TestValidator.equals(
    "session ID should remain consistent after second refresh",
    initialGuestSession.id,
    secondRefresh.id,
  );

  // The new refresh token must be different from the previous one
  TestValidator.notEquals(
    "second refresh should produce a new access token",
    refreshedGuestSession.token.access,
    secondRefresh.token.access,
  );

  TestValidator.notEquals(
    "second refresh should produce a new refresh token",
    refreshedGuestSession.token.refresh,
    secondRefresh.token.refresh,
  );
}
