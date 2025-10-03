import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_member_registration(
  connection: api.IConnection,
) {
  const email: string & tags.Format<"email"> = typia.random<
    string & tags.Format<"email">
  >();
  const passwordHash: string = RandomGenerator.alphaNumeric(64);

  const response: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email,
        password_hash: passwordHash,
      } satisfies IMember.IJoin,
    });

  typia.assert(response);

  TestValidator.equals("email matches", response.email, email);
  TestValidator.equals("access token exists", !!response.token.access, true);
  TestValidator.equals("refresh token exists", !!response.token.refresh, true);
}
