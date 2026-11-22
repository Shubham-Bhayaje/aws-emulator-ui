import { notFound } from "next/navigation";
import RouteDetailClient from "./RouteDetailClient";
import { describeRouteCalculatorAction } from "../../actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ calculatorName: string }>;
}

export default async function RouteDetailPage({ params }: Props) {
  const { calculatorName } = await params;
  const res = await describeRouteCalculatorAction(calculatorName);

  if (!res.success || !res.calculator) {
    notFound();
  }

  return <RouteDetailClient calculator={res.calculator} />;
}
