import ElasticIpsClient from "./ElasticIpsClient";
import { listElasticIpsAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function ElasticIpsPage() {
  const res = await listElasticIpsAction();
  return <ElasticIpsClient initialElasticIps={res.success ? res.elasticIps : []} />;
}
