import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunityIRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunityIRequest";
import type { ICommunityPlatformCommunityPlatformUserCommunityISummary } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunityISummary";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformCommunityPlatformUserCommunityISummary } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformCommunityPlatformUserCommunityISummary";

export async function test_api_community_member_list_unauthenticated_access(
  connection: api.IConnection,
) {
  // Step 1: Create a community creator account
  const creatorEmail: string = typia.random<string & tags.Format<"email">>();
  const creator: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: creatorEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(creator);

  // Step 2: Create a community with the creator account
  const communityName: string = RandomGenerator.alphaNumeric(10);
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming",
          description: "A technical community for developers",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);
  TestValidator.equals("Community name matches", community.name, communityName);

  // Step 3: Add another member to the community to ensure non-empty list
  const secondMemberEmail: string = typia.random<
    string & tags.Format<"email">
  >();
  const secondMember: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: secondMemberEmail,
        password_hash: "hashed_password_456",
      } satisfies IMember.IJoin,
    });
  typia.assert(secondMember);

  // Switch to second member context (if needed, though not necessary for this test)
  // But we'll use the original connection since join automatically sets token
  const membership: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName: communityName,
      },
    );
  typia.assert(membership);

  // Step 4: Attempt to access members list without authentication
  // Create a clean connection without authorization headers
  const unauthConnection: api.IConnection = { ...connection, headers: {} };

  // Test that unauthenticated access to members list fails with 401
  await TestValidator.error(
    "Unauthenticated access to community members list should return 401 Unauthorized",
    async () => {
      await api.functional.communityPlatform.communities.members.index(
        unauthConnection,
        {
          communityName: communityName,
          body: {
            limit: 10,
            offset: 0,
            sort: "last_interaction_at",
            direction: "desc",
          } satisfies ICommunityPlatformCommunityPlatformUserCommunityIRequest,
        },
      );
    },
  );
}
