/**
 * resolveBranchScope
 *
 * Consistent multi-branch rules used by every listing/report endpoint:
 * - cashier / branch_manager: always scoped to their own assigned branch,
 *   regardless of what the client asks for.
 * - super_admin: may view data for a specific branch, or for ALL branches when
 *   no branchId is supplied (null = no branch filter).
 * This differs from assertBranchAccess (which requires a concrete branch and
 * rejects mismatches) and is intended for read/list endpoints only. Mutating
 * endpoints must keep using assertBranchAccess so a concrete branch is always
 * enforced.
 *
 * @param {object} user - the authenticated user (req.user)
 * @param {string|object|null} requestedBranchId - branchId coming from the request
 * @returns {string|null} the branchId to filter on (null = all branches)
 * @throws {Error} with `.statusCode` when the user is not allowed
 */

const resolveBranchScope = (user, requestedBranchId) => {
  if (!user) {
    const err = new Error("User not authenticated");
    err.statusCode = 401;
    throw err;
  }

  // super_admin: optional branch selection (null = all branches)
  if (user.role === "super_admin") {
    return requestedBranchId ? requestedBranchId : null;
  }

  // scoped roles: the server decides the branch, ignoring what the client
  // asked for (listing a different branch is never possible)
  if (!user.branchId) {
    const err = new Error("You are not assigned to a branch");
    err.statusCode = 403;
    throw err;
  }

  return user.branchId;
};

module.exports = resolveBranchScope;
