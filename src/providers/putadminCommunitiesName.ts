import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Updates metadata of an existing community including description, category,
 * rules, logo, or banner.
 *
 * This endpoint allows administrators to update the metadata of an existing
 * community in the communitybbs_community table. The fields that can be
 * modified are: description, category, rules, logo, and banner. The name field
 * is immutable and provided as a path parameter; it cannot be changed. The
 * updated_at timestamp is automatically refreshed to the current time. The
 * deleted_at field is preserved unless explicitly provided in the update body.
 *
 * @param props Request properties containing administrator authentication,
 *   community name, and update payload
 * @param props.administrator - The authenticated administrator making the
 *   request
 * @param props.name - The current unique name of the community to update (path
 *   parameter)
 * @param props.body - The patch payload containing fields to update
 *   (description, category, rules, logo, banner)
 * @returns The updated community object with all fields
 * @throws {Error} When the community with the specified name is not found
 * @throws {Error} When any text field exceeds its maximum length
 * @throws {Error} When category value is not one of the predefined options
 */
export async function putadminCommunitiesName(props: {
  administrator: AdministratorPayload;
  name: string;
  body: ICommunitybbsCommunity.IUpdate;
}): Promise<ICommunitybbsCommunity> {
  const { administrator, name, body } = props;

  // Prepare update data without direct spread to ensure only allowed fields are modified
  const updateData = {
    // Conditionally include fields only if explicitly provided
    ...(body.description !== undefined && { description: body.description }),
    ...(body.category !== undefined && { category: body.category }),
    ...(body.logo !== undefined && { logo: body.logo }),
    ...(body.banner !== undefined && { banner: body.banner }),
    ...(body.rules !== undefined && { rules: body.rules }),

    // Always update the timestamp - no need to check if provided
    updated_at: toISOStringSafe(new Date()),
  };

  // Perform the update operation
  const updated = await MyGlobal.prisma.communitybbs_community.update({
    where: { name },
    data: updateData,
  });

  // Convert all DateTime fields from Prisma Date objects to ISO strings
  return {
    id: updated.id,
    name: updated.name,
    description: updated.description,
    category: updated.category,
    logo: updated.logo,
    banner: updated.banner,
    rules: updated.rules,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at:
      updated.deleted_at !== null ? toISOStringSafe(updated.deleted_at) : null,
    member_count: updated.member_count,
    last_active_at: toISOStringSafe(updated.last_active_at),
  };
}
