import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsComment";
import { IPageICommunitybbsComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunitybbsComment";

/**
 * Retrieves paginated comments for a specific post.
 *
 * This operation returns a list of active (not deleted) comments belonging to a
 * specific post within a community, supporting pagination, sorting by creation
 * time, and preserving thread relationships. Only comments with a valid post-ID
 * and belonging to the specified community are returned. Soft-deleted comments
 * are excluded. The response includes comprehensive comment metadata and
 * pagination information.
 *
 * @param props - Request properties containing the community and post
 *   identifiers and pagination parameters
 * @param props.communityId - UUID of the target community
 * @param props.postId - UUID of the target post
 * @param props.body - Pagination and sorting parameters for comment retrieval
 * @param props.body.page - Page number for pagination (default: 1)
 * @param props.body.limit - Number of comments per page (default: 20, max: 100)
 * @param props.body.sort - Sort order: 'created_at' (oldest first) or
 *   '-created_at' (newest first; default)
 * @returns Paginated list of comments matching criteria
 * @throws {Error} When the specified post does not exist or does not belong to
 *   the specified community
 */
export async function patchcommunitybbsMemberCommunitiesCommunityIdPostsPostIdComments(props: {
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  body: ICommunitybbsComment.IRequest;
}): Promise<IPageICommunitybbsComment> {
  const { communityId, postId, body } = props;

  // Validate the post exists and belongs to the specified community
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: {
      id: postId,
      communitybbs_community_id: communityId,
    },
    select: { id: true },
  });

  // Extract and normalize pagination parameters
  const page = Number(body.page ?? 1);
  const limit = Math.min(Number(body.limit ?? 20), 100);
  const skip = (page - 1) * limit;

  // Determine sort order
  const orderBy =
    body.sort === "-created_at"
      ? { created_at: "desc" }
      : { created_at: "asc" };

  // Retrieve comments with pagination and filter for active (not deleted) ones
  const [comments, total] = await Promise.all([
    MyGlobal.prisma.communitybbs_comment.findMany({
      where: {
        communitybbs_post_id: postId,
        deleted_at: null,
      },
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        communitybbs_post_id: true,
        communitybbs_member_id: true,
        communitybbs_comment_id: true,
        content: true,
        display_name: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    }),
    MyGlobal.prisma.communitybbs_comment.count({
      where: {
        communitybbs_post_id: postId,
        deleted_at: null,
      },
    }),
  ]);

  // Convert all date fields to string & tags.Format<'date-time'>
  // Prisma returns Date objects — we must convert them to branded strings
  const formattedComments = comments.map((comment) => ({
    ...comment,
    created_at: toISOStringSafe(comment.created_at),
    updated_at: comment.updated_at
      ? toISOStringSafe(comment.updated_at)
      : undefined,
    deleted_at: comment.deleted_at
      ? toISOStringSafe(comment.deleted_at)
      : undefined,
  }));

  return {
    pagination: {
      current: page,
      limit,
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: formattedComments,
  };
}
