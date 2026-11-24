import {
  NetworkFirewallClient,
  CreateRuleGroupCommand,
  DescribeRuleGroupCommand,
  DeleteRuleGroupCommand,
  CreateFirewallPolicyCommand,
  DescribeFirewallPolicyCommand,
  DeleteFirewallPolicyCommand,
  CreateFirewallCommand,
  DescribeFirewallCommand,
  DeleteFirewallCommand,
  ListFirewallsCommand,
} from "@aws-sdk/client-network-firewall";
import { EC2Client, DescribeSubnetsCommand, DescribeVpcsCommand } from "@aws-sdk/client-ec2";
import https from "https";
import fs from "fs";
import path from "path";
import os from "os";
import { NodeHttpHandler } from "@smithy/node-http-handler";

const homeDir = os.homedir();
const possibleCredPaths = [
  path.join(homeDir, ".aws/emulator/9297/emulator_credentials"),
  "//wsl$/Ubuntu/home/shubham/.aws/emulator/9297/emulator_credentials",
  "/home/shubham/.aws/emulator/9297/emulator_credentials",
];

let accessKey = "EMULATORAACB34D2F2BC";
let secretKey = "8368589A0822F58CF6E513A6ECB0C07D1095C31A";

for (const credFile of possibleCredPaths) {
  if (fs.existsSync(credFile)) {
    const content = fs.readFileSync(credFile, "utf-8");
    const k = content.match(/aws_access_key_id\s*=\s*([^\r\n]+)/);
    const s = content.match(/aws_secret_access_key\s*=\s*([^\r\n]+)/);
    if (k) accessKey = k[1].trim();
    if (s) secretKey = s[1].trim();
    break;
  }
}

const credentials = { accessKeyId: accessKey, secretAccessKey: secretKey };

const clientConfig = {
  endpoint: process.env.AWS_ENDPOINT_URL || "https://127.0.0.1:9297",
  region: "us-east-1",
  credentials,
  requestHandler: new NodeHttpHandler({
    httpsAgent: new https.Agent({ rejectUnauthorized: false }),
  }),
};

const client = new NetworkFirewallClient(clientConfig);
const ec2Client = new EC2Client(clientConfig);

async function main() {
  console.log("Testing NetworkFirewall SDK actions against emulator...");

  // 1. Create Stateful Rule Group (Domain list)
  const rgRes = await client.send(
    new CreateRuleGroupCommand({
      RuleGroupName: "sdk-test-domain-rg",
      Type: "STATEFUL",
      Capacity: 100,
      RuleGroup: {
        RulesSource: {
          RulesSourceList: {
            Targets: [".example.com", ".test.org"],
            TargetTypes: ["TLS_SNI", "HTTP_HOST"],
            GeneratedRulesType: "DENYLIST",
          },
        },
      },
    })
  );
  console.log("[PASS] Created stateful domain rule group:", rgRes.RuleGroupResponse?.RuleGroupArn);

  // 2. Describe Rule Group
  const descRg = await client.send(
    new DescribeRuleGroupCommand({
      RuleGroupName: "sdk-test-domain-rg",
      Type: "STATEFUL",
    })
  );
  console.log("[PASS] Described rule group, status:", descRg.RuleGroupResponse?.RuleGroupStatus);

  // 3. Create Firewall Policy
  const policyRes = await client.send(
    new CreateFirewallPolicyCommand({
      FirewallPolicyName: "sdk-test-policy",
      FirewallPolicy: {
        StatelessDefaultActions: ["aws:forward_to_sfe"],
        StatelessFragmentDefaultActions: ["aws:pass"],
        StatefulRuleGroupReferences: [
          {
            ResourceArn: rgRes.RuleGroupResponse?.RuleGroupArn,
          },
        ],
      },
    })
  );
  console.log("[PASS] Created firewall policy:", policyRes.FirewallPolicyResponse?.FirewallPolicyArn);

  // 4. Fetch VPC & Subnet
  const vpcRes = await ec2Client.send(new DescribeVpcsCommand({}));
  const vpcId = vpcRes.Vpcs?.[0]?.VpcId!;
  const subnetsRes = await ec2Client.send(new DescribeSubnetsCommand({ Filters: [{ Name: "vpc-id", Values: [vpcId] }] }));
  const subnetId = subnetsRes.Subnets?.[0]?.SubnetId!;

  // 5. Create Firewall
  const fwRes = await client.send(
    new CreateFirewallCommand({
      FirewallName: "sdk-test-firewall",
      FirewallPolicyArn: policyRes.FirewallPolicyResponse?.FirewallPolicyArn!,
      VpcId: vpcId,
      SubnetMappings: [{ SubnetId: subnetId }],
      DeleteProtection: false,
    })
  );
  console.log("[PASS] Created firewall:", fwRes.Firewall?.FirewallArn);

  // 6. List Firewalls
  const listFw = await client.send(new ListFirewallsCommand({}));
  console.log("[PASS] Listed firewalls count:", listFw.Firewalls?.length);

  // 7. Cleanup
  await client.send(new DeleteFirewallCommand({ FirewallName: "sdk-test-firewall" }));
  await client.send(new DeleteFirewallPolicyCommand({ FirewallPolicyName: "sdk-test-policy" }));
  await client.send(new DeleteRuleGroupCommand({ RuleGroupName: "sdk-test-domain-rg", Type: "STATEFUL" }));
  console.log("[PASS] Cleaned up test resources successfully!");
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
