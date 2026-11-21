import Link from "next/link";
import { getStreamDetailAction, getKmsKeysAction } from "../../actions";
import StreamDetailClient from "./StreamDetailClient";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ stream: string }>;
}

export default async function StreamDetailPage(props: Props) {
  const { stream: rawStream } = await props.params;
  const streamName = decodeURIComponent(rawStream);

  const [{ stream, shards, consumers, error }, kmsKeys] = await Promise.all([
    getStreamDetailAction(streamName),
    getKmsKeysAction(),
  ]);

  if (!stream) {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center space-y-4">
        <div className="bg-white border border-[#eaeded] rounded p-8 shadow-sm space-y-4">
          <h2 className="text-[20px] font-bold text-[#16191f]">Data stream not found</h2>
          <p className="text-[13px] text-[#545b64]">
            Data stream <strong className="font-mono text-[#16191f]">{streamName}</strong> was not found in this Region.
          </p>
          <div className="pt-2">
            <Link
              href="/kinesis/streams"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07]"
            >
              Back to Data streams
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <StreamDetailClient
      stream={stream}
      shards={shards}
      consumers={consumers}
      kmsKeys={kmsKeys}
      initialError={error}
    />
  );
}
