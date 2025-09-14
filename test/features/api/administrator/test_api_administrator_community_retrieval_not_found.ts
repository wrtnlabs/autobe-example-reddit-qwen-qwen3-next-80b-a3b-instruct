import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import type { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";

export async function test_api_administrator_community_retrieval_not_found(
  connection: api.IConnection,
) {
  // Generate a random community name that will definitely not exist
  // Use a unique name with random alphanumeric to ensure it doesn't exist
  const nonExistentName: string = `nonexistent-${RandomGenerator.alphaNumeric(8)}`;

  // Validate that retrieving a non-existent community returns 404 Not Found
  // This should work even without authentication as it's a resource not found error
  await TestValidator.error(
    "non-existent community name should return 404 Not Found",
    async () => {
      await api.functional.admin.communities.at(connection, {
        name: nonExistentName,
      });
    },
  );

  // Verify case-insensitive matching is enforced
  // Generate a variant in uppercase - the system should treat it as non-existent too
  const mixedCaseName = nonExistentName.toUpperCase();
  await TestValidator.error(
    "case-insensitive variant of non-existent community should return 404",
    async () => {
      await api.functional.admin.communities.at(connection, {
        name: mixedCaseName,
      });
    },
  );
}
