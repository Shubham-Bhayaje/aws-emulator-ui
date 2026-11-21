import Link from "next/link";

export default function DeliveryStreamsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Data delivery streams</h1>
          <p className="text-[14px] text-[#545b64] mt-0.5">
            Amazon Data Firehose is the easiest way to reliably load streaming data into data lakes, data stores, and analytics services.
          </p>
        </div>
      </div>

      <div className="bg-[#f2f3f3] border border-[#d5dbdb] rounded p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded border border-[#eaeded] text-[#8C4FFF] font-bold text-lg">
            Firehose
          </div>
          <div className="space-y-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">
              Amazon Data Firehose Integration
            </h2>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Data delivery streams capture, transform, and continuously load streaming data directly into Amazon S3, Amazon Redshift, Amazon OpenSearch Service, and third-party service providers.
            </p>
            <div className="p-3 bg-white border border-[#eaeded] rounded text-[13px] text-[#545b64]">
              <strong className="text-[#16191f]">Note:</strong> Amazon Data Firehose is tracked in the Integration Backlog and will be fully connected when Amazon Data Firehose is built. You can use your Kinesis data streams directly to ingest and process records with the built-in Data Viewer.
            </div>
            <div className="pt-2">
              <Link
                href="/kinesis/streams"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                className="inline-flex items-center justify-center font-bold text-[13px] px-4 rounded bg-[#ec7211] text-white hover:bg-[#eb5f07] transition-colors"
              >
                Go to Data streams
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
