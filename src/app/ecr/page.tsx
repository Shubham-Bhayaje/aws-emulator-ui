import { redirect } from "next/navigation";

export default function EcrIndexPage() {
  redirect("/ecr/repositories");
}
