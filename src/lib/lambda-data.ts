/**
 * src/lib/lambda-data.ts – Types, defaults, runtime presets, and templates for AWS Lambda.
 * Zero emojis, Cloudscape enterprise styling.
 */

export interface LambdaFunction {
  name: string;
  arn: string;
  runtime: string;
  role: string;
  handler: string;
  codeSize: number;
  description: string;
  timeout: number;
  memorySize: number;
  lastModified: string;
  codeSha256: string;
  version: string;
  environmentVariables: Record<string, string>;
  state: "Active" | "Pending" | "Failed" | "Inactive";
  packageType: "Zip" | "Image";
  architectures: string[];
  ephemeralStorage: number;
}

export interface LambdaRuntimeOption {
  id: string;
  name: string;
  family: "Node.js" | "Python" | "Java" | ".NET" | "Ruby" | "Custom";
  defaultExtension: string;
  defaultHandler: string;
  starterCode: string;
}

export const LAMBDA_RUNTIMES: LambdaRuntimeOption[] = [
  {
    id: "nodejs20.x",
    name: "Node.js 20.x",
    family: "Node.js",
    defaultExtension: "mjs",
    defaultHandler: "index.handler",
    starterCode: `export const handler = async (event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  const response = {
    statusCode: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
    body: JSON.stringify({
      message: "Hello from AWS Lambda on local emulator!",
      timestamp: new Date().toISOString(),
      requestId: event?.requestContext?.requestId || "local-req-1",
    }),
  };

  return response;
};`,
  },
  {
    id: "nodejs18.x",
    name: "Node.js 18.x",
    family: "Node.js",
    defaultExtension: "mjs",
    defaultHandler: "index.handler",
    starterCode: `export const handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Hello from Node.js 18.x Lambda!" }),
  };
};`,
  },
  {
    id: "python3.12",
    name: "Python 3.12",
    family: "Python",
    defaultExtension: "py",
    defaultHandler: "lambda_function.lambda_handler",
    starterCode: `import json
from datetime import datetime

def lambda_handler(event, context):
    print("Received event:", json.dumps(event))
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json'
        },
        'body': json.dumps({
            'message': 'Hello from Python 3.12 AWS Lambda!',
            'timestamp': datetime.utcnow().isoformat()
        })
    }`,
  },
  {
    id: "python3.11",
    name: "Python 3.11",
    family: "Python",
    defaultExtension: "py",
    defaultHandler: "lambda_function.lambda_handler",
    starterCode: `import json

def lambda_handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Hello from Python 3.11!'})
    }`,
  },
  {
    id: "java21",
    name: "Java 21",
    family: "Java",
    defaultExtension: "java",
    defaultHandler: "example.Handler::handleRequest",
    starterCode: `package example;

import java.util.Map;

public class Handler {
    public Map<String, Object> handleRequest(Map<String, Object> event) {
        return Map.of(
            "statusCode", 200,
            "message", "Hello from Java 21 Lambda!"
        );
    }
}`,
  },
  {
    id: "dotnet8",
    name: ".NET 8 (C#)",
    family: ".NET",
    defaultExtension: "cs",
    defaultHandler: "MyAssembly::MyNamespace.Function::FunctionHandler",
    starterCode: `using System.Text.Json;

namespace MyNamespace;

public class Function
{
    public string FunctionHandler(object input)
    {
        return JsonSerializer.Serialize(new { message = "Hello from .NET 8 Lambda!" });
    }
}`,
  },
  {
    id: "ruby3.3",
    name: "Ruby 3.3",
    family: "Ruby",
    defaultExtension: "rb",
    defaultHandler: "lambda_function.handler",
    starterCode: `require 'json'

def handler(event:, context:)
  {
    statusCode: 200,
    body: JSON.generate({ message: "Hello from Ruby 3.3 Lambda!" })
  }
end`,
  },
];

export interface TestEventPreset {
  id: string;
  name: string;
  category: string;
  payload: Record<string, any>;
}

