import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformComment";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { ICommunityPlatformSearchComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformSearchComment";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_comment_search_detail_retrieval(
  connection: api.IConnection,
) {
  // Step 1: Authenticate member to create test data
  const authData = typia.random<IMember.IJoin>();
  const member: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: authData,
    });
  typia.assert(member);

  // Step 2: Create a community for the test comment
  const community: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: RandomGenerator.alphabets(8),
          category: "Tech & Programming",
          description: RandomGenerator.paragraph({ sentences: 3 }),
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(community);

  // Step 3: Create a post in the community
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 2 }),
        body: RandomGenerator.content({ paragraphs: 1 }),
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
          content: RandomGenerator.paragraph({ sentences: 4 }),
        } satisfies ICommunityPlatformComment.ICreate,
      },
    );
  typia.assert(comment);

  // Step 5: Retrieve the comment via search endpoint
  const searchComment: ICommunityPlatformSearchComment =
    await api.functional.communityPlatform.search.comments.at(connection, {
      commentId: comment.id,
    });
  typia.assert(searchComment);

  // Step 6: Validate search comment response details according to schema
  TestValidator.equals(
    "search comment ID matches expectation",
    searchComment.id,
    comment.id,
  );
  TestValidator.equals(
    "search comment comment_id matches original comment id",
    searchComment.comment_id,
    comment.id,
  );
  TestValidator.equals(
    "search comment post_id matches parent post id",
    searchComment.post_id,
    post.id,
  );
  TestValidator.equals(
    "search comment community_id matches community id",
    searchComment.community_id,
    community.id,
  );
  TestValidator.equals(
    "search comment content matches original",
    searchComment.content,
    comment.content,
  );
  TestValidator.equals(
    "search comment author name matches member display name",
    searchComment.author_name,
    member.display_name || "Anonymous",
  );
  TestValidator.equals(
    "search comment score matches comment score",
    searchComment.score,
    comment.score,
  );
  TestValidator.equals(
    "search comment created_at matches comment created_at",
    searchComment.created_at,
    comment.created_at,
  );

  // Step 7: Verify non-existent comment ID returns 404
  await TestValidator.error(
    "non-existent comment ID should return 404",
    async () => {
      await api.functional.communityPlatform.search.comments.at(connection, {
        commentId: "00000000-0000-0000-0000-000000000000",
      });
    },
  );
}
