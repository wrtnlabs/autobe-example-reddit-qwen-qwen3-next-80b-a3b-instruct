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
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformSearchComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformSearchComment";

export async function test_api_comment_search_no_results(
  connection: api.IConnection,
) {
  // Step 1: Authenticate a member to create content
  const email: string = typia.random<string & tags.Format<"email">>();
  const password_hash: string = "hashed_password_for_test";
  const authResponse: ICommunityPlatformMember.IAuthorized =
    await api.functional.auth.member.join(connection, {
      body: { email, password_hash } satisfies IMember.IJoin,
    });
  typia.assert(authResponse);

  // Step 2: Create a community
  const communityName: string = RandomGenerator.alphaNumeric(10);
  const communityResponse: ICommunityPlatformCommunity =
    await api.functional.communityPlatform.member.communities.create(
      connection,
      {
        body: {
          name: communityName,
          category: "Tech & Programming",
        } satisfies ICommunityPlatformCommunity.ICreate,
      },
    );
  typia.assert(communityResponse);

  // Step 3: Create a post in the community
  const postResponse: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: communityResponse.id,
        title: RandomGenerator.paragraph({ sentences: 5 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(postResponse);

  // Step 4: Create multiple comments with realistic data
  const commentContent1: string = RandomGenerator.paragraph({ sentences: 3 });
  const commentContent2: string = RandomGenerator.content({ paragraphs: 1 });
  const commentContent3: string = RandomGenerator.paragraph({ sentences: 2 });

  await api.functional.communityPlatform.member.posts.comments.create(
    connection,
    {
      postId: postResponse.id,
      body: {
        content: commentContent1,
      } satisfies ICommunityPlatformComment.ICreate,
    },
  );

  await api.functional.communityPlatform.member.posts.comments.create(
    connection,
    {
      postId: postResponse.id,
      body: {
        content: commentContent2,
      } satisfies ICommunityPlatformComment.ICreate,
    },
  );

  await api.functional.communityPlatform.member.posts.comments.create(
    connection,
    {
      postId: postResponse.id,
      body: {
        content: commentContent3,
      } satisfies ICommunityPlatformComment.ICreate,
    },
  );

  // Step 5: Perform search with a term not present in any comment
  const searchTerm: string = RandomGenerator.alphaNumeric(15); // Guaranteed unique, non-existent term
  const searchResponse: IPageICommunityPlatformSearchComment =
    await api.functional.communityPlatform.search.comments.search(connection, {
      body: {
        q: searchTerm,
      } satisfies ICommunityPlatformSearchComment.IRequest,
    });
  typia.assert(searchResponse);

  // Step 6: Validate search results
  TestValidator.equals(
    "total comments found should be 0",
    searchResponse.pagination.records,
    0,
  );
  TestValidator.equals(
    "current page should be 1",
    searchResponse.pagination.current,
    1,
  );
  TestValidator.equals(
    "limit should be 20",
    searchResponse.pagination.limit,
    20,
  );
  TestValidator.equals("pages should be 0", searchResponse.pagination.pages, 0);
  TestValidator.equals(
    "data array should be empty",
    searchResponse.data.length,
    0,
  );
}
