import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdmin";
import type { ICommunityPlatformAdminMemberId } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdminMemberId";
import type { ICommunityPlatformGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformGuest";
import type { ICommunityPlatformGuestIRequest } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformGuestIRequest";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageICommunityPlatformGuest } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageICommunityPlatformGuest";

export async function test_api_guest_search_admin_auth_required(
  connection: api.IConnection,
) {
  // Step 1: Create an admin user account using /auth/admin/join
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "securePassword123";

  const admin: ICommunityPlatformAdmin.IAuthorized =
    await api.functional.auth.admin.join(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
      } satisfies ICommunityPlatformAdmin.IJoin,
    });
  typia.assert(admin);

  // Step 2: Use admin credentials to make a search request with an empty filter
  // Confirm successful response with paginated results
  const searchResponse: IPageICommunityPlatformGuest =
    await api.functional.communityPlatform.admin.guests.search(connection, {
      body: {} satisfies ICommunityPlatformGuestIRequest,
    });
  typia.assert(searchResponse);

  // Verify pagination structure
  TestValidator.equals("pagination object exists", searchResponse.pagination, {
    current: 1,
    limit: 20,
    records: searchResponse.pagination.records,
    pages: Math.ceil(searchResponse.pagination.records / 20),
  });

  // Verify data array exists and contains guest objects
  TestValidator.predicate(
    "data array is not empty",
    searchResponse.data.length > 0,
  );

  // Validate guest object structure
  if (searchResponse.data.length > 0) {
    const firstGuest: ICommunityPlatformGuest = searchResponse.data[0];
    TestValidator.equals("guest has id", typeof firstGuest.id, "string");
    TestValidator.predicate(
      "guest id is UUID",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        firstGuest.id,
      ),
    );
    TestValidator.equals(
      "guest has created_at",
      typeof firstGuest.created_at,
      "string",
    );
    TestValidator.predicate(
      "created_at is ISO date-time",
      /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(?:\.[0-9]+)?(?:Z|[+-][0-9]{2}:[0-9]{2})$/.test(
        firstGuest.created_at,
      ),
    );

    // ip_address is optional, so we'll verify type if it exists
    if (firstGuest.ip_address !== undefined) {
      TestValidator.equals(
        "ip_address is string",
        typeof firstGuest.ip_address,
        "string",
      );
    }
  }

  // Step 3: Make a search request without authentication to verify 401 Unauthorized
  // Create an unauthenticated connection by stripping the auth token
  const unauthConn: api.IConnection = {
    ...connection,
    headers: {}, // Explicitly clear headers as per system requirements
  };

  await TestValidator.error(
    "unauthenticated guest search should fail with 401",
    async () => {
      await api.functional.communityPlatform.admin.guests.search(unauthConn, {
        body: {} satisfies ICommunityPlatformGuestIRequest,
      });
    },
  );
}
