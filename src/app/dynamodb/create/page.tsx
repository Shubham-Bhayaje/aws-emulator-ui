import { redirect } from "next/navigation";

export default function CreateTableRedirect() {
  redirect("/dynamodb/tables/create");
}
