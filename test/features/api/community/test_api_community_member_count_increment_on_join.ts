import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformCommunityPlatformUserCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityPlatformUserCommunity";
import type { ICommunityPlatformCommunityStats } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunityStats";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_community_member_count_increment_on_join(
  connection: api.IConnection,
) {
  // 1. Create member account
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create new community
  const communityName: string = typia.random<
    string &
      tags.MinLength<5> &
      tags.MaxLength<64> &
      tags.Pattern<"^[a-zA-Z0-9_-]+$">
  >();
  const communityCategory:
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
          category: communityCategory,
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);
  TestValidator.equals(
    "community created with member_count 0",
    community.member_count,
    0,
  );

  // 3. Member joins the community
  const membership: ICommunityPlatformCommunityPlatformUserCommunity =
    await api.functional.communityPlatform.member.communities.members.create(
      connection,
      {
        communityName,
      },
    );
  typia.assert(membership);

  // 4. Validate member count increment
  const memberCount: ICommunityPlatformCommunityStats =
    await api.functional.communityPlatform.analytics.communities.member_count.at(
      connection,
      {
        communityId: community.id,
      },
    );
  typia.assert(memberCount);
  TestValidator.equals(
    "member_count incremented to 1 after join",
    memberCount.member_count,
    1,
  );
}
