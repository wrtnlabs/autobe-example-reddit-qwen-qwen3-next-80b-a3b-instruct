import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_update_non_creator(
  connection: api.IConnection,
) {
  // 1. Authenticate the creator of the community
  const createEmail: string = typia.random<string & tags.Format<"email">>();
  const creator: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: createEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(creator);

  // 2. Authenticate a second member user to attempt unauthorized updates
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_456",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 3. Create a community owned by the first authenticated member
  const communityName: string = typia.random<
    string &
      tags.MinLength<5> &
      tags.MaxLength<64> &
      tags.Pattern<"^[a-zA-Z0-9_-]+$">
  >();
  const category:
    | "Tech & Programming"
    | "Science"
    | "Movies & TV"
    | "Games"
    | "Sports"
    | "Lifestyle & Wellness"
    | "Study & Education"
    | "Art & Design"
    | "Business & Finance"
    | "News & Current Affairs" = "Tech & Programming";
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category,
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);
  TestValidator.equals("community name matches", community.name, communityName);

  // Switch to the second member's context by authenticating as the member
  await api.functional.auth.member.join(connection, {
    body: {
      email: memberEmail,
      password_hash: "hashed_password_456",
    } satisfies IMember.IJoin,
  });

  // 4. Attempt to update the community metadata as a non-creator
  await TestValidator.error("non-creator cannot update community", async () => {
    await api.functional.communityPlatform.member.communities.update(
      connection,
      {
        communityName,
        body: {
          description: "Updated description",
          rules: "New rules",
          logo_url: "https://example.com/logo.png",
          banner_url: "https://example.com/banner.png",
        } satisfies ICommunityPlatformCommunity.IUpdate,
      },
    );
  });
}
