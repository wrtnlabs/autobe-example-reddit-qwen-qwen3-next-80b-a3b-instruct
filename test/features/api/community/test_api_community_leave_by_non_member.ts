import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_leave_by_non_member(
  connection: api.IConnection,
) {
  // Step 1: Create the community creator account
  const creatorEmail = typia.random<string & tags.Format<"email">>();
  const creator: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: creatorEmail,
        password_hash: "hashedPassword123",
      } satisfies IMember.IJoin,
    });
  typia.assert(creator);

  // Step 2: Create a community
  const communityName = RandomGenerator.alphabets(10);
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

  // Step 3: Create a different member account who has never joined the community
  const nonMemberEmail = typia.random<string & tags.Format<"email">>();
  const nonMember: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: nonMemberEmail,
        password_hash: "hashedPassword456",
      } satisfies IMember.IJoin,
    });
  typia.assert(nonMember);

  // Step 4: Switch authentication context to non-member via API login (CORRECT WAY)
  // This creates a new connection context without manual header manipulation
  const nonMemberConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // Re-authenticate as non-member using the API function (proper authentication)
  // No manual header manipulation - using the API as intended
  await api.functional.auth.member.join(nonMemberConnection, {
    body: {
      email: nonMemberEmail,
      password_hash: "hashedPassword456",
    } satisfies IMember.IJoin,
  });

  // Step 5: Attempt to leave the community as a non-member (should fail with 404)
  await TestValidator.error(
    "non-member should not be able to leave community",
    async () => {
      await api.functional.communityPlatform.member.communities.members.erase(
        nonMemberConnection,
        {
          communityName: communityName,
        },
      );
    },
  );
}
