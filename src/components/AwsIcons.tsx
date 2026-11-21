/**
 * AwsIcons – Official AWS service icon SVGs.
 * These match the real AWS Architecture Icons used in the AWS Console.
 * Each icon uses the correct gradient background color from the AWS icon set.
 */

type IconProps = { size?: number; className?: string };

// ─── Compute (Orange) ──────────────────────────────────────────────

// EC2 – Orange compute icon
export function EC2Icon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="ec2-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#C8511B"/><stop offset="100%" stopColor="#F90"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#ec2-grad)"/>
      <rect x="13" y="13" width="14" height="14" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
      <rect x="17" y="17" width="6" height="6" rx="1" fill="white"/>
      <line x1="20" y1="10" x2="20" y2="13" stroke="white" strokeWidth="1.3"/>
      <line x1="20" y1="27" x2="20" y2="30" stroke="white" strokeWidth="1.3"/>
      <line x1="10" y1="20" x2="13" y2="20" stroke="white" strokeWidth="1.3"/>
      <line x1="27" y1="20" x2="30" y2="20" stroke="white" strokeWidth="1.3"/>
    </svg>
  );
}

// Lambda – Orange serverless icon
export function LambdaIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="lambda-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#C8511B"/><stop offset="100%" stopColor="#F90"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#lambda-grad)"/>
      <text x="20" y="27" textAnchor="middle" fill="white" fontSize="20" fontWeight="300" fontFamily="serif">λ</text>
    </svg>
  );
}

// Elastic Beanstalk – Orange
export function BeanstalkIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="eb-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#C8511B"/><stop offset="100%" stopColor="#F90"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#eb-grad)"/>
      <path d="M20 10c-2 4-6 6-6 12a6 6 0 0012 0c0-6-4-8-6-12z" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M17 24h6" stroke="white" strokeWidth="1.3"/>
    </svg>
  );
}

// Lightsail – Orange
export function LightsailIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="ls-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#C8511B"/><stop offset="100%" stopColor="#F90"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#ls-grad)"/>
      <circle cx="20" cy="18" r="6" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M18 18l2-3 2 3M14 28h12" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

// ECS – Orange container icon
export function ECSIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="ecs-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#C8511B"/><stop offset="100%" stopColor="#F90"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#ecs-grad)"/>
      <rect x="11" y="12" width="18" height="16" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M15 17v6M20 17v6M25 17v6" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

// EKS – Orange Kubernetes
export function EKSIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="eks-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#C8511B"/><stop offset="100%" stopColor="#F90"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#eks-grad)"/>
      <circle cx="20" cy="20" r="8" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M20 12v5M20 23v5M13 16l4.5 2.5M22.5 21.5l4.5 2.5M13 24l4.5-2.5M22.5 18.5l4.5-2.5" stroke="white" strokeWidth="1.2"/>
    </svg>
  );
}

// ─── Storage (Green) ────────────────────────────────────────────────

// S3 – Green bucket icon
export function S3Icon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="s3-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1B660F"/><stop offset="100%" stopColor="#6CAE3E"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#s3-grad)"/>
      <path d="M28 17.5c0 1.38-3.58 2.5-8 2.5s-8-1.12-8-2.5" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M28 22.5c0 1.38-3.58 2.5-8 2.5s-8-1.12-8-2.5" stroke="white" strokeWidth="1.5" fill="none"/>
      <ellipse cx="20" cy="12.5" rx="8" ry="2.5" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M12 12.5v15c0 1.38 3.58 2.5 8 2.5s8-1.12 8-2.5v-15" stroke="white" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

// EFS – Green file system
export function EFSIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="efs-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1B660F"/><stop offset="100%" stopColor="#6CAE3E"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#efs-grad)"/>
      <rect x="11" y="11" width="18" height="18" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M15 16h10M15 20h7M15 24h10" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

// S3 Glacier – Green archive
export function GlacierIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="glacier-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1B660F"/><stop offset="100%" stopColor="#6CAE3E"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#glacier-grad)"/>
      <path d="M12 28l8-18 8 18H12z" stroke="white" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M16 28l4-9 4 9" stroke="white" strokeWidth="1.2" fill="none"/>
    </svg>
  );
}

