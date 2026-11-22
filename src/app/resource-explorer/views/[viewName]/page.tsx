import { notFound } from "next/navigation";
import ViewDetailClient from "./ViewDetailClient";
import { getViewAction, listViewsAction } from "../../actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ viewName: string }>;
  searchParams: Promise<{ arn?: string }>;
}

export default async function ViewDetailPage({ params, searchParams }: Props) {
  const { viewName } = await params;
  const { arn } = await searchParams;

  let targetArn = arn;

  if (!targetArn) {
    const listRes = await listViewsAction();
    const matched = (listRes.views || []).find(
      (v) =>
        v.ViewName?.toLowerCase() === viewName.toLowerCase() ||
        v.ViewArn.split("/").pop()?.toLowerCase() === viewName.toLowerCase()
    );
    if (matched) {
      targetArn = matched.ViewArn;
    }
  }

  if (!targetArn) {
    notFound();
  }

  const res = await getViewAction(targetArn);
  if (!res.success || !res.view) {
    notFound();
  }

  return <ViewDetailClient view={res.view} />;
}
