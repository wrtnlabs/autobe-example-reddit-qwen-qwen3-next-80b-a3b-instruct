import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";

export async function test_api_post_vote_state_retrieval_by_anonymous_user(
  connection: api.IConnection,
) {
  // 1. Create a community to host the post
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: RandomGenerator.alphaNumeric(8),
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // 2. Create a post within the community
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({
          sentences: 4,
          wordMin: 3,
          wordMax: 8,
        }),
        body: RandomGenerator.content({
          paragraphs: 1,
          sentenceMin: 8,
          sentenceMax: 12,
          wordMin: 3,
          wordMax: 8,
        }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // 3. Attempt to retrieve vote state as an anonymous user (no authentication)
  // This should return a 401 Unauthorized error, validating that authentication is required
  await TestValidator.error(
    "anonymous user should not be able to retrieve vote state",
    async () => {
      await api.functional.communityPlatform.member.posts.votes.index(
        connection,
        {
          postId: post.id,
          body: {
            page: 1,
            limit: 10,
          } satisfies ICommunityPlatformPost.IRequest,
        },
      );
    },
  );
}
