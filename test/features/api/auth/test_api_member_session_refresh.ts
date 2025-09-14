import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { ICommunitybbsMember } from "@ORGANIZATION/PROJECT-api/lib/structures/ICommunitybbsMember";
import type { IMember } from "@ORGANIZATION/PROJECT-api/lib/structures/IMember";

export async function test_api_member_session_refresh(
  connection: api.IConnection,
) {
  // Generate a valid refresh token structure using typia.random
  // This creates a proper IMember.IRefresh object with a string refresh_token
  const refreshTokenData = typia.random<IMember.IRefresh>();

  // Call the refresh endpoint with the generated token data
  const refreshResponse: ICommunitybbsMember.IAuthorized =
    await api.functional.auth.member.refresh(connection, {
      body: refreshTokenData satisfies IMember.IRefresh,
    });

  // Validate the response structure using typia.assert
  // This ensures the API returns exactly what's declared in ICommunitybbsMember.IAuthorized
  typia.assert(refreshResponse);

  // Verify that the response contains all expected properties
  // Since we don't have a way to get a valid refresh token in this test environment,
  // we can't test business logic, but we can verify the API contract structure
  TestValidator.predicate(
    "response should have an id property",
    typeof refreshResponse.id === "string",
  );
  TestValidator.predicate(
    "response should have a token property",
    typeof refreshResponse.token === "object" && refreshResponse.token !== null,
  );
  TestValidator.predicate(
    "token should have an access property",
    typeof refreshResponse.token.access === "string",
  );
  TestValidator.predicate(
    "token should have a refresh property",
    typeof refreshResponse.token.refresh === "string",
  );
  TestValidator.predicate(
    "token should have an expired_at property",
    typeof refreshResponse.token.expired_at === "string",
  );
  TestValidator.predicate(
    "token should have a refreshable_until property",
    typeof refreshResponse.token.refreshable_until === "string",
  );
}
