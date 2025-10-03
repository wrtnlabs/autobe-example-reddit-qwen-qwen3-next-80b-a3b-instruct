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

export async function test_api_member_recent_communities_get(
  connection: api.IConnection,
) {
  // Step 1: Authenticate a member user
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create exactly 6 communities for testing (5 to appear in result + 1 that will not)
  const communityNames = ArrayUtil.repeat(
    6,
    (index) => `community${index + 1}`,
  );
  const createdCommunities: ICommunityPlatformCommunity[] = [];
  for (const name of communityNames) {
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
    createdCommunities.push(community);
  }

  // Step 3: Join the communities in sequence: 1, 2, 3, 4, 5, 6
  // The most recently joined will be 6, then 5, etc.
  // We will join communities 1 to 6 sequentially to guarantee chronological order of interaction
  for (const community of createdCommunities) {
    const membership: ICommunityPlatformCommunityPlatformUserCommunity =
      await api.functional.communityPlatform.member.communities.members.create(
        connection,
        {
          communityName: community.name,
        },
      );
    typia.assert(membership);
  }

  // Step 4: Call the endpoint to get the member's recent communities
  // Expect the 5 most recently joined communities: 6, 5, 4, 3, 2 (in that order)
  // The oldest joined (community 1) should not be included
  const recentCommunities: ICommunityPlatformIPageICommunity.ISummary =
    await api.functional.communityPlatform.member.users.communities.getByUserid(
      connection,
      {
        userId: member.id,
      },
    );
  typia.assert(recentCommunities);

  // Step 5: Validate the response structure
  TestValidator.equals(
    "should return exactly 5 recent communities",
    recentCommunities.data.length,
    5,
  );

  // Should have correct pagination
  TestValidator.equals(
    "pagination should have limit of 5",
    recentCommunities.pagination.limit,
    5,
  );
  TestValidator.equals(
    "pagination should have page of 1",
    recentCommunities.pagination.current,
    1,
  );
  TestValidator.predicate(
    "pagination should have at least 5 records",
    recentCommunities.pagination.records >= 5,
  );

  // Validate ordering by most recently joined (descending by last_interaction_at)
  // Most recent = community 6 → should be at index 0
  // Then community 5 → index 1
  // Then community 4 → index 2
  // Then community 3 → index 3
  // Then community 2 → index 4 (least recent of the 5)
  // Community 1 (oldest) should be excluded

  // Order of communities we joined: 0=community1, 1=community2, 2=community3, 3=community4, 4=community5, 5=community6
  // Most recent 5: community2, community3, community4, community5, community6 → indices 1-5 in createdCommunities
  // But we want descending order: community6, community5, community4, community3, community2
  // So we'll map: response[0] = createdCommunities[5] (community6)
  //              response[1] = createdCommunities[4] (community5)
  //              response[2] = createdCommunities[3] (community4)
  //              response[3] = createdCommunities[2] (community3)
  //              response[4] = createdCommunities[1] (community2)

  for (let i = 0; i < 5; i++) {
    const communityInResponse = recentCommunities.data[i];
    const communityExpected = createdCommunities[6 - 1 - i]; // 5, 4, 3, 2, 1 → communities 6, 5, 4, 3, 2

    TestValidator.equals(
      `community at position ${i} should be ${communityExpected.name}`,
      communityInResponse.id,
      communityExpected.id,
    );

    // Verify the community name matches
    TestValidator.equals(
      `community name at position ${i} should match expected`,
      communityInResponse.name,
      communityExpected.name,
    );

    // Verify the category matches
    TestValidator.equals(
      `community category at position ${i} should match expected`,
      communityInResponse.category,
      communityExpected.category,
    );

    // Verify member_count is at least 1 (natural for joined community)
    TestValidator.predicate(
      `community member_count at position ${i} should be at least 1`,
      communityInResponse.member_count >= 1,
    );

    // Verify created_at is in valid ISO format
    TestValidator.predicate(
      `community created_at at position ${i} should be valid`,
      !isNaN(Date.parse(communityInResponse.created_at)),
    );
  }
}
