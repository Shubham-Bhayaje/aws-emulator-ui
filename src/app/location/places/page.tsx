"use client";

import Link from "next/link";
import { useState } from "react";

export default function PlacesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);

  return (
    <div className="space-y-4">
      {/* Breadcrumb */}
      <div className="flex items-center text-[12px] text-[#545b64]">
        <Link href="/location" className="hover:underline">
          Amazon Location Service
        </Link>
        <span className="mx-1 text-[#879596]">/</span>
        <span className="text-[#16191f] font-medium">Place indexes</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#eaeded]">
        <div>
          <h1 className="text-[20px] font-bold text-[#16191f]">Place indexes (0)</h1>
          <p className="text-[13px] text-[#545b64] mt-0.5">
            Geocode addresses into geographic coordinates, reverse geocode coordinates, and search for points of interest (POI).
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-1.5 text-[13px] font-bold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded inline-flex items-center justify-center transition-colors shadow-sm"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create place index
          </button>
        </div>
      </div>

      {/* Emulator Information Banner */}
      <div className="bg-[#f2f8fd] border border-[#a4cbe8] rounded p-4 text-[13px] text-[#545b64] space-y-1">
        <div className="font-bold text-[#16191f]">Emulator Compatibility Notice</div>
        <p>
          The local AWS Emulator has not yet implemented Place Index APIs (operation <code>CreatePlaceIndex</code> and <code>SearchPlaceIndexForText</code> are scaffolded). This interface provides the real AWS Console layout for Place Indexes and will automatically connect when the emulator adds place search backend support.
        </p>
      </div>

      {/* Empty State Table */}
      <div className="border border-[#eaeded] rounded bg-white overflow-hidden shadow-sm">
        <table className="w-full text-left text-[13px]">
          <thead className="bg-[#fafafa] border-b border-[#eaeded] text-[#545b64] font-medium">
            <tr>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Name</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Data provider</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Pricing plan</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Intended use</th>
              <th className="py-2.5 px-4 font-semibold text-[#16191f]">Created at</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={5} className="py-12 text-center text-[#545b64]">
                <div className="max-w-md mx-auto space-y-2">
                  <div className="font-bold text-[#16191f]">No place indexes found</div>
                  <p className="text-[12px]">
                    Create a place index to search addresses, landmarks, and coordinates using data from Esri or HERE.
                  </p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Create Modal Showing Emulator Scaffolded Message */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded border border-[#d5dbdb] shadow-xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">Create place index</h3>
            <div className="p-3 bg-[#fff8e6] border border-[#fed688] rounded text-[12px] text-[#b35900]">
              Operation <strong>CreatePlaceIndex</strong> is scaffolded in this emulator version. Place search endpoints will be enabled in a future emulator update.
            </div>
            <p className="text-[13px] text-[#545b64]">
              In production AWS, creating a place index allows your application to query address autocompletions and reverse-lookup coordinates using Esri or HERE geospatial datasets.
            </p>
            <div className="flex justify-end pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-1.5 text-[13px] font-medium text-[#16191f] border border-[#d5dbdb] rounded hover:bg-[#fafafa]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
