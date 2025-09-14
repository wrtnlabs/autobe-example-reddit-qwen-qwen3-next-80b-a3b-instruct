import { tags } from "typia";

export namespace ICommunitybbsSearch {
  /**
   * Request parameters for performing a global search across the platform.
   *
   * This schema defines the structure for complex, multi-content searches in
   * the Community BBS platform. It combines content type selection, full-text
   * query, sorting preference, and pagination controls in a unified request
   * body.
   *
   * This design replaces three separate search endpoints with one flexible
   * endpoint that adapts behavior based on the 'type' field. This reduces API
   * surface complexity and ensures consistent behavior across all search use
   * cases.
   *
   * The system validates that the query is at least 2 characters and that the
   * sort option is valid for the selected type. All search operations are
   * performed against indexed tables (communitybbs_search_post,
   * communitybbs_search_community, communitybbs_search_comment) to ensure
   * high-performance response times.
   */
  export type IRequest = {
    /**
     * The type of content to search across: posts, communities, or
     * comments.
     *
     * This field defines which index will be queried. It must be one of
     * 'posts' (searches post titles and bodies), 'communities' (searches
     * community names and descriptions), or 'comments' (searches comment
     * content).
     *
     * This design allows a single API endpoint to handle all search types
     * with consistent parameters, reducing complexity on the server side
     * and ensuring uniform search behavior across the platform.
     */
    type: "posts" | "communities" | "comments";

    /**
     * The search query string to match against content.
     *
     * This field contains the full-text search term entered by the user. It
     * must be at least 2 characters long to prevent noise in search results
     * and to improve performance on large datasets.
     *
     * The search matches substrings in the relevant fields: title/body for
     * posts, name/description for communities, and content for comments.
     * Every character in the query is used for matching, supporting partial
     * word matching and typos.
     */
    query: string & tags.MinLength<2>;

    /**
     * Sorting criteria for search results, varying by content type.
     *
     * This field defines how search results are ordered. The available
     * options depend on the 'type' parameter:
     *
     * - For 'posts': 'Newest' or 'Top'
     * - For 'communities': 'Name Match' or 'Recently Created'
     * - For 'comments': 'Newest' only
     *
     * The system defaults to 'Newest' for posts and comments, and 'Name
     * Match' for communities to align with user expectations and business
     * requirements.
     *
     * Only one sort option can be specified per request, ensuring
     * deterministic and predictable result ordering.
     */
    sort?: "Newest" | "Top" | "Name Match" | "Recently Created" | undefined;

    /**
     * Page number for pagination, starting from 1.
     *
     * This field specifies which page of results to return. If omitted,
     * defaults to 1. Page size is fixed at 20 results per page as per
     * business requirements.
     *
     * This enables clients to implement a 'Load more' feature by
     * incrementing this number. The pagination is cursor-based for
     * consistency with embedded UI controls.
     */
    page?:
      | (number & tags.Type<"int32"> & tags.Default<1> & tags.Minimum<1>)
      | undefined;

    /**
     * Number of search results per page.
     *
     * This field defines how many results to return per page. The maximum
     * allowed value is 100 to prevent excessive database load. If omitted,
     * defaults to 20.
     *
     * The limit parameter is constrained to ensure search performance
     * remains optimal, even when many users are querying simultaneously.
     * This soft cap prevents resource exhaustion and user experience
     * degradation.
     */
    limit?:
      | (number &
          tags.Type<"int32"> &
          tags.Default<20> &
          tags.Minimum<1> &
          tags.Maximum<100>)
      | undefined;
  };
}
