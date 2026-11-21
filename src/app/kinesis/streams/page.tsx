import { listStreamsAction } from "../actions";
import StreamsClient from "./StreamsClient";

export const dynamic = "force-dynamic";

export default async function StreamsPage() {
  const { streams, totalShards, onDemandCount, encryptedCount, error } =
    await listStreamsAction();

  return (
    <StreamsClient
      initialStreams={streams}
      totalShards={totalShards}
      onDemandCount={onDemandCount}
      encryptedCount={encryptedCount}
      initialError={error}
    />
  );
}
