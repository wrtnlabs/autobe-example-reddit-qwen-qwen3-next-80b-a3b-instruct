import { ForbiddenException, UnauthorizedException } from "@nestjs/common";

import { MyGlobal } from "../../MyGlobal";
import { jwtAuthorize } from "./jwtAuthorize";
import { GuestPayload } from "../../decorators/payload/GuestPayload";

export async function guestAuthorize(request: {
  headers: {
    authorization?: string;
  };
}): Promise<GuestPayload> {
  const payload: GuestPayload = jwtAuthorize({ request }) as GuestPayload;

  if (payload.type !== "guest") {
    throw new ForbiddenException(`You're not ${payload.type}`);
  }

  // For guest role, we don't need to query the database since there's no user entity to validate
  // The JWT payload itself is the source of truth for guest identity
  // In this system, guest users are identified solely by the JWT token containing 'type: "guest"'
  // No database lookup is required because guest access is unauthenticated and unrestricted
  
  return payload;
}