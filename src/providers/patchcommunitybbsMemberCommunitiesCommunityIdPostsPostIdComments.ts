import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsComment";
import { IPageICommunitybbsComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunitybbsComment";

/**
 * Retrieve paginated comments for a specific post.
 *
 * This operation retrieves all comments for a specific post within a community
 * using advanced filtering and sorting capabilities. It operates on the
 * communitybbs_comment table from the Prisma schema. Supports pagination,
 * sorting by creation time, and filtering by comment parent-child
 * relationships. This endpoint enables the UI to display threaded comment
 * threads efficiently.
 *
 * The operation supports comprehensive pagination with configurable page sizes
 * and sorting options. Comments can be sorted by creation date in ascending or
 * descending order. Parent-child relationships are preserved in the response
 * structure to support nested comment threads. Only comments belonging to the
 * specified post are returned, ensuring data integrity.
 *
 * Security considerations include rate limiting for search operations and
 * appropriate filtering of sensitive comment information based on the
 * requesting user's authorization level. Only users with appropriate
 * permissions can access detailed comments, while basic comment lists may be
 * available to authenticated users. The system enforces that comments must
 * relate to the specified post and community, with foreign key constraints
 * ensuring data consistency.
 *
 * This operation integrates with the communitybbs_comment table as defined in
 * the Prisma schema, incorporating all available comment fields and
 * relationships. The response includes comment information optimized for list
 * displays, with options to include additional thread context based on
 * authorization level and request parameters. The operation returns exactly 20
 * comments per page as specified in the business requirements, with a 'Load
 * more' button to retrieve additional pages.
 *
 * Validation rules ensure that the postId and communityId form a valid
 * relationship. If the post does not exist or does not belong to the specified
 * community, a 404 response is returned. There are no rate limits on this
 * endpoint to enable seamless user navigation, but the system enforces
 * ownership and relationship integrity through the database schema.
 *
 * Related API operations include retrieving a specific comment by ID (GET
 * /communities/{communityId}/posts/{postId}/comments/{commentId}) and creating
 * new comments (POST /communities/{communityId}/posts/{postId}/comments). This
 * 'index' operation is the primary method for loading comment threads in the
 * UI.
 *
 * @param props - Request properties
 * @param props.communityId - Unique identifier of the target community
 * @param props.postId - Unique identifier of the target post
 * @param props.body - Search criteria and pagination parameters for comment
 *   filtering
 * @param props.body.page - Page number for pagination, starting from 1
 * @param props.body.limit - Number of results per page
 * @param props.body.sort - Sort order for comment results
 * @returns Paginated list of comments matching search criteria
 * @throws {Error} When post is not found or doesn't belong to the specified
 *   community
 */
export async function patchcommunitybbsMemberCommunitiesCommunityIdPostsPostIdComments(props: {
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  body: ICommunitybbsComment.IRequest;
}): Promise<IPageICommunitybbsComment> {
  const { communityId, postId, body } = props;

  const { page = 1, limit = 20, sort = "-created_at" } = body;

  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: { id: postId },
  });

  if (post.communitybbs_community_id !== communityId) {
    throw new Error(
      "Post not found or doesn't belong to the specified community",
    );
  }

  const skip = (page - 1) * limit;
  const take = limit;

  const sortDirection = sort === "created_at" ? "asc" : "desc";

  const comments = await MyGlobal.prisma.communitybbs_comment.findMany({
    where: {
      communitybbs_post_id: postId,
      deleted_at: null,
    },
    orderBy: { created_at: sortDirection },
    skip,
    take,
  });

  const total = await MyGlobal.prisma.communitybbs_comment.count({
    where: {
      communitybbs_post_id: postId,
      deleted_at: null,
    },
  });

  const totalPages = Math.ceil(total / limit);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: Number(total),
      pages: Number(totalPages),
    },
    data: comments.map((comment) => ({
      id: comment.id,
      communitybbs_post_id: comment.communitybbs_post_id,
      communitybbs_member_id: comment.communitybbs_member_id,
      communitybbs_comment_id:
        comment.communitybbs_comment_id === null
          ? undefined
          : comment.communitybbs_comment_id,
      content: comment.content,
      display_name:
        comment.display_name === null ? undefined : comment.display_name,
      created_at: toISOStringSafe(comment.created_at),
      updated_at:
        comment.updated_at === null
          ? undefined
          : toISOStringSafe(comment.updated_at),
      deleted_at:
        comment.deleted_at === null
          ? undefined
          : toISOStringSafe(comment.deleted_at),
    })),
  };
}
