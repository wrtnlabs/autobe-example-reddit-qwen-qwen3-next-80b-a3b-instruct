import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_post_vote_toggle_none_to_upvote(
  connection: api.IConnection,
) {
  // 1. Authenticate a member user
  const email: string = typia.random<string & tags.Format<"email">>();
  const passwordHash: string = "hashed_password_123";
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: {
        email,
        password_hash: passwordHash,
      } satisfies IMember.IJoin,
    });
  typia.assert(member);

  // 2. Create a community for posting
  const communityName: string = RandomGenerator.alphaNumeric(10);
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

  // 3. Create a post to vote on
  const postTitle: string = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 5,
    wordMax: 10,
  });
  const postBody: string = RandomGenerator.content({
    paragraphs: 2,
    sentenceMin: 10,
    sentenceMax: 20,
    wordMin: 4,
    wordMax: 8,
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

  // 4. Toggle vote from none to upvote on the post
  await api.functional.communityPlatform.member.posts.votes.create(connection, {
    postId: post.id,
    body: {
      vote_state: "upvote",
    } satisfies ICommunityPlatformPost.ICreateVote,
  });
}
