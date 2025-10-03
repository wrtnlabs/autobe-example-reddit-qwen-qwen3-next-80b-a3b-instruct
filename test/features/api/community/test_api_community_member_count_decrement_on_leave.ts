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

export async function test_api_community_member_count_decrement_on_leave(
  connection: api.IConnection,
) {
  // 1. Create a new member account
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a new community (creator is automatically joined)
  const communityName = RandomGenerator.alphaNumeric(10);
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

  // 3. Verify member count is 1 (creator is automatically a member)
  const statsAfterCreation: ICommunityPlatformCommunityStats =
    await api.functional.communityPlatform.analytics.communities.member_count.at(
      connection,
      {
        communityId: community.id,
      },
    );
  typia.assert(statsAfterCreation);
  TestValidator.equals(
    "member count should be 1 after community creation",
    statsAfterCreation.member_count,
    1,
  );

  // 4. Member leaves the community
  await api.functional.communityPlatform.member.communities.members.erase(
    connection,
    {
      communityName,
    },
  );

  // 5. Verify member count is 0 after leaving
  const statsAfterLeave: ICommunityPlatformCommunityStats =
    await api.functional.communityPlatform.analytics.communities.member_count.at(
      connection,
      {
        communityId: community.id,
      },
    );
  typia.assert(statsAfterLeave);
  TestValidator.equals(
    "member count should be 0 after member leaves",
    statsAfterLeave.member_count,
    0,
  );
}
