import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsPost } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsPost";

export async function putcommunitybbsMemberCommunitiesCommunityIdPostsPostId(props: {
  user: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  body: ICommunitybbsPost.IUpdate;
}): Promise<ICommunitybbsPost> {
  const { user, communityId, postId, body } = props;

  // Fetch the post to verify existence and ownership
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: {
      id: postId,
      communitybbs_community_id: communityId,
    },
    select: {
      id: true,
      communitybbs_community_id: true,
      communitybbs_member_id: true,
      title: true,
      body: true,
      display_name: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  // Authorization: Only original author can update
  if (post.communitybbs_member_id !== user.id) {
    throw new Error("You can edit or delete only items you authored.");
  }

  // Determine final values for update
  const finalTitle = body.title !== undefined ? body.title : post.title;
  const finalBody = body.body !== undefined ? body.body : post.body;

  // Validate content length constraints
  if (finalTitle.length < 5 || finalTitle.length > 120) {
    throw new Error("Title must be between 5 and 120 characters.");
  }
  if (finalBody.length < 10 || finalBody.length > 10000) {
    throw new Error("Body must be between 10 and 10,000 characters.");
  }

  // Perform update with direct object literal (no intermediate variables)
  const updatedPost = await MyGlobal.prisma.communitybbs_post.update({
    where: { id: postId },
    data: {
      title: finalTitle,
      body: finalBody,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Return response - convert all date fields to ISO strings and handle optional display_name correctly
  return {
    id: updatedPost.id,
    communitybbs_community_id: updatedPost.communitybbs_community_id,
    communitybbs_member_id: updatedPost.communitybbs_member_id,
    title: updatedPost.title,
    body: updatedPost.body,
    display_name:
      updatedPost.display_name === null ? undefined : updatedPost.display_name,
    created_at: toISOStringSafe(updatedPost.created_at),
    updated_at: toISOStringSafe(updatedPost.updated_at),
    deleted_at: updatedPost.deleted_at
      ? toISOStringSafe(updatedPost.deleted_at)
      : undefined,
  };
}
