/* Regression tests for the consistent branch-scoping rules. */
const { test } = require("node:test");
const assert = require("node:assert");
const assertBranchAccess = require("../utils/assertBranchAccess");
const resolveBranchScope = require("../utils/resolveBranchScope");

const superAdmin = { role: "super_admin", branchId: null };
const manager = { role: "branch_manager", branchId: "branchA" };
const cashier = { role: "cashier", branchId: "branchB" };

const throwsWithStatus = (fn, expectedStatus) => {
  try {
    fn();
  } catch (err) {
    assert.equal(err.statusCode, expectedStatus);
    return;
  }
  assert.fail("expected the function to throw");
};

test("assertBranchAccess: scoped roles locked to their own branch", () => {
  assert.equal(assertBranchAccess(manager, "branchA"), "branchA");
  assert.equal(assertBranchAccess(manager, undefined), "branchA");
  throwsWithStatus(() => assertBranchAccess(manager, "branchOther"), 403);
  throwsWithStatus(() => assertBranchAccess(cashier, "branchOther"), 403);
  // a cashier without a branch assignment cannot operate anywhere
  throwsWithStatus(() => assertBranchAccess({ role: "cashier", branchId: null }, "branchA"), 403);
});

test("assertBranchAccess: super_admin must supply a concrete branch for mutations", () => {
  assert.equal(assertBranchAccess(superAdmin, "branchX"), "branchX");
  throwsWithStatus(() => assertBranchAccess(superAdmin, undefined), 400);
});

test("assertBranchAccess: unauthenticated user rejected", () => {
  throwsWithStatus(() => assertBranchAccess(null, "branchA"), 401);
});

test("resolveBranchScope: scoped roles always scoped to their branch", () => {
  assert.equal(resolveBranchScope(manager, "branchA"), "branchA");
  assert.equal(resolveBranchScope(manager, "branchOther"), "branchA"); // server wins
  assert.equal(resolveBranchScope(manager, null), "branchA");
});

test("resolveBranchScope: super_admin may list ALL branches when no branchId", () => {
  // this is the consistent multi-branch listing rule: null = no filter
  assert.equal(resolveBranchScope(superAdmin, null), null);
  assert.equal(resolveBranchScope(superAdmin, undefined), null);
  assert.equal(resolveBranchScope(superAdmin, ""), null);
});

test("resolveBranchScope: super_admin with branchId lists that branch", () => {
  assert.equal(resolveBranchScope(superAdmin, "branchX"), "branchX");
});

test("resolveBranchScope: unauthenticated user rejected", () => {
  throwsWithStatus(() => resolveBranchScope(null, "branchA"), 401);
});
