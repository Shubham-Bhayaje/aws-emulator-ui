export interface SnsNavItem {
  label: string;
  href: string;
  external?: boolean;
}

export const snsNav: SnsNavItem[] = [
  { label: "Topics", href: "/sns" },
  { label: "Subscriptions", href: "/sns/subscriptions" },
  { label: "Push notifications", href: "/sns/mobile/push" },
  { label: "Text messaging (SMS)", href: "/sns/mobile/sms" },
];
