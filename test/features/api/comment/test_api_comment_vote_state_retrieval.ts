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

export async function test_api_comment_vote_state_retrieval(
  connection: api.IConnection,
) {
  // Step 1: Authenticate a member user
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // Step 2: Create a community
  const communityName: string = RandomGenerator.alphabets(10);
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

  // Step 3: Create a post in the community
  const postTitle: string = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 3,
    wordMax: 7,
  });
  const postBody: string = RandomGenerator.content({
    paragraphs: 2,
    sentenceMin: 5,
    sentenceMax: 10,
  });
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: postTitle,
        body: postBody,
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 4: Create a comment on the post
  const commentContent: string = RandomGenerator.paragraph({ sentences: 2 });
  const comment: ICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.member.posts.comments.create(
      connection,
      {
        postId: post.id,
        body: {
          content: commentContent,
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);

  // Step 5: Verify association and initial state (score 0)
  const initialVoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.update(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(initialVoteResponse);
  TestValidator.equals(
    "Initial upvote score should be 1",
    initialVoteResponse.score,
    1,
  );

  // Step 6: Toggle to downvote
  const toggleDownvoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.update(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "downvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(toggleDownvoteResponse);
  TestValidator.equals(
    "Toggle from upvote to downvote should result in score -1",
    toggleDownvoteResponse.score,
    -1,
  );

  // Step 7: Toggle to none (unvote)
  const unvoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.update(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "downvote", // Send downvote again to remove it
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(unvoteResponse);
  TestValidator.equals(
    "Unvote (downvote again) should return score to 0",
    unvoteResponse.score,
    0,
  );

  // Step 8: Create another member
  const otherMemberEmail: string = typia.random<
    string & tags.Format<"email">
  >();
  const otherMember: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: otherMemberEmail,
        password_hash: "hashed_password_456",
      } satisfies IMember.IJoin,
    });
  typia.assert(otherMember);

  // Step 9: Test other member voting
  const otherVoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.update(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(otherVoteResponse);
  // The score should now be 1 (other user upvoted, previous state was 0)
  TestValidator.equals(
    "Other member's upvote should make score 1",
    otherVoteResponse.score,
    1,
  );

  // Step 10: Switch back to original member
  await api.functional.auth.member.join(connection, {
    body: {
      email: memberEmail,
      password_hash: "hashed_password_123",
    } satisfies IMember.IJoin,
  });

  // Step 11: Test that member cannot vote on their own comment
  await TestValidator.error(
    "Member should not be allowed to vote on their own comment",
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
