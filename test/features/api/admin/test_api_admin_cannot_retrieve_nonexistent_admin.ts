import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdmin";
import type { ICommunityPlatformAdminId } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdminId";
import type { ICommunityPlatformAdminMemberId } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdminMemberId";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_admin_cannot_retrieve_nonexistent_admin(
  connection: api.IConnection,
) {
  // 1. Create an admin account
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const admin: ICommunityPlatformAdmin.IAuthorized =
    await api.functional.auth.admin.join(connection, {
      body: {
        email: adminEmail,
        password: "SecurePassword123!",
        displayName: RandomGenerator.name(),
      } satisfies ICommunityPlatformAdmin.IJoin,
    });
  typia.assert(admin);

  // 2. Create a regular member account (not an admin)
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "MemberPasswordHash",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 3. Attempt to retrieve admin details using the regular member's ID
  // This should fail with 404 since the member is not an admin
  await TestValidator.error(
    "retrieving admin details for non-admin member should return 404",
    async () => {
      await api.functional.communityPlatform.admin.admin.members.at(
        connection,
        {
          memberId: member.id, // Using regular member ID, not admin
        },
      );
    },
  );
}
