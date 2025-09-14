import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import type { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";

export async function test_api_administrator_unban_member(
  connection: api.IConnection,
) {
  // Generate valid member email for unban test
  const validMemberEmail: string = typia.random<
    string & tags.Format<"email">
  >();

  // 1. Test successful unban with valid email (assumes already banned)
  const unbannedMember: ICommunitybbsMember =
    await api.functional.admin.members.unban(connection, {
      email: validMemberEmail,
    });
  typia.assert(unbannedMember);
  TestValidator.equals(
    "unbanned member email matches",
    unbannedMember.email,
    validMemberEmail,
  );

  // 2. Test unban with invalid email format (must throw)
  const invalidEmailFormat = "not-an-email";
  await TestValidator.error("should reject invalid email format", async () => {
    await api.functional.admin.members.unban(connection, {
      email: invalidEmailFormat,
    });
  });

  // 3. Test unban with non-existent member email (must throw)
  const nonExistentEmail = typia.random<string & tags.Format<"email">>();
  // Use an email we know doesn't exist in system
  await TestValidator.error(
    "should reject unban for non-existent member",
    async () => {
      await api.functional.admin.members.unban(connection, {
        email: nonExistentEmail,
      });
    },
  );
}