// ─── Database (Blue) ────────────────────────────────────────────────

// DynamoDB – Blue database icon
export function DynamoDBIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="ddb-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2E27AD"/><stop offset="100%" stopColor="#527FFF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#ddb-grad)"/>
      <ellipse cx="20" cy="12" rx="8" ry="3" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M12 12v16c0 1.66 3.58 3 8 3s8-1.34 8-3V12" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M28 20c0 1.66-3.58 3-8 3s-8-1.34-8-3" stroke="white" strokeWidth="1.3" fill="none"/>
    </svg>
  );
}

// Keyspaces – Blue Cassandra database icon
export function KeyspacesIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="keyspaces-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2E27AD"/><stop offset="100%" stopColor="#527FFF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#keyspaces-grad)"/>
      <ellipse cx="20" cy="11" rx="8" ry="3" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M12 11v18c0 1.66 3.58 3 8 3s8-1.34 8-3V11" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M28 17c0 1.66-3.58 3-8 3s-8-1.34-8-3" stroke="white" strokeWidth="1.2" fill="none"/>
      <path d="M28 23c0 1.66-3.58 3-8 3s-8-1.34-8-3" stroke="white" strokeWidth="1.2" fill="none"/>
      <path d="M17 19l6 6M23 19l-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// RDS – Blue relational DB
export function RDSIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="rds-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2E27AD"/><stop offset="100%" stopColor="#527FFF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#rds-grad)"/>
      <ellipse cx="20" cy="12" rx="8" ry="3" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M12 12v16c0 1.66 3.58 3 8 3s8-1.34 8-3V12" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M28 17c0 1.66-3.58 3-8 3s-8-1.34-8-3" stroke="white" strokeWidth="1.2" fill="none"/>
      <path d="M28 22c0 1.66-3.58 3-8 3s-8-1.34-8-3" stroke="white" strokeWidth="1.2" fill="none"/>
    </svg>
  );
}

// ElastiCache – Blue cache
export function ElastiCacheIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="ec-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2E27AD"/><stop offset="100%" stopColor="#527FFF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#ec-grad)"/>
      <circle cx="20" cy="20" r="8" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M16 20h8M20 16v8" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Networking (Purple) ────────────────────────────────────────────

// VPC – Purple network
export function VPCIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="vpc-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4D27A8"/><stop offset="100%" stopColor="#A166FF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#vpc-grad)"/>
      <rect x="11" y="11" width="18" height="18" rx="2" stroke="white" strokeWidth="1.5" fill="none" strokeDasharray="3 2"/>
      <circle cx="16" cy="16" r="2" fill="white"/>
      <circle cx="24" cy="16" r="2" fill="white"/>
      <circle cx="16" cy="24" r="2" fill="white"/>
      <circle cx="24" cy="24" r="2" fill="white"/>
      <path d="M18 16h4M18 24h4M16 18v4M24 18v4" stroke="white" strokeWidth="1"/>
    </svg>
  );
}

// CloudFront – Purple CDN
export function CloudFrontIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="cf-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4D27A8"/><stop offset="100%" stopColor="#A166FF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#cf-grad)"/>
      <circle cx="20" cy="20" r="9" stroke="white" strokeWidth="1.5" fill="none"/>
      <ellipse cx="20" cy="20" rx="4" ry="9" stroke="white" strokeWidth="1.2" fill="none"/>
      <path d="M11 20h18" stroke="white" strokeWidth="1.2"/>
    </svg>
  );
}

// Route 53 – Purple DNS
export function Route53Icon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="r53-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4D27A8"/><stop offset="100%" stopColor="#A166FF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#r53-grad)"/>
      <text x="20" y="25" textAnchor="middle" fill="white" fontSize="13" fontWeight="bold" fontFamily="Inter, Arial">53</text>
      <path d="M12 12l4 2M28 12l-4 2M12 28l4-2M28 28l-4-2" stroke="white" strokeWidth="1.2"/>
    </svg>
  );
}

