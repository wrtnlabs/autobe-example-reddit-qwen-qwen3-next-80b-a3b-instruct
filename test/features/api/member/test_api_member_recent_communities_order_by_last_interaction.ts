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

export async function test_api_member_recent_communities_order_by_last_interaction(
  connection: api.IConnection,
) {
  // 1. Create a new member account for authentication
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create four distinct communities
  const communityNames = ArrayUtil.repeat(4, () =>
    RandomGenerator.alphaNumeric(10),
  );
  const communities: ICommunityPlatformCommunity[] = [];
  for (const name of communityNames) {
    const community: ICommunityPlatformCommunity =
      await api.functional.communityPlatform.member.communities.create(
        connection,
        {
          body: {
            name: name,
            category: "Tech & Programming" as const,
          } satisfies ICommunityPlatformCommunity.ICreate,
        },
      );
    typia.assert(community);
    communities.push(community);
  }

  // 3. Join the member to each community sequentially with increasing timestamps
  // Simulate increasing last_interaction_at by using increasing timestamps
  const createdDates: string[] = [];
  for (let i = 0; i < communities.length; i++) {
    // Create a timestamp that increases for each community join
    const now = new Date();
    const timestamp = new Date(now.getTime() + i * 1000 * 60 * 60); // 1 hour increment between each
    const dateString = timestamp.toISOString();
    createdDates.push(dateString);

    // Join member to community
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: communities[i].name,
      },
    );

    // Note: In reality, last_interaction_at is generated server-side on activity.
    // This test relies on creation order to simulate increasing last_interaction_at.
    // The server will set last_interaction_at to the time of the join.
  }

  // 4. Retrieve the member's recent communities and verify ordering by last_interaction_at
  const recentCommunities: ICommunityPlatformIPageICommunity.ISummary =
    await api.functional.communityPlatform.member.users.communities.getByUserid(
      connection,
      {
        userId: member.id,
      },
    );
  typia.assert(recentCommunities);

  // Validate that the returned communities are ordered by last_interaction_at descending
  const communityList = recentCommunities.data;
  TestValidator.equals("expected 4 communities", communityList.length, 4);

  // Validate ordering: the first community should have the latest last_interaction_at
  // Since we joined in sequence with increasing timestamps,
  // the last joined community (communities[3]) should be first in the list
  TestValidator.equals(
    "most recent community matches expected",
    communityList[0].id,
    communities[3].id,
  );
  TestValidator.equals(
    "second most recent community matches expected",
    communityList[1].id,
    communities[2].id,
  );
  TestValidator.equals(
    "third most recent community matches expected",
    communityList[2].id,
    communities[1].id,
  );
  TestValidator.equals(
    "least recent community matches expected",
    communityList[3].id,
    communities[0].id,
  );

  // Ensure ordering is based on last_interaction_at and not community id or name
  // The ids and names were generated randomly, so this ordering by creation sequence validates the logic
}
