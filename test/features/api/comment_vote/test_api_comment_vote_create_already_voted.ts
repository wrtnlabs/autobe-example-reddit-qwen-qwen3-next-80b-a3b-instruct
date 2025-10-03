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

export async function test_api_comment_vote_create_already_voted(
  connection: api.IConnection,
) {
  // 1. Authenticate as a member user
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "hashed_password_123",
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community for hosting the post and comment
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
        title: RandomGenerator.paragraph({ sentences: 5 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
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
          content: RandomGenerator.paragraph({ sentences: 3 }),
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);

  // 5. Create the initial upvote on the comment
  const firstVote: ICommunityPlatformCommentVoteResponse =
    await api.functional.communityPlatform.member.comments.votes.create(
      connection,
      {
        commentId: comment.id,
        body: {
          vote_state: "upvote",
        } satisfies ICommunityPlatformCommentVoteRequest,
      },
    );
  typia.assert(firstVote);

  // 6. Attempt to create another upvote on the same comment (should fail)
  await TestValidator.error(
    "cannot create duplicate vote on same comment",
    async () => {
      await api.functional.communityPlatform.member.comments.votes.create(
        connection,
        {
          commentId: comment.id,
          body: {
            vote_state: "upvote", // same vote state as before
          } satisfies ICommunityPlatformCommentVoteRequest,
        },
      );
    },
  );
}
