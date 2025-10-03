import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdmin";
import type { ICommunityPlatformAdminMemberId } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdminMemberId";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_admin_retrieves_member_profile(
  connection: api.IConnection,
) {
  // Step 1: Create admin account
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword: string = "SecurePass123!";
  const admin: ICommunityPlatformAdmin.IAuthorized =
    await api.functional.auth.admin.join(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ICommunityPlatformAdmin.IJoin,
    });
  typia.assert(admin);

  // Step 2: Create regular member account
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const memberPasswordHash: string = "hashedpassword123";
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPasswordHash,
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 3: Switch to admin context (already authenticated via admin join)
  // Admin is already authenticated at this point

  // Step 4: Admin retrieves member's profile using memberId
  const memberProfile: ICommunityPlatformMember =
    await api.functional.communityPlatform.admin.members.at(connection, {
      memberId: member.id,
    });
  typia.assert(memberProfile);

  // Step 5: Validate retrieved profile data
  TestValidator.equals(
    "member email matches",
    memberProfile.email,
    memberEmail,
  );
  TestValidator.equals(
    "member creation timestamp is valid",
    memberProfile.created_at,
    member.created_at,
  );
  TestValidator.predicate(
    "member display name optional property is either string or undefined",
    memberProfile.display_name === undefined ||
      typeof memberProfile.display_name === "string",
  );
}
