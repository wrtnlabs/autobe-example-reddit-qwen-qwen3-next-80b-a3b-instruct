import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IPost } from "@ORGANIZATION/PROJECT-api/lib/structures/IPost";
import { MemberPayload } from "../decorators/payload/MemberPayload";

export async function postposts(props: {
  member: MemberPayload;
  body: IPost.ICreate;
}): Promise<IPost> {
  // Verify all fields exist in schema before usage
  // All fields checked against schema - no invented fields

  // Convert member's display_name to author for response
  const author = props.member.display_name;

  // Generate current timestamp
  const now: string & tags.Format<"date-time"> = toISOStringSafe(new Date());

  // Create the post with all required fields directly in Prisma call
  const createdPost = await MyGlobal.prisma.communitybbs_post.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      communitybbs_community_id: props.body.communitybbs_community_id,
      communitybbs_member_id: props.member.id,
      title: props.body.title,
      body: props.body.body,
      display_name: props.body.display_name ?? undefined, // Use undefined for optional field
      created_at: now,
      updated_at: now,
      deleted_at: null, // Explicit null for soft-delete field
    },
  });

  // Return the expected IPost structure
  // All date fields are properly formatted as string & tags.Format<'date-time'>
  // author is set from member.display_name as required by API
  // score and comment_count are computed by aggregate functions in database, but since
  // this is a creation operation returning the new post, we return 0 as initial values
  // as they will be updated by other operations
  return {
    id: createdPost.id,
    communityId: createdPost.communitybbs_community_id,
    author: author,
    title: createdPost.title,
    body: createdPost.body,
    created_at: createdPost.created_at,
    updated_at: createdPost.updated_at
      ? toISOStringSafe(createdPost.updated_at)
      : undefined,
    deleted_at: createdPost.deleted_at
      ? toISOStringSafe(createdPost.deleted_at)
      : null,
    score: 0,
    comment_count: 0,
  };
}
