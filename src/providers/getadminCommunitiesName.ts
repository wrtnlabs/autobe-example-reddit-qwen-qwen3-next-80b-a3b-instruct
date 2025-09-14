import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Retrieves a single community by its name (URL identifier) for administrative
 * view. This endpoint returns all metadata including rules, logo, banner, and
 * deletion status. Unlike the public endpoint, this version includes
 * soft-deleted communities and is intended for moderation tools. The response
 * contains the complete record from the communitybbs_community table for audit
 * or recovery purposes.
 *
 * This endpoint retrieves a specific community by its name identifier for
 * administrative review. The system looks up the community in the
 * communitybbs_community table using the name parameter (case-insensitive
 * lookup). If the community exists, the full record is returned including id,
 * description, category, logo, banner, rules, created_at, updated_at,
 * deleted_at, member_count, and last_active_at. This endpoint returns
 * soft-deleted records (where deleted_at is not null) unlike the public API,
 * enabling administrators to view and potentially restore archived
 * communities.
 *
 * The response includes all fields as stored in the schema, including the rules
 * array as a JSON string and the image URLs. No filtering is applied based on
 * user access rights; administrators always see the complete state. This
 * operation is read-only and does not affect any data.
 *
 * This endpoint is used in moderation dashboards, recovery workflows, or
 * compliance audits where visibility into historical or inactive communities is
 * required. The name parameter is a required path variable that must match
 * exactly with the unique index constraint on the name field in the community
 * table.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator making the
 *   request
 * @param props.name - The unique name identifier of the community (e.g., 'ai',
 *   'retro-gaming'). Case-insensitive, must match exactly
 * @returns The complete community object including hidden or deleted fields
 * @throws {Error} When community with specified name does not exist
 */
export async function getadminCommunitiesName(props: {
  administrator: AdministratorPayload;
  name: string;
}): Promise<ICommunitybbsCommunity> {
  const { name } = props;

  const community =
    await MyGlobal.prisma.communitybbs_community.findFirstOrThrow({
      where: { name },
    });

  return {
    id: community.id as string & tags.Format<"uuid">,
    name: community.name as string &
      tags.MinLength<3> &
      tags.MaxLength<32> &
      tags.Pattern<"^[a-z0-9_-]+$">,
    description: community.description as
      | (string & tags.MaxLength<500>)
      | undefined,
    category: community.category as
      | "Tech & Programming"
      | "Science"
      | "Movies & TV"
      | "Games"
      | "Sports"
      | "Lifestyle & Wellness"
      | "Study & Education"
      | "Art & Design"
      | "Business & Finance"
      | "News & Current Affairs"
      | "General",
    logo: community.logo as
      | (string & tags.MaxLength<80000> & tags.Format<"uri">)
      | undefined,
    banner: community.banner as
      | (string & tags.MaxLength<80000> & tags.Format<"uri">)
      | undefined,
    rules: community.rules as (string & tags.MaxLength<3000>) | undefined,
    created_at: toISOStringSafe(community.created_at) as string &
      tags.Format<"date-time">,
    updated_at: toISOStringSafe(community.updated_at) as string &
      tags.Format<"date-time">,
    deleted_at: community.deleted_at
      ? (toISOStringSafe(community.deleted_at) as string &
          tags.Format<"date-time">)
      : undefined,
    member_count: community.member_count as number &
      tags.Type<"int32"> &
      tags.Minimum<0>,
    last_active_at: toISOStringSafe(community.last_active_at) as string &
      tags.Format<"date-time">,
  };
}
