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

export async function test_api_toggle_comment_vote_by_author(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as a member to toggle comment vote
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community for post and comment creation
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

  // Step 3: Create a post to comment on
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
  const comment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: RandomGenerator.paragraph({ sentences: 2 }),
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);

  // Step 5: Cast an initial upvote on the comment
  const upvoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(upvoteResponse);
  const initialScore: number = upvoteResponse.score;

  // Step 6: Toggle the vote from upvote to downvote
  const downvoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.update(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "downvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(downvoteResponse);
  const downvoteScore: number = downvoteResponse.score;
  TestValidator.equals(
    "score should change from upvote to downvote",
    downvoteScore,
    initialScore - 2,
  );

  // Step 7: Toggle the vote from downvote to none (clear vote)
  const clearVoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.update(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "downvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(clearVoteResponse);
  const clearedScore: number = clearVoteResponse.score;
  TestValidator.equals(
    "score should return to 0 after clearing vote",
    clearedScore,
    0,
  );

  // Step 8: Verify that an upvote again now sets score to 1
  const reintroduceUpvoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.update(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(reintroduceUpvoteResponse);
  const reintroducedScore: number = reintroduceUpvoteResponse.score;
  TestValidator.equals(
    "score should be 1 after reintroducing upvote",
    reintroducedScore,
    1,
  );

  // Step 9: Verify authorization enforcement - cannot vote on own comment
  // Reuse the same connection (logged in as the comment author)
  await TestValidator.error(
    "member cannot vote on their own comment",
    async () => {
      await api.functional.communityPlatform.member.comments.votes.update(
        connection,
        {
          commentId: comment.id,
          body: {
            vote_state: "upvote",
          } satisfies ICommunityPlatformCommentVoteRequest,
        },
      );
    },
  );
}
