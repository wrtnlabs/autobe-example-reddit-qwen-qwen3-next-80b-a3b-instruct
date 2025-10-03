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

export async function test_api_comment_update_immutable_created_at(
  connection: api.IConnection,
) {
  // 1. Authenticate member to get access token
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community to post in
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: RandomGenerator.alphaNumeric(10),
          category: "Science",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // 3. Create a post within the community
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({
          sentences: 5,
          wordMin: 3,
          wordMax: 8,
        }),
        body: RandomGenerator.content({
          paragraphs: 2,
          sentenceMin: 10,
          sentenceMax: 15,
          wordMin: 4,
          wordMax: 8,
        }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Create a comment on the post
  const comment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: RandomGenerator.paragraph({
            sentences: 3,
            wordMin: 5,
            wordMax: 10,
          }),
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);

  // Store original created_at value for verification
  const originalCreatedAt: string = comment.created_at;

  // 5. Update the comment - only content changes, created_at is automatically immutable
  const updatedComment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.update(
      connection,
      {
        postId: post.id,
        commentId: comment.id,
        body: {
          content: "Updated comment content with new text", // System ignores any attempted created_at modification, and the property doesn't exist in IUpdate type
        } satisfies ICommunityPlatformComment.IUpdate,
      },
    );
  typia.assert(updatedComment);

  // 6. Verify the created_at field was not modified
  TestValidator.equals(
    "created_at should remain immutable during update",
    updatedComment.created_at,
    originalCreatedAt,
  );
  // Verify the content was updated correctly
  TestValidator.equals(
    "comment content should be updated",
    updatedComment.content,
    "Updated comment content with new text",
  );
}
