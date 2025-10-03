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

export async function test_api_remove_vote_from_comment(
  connection: api.IConnection,
) {
  // 1. Authenticate as member to cast and remove vote
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community for post and comment creation
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

  // 3. Create a post to comment on
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 1 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 4. Create a comment to vote on
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

  // 5. Cast a vote on the comment
  const voteResponseBeforeRemove: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(voteResponseBeforeRemove);
  const initialScore = voteResponseBeforeRemove.score;

  // 6. Remove the vote from the comment
  const voteResponseAfterRemove: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.erase(
      connection,
      {
        commentId: comment.id,
      },
    );
  typia.assert(voteResponseAfterRemove);

  // 7. Validate that the score reverted to its original value (before vote)
  // Since we just cast an upvote, removing it should return to 0
  TestValidator.equals(
    "comment score should revert to 0 after removing vote",
    voteResponseAfterRemove.score,
    0,
  );

  // 8. Verify idempotent behavior: remove vote again (no vote exists)
  const voteResponseAfterSecondRemove: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.erase(
      connection,
      {
        commentId: comment.id,
      },
    );
  typia.assert(voteResponseAfterSecondRemove);

  // 9. Validate that score remains unchanged after second removal
  TestValidator.equals(
    "comment score should remain 0 after second remove vote",
    voteResponseAfterSecondRemove.score,
    0,
  );
}
