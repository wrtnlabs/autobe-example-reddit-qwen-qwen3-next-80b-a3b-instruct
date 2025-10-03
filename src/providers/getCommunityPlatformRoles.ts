import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformUserRoleArray } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformUserRoleArray";
import { ICommunityPlatformUserRole } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformUserRole";

export async function getCommunityPlatformRoles(): Promise<ICommunityPlatformUserRoleArray> {
  // Schema has no DateTime fields - only String fields for id, role_name, description
  // No toISOStringSafe needed for date handling

  const roles = await MyGlobal.prisma.community_platform_user_roles.findMany({
    select: {
      id: true,
      role_name: true,
      description: true,
    },
  });

  return roles.map((role) => ({
    id: role.id satisfies string as string & tags.Format<"uuid">,
    role_name: role.role_name,
    description: role.description,
  }));
}