// API Gateway – Purple
export function APIGatewayIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="apigw-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4D27A8"/><stop offset="100%" stopColor="#A166FF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#apigw-grad)"/>
      <rect x="16" y="10" width="8" height="20" rx="1.5" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M10 15h6M10 25h6M24 15h6M24 25h6M10 20h6M24 20h6" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Application Integration (Pink) ─────────────────────────────────

// SQS – Pink queue icon
export function SQSIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="sqs-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#B0084D"/><stop offset="100%" stopColor="#FF4F8B"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#sqs-grad)"/>
      <rect x="10" y="12" width="20" height="16" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M14 17h12M14 20.5h12M14 24h8" stroke="white" strokeWidth="1.3" strokeLinecap="round"/>
    </svg>
  );
}

// SNS – Pink notification
export function SNSIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="sns-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#B0084D"/><stop offset="100%" stopColor="#FF4F8B"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#sns-grad)"/>
      <path d="M12 16v-2a8 8 0 0116 0v2" stroke="white" strokeWidth="1.5" fill="none"/>
      <rect x="10" y="16" width="20" height="10" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M10 17l10 6 10-6" stroke="white" strokeWidth="1.3" fill="none"/>
    </svg>
  );
}

// Step Functions – Pink workflow
export function StepFunctionsIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="sf-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#B0084D"/><stop offset="100%" stopColor="#FF4F8B"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#sf-grad)"/>
      <circle cx="20" cy="12" r="3" stroke="white" strokeWidth="1.3" fill="none"/>
      <circle cx="14" cy="24" r="3" stroke="white" strokeWidth="1.3" fill="none"/>
      <circle cx="26" cy="24" r="3" stroke="white" strokeWidth="1.3" fill="none"/>
      <path d="M18 14l-3 7M22 14l3 7" stroke="white" strokeWidth="1.2"/>
    </svg>
  );
}

// EventBridge – Pink events
export function EventBridgeIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="evb-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#B0084D"/><stop offset="100%" stopColor="#FF4F8B"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#evb-grad)"/>
      <rect x="11" y="11" width="18" height="18" rx="3" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M15 16l4 4-4 4M21 24h4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// ─── Security (Red) ─────────────────────────────────────────────────

// IAM – Red shield icon
export function IAMIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="iam-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#BD0816"/><stop offset="100%" stopColor="#FF5252"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#iam-grad)"/>
      <path d="M20 8L10 13v8c0 6.08 4.26 11.76 10 13 5.74-1.24 10-6.92 10-13v-8L20 8z" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M16 20l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// KMS – Red key
export function KMSIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="kms-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#BD0816"/><stop offset="100%" stopColor="#FF5252"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#kms-grad)"/>
      <circle cx="16" cy="18" r="5" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M20 20h9M26 20v4M29 20v3" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// Secrets Manager – Red
export function SecretsManagerIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="sm-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#BD0816"/><stop offset="100%" stopColor="#FF5252"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#sm-grad)"/>
      <rect x="13" y="18" width="14" height="12" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M16 18v-4a4 4 0 018 0v4" stroke="white" strokeWidth="1.5" fill="none"/>
      <circle cx="20" cy="24" r="1.5" fill="white"/>
    </svg>
  );
}

// Cognito – Red
export function CognitoIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="cog-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#BD0816"/><stop offset="100%" stopColor="#FF5252"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#cog-grad)"/>
      <circle cx="20" cy="15" r="4" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M12 28c0-4.42 3.58-8 8-8s8 3.58 8 8" stroke="white" strokeWidth="1.5" fill="none"/>
    </svg>
  );
}

// ─── Management & Governance (Pink/Red) ─────────────────────────────

// CloudWatch – Pink monitoring
export function CloudWatchIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="cw-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#B0084D"/><stop offset="100%" stopColor="#FF4F8B"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#cw-grad)"/>
      <circle cx="20" cy="20" r="9" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M20 14v6l4 3" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

// CloudTrail
export function CloudTrailIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="ct-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#B0084D"/><stop offset="100%" stopColor="#FF4F8B"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#ct-grad)"/>
      <path d="M10 26l6-8 5 4 5-8 4 5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="30" cy="19" r="2" fill="white"/>
    </svg>
  );
}

