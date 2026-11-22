import { listKmsKeysForAppConfigAction } from "../actions";

export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
  const kmsRes = await listKmsKeysForAppConfigAction();
  const keys = kmsRes.keys || [];

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="pb-4 border-b border-[#eaeded]">
        <h1 className="text-[22px] font-bold text-[#16191f]">Account settings</h1>
        <p className="text-[13px] text-[#545b64] mt-1">
          Configure account-level encryption and manage key usage across AWS AppConfig resources.
        </p>
      </div>

      {/* Encryption Settings Card */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f]">Encryption settings</h2>
        <p className="text-[12px] text-[#545b64]">
          By default, AppConfig uses an AWS-owned KMS key to encrypt configurations. You can optionally select a customer managed KMS key.
        </p>

        <div className="space-y-3 pt-2">
          <label className="flex items-center gap-2 text-[13px] cursor-pointer">
            <input type="radio" name="kms-setting" defaultChecked className="text-[#0073bb]" />
            <span className="font-semibold text-[#16191f]">AWS owned key (Default)</span>
          </label>
          <p className="text-[12px] text-[#545b64] pl-6">
            AppConfig owns and manages this key. There is no additional charge for using this key.
          </p>

          <label className="flex items-center gap-2 text-[13px] cursor-pointer pt-2">
            <input type="radio" name="kms-setting" className="text-[#0073bb]" />
            <span className="font-semibold text-[#16191f]">Customer managed key (KMS)</span>
          </label>
          <div className="pl-6 space-y-2">
            <p className="text-[12px] text-[#545b64]">
              Select a customer managed key created in AWS Key Management Service (KMS).
            </p>
            <select className="px-3 py-1.5 text-[13px] border border-[#aab7b8] rounded bg-white w-96 font-mono text-[12px]">
              {keys.length === 0 ? (
                <option value="">No KMS customer managed keys available</option>
              ) : (
                keys.map((k) => (
                  <option key={k.keyId} value={k.keyArn}>
                    {k.keyId} ({k.keyArn.slice(0, 32)}...)
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div className="pt-4 border-t border-[#eaeded] flex justify-end">
          <button
            type="button"
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded flex items-center justify-center transition-colors shadow-xs"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Save settings
          </button>
        </div>
      </div>

      {/* Quotas & Limits */}
      <div className="bg-white border border-[#eaeded] rounded p-6 shadow-xs space-y-4">
        <h2 className="text-[16px] font-bold text-[#16191f]">Service quotas</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[11px] font-semibold uppercase">
                <th className="py-2.5 px-3">Quota name</th>
                <th className="py-2.5 px-3">Default limit</th>
                <th className="py-2.5 px-3">Adjustable</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded] text-[#16191f]">
              <tr>
                <td className="py-2.5 px-3 font-medium">Applications per account</td>
                <td className="py-2.5 px-3">1,000</td>
                <td className="py-2.5 px-3 text-[#1d8102]">Yes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">Environments per application</td>
                <td className="py-2.5 px-3">20</td>
                <td className="py-2.5 px-3 text-[#1d8102]">Yes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">Configuration profiles per application</td>
                <td className="py-2.5 px-3">100</td>
                <td className="py-2.5 px-3 text-[#1d8102]">Yes</td>
              </tr>
              <tr>
                <td className="py-2.5 px-3 font-medium">Maximum configuration payload size</td>
                <td className="py-2.5 px-3">1 MB</td>
                <td className="py-2.5 px-3 text-[#545b64]">No</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
