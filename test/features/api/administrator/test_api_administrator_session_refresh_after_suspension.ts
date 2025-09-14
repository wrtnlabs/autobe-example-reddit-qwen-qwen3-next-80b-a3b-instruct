import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunitybbsAdministrator } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsAdministrator";

export async function test_api_administrator_session_refresh_after_suspension(
  connection: api.IConnection,
) {
  // The API does not provide a way to create login or obtain an admin token.
  // We assume an existing administrator session is active on this connection (from test setup).
  // This test focuses on verifying that suspension terminates the ability to refresh.

  // Suspension endpoint requires an email
  const adminEmail: string = "admin@example.com"; // Known test admin email

  // 1. Suspend the administrator
  await api.functional.admin.administrators.suspend(connection, {
    email: adminEmail,
  });

  // 2. Attempt to refresh the current admin session (which should be now invalid)
  // The connection's Authorization header should still contain the old token.
  // The system must reject refresh due to suspension.
  await TestValidator.error(
    "Session refresh should fail after admin suspension",
    async () => {
      await api.functional.auth.administrator.refresh(connection);
    },
  );
}
