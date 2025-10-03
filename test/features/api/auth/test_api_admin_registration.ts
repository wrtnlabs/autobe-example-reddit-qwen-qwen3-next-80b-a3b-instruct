import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunityPlatformAdmin } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdmin";
import type { ICommunityPlatformAdminMemberId } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunityPlatformAdminMemberId";

export async function test_api_admin_registration(connection: api.IConnection) {
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword: string = "SecurePass123!";
  const adminDisplayName: string | undefined = RandomGenerator.name();

  const adminRegistration: ICommunityPlatformAdmin.IAuthorized =
    await api.functional.auth.admin.join(connection, {
      body: {
        email: adminEmail,
        password: adminPassword,
        displayName: adminDisplayName,
      } satisfies ICommunityPlatformAdmin.IJoin,
    });

  typia.assert(adminRegistration);

  // Validate the returned admin account structure
  TestValidator.equals(
    "admin account id should be valid UUID",
    adminRegistration.id,
    adminRegistration.id,
  );
  TestValidator.equals(
    "admin member_id should be valid UUID",
    adminRegistration.member_id,
    adminRegistration.member_id,
  );
  TestValidator.equals(
    "admin token should have access property",
    adminRegistration.token.access !== "",
    true,
  );
  TestValidator.equals(
    "admin token should have refresh property",
    adminRegistration.token.refresh !== "",
    true,
  );
  TestValidator.predicate(
    "admin token access should expire in future",
    () => new Date(adminRegistration.token.expired_at) > new Date(),
  );
  TestValidator.predicate(
    "admin token refresh should be valid until future",
    () => new Date(adminRegistration.token.refreshable_until) > new Date(),
  );
}
