import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IVote } from "@ORGANIZATION/PROJECT-api/lib/structures/IVote";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postvotes(props: {
  member: MemberPayload;
  body: IVote.ICreate;
}): Promise<IVote> {
  const { member, body } = props;

  // Validate mutually exclusive target: exactly one of post_id or comment_id must be provided
  if (body.post_id !== undefined && body.comment_id !== undefined) {
    throw new Error("Cannot vote on both post and comment");
  }
  if (body.post_id === undefined && body.comment_id === undefined) {
    throw new Error("Must vote on either a post or a comment");
  }

  // Validate target existence and authorship
  if (body.post_id !== undefined) {
    const post = await MyGlobal.prisma.communitybbs_post.findUniqueOrThrow({
      where: { id: body.post_id },
    });
    // Prevent self-voting: member cannot vote on their own post
    if (post.communitybbs_member_id === member.id) {
      throw new Error("Cannot vote on your own post");
    }
  } else if (body.comment_id !== undefined) {
    const comment =
      await MyGlobal.prisma.communitybbs_comment.findUniqueOrThrow({
        where: { id: body.comment_id },
      });
    // Prevent self-voting: member cannot vote on their own comment
    if (comment.communitybbs_member_id === member.id) {
      throw new Error("Cannot vote on your own comment");
    }
  }

  // Create the vote record - inline Prisma operation (no intermediate variables)
  const createdVote = await MyGlobal.prisma.communitybbs_vote.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      actor_id: member.id,
      post_id: body.post_id === null ? undefined : body.post_id,
      comment_id: body.comment_id === null ? undefined : body.comment_id,
      type: body.type,
      created_at: toISOStringSafe(new Date()),
    },
  });

  // Return compliant IVote object - matching interface exactly
  return {
    id: createdVote.id,
    actor_id: createdVote.actor_id,
    post_id: createdVote.post_id,
    comment_id: createdVote.comment_id,
    type: createdVote.type,
    created_at: createdVote.created_at, // Already string & Format<'date-time'> from Prisma
  };
}
