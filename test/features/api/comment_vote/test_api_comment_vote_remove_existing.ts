import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformComment";
import type { ICommunityPlatformCommentVoteRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommentVoteRequest";
import type { ICommunityPlatformCommentVoteResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommentVoteResponse";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_comment_vote_remove_existing(
  connection: api.IConnection,
) {
  // Authenticate member
  const authHeader = connection.headers?.["authorization"];
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: typia.random<string>(),
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Create community
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: RandomGenerator.alphabets(10),
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Create post
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Create comment
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

  // Test 1: Vote up then remove
  const upvote: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(upvote);

  // Remove the upvote
  const removedUpvote: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.erase(
      connection,
      {
        commentId: comment.id,
      },
    );
  typia.assert(removedUpvote);

  // Verify vote score was decremented by 1
  TestValidator.equals(
    "vote score should be decremented by 1 after upvote removal",
    removedUpvote.score,
    upvote.score - 1,
  );

  // Verify idempotency: remove vote again
  const secondRemovalUpvote: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.erase(
      connection,
      {
        commentId: comment.id,
      },
    );
  typia.assert(secondRemovalUpvote);

  // Verify score remains unchanged after second removal (idempotent)
  TestValidator.equals(
    "vote score should remain unchanged after second removal (idempotent upvote)",
    secondRemovalUpvote.score,
    removedUpvote.score,
  );

  // Test 2: Vote down then remove
  const downvote: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "downvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(downvote);

  // Remove the downvote
  const removedDownvote: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.erase(
      connection,
      {
        commentId: comment.id,
      },
    );
  typia.assert(removedDownvote);

  // Verify vote score was incremented by 1 (since downvote was -1, removing it adds +1)
  TestValidator.equals(
    "vote score should be incremented by 1 after downvote removal",
    removedDownvote.score,
    downvote.score + 1,
  );

  // Verify idempotency: remove vote again
  const secondRemovalDownvote: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.erase(
      connection,
      {
        commentId: comment.id,
      },
    );
  typia.assert(secondRemovalDownvote);

  // Verify score remains unchanged after second removal (idempotent)
  TestValidator.equals(
    "vote score should remain unchanged after second removal (idempotent downvote)",
    secondRemovalDownvote.score,
    removedDownvote.score,
  );

  // Test 3: User cannot remove another user's vote (requires separate connection)
  const newConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // Authenticate another member
  const otherMember: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(newConnection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: typia.random<string>(),
      } satisfies IMember.IJoin,
    });
  typia.assert(otherMember);

  // Verify that the other member cannot remove the vote
  await TestValidator.error(
    "other user cannot remove someone else's vote",
    async () => {
      await api.functional.communityPlatform.member.comments.votes.erase(
        newConnection,
        { commentId: comment.id },
      );
    },
  );

  // Verify that removing a vote when none exists returns 404
  await TestValidator.error("cannot remove non-existent vote", async () => {
    await api.functional.communityPlatform.member.comments.votes.erase(
      connection,
      { commentId: comment.id },
    );
  });
}
