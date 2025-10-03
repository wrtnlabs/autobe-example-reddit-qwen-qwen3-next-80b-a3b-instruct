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

export async function test_api_community_member_count_after_leave(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as creator member
  const creatorEmail: string = typia.random<string & tags.Format<"email">>();
  const creator: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: creatorEmail,
        password_hash: "hashedPassword123",
      } satisfies IMember.IJoin,
    });
  typia.assert(creator);

  // Step 2: Create community for testing
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

  // Step 3: Authenticate as second member
  const secondMemberEmail: string = typia.random<
    string & tags.Format<"email">
  >();
  const secondMember: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: secondMemberEmail,
        password_hash: "hashedPassword456",
      } satisfies IMember.IJoin,
    });
  typia.assert(secondMember);

  // Step 4: Second member joins community
  const membership: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: communityName,
      },
    );
  typia.assert(membership);

  // Step 5: Second member leaves community
  await api.functional.communityPlatform.member.communities.members.erase(
    connection,
    {
      communityName: communityName,
    },
  );

  // Step 6: Verify community member count after leave
  const stats: ICommunityPlatformCommunityStats =
    await api.functional.communityPlatform.analytics.communities.member_count.at(
      connection,
      {
        communityId: community.id,
      },
    );
  typia.assert(stats);
  TestValidator.equals(
    "community member count should be 1 after one member leaves",
    stats.member_count,
    1,
  );
}
