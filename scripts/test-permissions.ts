// scripts/test-permissions.ts
import { evaluatePermissions, assertPermission } from "../src/lib/permissions";

console.log("Starting permissions verification test suite...\n");

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string) {
  total++;
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passed++;
  } else {
    console.error(`[FAIL] ${testName}`);
  }
}

// 1. Admin / Emulator user has unrestricted access
const adminIdentity = {
  type: "admin" as const,
  name: "emulator",
  accountId: "000000000000",
};

assert(evaluatePermissions(adminIdentity, "ec2:RunInstances").allowed === true, "Admin allowed ec2:RunInstances");
assert(evaluatePermissions(adminIdentity, "s3:CreateBucket").allowed === true, "Admin allowed s3:CreateBucket");
assert(evaluatePermissions(adminIdentity, "iam:CreateUser").allowed === true, "Admin allowed iam:CreateUser");
assert(evaluatePermissions(adminIdentity, "dynamodb:CreateTable").allowed === true, "Admin allowed dynamodb:CreateTable");

// 2. User with NO policies (e.g. newly created user or CO-ADMIN) is denied (Implicit Deny)
const userWithNoPolicies = {
  type: "user" as const,
  name: "CO-ADMIN",
  accountId: "000000000000",
  policies: [],
};

assert(evaluatePermissions(userWithNoPolicies, "ec2:RunInstances").allowed === false, "CO-ADMIN (0 policies) denied ec2:RunInstances");
assert(evaluatePermissions(userWithNoPolicies, "s3:CreateBucket").allowed === false, "CO-ADMIN (0 policies) denied s3:CreateBucket");
assert(evaluatePermissions(userWithNoPolicies, "dynamodb:CreateTable").allowed === false, "CO-ADMIN (0 policies) denied dynamodb:CreateTable");
assert(evaluatePermissions(userWithNoPolicies, "lambda:CreateFunction").allowed === false, "CO-ADMIN (0 policies) denied lambda:CreateFunction");

// Verify assertPermission throws authentic AWS AccessDeniedException
let threwAccessDenied = false;
let errorMessage = "";
try {
  assertPermission(userWithNoPolicies, "ec2:RunInstances", "*");
} catch (err: any) {
  threwAccessDenied = true;
  errorMessage = err.message;
}
assert(threwAccessDenied === true, "assertPermission threw on unauthorized action");
assert(errorMessage.includes("AccessDeniedException"), "Error message contains AccessDeniedException");
assert(errorMessage.includes("CO-ADMIN"), "Error message specifies user ARN");
assert(errorMessage.includes("ec2:RunInstances"), "Error message specifies action");

// 3. User with AmazonEC2FullAccess (directly or via Group) is allowed EC2 actions, denied others
const userWithEc2 = {
  type: "user" as const,
  name: "CO-ADMIN",
  accountId: "000000000000",
  policies: [
    {
      name: "AmazonEC2FullAccess",
      document: {
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow" as const, Action: "ec2:*", Resource: "*" }],
      },
    },
  ],
};

assert(evaluatePermissions(userWithEc2, "ec2:RunInstances").allowed === true, "CO-ADMIN (with EC2FullAccess) allowed ec2:RunInstances");
assert(evaluatePermissions(userWithEc2, "ec2:TerminateInstances").allowed === true, "CO-ADMIN (with EC2FullAccess) allowed ec2:TerminateInstances");
assert(evaluatePermissions(userWithEc2, "ec2:CreateSecurityGroup").allowed === true, "CO-ADMIN (with EC2FullAccess) allowed ec2:CreateSecurityGroup");
assert(evaluatePermissions(userWithEc2, "s3:CreateBucket").allowed === false, "CO-ADMIN (with EC2FullAccess) denied s3:CreateBucket");
assert(evaluatePermissions(userWithEc2, "iam:CreateUser").allowed === false, "CO-ADMIN (with EC2FullAccess) denied iam:CreateUser");

// 4. Explicit Deny overrides Allow
const userWithDeny = {
  type: "user" as const,
  name: "DEV-USER",
  accountId: "000000000000",
  policies: [
    {
      name: "AllowAll",
      document: {
        Version: "2012-10-17",
        Statement: [{ Effect: "Allow" as const, Action: "*", Resource: "*" }],
      },
    },
    {
      name: "DenyTerminate",
      document: {
        Version: "2012-10-17",
        Statement: [{ Effect: "Deny" as const, Action: "ec2:TerminateInstances", Resource: "*" }],
      },
    },
  ],
};

assert(evaluatePermissions(userWithDeny, "ec2:RunInstances").allowed === true, "DEV-USER allowed ec2:RunInstances");
assert(evaluatePermissions(userWithDeny, "ec2:TerminateInstances").allowed === false, "DEV-USER explicit Deny overrides Allow on ec2:TerminateInstances");

console.log(`\n========================================`);
console.log(`Results: ${passed}/${total} tests passed.`);
console.log(`========================================`);
