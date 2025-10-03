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

export async function test_api_update_comment_by_author(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as member
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community for post creation
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

  // Step 3: Create a post in the community
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 4: Create a comment on the post
  const initialComment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: RandomGenerator.paragraph({ sentences: 2 }),
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(initialComment);
  const commentId = initialComment.id;

  // Step 5: Update the comment with new content
  const newContent: string = RandomGenerator.paragraph({ sentences: 3 });
  const updatedComment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.update(
      connection,
      {
        postId: post.id,
        commentId: commentId,
        body: {
          content: newContent,
        } satisfies ICommunityPlatformComment.IUpdate,
      },
    );
  typia.assert(updatedComment);

  // Step 6: Validate that the comment was updated correctly
  TestValidator.equals(
    "comment content updated",
    updatedComment.content,
    newContent,
  );
  TestValidator.predicate(
    "updated_at timestamp refreshed",
    updatedComment.updated_at !== null,
  );
  TestValidator.equals("comment id unchanged", updatedComment.id, commentId);
  TestValidator.equals("post id unchanged", updatedComment.post_id, post.id);
  TestValidator.equals(
    "author id unchanged",
    updatedComment.author_id,
    member.id,
  );
  TestValidator.equals(
    "score unchanged",
    updatedComment.score,
    initialComment.score,
  );
  TestValidator.equals(
    "reply count unchanged",
    updatedComment.reply_count,
    initialComment.reply_count,
  );

  // Step 7: Verify that a non-author cannot update the comment
  // Would require re-authentication with a different member
  const differentMemberEmail: string = typia.random<
    string & tags.Format<"email">
  >();
  const differentMember: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: differentMemberEmail,
        password_hash: "another_hashed_password",
      } satisfies IMember.IJoin,
    });
  typia.assert(differentMember);

  // Reset connection to simulate new member
  const disconnectedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  // Re-authenticate with different member
  await api.functional.auth.member.join(disconnectedConnection, {
    body: {
      email: differentMemberEmail,
      password_hash: "another_hashed_password",
    } satisfies IMember.IJoin,
  });

  // Attempt update - should fail with 403
  await TestValidator.error(
    "non-author should receive 403 Forbidden",
    async () => {
      await api.functional.communityPlatform.member.posts.comments.update(
        disconnectedConnection,
        {
          postId: post.id,
          commentId: commentId,
          body: {
            content: "This should fail",
          } satisfies ICommunityPlatformComment.IUpdate,
        },
      );
    },
  );
}