export const TEST_EVENT_PRESETS: TestEventPreset[] = [
  {
    id: "hello-world",
    name: "Hello World Event",
    category: "General",
    payload: {
      key1: "value1",
      key2: "value2",
      key3: "value3",
    },
  },
  {
    id: "apigateway-aws-proxy",
    name: "API Gateway AWS Proxy",
    category: "API Gateway",
    payload: {
      resource: "/items/{itemId}",
      path: "/items/123",
      httpMethod: "GET",
      headers: {
        Accept: "*/*",
        Host: "127.0.0.1:9297",
        "User-Agent": "AWS-Console-Client/1.0",
      },
      queryStringParameters: {
        filter: "active",
      },
      pathParameters: {
        itemId: "123",
      },
      requestContext: {
        accountId: "000000000000",
        resourceId: "res-001",
        stage: "prod",
        requestId: "c6af9ac6-7b61-11e6-9a41-97e8812aa9e7",
        identity: {
          sourceIp: "127.0.0.1",
        },
        httpMethod: "GET",
      },
      body: null,
      isBase64Encoded: false,
    },
  },
  {
    id: "s3-put",
    name: "Amazon S3 Put",
    category: "Storage",
    payload: {
      Records: [
        {
          eventVersion: "2.1",
          eventSource: "aws:s3",
          awsRegion: "us-east-1",
          eventTime: "2026-11-18T04:30:00.000Z",
          eventName: "ObjectCreated:Put",
          s3: {
            s3SchemaVersion: "1.0",
            configurationId: "testConfigRule",
            bucket: {
              name: "local-incoming-bucket",
              ownerIdentity: {
                principalId: "EXAMPLE",
              },
              arn: "arn:aws:s3:::local-incoming-bucket",
            },
            object: {
              key: "uploads/data-file.json",
              size: 1024,
              eTag: "0123456789abcdef0123456789abcdef",
              sequencer: "0A1B2C3D4E5F678901",
            },
          },
        },
      ],
    },
  },
  {
    id: "sqs-receive-message",
    name: "Amazon SQS Message",
    category: "Messaging",
    payload: {
      Records: [
        {
          messageId: "19dd0b57-b21e-4ac1-bd88-01bbb068cb78",
          receiptHandle: "MessageReceiptHandle",
          body: JSON.stringify({ orderId: "ord-98213", status: "PENDING" }),
          attributes: {
            ApproximateReceiveCount: "1",
            SentTimestamp: "1523232000000",
            SenderId: "127.0.0.1",
            ApproximateFirstReceiveTimestamp: "1523232000001",
          },
          messageAttributes: {},
          md5OfBody: "7b270eebdaec70f745f1064684b40d2a",
          eventSource: "aws:sqs",
          eventSourceARN: "arn:aws:sqs:us-east-1:000000000000:orders-queue",
          awsRegion: "us-east-1",
        },
      ],
    },
  },
  {
    id: "sns-notification",
    name: "Amazon SNS Topic Notification",
    category: "Messaging",
    payload: {
      Records: [
        {
          EventSource: "aws:sns",
          EventVersion: "1.0",
          EventSubscriptionArn: "arn:aws:sns:us-east-1:000000000000:alerts:sub-01",
          Sns: {
            Type: "Notification",
            MessageId: "95df01b4-ee98-5cb9-9903-4c221d41eb5e",
            TopicArn: "arn:aws:sns:us-east-1:000000000000:alerts",
            Subject: "Serverless System Alert",
            Message: "High CPU threshold detected on primary worker cluster.",
            Timestamp: "2026-11-18T04:30:00.000Z",
          },
        },
      ],
    },
  },
];

export const DEFAULT_LAMBDA_FUNCTIONS: LambdaFunction[] = [
  {
    name: "hello-world-function",
    arn: "arn:aws:lambda:us-east-1:000000000000:function:hello-world-function",
    runtime: "nodejs20.x",
    role: "arn:aws:iam::000000000000:role/lambda-basic-execution-role",
    handler: "index.handler",
    codeSize: 450,
    description: "Default serverless starter handler for local development",
    timeout: 15,
    memorySize: 128,
    lastModified: new Date().toISOString(),
    codeSha256: "47DEQpj8HBSa+/TImW+5JCeuQeRkm5NMpJWZG3hSuFU=",
    version: "$LATEST",
    environmentVariables: {
      ENV_MODE: "development",
      AWS_REGION: "us-east-1",
    },
    state: "Active",
    packageType: "Zip",
    architectures: ["x86_64"],
    ephemeralStorage: 512,
  },
];
