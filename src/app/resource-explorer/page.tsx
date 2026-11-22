import ResourceSearchClient from "./ResourceSearchClient";
import {
  getIndexAction,
  listViewsAction,
  searchResourcesAction,
} from "./actions";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: Promise<{ query?: string; view?: string }>;
}

export default async function ResourceExplorerPage({ searchParams }: Props) {
  const { query, view } = await searchParams;

  const [indexRes, viewsRes] = await Promise.all([
    getIndexAction(),
    listViewsAction(),
  ]);

  const activeViewArn = view || viewsRes.defaultViewArn || viewsRes.views[0]?.ViewArn;
  const initialQuery = query || "";

  let initialSearchRes: {
    success: boolean;
    resources: any[];
    count: number;
    complete: boolean;
    viewArn?: string;
    error?: string;
  } = {
    success: true,
    resources: [],
    count: 0,
    complete: true,
    viewArn: activeViewArn,
    error: undefined,
  };

  if (indexRes.hasIndex) {
    const searchRes = await searchResourcesAction(initialQuery, activeViewArn);
    initialSearchRes = {
      success: searchRes.success,
      resources: searchRes.resources as any,
      count: searchRes.count || 0,
      complete: searchRes.complete ?? true,
      viewArn: searchRes.viewArn,
      error: searchRes.error,
    };
  }

  return (
    <ResourceSearchClient
      indexInfo={indexRes}
      views={viewsRes.views}
      defaultViewArn={viewsRes.defaultViewArn}
      initialActiveViewArn={activeViewArn}
      initialQuery={initialQuery}
      initialSearchRes={initialSearchRes}
    />
  );
}