// CloudFormation – Pink stack
export function CloudFormationIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="cfn-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#B0084D"/><stop offset="100%" stopColor="#FF4F8B"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#cfn-grad)"/>
      <path d="M20 10l10 6v8l-10 6-10-6v-8l10-6z" stroke="white" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <path d="M10 16l10 6 10-6M20 22v8" stroke="white" strokeWidth="1.2"/>
    </svg>
  );
}

// Systems Manager
export function SystemsManagerIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="ssm-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#B0084D"/><stop offset="100%" stopColor="#FF4F8B"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#ssm-grad)"/>
      <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44" stroke="white" strokeWidth="1" fill="none" transform="translate(8,8) scale(0.65)"/>
      <circle cx="20" cy="20" r="3" stroke="white" strokeWidth="1.3" fill="none"/>
      <path d="M20 10v3M20 27v3M10 20h3M27 20h3" stroke="white" strokeWidth="1.2"/>
    </svg>
  );
}

// ─── Analytics (Blue) ───────────────────────────────────────────────

// Kinesis – Blue streaming
export function KinesisIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="kin-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4D27A8"/><stop offset="100%" stopColor="#A166FF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#kin-grad)"/>
      <path d="M12 14c5 2 11 2 16 0M12 20c5 2 11 2 16 0M12 26c5 2 11 2 16 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
    </svg>
  );
}

// Athena – Purple
export function AthenaIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="ath-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#4D27A8"/><stop offset="100%" stopColor="#A166FF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#ath-grad)"/>
      <circle cx="20" cy="18" r="6" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M24.5 22.5l5 5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

// Redshift – Blue analytics
export function RedshiftIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="rs-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2E27AD"/><stop offset="100%" stopColor="#527FFF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#rs-grad)"/>
      <rect x="12" y="10" width="16" height="20" rx="2" stroke="white" strokeWidth="1.5" fill="none"/>
      <path d="M16 15h8M16 19h8M16 23h5" stroke="white" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Developer Tools (Blue/Dark) ────────────────────────────────────

// CodeCommit – Dark blue
export function CodeIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="code-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#2E27AD"/><stop offset="100%" stopColor="#527FFF"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#code-grad)"/>
      <path d="M15 14l-5 6 5 6M25 14l5 6-5 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
    </svg>
  );
}

// ─── Machine Learning (Green/Teal) ──────────────────────────────────

// SageMaker – Green ML
export function SageMakerIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="sm2-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1B660F"/><stop offset="100%" stopColor="#6CAE3E"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#sm2-grad)"/>
      <circle cx="14" cy="14" r="3" stroke="white" strokeWidth="1.3" fill="none"/>
      <circle cx="26" cy="14" r="3" stroke="white" strokeWidth="1.3" fill="none"/>
      <circle cx="20" cy="26" r="3" stroke="white" strokeWidth="1.3" fill="none"/>
      <path d="M16 16l3 8M24 16l-3 8M17 14h6" stroke="white" strokeWidth="1.2"/>
    </svg>
  );
}

// Bedrock – Green/Teal AI
export function BedrockIcon({ size = 20, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="br-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" stopColor="#1B660F"/><stop offset="100%" stopColor="#6CAE3E"/></linearGradient></defs>
      <rect width="40" height="40" rx="4" fill="url(#br-grad)"/>
      <path d="M20 10l8 5v10l-8 5-8-5v-10l8-5z" stroke="white" strokeWidth="1.5" fill="none" strokeLinejoin="round"/>
      <circle cx="20" cy="20" r="3" stroke="white" strokeWidth="1.3" fill="none"/>
      <path d="M20 10v7M20 23v7M12 15l5 3M23 22l5 3M28 15l-5 3M17 22l-5 3" stroke="white" strokeWidth="0.8"/>
    </svg>
  );
}

// ─── Generic AWS Service Icon (fallback) ────────────────────────────

