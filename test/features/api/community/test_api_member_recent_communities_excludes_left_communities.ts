import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformIPageICommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformIPageICommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";

export async function test_api_member_recent_communities_excludes_left_communities(
  connection: api.IConnection,
) {
  // 1. Join member
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashedPassword123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create four communities
  const communityNames = ArrayUtil.repeat(4, () =>
    RandomGenerator.alphaNumeric(10),
  );
  const createdCommunities = await Promise.all(
    communityNames.map(async (name) => {
      const community: ICommunityPlatformCommunity =
        await api.functional.communityPlatform.member.communities.create(
          connection,
          {
            body: {
              name: name,
              category: RandomGenerator.pick([
                "Tech & Programming",
                "Science",
                "Movies & TV",
                "Games",
                "Sports",
                "Lifestyle & Wellness",
                "Study & Education",
                "Art & Design",
                "Business & Finance",
                "News & Current Affairs",
              ]),
            } satisfies ICommunityPlatformCommunity.ICreate,
          },
        );
      typia.assert(community);
      return community;
    }),
  );

  // 3. Join all four communities
  const joinedCommunities = await Promise.all(
    createdCommunities.map(async (community) => {
      const membership: ICommunityPlatformCommunityPlatformUserCommunity =
        await api.functional.communityPlatform.member.communities.members.create(
          connection,
          {
            communityName: community.name,
          },
        );
      typia.assert(membership);
      return membership;
    }),
  );

  // 4. Leave the third community to create a deleted_at timestamp
  const thirdCommunityName = createdCommunities[2].name;
  await api.functional.communityPlatform.member.communities.members.erase(
    connection,
    {
      communityName: thirdCommunityName,
    },
  );

  // 5. Fetch the member's recent communities list
  const recentCommunities: ICommunityPlatformIPageICommunity.ISummary =
    await api.functional.communityPlatform.member.users.communities.getByUserid(
      connection,
      {
        userId: member.id,
      },
    );
  typia.assert(recentCommunities);

  // 6. Validate: Result should contain exactly 3 communities (one left)
  TestValidator.equals(
    "recent communities count after leaving one",
    recentCommunities.data.length,
    3,
  );

  // 7. Validate: The left community's name should not be in the result
  const leftCommunityName = thirdCommunityName;
  const leftCommunityIsInList = recentCommunities.data.some(
    (comm) => comm.name === leftCommunityName,
  );
  TestValidator.predicate(
    "left community is excluded from recent list",
    !leftCommunityIsInList,
  );
}
