import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformComment";
import type { ICommunityPlatformCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformCommunity";
import type { ICommunityPlatformMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformMember";
import type { ICommunityPlatformPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformPost";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformComment";

export async function test_api_retrieve_comments_newest_sort(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as member
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

  // Step 3: Create a post in the community
  const post: ICommunityPlatformPost =
    await api.functional.communityPlatform.member.posts.create(connection, {
      body: {
        community_id: community.id,
        title: RandomGenerator.paragraph({ sentences: 3 }),
        body: RandomGenerator.content({ paragraphs: 2 }),
      } satisfies ICommunityPlatformPost.ICreate,
    });
  typia.assert(post);

  // Step 4: Create multiple comments in sequence with proper ordering
  const commentCount = 25; // More than page limit to test pagination
  const comments: ICommunityPlatformComment.ISparse[] = [];

  // Create comments sequentially without artificial delays
  for (let i = 0; i < commentCount; i++) {
    const comment: ICommunityPlatformComment.ISparse =
      await api.functional.communityPlatform.member.posts.comments.create(
        connection,
        {
          postId: post.id,
          body: {
            content: `Comment ${i + 1} with text length ${i}`,
          } satisfies ICommunityPlatformComment.ICreate,
        },
      );
    comments.push(comment);
  }

  // Step 5: Retrieve comments with 'newest' sort and default pagination
  const page1: IPageICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.posts.comments.index(connection, {
      postId: post.id,
      body: {
        sort: "newest",
      },
    });
  typia.assert(page1);

  // Step 6: Validate pagination structure
  TestValidator.equals(
    "page 1 should have 20 comments",
    page1.pagination.limit,
    20,
  );
  TestValidator.equals("page 1 should be page 1", page1.pagination.current, 1);
  TestValidator.equals(
    "total comments should be 25",
    page1.pagination.records,
    commentCount,
  );
  TestValidator.equals("total pages should be 2", page1.pagination.pages, 2);

  // Step 7: Validate that comments are sorted by newest (desc) order
  const firstPageComments = page1.data;
  TestValidator.equals(
    "first page should have 20 comments",
    firstPageComments.length,
    20,
  );

  // Verify latest comments appear first - the first comment created should be last on page 1
  // and the last comment created should be first on page 1
  // We created comments in sequence from 0 to 24, so the 24th is the newest
  for (let i = 0; i < firstPageComments.length - 1; i++) {
    const current = firstPageComments[i];
    const next = firstPageComments[i + 1];

    // Most recent comment should come first (descending order)
    // Created later -> higher timestamp
    // Find the original index from our comments array
    const currentIndex = comments.findIndex((c) => c.id === current.id);
    const nextIndex = comments.findIndex((c) => c.id === next.id);

    // Since we created comments sequentially, higher index means more recent
    TestValidator.predicate(
      `comment ${i} should be newer than comment ${i + 1}`,
      currentIndex >= nextIndex,
    );
  }

  // Step 8: Validate response includes expected fields
  for (const comment of firstPageComments) {
    TestValidator.equals(
      "comment should have correct post_id",
      comment.post_id,
      post.id,
    );
    TestValidator.predicate(
      "author_id must be defined",
      comment.author_id !== undefined,
    );
    TestValidator.predicate(
      "content must be 2-2000 chars",
      comment.content.length >= 2 && comment.content.length <= 2000,
    );
    TestValidator.predicate(
      "created_at must be defined",
      comment.created_at !== undefined,
    );
    TestValidator.predicate(
      "score should be defined",
      comment.score !== undefined,
    );
    TestValidator.predicate(
      "author_display_name must be string, null, or undefined",
      comment.author_display_name === undefined ||
        comment.author_display_name === null ||
        (comment.author_display_name.length >= 0 &&
          comment.author_display_name.length <= 32),
    );
  }

  // Step 9: Retrieve second page
  const page2: IPageICommunityPlatformComment.ISparse =
    await api.functional.communityPlatform.posts.comments.index(connection, {
      postId: post.id,
      body: {
        sort: "newest",
        page: 2,
        limit: 20,
      },
    });
  typia.assert(page2);

  // Step 10: Validate second page structure
  TestValidator.equals("page 2 should have 5 comments", page2.data.length, 5);
  TestValidator.equals("page 2 should be page 2", page2.pagination.current, 2);
  TestValidator.equals("page 2 limit should be 20", page2.pagination.limit, 20);

  // Step 11: Validate second page comments are older than first page
  const secondPageComments = page2.data;
  const lastFirstPageComment = firstPageComments[firstPageComments.length - 1];
  const firstSecondPageComment = secondPageComments[0];

  const lastFirstPageIndex = comments.findIndex(
    (c) => c.id === lastFirstPageComment.id,
  );
  const firstSecondPageIndex = comments.findIndex(
    (c) => c.id === firstSecondPageComment.id,
  );

  TestValidator.predicate(
    "last comment on page 1 should be newer than first comment on page 2",
    lastFirstPageIndex >= firstSecondPageIndex,
  );

  // Step 12: Validate scores and reply counts are present and correct type
  for (const comment of [...firstPageComments, ...secondPageComments]) {
    TestValidator.predicate(
      "score should be number",
      typeof comment.score === "number",
    );
    TestValidator.predicate(
      "reply_count should be number or undefined",
      comment.reply_count === undefined ||
        typeof comment.reply_count === "number",
    );
  }
}
