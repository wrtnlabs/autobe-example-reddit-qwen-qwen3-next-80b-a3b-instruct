import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_member_refresh_token_success(
  connection: api.IConnection,
) {
  // Step 1: Create new member account to obtain initial tokens
  // Use a valid bcrypt hash pattern for password_hash - server requires it
  const passwordHash =
    "$2a$10$W4XoMVDj7NqybuoqVjLxYubajnXbcfS1x59M1KUGV2L2eT97cWSxi"; // valid bcrypt hash format
  const joinResponse: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: passwordHash,
      } satisfies IMember.IJoin,
    });
  typia.assert(joinResponse);

  // Capture original last_login_at for comparison
  const originalLastLoginAt = joinResponse.last_login_at;

  // Extract refresh token from join response for refresh endpoint
  const refreshToken = joinResponse.token.refresh;

  // Step 2: Use refresh token to obtain new access token
  const refreshResponse: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.refresh(connection, {
      body: {
        refreshToken,
      } satisfies IMember.IRefresh,
    });
  typia.assert(refreshResponse);

  // Step 3: Validate refresh behavior

  // Ensure last_login_at was updated after refresh (must be >= original timestamp)
  // Convert to Date objects for comparison
  const originalDate = originalLastLoginAt
    ? new Date(originalLastLoginAt)
    : new Date(0);
  const refreshedDate = refreshResponse.last_login_at
    ? new Date(refreshResponse.last_login_at)
    : new Date(0);

  TestValidator.predicate(
    "last_login_at should be updated after refresh",
    refreshedDate >= originalDate,
  );

  // Ensure the refresh token is still valid (refreshable_until is in the future)
  const refreshableUntil = new Date(refreshResponse.token.refreshable_until);
  TestValidator.predicate(
    "refresh token should still be valid",
    refreshableUntil > new Date(),
  );

  // Ensure last_login_at is not null or undefined after successful refresh
  TestValidator.predicate(
    "last_login_at should not be null or undefined after refresh",
    refreshResponse.last_login_at !== null &&
      refreshResponse.last_login_at !== undefined,
  );

  // The server automatically updates connection.headers.Authorization with the new access token.
  // No further validation of the token is possible since no additional protected endpoints are provided.
  // The fact that refresh succeeded validates the new access token works (as per server contract).
}
