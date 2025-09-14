import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IPost } from "@ORGANIZATION/PROJECT-api/lib/structures/IPost";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Create a new post in a community.
 *
 * This endpoint allows an authenticated member to create a new post in any
 * community. The post is linked to the authenticating member and the specified
 * community. The author name is resolved from the member's profile display_name
 * or overridden by the optional display_name provided in the request body.
 *
 * The post's title and body are validated to meet length constraints (5-120 and
 * 10-10,000 characters) as enforced by the IPost.ICreate schema. The system
 * does not support HTML or code in the body.
 *
 * All timestamps are generated in UTC and formatted as ISO 8601 strings. The
 * score and comment_count are initialized to 0 as no votes or comments exist at
 * creation.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member making the request
 * @param props.body - Object containing communitybbs_community_id, title, body,
 *   and optional display_name
 * @returns The newly created post object with all fields populated
 * @throws {Error} When the authenticated member is not found in the system
 */
export async function postposts(props: {
  member: MemberPayload;
  body: IPost.ICreate;
}): Promise<IPost> {
  const { member, body } = props;

  // Fetch member's display_name from database
  const foundMember = await MyGlobal.prisma.communitybbs_member.findFirst({
    where: { id: member.id },
  });

  if (!foundMember) {
    throw new Error("Member not found");
  }

  // Build create data
  const createData = {
    id: v4() as string & tags.Format<"uuid">,
    communitybbs_community_id: body.communitybbs_community_id,
    communitybbs_member_id: member.id,
    title: body.title,
    body: body.body,
    display_name: body.display_name ?? foundMember.display_name,
    created_at: toISOStringSafe(new Date()),
    updated_at: toISOStringSafe(new Date()),
    deleted_at: null,
  };

  // Create the post
  const createdPost = await MyGlobal.prisma.communitybbs_post.create({
    data: createData,
  });

  // Return IPost
  return {
    id: createdPost.id,
    communityId: createdPost.communitybbs_community_id,
    author: createdPost.display_name,
    title: createdPost.title,
    body: createdPost.body,
    created_at: createdPost.created_at,
    updated_at: createdPost.updated_at,
    deleted_at: createdPost.deleted_at,
    score: 0,
    comment_count: 0,
  };
}
