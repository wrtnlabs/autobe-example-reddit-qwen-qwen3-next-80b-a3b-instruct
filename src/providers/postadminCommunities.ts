import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { ICommunitybbsCommunity } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsCommunity";
import { AdministratorPayload } from "../decorators/payload/AdministratorPayload";

/**
 * Creates a new sub-community with specified name, category, description,
 * rules, and optional logo/banner. This operation requires full administrative
 * privileges and bypasses user creation restrictions. The new community is
 * inserted into the communitybbs_community table with the provided metadata,
 * and a session log is created for audit purposes.
 *
 * The name must be unique, alphanumeric, with hyphens or underscores, 3–32
 * characters, and is case-insensitive. The operation is atomic and will fail if
 * any field violates the schema constraints.
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
 *   characters. Stored as a JSON-encoded string. Optional.
 * @param props.logo - URL to the community logo image. Must be a valid URL.
 *   Optional.
 * @param props.banner - URL to the community banner image. Must be a valid URL.
 *   Optional.
 * @returns The newly created community object with full metadata
 * @throws {Error} When the community name is not unique (Prisma enforces unique
 *   constraint)
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

  const now = toISOStringSafe(new Date());

  const newCommunity = await MyGlobal.prisma.communitybbs_community.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      name,
      category,
      description: description.length > 0 ? description : undefined,
      logo: logo && logo.length > 0 ? logo : undefined,
      banner: banner && banner.length > 0 ? banner : undefined,
      rules: rules.length > 0 ? rules : undefined,
      created_at: now,
      updated_at: now,
      deleted_at: undefined,
      member_count: 0,
      last_active_at: now,
    },
  });

  return newCommunity;
}
