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

export async function test_api_retrieve_community_member_count(
  connection: api.IConnection,
) {
  // Step 1: Authenticate and create a new member (community creator)
  const creatorEmail = typia.random<string & tags.Format<"email">>();
  const creator: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: creatorEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(creator);

  // Step 2: Create a new community as the creator
  const communityName = "test-community-" + RandomGenerator.alphaNumeric(8);
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

  // Step 3: Create and authenticate two additional members
  const additionalMembers = ArrayUtil.repeat(2, async () => {
    const email = typia.random<string & tags.Format<"email">>();
    const member: ICommunityPlatformMember.IAuthorized =
      await api.functional.auth.member.join(connection, {
        body: {
          email: email,
          password_hash: "hashed_password_456",
        } satisfies IMember.IJoin,
      });
    typia.assert(member);
    return member;
  });
  const additionalMembersResults = await Promise.all(additionalMembers);

  // Step 4: Join each additional member to the community using their own authenticated connection
  for (const member of additionalMembersResults) {
    // Create a new connection with the additional member's authentication token
    const memberConn: api.IConnection = {
      ...connection,
      headers: {
        Authorization: member.token.access,
      },
    };

    // Join the community as this member
    await api.functional.communityPlatform.member.communities.members.create(
      memberConn,
      {
        communityName: communityName,
      },
    );
  }

  // Step 5: Retrieve and validate member count (creator + 2 additional members = 3)
  const memberCountResponse: ICommunityPlatformCommunityStats =
    await api.functional.communityPlatform.analytics.communities.member_count.at(
      connection, // can use original connection - this endpoint doesn't require auth
      {
        communityId: community.id,
      },
    );
  typia.assert(memberCountResponse);
  TestValidator.equals(
    "member count should be 3 after 3 joins",
    memberCountResponse.member_count,
    3,
  );

  // Step 6: Leave one additional member from the community (using their connection)
  // Authenticate as the first additional member and leave the community
  const firstAdditionalMember = additionalMembersResults[0];
  const firstAdditionalConn: api.IConnection = {
    ...connection,
    headers: {
      Authorization: firstAdditionalMember.token.access,
    },
  };

  await api.functional.communityPlatform.member.communities.members.erase(
    firstAdditionalConn,
    {
      communityName: communityName,
    },
  );

  // Step 7: Retrieve and validate member count after one member leaves (3 - 1 = 2)
  const memberCountAfterLeave: ICommunityPlatformCommunityStats =
    await api.functional.communityPlatform.analytics.communities.member_count.at(
      connection, // can use original connection
      {
        communityId: community.id,
      },
    );
  typia.assert(memberCountAfterLeave);
  TestValidator.equals(
    "member count should be 2 after one leave",
    memberCountAfterLeave.member_count,
    2,
  );

  // Step 8: Test 404 for non-existent community
  await TestValidator.error(
    "should return 404 for non-existent community",
    async () => {
      await api.functional.communityPlatform.analytics.communities.member_count.at(
        connection,
        {
          communityId: typia.random<string & tags.Format<"uuid">>(), // random non-existent UUID
        },
      );
    },
  );
}
