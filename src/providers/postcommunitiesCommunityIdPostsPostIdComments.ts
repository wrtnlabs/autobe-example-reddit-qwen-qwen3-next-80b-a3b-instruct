import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsComment } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsComment";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postcommunitiesCommunityIdPostsPostIdComments(props: {
  member: MemberPayload;
  communityId: string & tags.Format<"uuid">;
  postId: string & tags.Format<"uuid">;
  body: ICommunitybbsComment.ICreate;
}): Promise<ICommunitybbsComment> {
  const { member, postId, body } = props;

  // Validate that the target post exists and is not deleted
  const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
    where: { id: postId },
  });

  // Validate that the post belongs to the specified community
  if (post.communitybbs_community_id !== communityId) {
    throw new Error("Post does not belong to the specified community");
  }

  // Check if post is deleted
  if (post.deleted_at !== null) {
    throw new Error("Cannot comment on a deleted post");
  }

  // Validate that the member exists and is active
  // Note: member model has no deleted_at field, so we only check existence
  const foundMember =
    await MyGlobal.prisma.communitybbs_member.findUniqueOrThrow({
      where: { id: member.id },
    });

  // Validate content length per requirements
  if (body.content.length < 2 || body.content.length > 2000) {
    throw new Error("Comment content must be between 2 and 2000 characters");
  }

  // Create the comment
  const createdComment = await MyGlobal.prisma.communitybbs_comment.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      communitybbs_post_id: postId,
      communitybbs_member_id: member.id,
      content: body.content,
      display_name: body.display_name ?? foundMember.display_name,
      created_at: toISOStringSafe(new Date()),
    },
  });

  // Ensure output strictly matches ICommunitybbsComment type
  return {
    id: createdComment.id,
    communitybbs_post_id: createdComment.communitybbs_post_id,
    communitybbs_member_id: createdComment.communitybbs_member_id,
    communitybbs_comment_id: createdComment.communitybbs_comment_id,
    content: createdComment.content,
    display_name: createdComment.display_name,
    created_at: createdComment.created_at,
    updated_at: createdComment.updated_at,
    deleted_at: createdComment.deleted_at,
  };
}
