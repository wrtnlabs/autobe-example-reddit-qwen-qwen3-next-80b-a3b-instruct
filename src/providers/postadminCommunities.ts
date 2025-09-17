import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Create a new community (Admin only)
 *
 * This endpoint allows administrators to create new sub-communities using the
 * communitybbs_community table.
 *
 * The request provides fields: name (required), category (required),
 * description (optional), rules (optional array of strings), logo (optional
 * URL), banner (optional URL). The name is validated: must be 3–32 characters,
 * contain only alphanumeric characters, hyphens (-), or underscores (_), and
 * must be unique across all existing communities. Case-insensitive uniqueness
 * is enforced by the unique index on the name column. The category must be one
 * of the predefined values from the predefined list: "Tech & Programming",
 * "Science", "Movies & TV", "Games", "Sports", "Lifestyle & Wellness", "Study &
 * Education", "Art & Design", "Business & Finance", "News & Current Affairs",
 * or "General".
 *
 * The field rules is stored as a null-allowed string, converted from a JSON
 * array of strings. If provided, each rule is checked for length (<100 chars)
 * and maximum count (10 rules). The logo and banner URLs are accepted as
 * strings and validated for format but not checked for existence.
 *
 * Upon creation, the system assigns created_at and updated_at timestamps, sets
 * member_count to 0, and last_active_at to the creation time. A trusting
 * subscription to the community associated with a similar significant and
 * coordinated action will create a community in the ! community and, under any
 * explicit oui greater InetAddress condition may be required.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator making the
 *   request
 * @param props.name - The unique identifier for the community. Must be 3–32
 *   characters long, contain only alphanumeric characters, hyphens (-), or
 *   underscores (_), and must not be duplicated.
 * @param props.category - The category to classify the community. Must be one
 *   of the predefined system categories.
 * @param props.description - A brief description of the community's purpose, up
 *   to 500 characters. Optional.
 * @param props.rules - An array of up to 10 community rules, each up to 100
 *   characters. Stored as a JSON-encoded string.
 * @param props.logo - URL to the community logo image. Must be a valid URL.
 *   Optional.
 * @param props.banner - URL to the community banner image. Must be a valid URL.
 *   Optional.
 * @returns The newly created community object with full metadata
 * @throws {Error} When the community name already exists (UNIQUE constraint
 *   violation)
 */
export async function postadminCommunities(props: {
  administrator: AdministratorPayload;
  name: string;
  category: string;
  description: string;
  rules: string;
  logo: string & tags.Format<"uri">;
  banner: string & tags.Format<"uri">;
}): Promise<ICommunitybbsCommunity> {
  const { administrator, name, category, description, rules, logo, banner } =
    props;

  // Generate new community ID
  const id = v4() as string & tags.Format<"uuid">;

  // Create current timestamps
  const now = toISOStringSafe(new Date());

  // Convert rules string to JSON array format if provided, otherwise null
  const rulesJson = rules ? rules : null;

  // Create the new community record
  const createdCommunity = await MyGlobal.prisma.communitybbs_community.create({
    data: {
      id,
      name,
      category,
      description: description || undefined,
      rules: rulesJson,
      logo: logo || undefined,
      banner: banner || undefined,
      created_at: now,
      updated_at: now,
      deleted_at: null,
      member_count: 0,
      last_active_at: now,
    },
  });

  // Create audit log entry
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      actor_id: administrator.id,
      target_id: createdCommunity.id,
      action_type: "community_created",
      details: JSON.stringify({
        name,
        category,
        description,
        rules: rulesJson,
        logo,
        banner,
      }),
      created_at: now,
      ip_address: null,
    },
  });

  return createdCommunity;
}
