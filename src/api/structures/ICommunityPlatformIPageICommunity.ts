import { IPage } from "./IPage";
import { ICommunityPlatformCommunity } from "./ICommunityPlatformCommunity";

export namespace ICommunityPlatformIPageICommunity {
  /**
   * Paginated collection of community summary information with pagination
   * metadata and data array.
   *
   * This represents a lightweight version of the full Community type,
   * designed specifically for display in the left sidebar 'Recent
   * Communities' list. It contains only the essential information needed for
   * user interface rendering: community name, category, and member count.
   *
   * The special IPage format ensures compatibility with the platform's
   * standard pagination pattern and allows the UI to handle loading,
   * filtering, and navigation consistently across all collection-type
   * responses.
   *
   * The underlying communities in the data array must be those the
   * authenticated user has joined (active membership with deleted_at = null)
   * and ordered by last_interaction_at descending to maintain the required
   * 'most recently active' priority order.
   */
  export type ISummary = {
    /** Pagination information for the collection of communities. */
    pagination: IPage.IPagination;

    /**
     * Array of community summary objects, each containing essential
     * information for display in UI views like the 'Recent Communities'
     * sidebar.
     *
     * The community summary includes name, category, and member count,
     * optimized for efficient rendering. This avoids including full details
     * like description, rules, logo, or banner which are not needed in
     * summary contexts.
     *
     * The items in this array are sorted by the user's most recent
     * interaction with each community (join, post, comment, vote) and
     * limited to the 5 most recent as required by the business rule for the
     * 'Recent Communities' list.
     */
    data: ICommunityPlatformCommunity.ISummary[];
  };
}
