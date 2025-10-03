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

export async function test_api_vote_on_comment_by_member(
  connection: api.IConnection,
) {
  // 1. Authenticate as member
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashedpassword123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community
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

  // 4. Create a comment on the post (by the same member)
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

  // 5. Test: Vote on the comment by the comment author - expect 403 Forbidden
  await TestValidator.error(
    "member cannot vote on their own comment",
    async () => {
      await api.functional.communityPlatform.member.comments.votes.create(
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

  // 6. Create a second member to vote on the comment
  const secondMemberEmail: string = typia.random<
    string & tags.Format<"email">
  >();
  const secondMember: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: secondMemberEmail,
        password_hash: "hashedpassword456",
      } satisfies IMember.IJoin,
    });
  typia.assert(secondMember);

  // 7. Vote on the comment as the second member (upvote)
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
  TestValidator.equals(
    "comment score increased by 1",
    upvoteResponse.score,
    comment.score + 1,
  );

  // 8. Vote again as the second member (downvote - toggle)
  const downvoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "downvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(downvoteResponse);
  TestValidator.equals(
    "comment score decreased by 2",
    downvoteResponse.score,
    comment.score - 1,
  );

  // 9. Vote again as the second member (remove vote)
  const removeVoteResponse: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "downvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(removeVoteResponse);
  TestValidator.equals(
    "comment score increased by 1",
    removeVoteResponse.score,
    comment.score,
  );
}
