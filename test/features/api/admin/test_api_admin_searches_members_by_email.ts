import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdmin";
import type { ICommunityPlatformAdminMemberId } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdminMemberId";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformMember";

export async function test_api_admin_searches_members_by_email(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as admin
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const admin: ICommunityPlatformAdmin.IAuthorized =
    await api.functional.auth.admin.join(connection, {
      body: {
        email: adminEmail,
        password: "AdminPassword123!",
        displayName: "Admin User",
      } satisfies ICommunityPlatformAdmin.IJoin,
    });
  typia.assert(admin);

  // Step 2: Create three member accounts with emails containing 'test'
  const testMembers: ICommunityPlatformMember.IAuthorized[] = [];
  for (let i = 0; i < 3; i++) {
    const memberEmail: string = `test${i}@example.com`;
    const member: ICommunityPlatformMember.IAuthorized =
      await api.functional.auth.member.join(connection, {
        body: {
          email: memberEmail,
          password_hash: "hashedpassword123",
        } satisfies IMember.IJoin,
      });
    typia.assert(member);
    testMembers.push(member);
  }

  // Step 3: Create one member account with email containing 'demo' (should not match)
  const demoMember: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: "demo@example.com",
        password_hash: "hashedpassword456",
      } satisfies IMember.IJoin,
    });
  typia.assert(demoMember);

  // Step 4: Search for members with query 'test'
  const searchResult: IPageICommunityPlatformMember.ISummary =
    await api.functional.communityPlatform.admin.admin.members.search(
      connection,
      {
        body: {
          search: "test",
          page: 1,
          limit: 10,
        } satisfies ICommunityPlatformMember.IRequest,
      },
    );
  typia.assert(searchResult);

  // Step 5: Validate search results
  TestValidator.equals(
    "pagination count matches expected",
    searchResult.pagination.records,
    3,
  );
  TestValidator.equals(
    "pagination page matches requested",
    searchResult.pagination.current,
    1,
  );
  TestValidator.equals(
    "pagination limit matches requested",
    searchResult.pagination.limit,
    10,
  );
  TestValidator.equals(
    "number of results matches expected",
    searchResult.data.length,
    3,
  );

  // Validate each returned member has summary fields and excludes sensitive fields
  for (const member of searchResult.data) {
    TestValidator.predicate(
      "member has email",
      () => member.email !== undefined,
    );
    TestValidator.predicate(
      "member has display_name",
      () => member.display_name !== undefined,
    );
    TestValidator.predicate(
      "member has created_at",
      () => member.created_at !== undefined,
    );
    TestValidator.predicate("member email contains 'test'", () =>
      member.email!.includes("test"),
    ); // type-safe check
  }

  // Ensure the demo member is not in results
  const demoEmailExists = searchResult.data.some(
    (member) => member.email === demoMember.email,
  );
  TestValidator.equals(
    "demo member should not be in results",
    demoEmailExists,
    false,
  );
}
