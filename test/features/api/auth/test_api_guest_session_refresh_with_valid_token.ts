import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";

export async function test_api_guest_session_refresh_with_valid_token(
  connection: api.IConnection,
) {
  // Step 1: Create guest session with initial tokens
  const initialSession: ICommunitybbsMember.IAuthorized =
    await api.functional.auth.guest.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        display_name: RandomGenerator.name(),
      } satisfies ICommunitybbsMember.ICreate,
    });
  typia.assert(initialSession);

  // Store original tokens for comparison
  const originalAccessToken = initialSession.token.access;
  const originalRefreshToken = initialSession.token.refresh;

  // Step 2: Refresh session using the valid refresh token (automatically handled by SDK via headers)
  const refreshedSession: ICommunitybbsMember.IAuthorized =
    await api.functional.auth.guest.refresh(connection);
  typia.assert(refreshedSession);

  // Step 3: Validate that new tokens are different from original tokens
  TestValidator.notEquals(
    "new access token differs from original",
    refreshedSession.token.access,
    originalAccessToken,
  );
  TestValidator.notEquals(
    "new refresh token differs from original",
    refreshedSession.token.refresh,
    originalRefreshToken,
  );

  // Step 5: Verify member ID remains the same
  TestValidator.equals(
    "member ID unchanged after refresh",
    refreshedSession.id,
    initialSession.id,
  );
}
