import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformIPageICommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformIPageICommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";

export async function test_api_member_recent_communities_limit_five(
  connection: api.IConnection,
) {
  // 1. Create member account
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);
  const memberId = member.id;

  // 2. Create eight communities with unique names
  const communityNames: string[] = ArrayUtil.repeat(
    8,
    (i) => `community_${RandomGenerator.alphaNumeric(6)}_${i + 1}`,
  );
  const createdCommunities: ICommunityPlatformCommunity[] = [];
  for (const name of communityNames) {
    const community: ICommunityPlatformCommunity =
      await api.functional.communityPlatform.member.communities.create(
        connection,
        {
          body: {
            name,
            category: "Tech & Programming",
          } satisfies ICommunityPlatformCommunity.ICreate,
        },
      );
    typia.assert(community);
    createdCommunities.push(community);
  }

  // 3. Join all eight communities
  const joinedCommunities: ICommunityPlatformCommunityPlatformUserCommunity[] =
    [];
  for (const community of createdCommunities) {
    const membership: ICommunityPlatformCommunityPlatformUserCommunity =
      await api.functional.communityPlatform.member.communities.members.create(
        connection,
        {
          communityName: community.name,
        },
      );
    typia.assert(membership);
    joinedCommunities.push(membership);
  }

  // 4. Post in second community to ensure it ranks higher than earlier ones
  // This updates the last_interaction_at for the second community
  const postContent = RandomGenerator.content({
    paragraphs: 3,
    sentenceMin: 10,
    sentenceMax: 15,
  });
  const secondCommunity = createdCommunities[1];
  await api.functional.communityPlatform.member.posts.create(connection, {
    body: {
      community_id: secondCommunity.id,
      title: RandomGenerator.paragraph({ sentences: 3 }),
      body: postContent,
    } satisfies ICommunityPlatformPost.ICreate,
  });

  // 5. Fetch the member's recent communities (limit should be 5)
  const recentCommunities: ICommunityPlatformIPageICommunity.ISummary =
    await api.functional.communityPlatform.member.users.communities.getByUserid(
      connection,
      {
        userId: memberId,
      },
    );
  typia.assert(recentCommunities);

  // 6. Validate that exactly five communities are returned
  TestValidator.equals(
    "returned communities count",
    recentCommunities.data.length,
    5,
  );

  // 7. Validate that the list is sorted by last_interaction_at descending
  // The second community (with the post) should be first
  // The remaining four are the four most recent joins among the other seven: communities with index 7,6,5,4
  const retrievedNames = recentCommunities.data.map((c) => c.name);
  // Expect: [community1, community7, community6, community5, community4]
  const expectedList = [
    secondCommunity.name,
    communityNames[7],
    communityNames[6],
    communityNames[5],
    communityNames[4],
  ];
  TestValidator.equals(
    "recent communities order",
    retrievedNames,
    expectedList,
  );

  // 8. Validate that the earliest three communities are not in the result (excluded)
  // The earliest three are community0, community2, community3 (indices 0,2,3)
  const excludedNames = [
    communityNames[0], // first created
    communityNames[2], // third created
    communityNames[3], // fourth created
  ];
  for (const excludedName of excludedNames) {
    TestValidator.predicate(
      `community ${excludedName} should be excluded`,
      !retrievedNames.includes(excludedName),
    );
  }

  // 9. Validate pagination metadata
  TestValidator.equals(
    "pagination current",
    recentCommunities.pagination.current,
    1,
  );
  TestValidator.equals(
    "pagination limit",
    recentCommunities.pagination.limit,
    5,
  );
  TestValidator.equals(
    "pagination records",
    recentCommunities.pagination.records,
    8,
  ); // Total active memberships
  TestValidator.equals(
    "pagination pages",
    recentCommunities.pagination.pages,
    2,
  ); // ceil(8/5) = 2
}
