import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Soft-deletes a community by marking it as archived in the database.
 *
 * This action hides the community from all public and member-facing views but
 * preserves all associated posts, comments, and data for potential restoration.
 * The deleted_at field is set to the current timestamp and is recorded in the
 * system log. This operation is reversible.
 *
 * @param props - Request properties
 * @param props.administrator - The authenticated administrator making the
 *   request
 * @param props.name - The name identifier of the community to delete
 * @returns The updated community object with deleted_at populated
 * @throws {Error} When the community with the specified name is not found
 */
export async function deleteadminCommunitiesName(props: {
  administrator: AdministratorPayload;
  name: string;
}): Promise<ICommunitybbsCommunity> {
  const { administrator, name } = props;

  // Find the community by name
  const community = await MyGlobal.prisma.communitybbs_community.findUnique({
    where: { name },
  });

  // If community not found, throw error
  if (!community) {
    throw new Error("Community not found");
  }

  // Current timestamp for soft delete
  const deleted_at = toISOStringSafe(new Date());

  // Update community with soft delete timestamp
  const updatedCommunity = await MyGlobal.prisma.communitybbs_community.update({
    where: { name },
    data: {
      deleted_at,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Create system log entry
  await MyGlobal.prisma.communitybbs_log.create({
    data: {
      actor_id: administrator.id,
      target_id: community.id,
      action_type: "community_deleted",
      details: JSON.stringify({
        community_name: name,
        administrator_id: administrator.id,
      }),
      created_at: toISOStringSafe(new Date()),
      ip_address: null,
    },
  });

  // Return the updated community object
  return updatedCommunity;
}
