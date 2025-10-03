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

export async function test_api_comment_update_by_author(
  connection: api.IConnection,
) {
  // 1. Authenticate the author
  const authorEmail: string = typia.random<string & tags.Format<"email">>();
  const author: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: authorEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(author);

  // 2. Create a community
  const communityName: string = `community-${RandomGenerator.alphaNumeric(8)}`;
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

  // 3. Create a post in the community
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Create a comment on the post as the author
  const commentContent: string = RandomGenerator.paragraph({ sentences: 5 });
  const createdComment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: commentContent,
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(createdComment);
  TestValidator.equals(
    "comment content matches",
    createdComment.content,
    commentContent,
  );
  TestValidator.equals(
    "comment author matches",
    createdComment.author_id,
    author.id,
  );

  // 5. Update the comment content by the author (original author)
  const updatedContent: string = RandomGenerator.paragraph({ sentences: 7 });
  const updatedComment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.update(
      connection,
      {
        postId: post.id,
        commentId: createdComment.id,
        body: {
          content: updatedContent,
        } satisfies ICommunityPlatformComment.IUpdate,
      },
    );
  typia.assert(updatedComment);
  TestValidator.equals(
    "updated comment content",
    updatedComment.content,
    updatedContent,
  );
  TestValidator.equals(
    "comment id unchanged",
    updatedComment.id,
    createdComment.id,
  );
  TestValidator.equals(
    "post id unchanged",
    updatedComment.post_id,
    createdComment.post_id,
  );
  TestValidator.equals(
    "author id unchanged",
    updatedComment.author_id,
    createdComment.author_id,
  );
  TestValidator.notEquals(
    "updated_at changed",
    updatedComment.updated_at,
    createdComment.updated_at,
  );
  TestValidator.equals(
    "created_at unchanged",
    updatedComment.created_at,
    createdComment.created_at,
  );

  // 6. Verify that non-author cannot update the comment
  // Switch to a different user
  const anotherEmail: string = typia.random<string & tags.Format<"email">>();
  const another: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: anotherEmail,
        password_hash: "hashed_password_456",
      } satisfies IMember.IJoin,
    });
  typia.assert(another);

  // Try to update the comment as a non-author
  await TestValidator.error("non-author cannot update comment", async () => {
    await api.functional.communityPlatform.member.posts.comments.update(
      connection,
      {
        postId: post.id,
        commentId: createdComment.id,
        body: {
          content: "attempted update by non-author",
        } satisfies ICommunityPlatformComment.IUpdate,
      },
    );
  });
}
