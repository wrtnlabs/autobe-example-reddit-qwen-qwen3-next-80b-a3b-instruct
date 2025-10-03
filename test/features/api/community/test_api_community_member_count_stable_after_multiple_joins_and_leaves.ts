import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformCommunityStats } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityStats";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_member_count_stable_after_multiple_joins_and_leaves(
  connection: api.IConnection,
) {
  // 1. Create member account
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash:
          "$2a$10$Z6shlg9e7v4p6.#1g7fP8P0.S55EcY8tm2o.f6zAhU.CjU.mgqfXy", // Valid bcrypt hash format for testing
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create new community
  const communityName: string = RandomGenerator.alphaNumeric(10);
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // 3. First join: member_count should increase to 1
  const firstMembership: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName,
      },
    );
  typia.assert(firstMembership);

  // 4. First leave: member_count should decrease to 0
  await api.functional.communityPlatform.member.communities.members.erase(
    connection,
    {
      communityName,
    },
  );

  // 5. Second join: member_count should increase to 1
  const secondMembership: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName,
      },
    );
  typia.assert(secondMembership);

  // 6. Second leave: member_count should decrease to 0
  await api.functional.communityPlatform.member.communities.members.erase(
    connection,
    {
      communityName,
    },
  );

  // 7. Third join: member_count should increase to 1
  const thirdMembership: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName,
      },
    );
  typia.assert(thirdMembership);

  // 8. Third leave: member_count should decrease to 0
  await api.functional.communityPlatform.member.communities.members.erase(
    connection,
    {
      communityName,
    },
  );

  // 9. Verify member_count is 0 after final leave
  const finalCount: ICommunityPlatformCommunityStats =
    await api.functional.communityPlatform.analytics.communities.member_count.at(
      connection,
      {
        communityId: community.id,
      },
    );
  typia.assert(finalCount);
  TestValidator.equals(
    "member count should be 0 after all leaves",
    finalCount.member_count,
    0,
  );
}
