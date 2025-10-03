import { ForbiddenException } from "@nestjs/common";

import { MyGlobal } from "../../MyGlobal";
import { jwtAuthorize } from "./jwtAuthorize";
import { AdminPayload } from "../../decorators/payload/AdminPayload";

export async function adminAuthorize(request: {
  headers: {
    authorization?: string;
  };
}): Promise<AdminPayload> {
  const payload: AdminPayload = jwtAuthorize({ request }) as AdminPayload;

  if (payload.type !== "admin") {
    throw new ForbiddenException(`You're not ${payload.type}`);
  }

  // Admin extends Member - query community_platform_admin using member_id from payload
  const admin = await MyGlobal.prisma.community_platform_admin.findFirst({
    where: {
      member_id: payload.id,
      deleted_at: null,
      member: {
        deleted_at: null
      }
    }
  });

  if (admin === null) {
    throw new ForbiddenException("You're not enrolled");
  }

  return payload;
}