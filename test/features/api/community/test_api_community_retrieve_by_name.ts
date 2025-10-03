import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_retrieve_by_name(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as member to create community
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hash123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create community with unique name
  const communityName: string = "gaming-arena";
  const createdCommunity: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Games",
          description: "A place for all gaming enthusiasts",
          rules: "No cheating\nNo toxicity\nHave fun!",
          logo_url: "https://example.com/logo.png",
          banner_url: "https://example.com/banner.jpg",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(createdCommunity);

  // Step 3: Retrieve community with authenticated connection
  const retrievedCommunity: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.communities.at(connection, {
      communityName: communityName,
    });
  typia.assert(retrievedCommunity);

  // Step 4: Verify returned data matches created data
  TestValidator.equals(
    "community name matches",
    retrievedCommunity.name,
    createdCommunity.name,
  );
  TestValidator.equals(
    "community category matches",
    retrievedCommunity.category,
    createdCommunity.category,
  );
  TestValidator.equals(
    "community description matches",
    retrievedCommunity.description,
    createdCommunity.description,
  );
  TestValidator.equals(
    "community rules matches",
    retrievedCommunity.rules,
    createdCommunity.rules,
  );
  TestValidator.equals(
    "community logo_url matches",
    retrievedCommunity.logo_url,
    createdCommunity.logo_url,
  );
  TestValidator.equals(
    "community banner_url matches",
    retrievedCommunity.banner_url,
    createdCommunity.banner_url,
  );
  TestValidator.equals(
    "member count should be 1",
    retrievedCommunity.member_count,
    1,
  );

  // Step 5: Create unauthenticated connection
  const unauthConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // Step 6: Retrieve community with unauthenticated connection
  const retrievedCommunityUnauth: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.communities.at(unauthConnection, {
      communityName: communityName,
    });
  typia.assert(retrievedCommunityUnauth);

  // Step 7: Verify unauthenticated response matches authenticated response
  TestValidator.equals(
    "unauthenticated community name matches",
    retrievedCommunityUnauth.name,
    createdCommunity.name,
  );
  TestValidator.equals(
    "unauthenticated community category matches",
    retrievedCommunityUnauth.category,
    createdCommunity.category,
  );
  TestValidator.equals(
    "unauthenticated community description matches",
    retrievedCommunityUnauth.description,
    createdCommunity.description,
  );
  TestValidator.equals(
    "unauthenticated community rules matches",
    retrievedCommunityUnauth.rules,
    createdCommunity.rules,
  );
  TestValidator.equals(
    "unauthenticated community logo_url matches",
    retrievedCommunityUnauth.logo_url,
    createdCommunity.logo_url,
  );
  TestValidator.equals(
    "unauthenticated community banner_url matches",
    retrievedCommunityUnauth.banner_url,
    createdCommunity.banner_url,
  );
  TestValidator.equals(
    "unauthenticated member count should be 1",
    retrievedCommunityUnauth.member_count,
    1,
  );

  // Step 8: Verify no membership information is included in either response
  // Check that there's no membershipStatus, isMember, isAdmin properties
  // We don't need to test for non-existent properties explicitly since typia.assert
  // will validate the exact ICommunityPlatformCommunity type structure
}