export function AwsServiceIcon({
  size = 20,
  className,
  label,
  color = "#232f3e",
}: IconProps & { label?: string; color?: string }) {
  const displayLabel = label ? (label.length > 3 ? label.slice(0, 3) : label) : "A";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className}>
      <rect width="40" height="40" rx="6" fill={color}/>
      <text
        x="20"
        y="25"
        textAnchor="middle"
        fill="white"
        fontSize={displayLabel.length >= 3 ? "11" : "13"}
        fontWeight="bold"
        fontFamily="sans-serif"
      >
        {displayLabel.toUpperCase()}
      </text>
    </svg>
  );
}

export function ServiceIcon({
  id,
  shortName,
  color,
  size = 20,
  className,
}: {
  id: string;
  shortName?: string;
  color?: string;
  size?: number;
  className?: string;
}) {
  const normId = id.toLowerCase();
  switch (normId) {
    case "ec2":
      return <EC2Icon size={size} className={className} />;
    case "lambda":
      return <LambdaIcon size={size} className={className} />;
    case "elasticbeanstalk":
      return <BeanstalkIcon size={size} className={className} />;
    case "lightsail":
      return <LightsailIcon size={size} className={className} />;
    case "ecs":
    case "ecs-anywhere":
      return <ECSIcon size={size} className={className} />;
    case "eks":
    case "eks-anywhere":
      return <EKSIcon size={size} className={className} />;
    case "s3":
      return <S3Icon size={size} className={className} />;
    case "efs":
      return <EFSIcon size={size} className={className} />;
    case "glacier":
    case "s3glacier":
    case "s3-glacier":
    case "amazons3glacier":
      return <GlacierIcon size={size} className={className} />;
    case "dynamodb":
      return <DynamoDBIcon size={size} className={className} />;
    case "keyspaces":
    case "amazonkeyspaces":
      return <KeyspacesIcon size={size} className={className} />;
    case "rds":
    case "aurora":
    case "rds-custom":
      return <RDSIcon size={size} className={className} />;
    case "elasticache":
    case "memorydb":
      return <ElastiCacheIcon size={size} className={className} />;
    case "redshift":
      return <RedshiftIcon size={size} className={className} />;
    case "vpc":
      return <VPCIcon size={size} className={className} />;
    case "cloudfront":
      return <CloudFrontIcon size={size} className={className} />;
    case "route53":
    case "route53-arc":
      return <Route53Icon size={size} className={className} />;
    case "apigateway":
      return <APIGatewayIcon size={size} className={className} />;
    case "sqs":
      return <SQSIcon size={size} className={className} />;
    case "sns":
      return <SNSIcon size={size} className={className} />;
    case "stepfunctions":
      return <StepFunctionsIcon size={size} className={className} />;
    case "eventbridge":
    case "pipes":
      return <EventBridgeIcon size={size} className={className} />;
    case "iam":
    case "identity-center":
      return <IAMIcon size={size} className={className} />;
    case "kms":
      return <KMSIcon size={size} className={className} />;
    case "secretsmanager":
      return <SecretsManagerIcon size={size} className={className} />;
    case "cognito":
      return <CognitoIcon size={size} className={className} />;
    case "cloudwatch":
      return <CloudWatchIcon size={size} className={className} />;
    case "cloudtrail":
      return <CloudTrailIcon size={size} className={className} />;
    case "cloudformation":
      return <CloudFormationIcon size={size} className={className} />;
    case "systems-manager":
    case "ssm-parameter-store":
      return <SystemsManagerIcon size={size} className={className} />;
    case "kinesis":
    case "kinesis-firehose":
    case "kinesis-video":
      return <KinesisIcon size={size} className={className} />;
    case "athena":
      return <AthenaIcon size={size} className={className} />;
    case "codecommit":
    case "codebuild":
    case "codepipeline":
    case "codeartifact":
    case "codecatalyst":
      return <CodeIcon size={size} className={className} />;
    case "sagemaker":
      return <SageMakerIcon size={size} className={className} />;
    case "bedrock":
      return <BedrockIcon size={size} className={className} />;
    default:
      return (
        <AwsServiceIcon
          size={size}
          className={className}
          label={shortName || id}
          color={color}
        />
      );
  }
}
