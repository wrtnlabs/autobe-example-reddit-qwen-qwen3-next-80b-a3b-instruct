import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_member_profile_retrieval_with_expired_session(
  connection: api.IConnection,
) {
  // Step 1: Create a new member account to obtain an initial access token
  const joinResponse: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash:
          "$2a$10$eXQVvR5ohmmjFcYdY3R0A.s8tXlL5g0/kLS1vlKiZoe1Z5Vvd.i9u",
      } satisfies IMember.IJoin,
    });
  typia.assert(joinResponse);

  // Step 2: Sign out the user by clearing authentication headers (simulating session expiration)
  // In a real scenario, the token would expire after a set time, but we simulate this by clearing headers
  const expiredConn: api.IConnection = { ...connection, headers: {} };

  // Step 3: Attempt to retrieve the member profile with the expired/invalid token
  // This call should fail with 401 Unauthorized as the token is no longer valid
  await TestValidator.error(
    "Should reject profile retrieval with expired token",
    async () => {
      await api.functional.communityPlatform.member.members.at(expiredConn, {
        memberId: joinResponse.id,
      });
    },
  );
}
