import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_update_non_author(
  connection: api.IConnection,
) {
  // 1. Authenticate the post creator
  const creatorEmail: string = typia.random<string & tags.Format<"email">>();
  const creator: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: creatorEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(creator);

  // 2. Authenticate a second user (non-author)
  const nonAuthorEmail: string = typia.random<string & tags.Format<"email">>();
  const nonAuthor: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: nonAuthorEmail,
        password_hash: "hashed_password_456",
      } satisfies IMember.IJoin,
    });
  typia.assert(nonAuthor);

  // 3. Create a community
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

  // 4. Create a post as the creator
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 5. Switch to non-author context
  // Re-authenticate as non-author - SDK automatically handles the new Authorization header
  await api.functional.auth.member.join(connection, {
    body: {
      email: nonAuthorEmail,
      password_hash: "hashed_password_456",
    } satisfies IMember.IJoin,
  });

  // 6. Attempt to update the post as non-author (expected to fail with 403)
  await TestValidator.error(
    "non-author should not be able to update post",
    async () => {
      await api.functional.communityPlatform.member.posts.update(connection, {
        postId: post.id,
        body: {
          title: "Hacked Title",
          body: "Hacked Body",
        } satisfies ICommunityPlatformPost.IUpdate,
      });
    },
  );
}
