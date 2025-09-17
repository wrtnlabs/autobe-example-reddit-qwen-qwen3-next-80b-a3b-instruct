import { tags } from "typia";

export interface GuestPayload {
  /**
   * The top-level guest session ID (primary key in communitybbs_guest table).
   * This is the fundamental identifier for anonymous users in the system.
   */
  id: string & tags.Format<"uuid">;

  /** Discriminator for the discriminated union type, always "guest". */
  type: "guest";
}
