import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformUserRole } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformUserRole";

export async function getCommunityPlatformRolesRoleId(props: {
  roleId: string & tags.Format<"uuid">;
}): Promise<ICommunityPlatformUserRole> {
  const role =
    await MyGlobal.prisma.community_platform_user_roles.findUniqueOrThrow({
      where: {
        id: props.roleId,
      },
    });

  return {
    id: role.id,
    role_name: role.role_name,
    description: role.description,
  };
}
