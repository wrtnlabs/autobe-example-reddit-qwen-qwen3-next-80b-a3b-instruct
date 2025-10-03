import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformComment";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_nested_comment_creation(
  connection: api.IConnection,
) {
  // 1. Authenticate as member to create post and comments
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123", // Must be valid bcrypt hash
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community to host the post
  const communityName: string = RandomGenerator.alphaNumeric(10);
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

  // 3. Create the post to comment on
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({
          paragraphs: 1,
          sentenceMin: 5,
          sentenceMax: 10,
        }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Create the parent comment to reply to
  const parentComment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: RandomGenerator.paragraph({ sentences: 2 }),
          // parent_id omitted - this is a top-level comment
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(parentComment);

  // 5. Create a nested (reply) comment to the parent comment
  const nestedComment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: RandomGenerator.paragraph({ sentences: 1 }),
          parent_id: parentComment.id,
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(nestedComment);

  // 6. Validate the nested comment has correct parent_id
  TestValidator.equals(
    "nested comment parent_id matches parent comment id",
    nestedComment.parent_id,
    parentComment.id,
  );
}
