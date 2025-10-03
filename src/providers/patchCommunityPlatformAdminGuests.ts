import { HttpException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import jwt from "jsonwebtoken";
import typia, { tags } from "typia";
import { v4 } from "uuid";
import { MyGlobal } from "../MyGlobal";
import { PasswordUtil } from "../utils/PasswordUtil";
import { toISOStringSafe } from "../utils/toISOStringSafe";

import { ICommunityPlatformGuestIRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformGuestIRequest";
import { IPageICommunityPlatformGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformGuest";
import { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import { ICommunityPlatformGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformGuest";
import { AdminPayload } from "../decorators/payload/AdminPayload";

export async function patchCommunityPlatformAdminGuests(props: {
  admin: AdminPayload;
  body: ICommunityPlatformGuestIRequest;
}): Promise<IPageICommunityPlatformGuest> {
  const { body } = props;

  // Validate sort_by and sort_order
  const sortByOptions = ["created_at", "ip_address"] as const;
  if (body.sort_by !== undefined && !sortByOptions.includes(body.sort_by)) {
    throw new HttpException("Invalid sort_by value", 400);
  }
  const sort_by = body.sort_by ?? "created_at";

  const sortOrderOptions = ["asc", "desc"] as const;
  if (
    body.sort_order !== undefined &&
    !sortOrderOptions.includes(body.sort_order)
  ) {
    throw new HttpException("Invalid sort_order value", 400);
  }
  const sort_order = body.sort_order ?? "desc";

  // Apply page and limit default values and ensure integer
  const page = body.page !== undefined ? (body.page < 1 ? 1 : body.page) : 1;
  const limit =
    body.limit !== undefined
      ? body.limit < 1
        ? 1
        : body.limit > 100
          ? 100
          : body.limit
      : 20;

  // Build where clause with type-safe conditional spread
  let where: Record<string, any> = {};
  if (body.ip_address !== undefined) {
    where.ip_address = body.ip_address;
  }
  if (body.created_at_min !== undefined || body.created_at_max !== undefined) {
    where.created_at = {};
    if (body.created_at_min !== undefined) {
      where.created_at.gte = body.created_at_min;
    }
    if (body.created_at_max !== undefined) {
      where.created_at.lte = body.created_at_max;
    }
  }

  // Count total records
  const total = await MyGlobal.prisma.community_platform_guest.count({ where });

  // Fetch records with inline inline object
  const guests = await MyGlobal.prisma.community_platform_guest.findMany({
    where,
    orderBy: {
      [sort_by]: sort_order,
    },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Convert Date to string & Format<"date-time"> using toISOStringSafe
  const guestsWithFormattedDate: ICommunityPlatformGuest[] = guests.map(
    (guest) => ({
      ...guest,
      created_at: toISOStringSafe(guest.created_at),
      ip_address: guest.ip_address ?? undefined,
    }),
  );

  // Return exact response structure matching IPageICommunityPlatformGuest
  return {
    pagination: {
      current: page,
      limit: limit,
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: guestsWithFormattedDate,
  };
}
