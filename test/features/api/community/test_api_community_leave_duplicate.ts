import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_leave_duplicate(
  connection: api.IConnection,
) {
  // Step 1: Create and authenticate a new member account
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashedpassword123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community
  const communityName: string = typia.random<
    string &
      tags.MinLength<5> &
      tags.MaxLength<64> &
      tags.Pattern<"^[a-zA-Z0-9_-]+$">
  >();
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

  // Step 3: Have the member join the community
  const membership: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: community.name,
      },
    );
  typia.assert(membership);
  TestValidator.equals(
    "membership community matches",
    membership.community_platform_community_id,
    community.id,
  );

  // Step 4: Have the member leave the community
  await api.functional.communityPlatform.member.communities.members.erase(
    connection,
    {
      communityName: community.name,
    },
  );

  // Step 5: Attempt to leave the community again (duplicate leave)
  // This should result in a 404 Not Found error since the membership is no longer active
  await TestValidator.error(
    "duplicate leave request should return 404 Not Found",
    async () => {
      await api.functional.communityPlatform.member.communities.members.erase(
        connection,
        {
          communityName: community.name,
        },
      );
    },
  );
}
