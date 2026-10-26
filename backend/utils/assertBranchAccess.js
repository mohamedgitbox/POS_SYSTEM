/**
 * Branch scoping rules:
 * - cashier / branch_manager: may only operate on the branch they are assigned to
 * - super_admin: may operate on any branch
 *
 * @param {object} user  - the authenticated user (req.user)
 * @param {string|object} requestedBranchId - branchId coming from the request
 * @returns {string} the branchId to use (string)
 * @throws {Error} with `.statusCode` when the user has no access
 */
const assertBranchAccess = (user, requestedBranchId) => {
  if (!user) {
    const err = new Error("User not authenticated");
    err.statusCode = 401;
    throw err;
  }

  // super_admin is not branch-scoped
  if (user.role === "super_admin") {
    if (!requestedBranchId) {
      const err = new Error("branchId is required");
      err.statusCode = 400;
      throw err;
    }
    return requestedBranchId;
  }

  // cashier / branch_manager must act on their own branch
  if (!user.branchId) {
    const err = new Error("You are not assigned to a branch");
    err.statusCode = 403;
    throw err;
  }

  if (requestedBranchId && requestedBranchId.toString() !== user.branchId.toString()) {
    const err = new Error("You can only operate on your assigned branch");
    err.statusCode = 403;
    throw err;
  }

  return user.branchId;
};

module.exports = assertBranchAccess;
