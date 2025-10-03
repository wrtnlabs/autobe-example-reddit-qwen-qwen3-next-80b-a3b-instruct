import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";

export async function test_api_community_join_by_guest(
  connection: api.IConnection,
) {
  // Create a community using the authenticated connection
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: RandomGenerator.alphaNumeric(10),
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Create an unauthenticated connection by clearing headers
  const unauthConnection: api.IConnection = { ...connection, headers: {} };

  // Attempt to join the community with unauthenticated connection - should fail with 401
  await TestValidator.error(
    "guest cannot join community without authentication",
    async () => {
      await api.functional.communityPlatform.member.communities.members.create(
        unauthConnection,
        {
          communityName: community.name,
        },
      );
    },
  );
}
