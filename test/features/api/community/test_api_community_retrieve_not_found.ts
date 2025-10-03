import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";

export async function test_api_community_retrieve_not_found(
  connection: api.IConnection,
) {
  // Generate a random community name that matches the format but doesn't exist
  const nonExistentCommunityName = typia.random<
    string &
      tags.MinLength<5> &
      tags.MaxLength<64> &
      tags.Pattern<"^[a-zA-Z0-9_-]+$">
  >();

  // Attempt to retrieve the non-existent community and validate it returns 404 Not Found
  await TestValidator.httpError(
    "API should return 404 for non-existent community",
    404,
    async () => {
      await api.functional.communityPlatform.communities.at(connection, {
        communityName: nonExistentCommunityName,
      });
    },
  );
}
