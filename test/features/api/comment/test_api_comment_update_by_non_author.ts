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

export async function test_api_comment_update_by_non_author(
  connection: api.IConnection,
) {
  // Step 1: Authenticate first member to create comment
  const member1Email: string = typia.random<string & tags.Format<"email">>();
  const member1: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: member1Email,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member1);

  // Step 2: Authenticate second member to attempt unauthorized update
  const member2Email: string = typia.random<string & tags.Format<"email">>();
  const member2: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: member2Email,
        password_hash: "hashed_password_456",
      } satisfies IMember.IJoin,
    });
  typia.assert(member2);

  // Step 3: Create a community to host the post
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

  // Step 4: Create a post in the community
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 2 }),
        body: RandomGenerator.content({ paragraphs: 1 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 5: Auth as member1 to create a comment on the post
  await api.functional.auth.member.join(connection, {
    body: {
      email: member1Email,
      password_hash: "hashed_password_123",
    } satisfies IMember.IJoin,
  });

  const comment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: RandomGenerator.paragraph({ sentences: 1 }),
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);

  // Step 6: Switch to member2 to attempt to update the comment created by member1
  await api.functional.auth.member.join(connection, {
    body: {
      email: member2Email,
      password_hash: "hashed_password_456",
    } satisfies IMember.IJoin,
  });

  // Verify that non-author cannot update the comment
  await TestValidator.error("non-author cannot update comment", async () => {
    await api.functional.communityPlatform.member.posts.comments.update(
      connection,
      {
        postId: post.id,
        commentId: comment.id,
        body: {
          content: "This update should fail",
        } satisfies ICommunityPlatformComment.IUpdate,
      },
    );
  });

  // Step 7: Verify the original comment content remains unchanged by retrieving it again
  // Re-authenticate as member1 to read the comment
  await api.functional.auth.member.join(connection, {
    body: {
      email: member1Email,
      password_hash: "hashed_password_123",
    } satisfies IMember.IJoin,
  });

  // Fetch the same comment by ID to verify it hasn't changed
  const retrievedComment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: comment.content,
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(retrievedComment);

  // Validate the comment content has not been changed
  TestValidator.equals(
    "original comment content unchanged",
    comment.content,
    retrievedComment.content,
  );
}
