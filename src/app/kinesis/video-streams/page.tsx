import Link from "next/link";

export default function VideoStreamsPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[24px] font-bold text-[#16191f]">Video streams</h1>
          <p className="text-[14px] text-[#545b64] mt-0.5">
            Amazon Kinesis Video Streams makes it easy to securely stream video from connected devices to AWS for analytics, machine learning, and playback.
          </p>
        </div>
      </div>

      <div className="bg-[#f2f3f3] border border-[#d5dbdb] rounded p-6 space-y-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-white rounded border border-[#eaeded] text-[#8C4FFF] font-bold text-lg">
            Video
          </div>
          <div className="space-y-2">
            <h2 className="text-[16px] font-bold text-[#16191f]">
              Amazon Kinesis Video Streams
            </h2>
            <p className="text-[13px] text-[#545b64] leading-relaxed">
              Kinesis Video Streams automatically provisions and elastically scales all the infrastructure needed to ingest streaming video data from millions of devices, securely store video data, and provide real-time and on-demand APIs to access your data.
            </p>
            <div className="p-3 bg-white border border-[#eaeded] rounded text-[13px] text-[#545b64]">
              <strong className="text-[#16191f]">Note:</strong> Amazon Kinesis Video Streams operates on media payloads (WebRTC / HLS / MPEG-DASH) and is independent from standard Kinesis Data Streams.
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
