import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { MemberPayload } from "../decorators/payload/MemberPayload";

/**
 * Creates a new community with the provided details.
 *
 * This endpoint allows authenticated members to create a new community with a
 * unique name, category, optional description, logo, banner, and rules. The
 * community is immediately active upon creation and visible to all users. The
 * system enforces strict naming rules: the name must be 3-32 characters long,
 * contain only alphanumeric characters, hyphens, or underscores, and be
 * globally unique.
 *
 * The category must be one of: "Tech & Programming", "Science", "Movies & TV",
 * "Games", "Sports", "Lifestyle & Wellness", "Study & Education", "Art &
 * Design", "Business & Finance", "News & Current Affairs", or "General".
 *
 * Description, logo, banner, and rules are optional. If provided, description
 * is limited to 500 characters, logo and banner URLs to 80,000 characters, and
 * rules to a JSON array of up to 10 strings, each under 100 characters.
 *
 * Upon creation, the system automatically assigns:
 *
 * - A unique UUID as the community ID
 * - The creation timestamp (created_at)
 * - The update timestamp (updated_at), initially equal to created_at
 * - A member count of 1 (the creator)
 * - The last active timestamp (last_active_at), initially equal to created_at
 * - A null deleted_at value indicating an active community
 *
 * This operation requires the caller to be an authenticated member. The user's
 * authentication is validated by the system before the community is created.
 *
 * @param props - Request properties
 * @param props.member - The authenticated member creating the community
 * @param props.body - Object containing the community creation data (name,
 *   category, description, logo, banner, rules)
 * @returns The newly created community object with all fields populated
 * @throws {Error} When a community with the same name already exists (unique
 *   constraint violation)
 * @throws {Error} When the category provided is not one of the allowed values
 * @throws {Error} When the name contains invalid characters or exceeds length
 *   limits
 */
export async function postcommunitybbsMemberCommunities(props: {
  member: MemberPayload;
  body: ICommunitybbsCommunity.ICreate;
}): Promise<ICommunitybbsCommunity> {
  const { body } = props;

  // Create community directly in Prisma with all required and optional fields
  const createdCommunity = await MyGlobal.prisma.communitybbs_community.create({
    data: {
      id: v4(),
      name: body.name,
      description: body.description,
      category: body.category,
      logo: body.logo,
      banner: body.banner,
      rules: body.rules,
      created_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
      deleted_at: null,
      member_count: 1,
      last_active_at: toISOStringSafe(new Date()),
    },
  });

  return createdCommunity;
}
