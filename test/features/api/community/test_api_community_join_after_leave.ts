import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_join_after_leave(
  connection: api.IConnection,
) {
  // 1. Create and authenticate a new member account
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community for the member to join and then leave
  const communityName: string =
    RandomGenerator.alphabets(10) + "_test_community";
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
  TestValidator.equals("community name matches", community.name, communityName);

  // 3. First, have the member join the community
  const firstMembership: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: communityName,
      },
    );
  typia.assert(firstMembership);
  TestValidator.equals(
    "first membership user_id matches member id",
    firstMembership.community_platform_user_id,
    member.id,
  );
  TestValidator.equals(
    "first membership community_id matches created community",
    firstMembership.community_platform_community_id,
    community.id,
  );
  TestValidator.predicate(
    "first membership not deleted",
    firstMembership.deleted_at === null,
  );

  // 4. Then, have the member leave the community (soft-delete the membership)
  await api.functional.communityPlatform.member.communities.members.erase(
    connection,
    {
      communityName: communityName,
    },
  );

  // 5. Attempt to join the community again
  const secondMembership: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: communityName,
      },
    );
  typia.assert(secondMembership);

  // 6. Validate that a new membership record is created (deleted_at is null again)
  TestValidator.equals(
    "second membership user_id matches member id",
    secondMembership.community_platform_user_id,
    member.id,
  );
  TestValidator.equals(
    "second membership community_id matches created community",
    secondMembership.community_platform_community_id,
    community.id,
  );
  TestValidator.predicate(
    "second membership not deleted",
    secondMembership.deleted_at === null,
  );

  // 7. Validate that the second membership has a different last_interaction_at
  // Note: We cannot verify the member_count changes because there is no
  // API endpoint provided to retrieve the community's member_count or the
  // user's recent communities list. The requirement to validate these
  // cannot be implemented with the provided API.
  // However, we can verify that the second membership record exists and is valid.
  // The system's internal updates to member_count and last_interaction_at
  // are assumed to work based on the successful rejoin.

  // The key business rule: rejoining a community after leaving creates a new active membership
  // This is proven by the success of create() and the fact that deleted_at is null.
}
