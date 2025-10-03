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

export async function test_api_community_member_count_retrieval(
  connection: api.IConnection,
) {
  // 1. Authenticate a member user to create a community
  const creatorEmail: string = typia.random<string & tags.Format<"email">>();
  const creator: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: creatorEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(creator);

  // Update connection with creator's token for community creation
  connection.headers = { Authorization: creator.token.access };

  // 2. Create a community to track member count
  const communityName: string = `community-${RandomGenerator.alphaNumeric(8)}`;
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
  TestValidator.equals(
    "created community has correct name",
    community.name,
    communityName,
  );

  // 3. Authenticate several member users to join the community
  const memberEmails: string[] = ArrayUtil.repeat(5, () =>
    typia.random<string & tags.Format<"email">>(),
  );
  const memberTokens: ICommunityPlatformMember.IAuthorized[] = [];
  for (const email of memberEmails) {
    const member: ICommunityPlatformMember.IAuthorized =
      await api.functional.auth.member.join(connection, {
        body: {
          email,
          password_hash: "hashed_password_123",
        } satisfies IMember.IJoin,
      });
    typia.assert(member);
    memberTokens.push(member);
  }

  // 4. Have multiple users join the community
  const membershipRecords: ICommunityPlatformCommunityPlatformUserCommunity[] =
    [];
  for (const member of memberTokens) {
    // Switch connection to member's token
    connection.headers = { Authorization: member.token.access };

    const membership: ICommunityPlatformCommunityPlatformUserCommunity =
      await api.functional.communityPlatform.member.communities.members.create(
        connection,
        {
          communityName,
        },
      );
    typia.assert(membership);
    TestValidator.equals(
      "membership has right community",
      membership.community_platform_community_id,
      community.id,
    );
    membershipRecords.push(membership);
  }

  // Verify member count after all joins
  const countAfterJoins: ICommunityPlatformCommunityStats =
    await api.functional.communityPlatform.analytics.communities.member_count.at(
      connection,
      {
        communityId: community.id,
      },
    );
  typia.assert(countAfterJoins);
  TestValidator.equals(
    "member count should be 6 (creator + 5 members)",
    countAfterJoins.member_count,
    6,
  );

  // 5. Have some members leave the community to test count reduction
  // Leave the first two members
  const membersToLeave = membershipRecords.slice(0, 2);
  const membersWhoStayed = membershipRecords.slice(2);

  for (const membership of membersToLeave) {
    // Find the corresponding token for this membership
    const memberToken = memberTokens.find(
      (m) => m.id === membership.community_platform_user_id,
    );

    if (!memberToken) {
      throw new Error("Could not find token for membership to leave");
    }

    // Switch connection to leaving member's token
    connection.headers = { Authorization: memberToken.token.access };

    await api.functional.communityPlatform.member.communities.members.erase(
      connection,
      {
        communityName,
      },
    );
  }

  // Verify member count after members leave
  const countAfterLeave: ICommunityPlatformCommunityStats =
    await api.functional.communityPlatform.analytics.communities.member_count.at(
      connection,
      {
        communityId: community.id,
      },
    );
  typia.assert(countAfterLeave);
  TestValidator.equals(
    "member count should be 4 (creator + 3 members who stayed)",
    countAfterLeave.member_count,
    4,
  );

  // 6. Re-authenticate as creator to ensure all memory is held
  connection.headers = { Authorization: creator.token.access };

  // 7. Final verification of member count
  const finalMemberCountResponse: ICommunityPlatformCommunityStats =
    await api.functional.communityPlatform.analytics.communities.member_count.at(
      connection,
      {
        communityId: community.id,
      },
    );
  typia.assert(finalMemberCountResponse);

  // Final validation: creator (1) + 3 members who stayed (3) = 4 total
  TestValidator.equals(
    "final member count should reflect only active members",
    finalMemberCountResponse.member_count,
    4,
  );
}
