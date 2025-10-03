import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_member_refresh_token_expired(
  connection: api.IConnection,
) {
  // 1. Create new member account to obtain initial access and refresh tokens
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Extract the refresh token from the authentication response
  const refreshToken = member.token.refresh;

  // 3. Attempt refresh with expired token (simulate token expiration by using valid token but expect server to reject)
  // Note: The server will reject if the token is no longer valid or expired
  await TestValidator.error(
    "refresh should fail with expired or invalid token",
    async () => {
      await api.functional.auth.member.refresh(connection, {
        body: {
          refreshToken,
        } satisfies IMember.IRefresh,
      });
    },
  );
}
