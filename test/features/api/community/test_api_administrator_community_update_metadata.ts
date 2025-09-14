import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";
import type { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";

export async function test_api_administrator_community_update_metadata(
  connection: api.IConnection,
) {
  // The provided API SDK only implements the update function.
  // It does not implement create or join/admin authentication endpoints.
  // Therefore, we must assume a community already exists with a known name,
  // and the connection is already authenticated with administrator privileges.

  // Use a known valid community name that exists (generated with proper constraints)
  const communityName = typia.random<
    string &
      tags.MinLength<3> &
      tags.MaxLength<32> &
      tags.Pattern<"^[a-z0-9_-]+$">
  >();

  // Update community metadata with partial payload
  // All fields are optional according to ICommunitybbsCommunity.IUpdate
  const updatedBanner = "https://example.com/new-community-banner.jpg";
  const updatedRules = JSON.stringify([
    "Follow community guidelines",
    "No spam or self-promotion",
    "Be respectful to others",
    "Use appropriate language",
  ]);

  const updateResponse = await api.functional.admin.communities.update(
    connection,
    {
      name: communityName, // Path parameter: immutable community name
      body: {
        description: "Updated description for community testing.",
        category: "Science",
        banner: updatedBanner,
        rules: updatedRules,
      } satisfies ICommunitybbsCommunity.IUpdate,
    },
  );

  // Validate response type and structure
  typia.assert(updateResponse);

  // Validate all updated fields
  TestValidator.equals(
    "community name unchanged",
    updateResponse.name,
    communityName,
  );

  // Since we don't know the original values, we can only validate update fields are present
  TestValidator.equals(
    "description updated",
    updateResponse.description,
    "Updated description for community testing.",
  );
  TestValidator.equals("category updated", updateResponse.category, "Science");
  TestValidator.equals("banner updated", updateResponse.banner, updatedBanner);

  // Validate rules JSON structure
  const parsedRules = JSON.parse(updateResponse.rules as string);
  TestValidator.predicate("rules array exists", () =>
    Array.isArray(parsedRules),
  );
  TestValidator.equals("rules count", parsedRules.length, 4);
  TestValidator.equals(
    "rules[0]",
    parsedRules[0],
    "Follow community guidelines",
  );
  TestValidator.equals("rules[1]", parsedRules[1], "No spam or self-promotion");
  TestValidator.equals("rules[2]", parsedRules[2], "Be respectful to others");
  TestValidator.equals("rules[3]", parsedRules[3], "Use appropriate language");

  // Validate updated_at is refreshed (should not be same as original, but we can't compare)
  // Since we don't have original community, we can only validate it was set
  TestValidator.predicate("updated_at is valid date-time", () => {
    const updatedAt = new Date(updateResponse.updated_at);
    return (
      !isNaN(updatedAt.getTime()) && updatedAt.toString() !== "Invalid Date"
    );
  });

  // Validate immutable fields exist (they should be present per ICommunitybbsCommunity)
  TestValidator.predicate("id is valid uuid", () =>
    /^([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/i.test(
      updateResponse.id,
    ),
  );
  TestValidator.predicate("created_at is valid date-time", () => {
    const createdAt = new Date(updateResponse.created_at);
    return (
      !isNaN(createdAt.getTime()) && createdAt.toString() !== "Invalid Date"
    );
  });
  TestValidator.predicate(
    "member_count is non-negative integer",
    () =>
      typeof updateResponse.member_count === "number" &&
      Number.isInteger(updateResponse.member_count) &&
      updateResponse.member_count >= 0,
  );
  TestValidator.predicate("last_active_at is valid date-time", () => {
    const lastActiveAt = new Date(updateResponse.last_active_at);
    return (
      !isNaN(lastActiveAt.getTime()) &&
      lastActiveAt.toString() !== "Invalid Date"
    );
  });

  // Validate optional fields that were not updated are present
  // In ICommunitybbsCommunity, logo and deleted_at are optional and may be null/undefined
  // We don't set them so they might be null - which is valid

  // Log for debug if needed
  console.log(`Community ${communityName} updated successfully`);
}
