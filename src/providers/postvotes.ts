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
  const actor_id = member.id;

  // Validate exactly one target is provided
  if (body.post_id === undefined && body.comment_id === undefined) {
    throw new Error("Either post_id or comment_id must be provided");
  }

  if (body.post_id !== undefined && body.comment_id !== undefined) {
    throw new Error(
      "Cannot provide both post_id and comment_id; only one target allowed",
    );
  }

  // Fetch target post or comment based on provided ID
  let target: { author_id: string } | null = null;

  if (body.post_id !== undefined && body.post_id !== null) {
    const post = await MyGlobal.prisma.communitybbs_post.findUnique({
      where: { id: body.post_id },
      select: { author_id: true },
    });

    if (!post) {
      throw new Error("Target post not found");
    }

    target = post;
  } else if (body.comment_id !== undefined && body.comment_id !== null) {
    const comment = await MyGlobal.prisma.communitybbs_comment.findUnique({
      where: { id: body.comment_id },
      select: { author_id: true },
    });

    if (!comment) {
      throw new Error("Target comment not found");
    }

    target = comment;
  }

  // Validate user not voting on own content
  if (target && target.author_id === actor_id) {
    throw new Error("Cannot vote on your own content");
  }

  // Create the vote
  const created = await MyGlobal.prisma.communitybbs_vote.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      actor_id,
      post_id: body.post_id === null ? undefined : body.post_id,
      comment_id: body.comment_id === null ? undefined : body.comment_id,
      type: body.type,
      created_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: created.id,
    actor_id: created.actor_id,
    post_id: created.post_id,
    comment_id: created.comment_id,
    type: created.type,
    created_at: created.created_at,
  };
}
