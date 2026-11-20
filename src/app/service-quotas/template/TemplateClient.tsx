"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ServiceQuotaTemplateItem, ServiceInfo } from "../types";
import {
  associateTemplateAction,
  disassociateTemplateAction,
  addQuotaToTemplateAction,
  deleteQuotaFromTemplateAction,
  fetchServiceQuotas,
} from "../actions";

interface TemplateClientProps {
  initialAssociated: boolean;
  initialTemplateQuotas: ServiceQuotaTemplateItem[];
  services: ServiceInfo[];
}

export default function TemplateClient({
  initialAssociated,
  initialTemplateQuotas,
  services,
}: TemplateClientProps) {
  const router = useRouter();
  const [associated, setAssociated] = useState(initialAssociated);
  const [templateQuotas, setTemplateQuotas] = useState<ServiceQuotaTemplateItem[]>(initialTemplateQuotas);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  // Toggling association
  const [isTogglingAssociation, setIsTogglingAssociation] = useState(false);

  // Add Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedServiceCode, setSelectedServiceCode] = useState(services[0]?.serviceCode || "ec2");
  const [serviceQuotasList, setServiceQuotasList] = useState<Array<{ quotaCode: string; quotaName: string; value: number }>>([]);
  const [selectedQuotaCode, setSelectedQuotaCode] = useState("");
  const [region, setRegion] = useState("us-east-1");
  const [desiredValue, setDesiredValue] = useState("");
  const [modalLoadingQuotas, setModalLoadingQuotas] = useState(false);
  const [addError, setAddError] = useState("");
  const [isSubmittingAdd, setIsSubmittingAdd] = useState(false);

  // Delete Dialog
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Banner
  const [banner, setBanner] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Handle Association Toggle
  const handleToggleAssociation = async () => {
    setIsTogglingAssociation(true);
    setBanner(null);
    try {
      if (associated) {
        const res = await disassociateTemplateAction();
        if (res.success) {
          setAssociated(false);
          setBanner({
            type: "success",
            message: "Successfully disassociated the quota request template.",
          });
        } else {
          setBanner({ type: "error", message: res.error || "Failed to disassociate template." });
        }
      } else {
        const res = await associateTemplateAction();
        if (res.success) {
          setAssociated(true);
          setBanner({
            type: "success",
            message: "Successfully associated the quota request template with your organization.",
          });
        } else {
          setBanner({ type: "error", message: res.error || "Failed to associate template." });
        }
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An unexpected error occurred." });
    } finally {
      setIsTogglingAssociation(false);
    }
  };

  // Open Add Modal and load quotas for selected service
  const handleOpenAddModal = async () => {
    setShowAddModal(true);
    setAddError("");
    const initialCode = selectedServiceCode || "ec2";
    await loadQuotasForService(initialCode);
  };

  const loadQuotasForService = async (code: string) => {
    setModalLoadingQuotas(true);
    try {
      const res = await fetchServiceQuotas(code);
      if (res.success && res.data.length > 0) {
        setServiceQuotasList(res.data.map((q) => ({ quotaCode: q.quotaCode, quotaName: q.quotaName, value: q.value })));
        setSelectedQuotaCode(res.data[0].quotaCode);
        setDesiredValue(String(res.data[0].value + 5));
      } else {
        setServiceQuotasList([]);
        setSelectedQuotaCode("");
        setDesiredValue("");
      }
    } catch {
      setServiceQuotasList([]);
    } finally {
      setModalLoadingQuotas(false);
    }
  };

  const handleServiceChange = async (code: string) => {
    setSelectedServiceCode(code);
    await loadQuotasForService(code);
  };

  // Submit Add to Template
  const handleSubmitAdd = async () => {
    if (!selectedQuotaCode) {
      setAddError("Please select a quota.");
      return;
    }
    const val = parseFloat(desiredValue);
    if (isNaN(val) || val <= 0) {
      setAddError("Please enter a valid positive number.");
      return;
    }

    setIsSubmittingAdd(true);
    setAddError("");
    try {
      const res = await addQuotaToTemplateAction(
        selectedServiceCode,
        selectedQuotaCode,
        region,
        val
      );
      if (res.success) {
        const qInfo = serviceQuotasList.find((q) => q.quotaCode === selectedQuotaCode);
        const sInfo = services.find((s) => s.serviceCode === selectedServiceCode);
        const newItem: ServiceQuotaTemplateItem = {
          serviceCode: selectedServiceCode,
          serviceName: sInfo?.serviceName || selectedServiceCode,
          quotaCode: selectedQuotaCode,
          quotaName: qInfo?.quotaName || selectedQuotaCode,
          desiredValue: val,
          awsRegion: region,
        };
        setTemplateQuotas((prev) => [
          ...prev.filter(
            (item) =>
              !(
                item.serviceCode === selectedServiceCode &&
                item.quotaCode === selectedQuotaCode &&
                item.awsRegion === region
              )
          ),
          newItem,
        ]);
        setShowAddModal(false);
        setBanner({
          type: "success",
          message: `Successfully added "${newItem.quotaName}" to the quota request template.`,
        });
      } else {
        setAddError(res.error || "Failed to add quota to template.");
      }
    } catch (e: any) {
      setAddError(e.message || "An unexpected error occurred.");
    } finally {
      setIsSubmittingAdd(false);
    }
  };

  // Handle Delete Selected from Template
  const handleDeleteSelected = async () => {
    if (selectedKeys.length === 0) return;
    setIsDeleting(true);
    setBanner(null);
    try {
      let failed = 0;
      for (const key of selectedKeys) {
        const [sc, qc, reg] = key.split(":::");
        const res = await deleteQuotaFromTemplateAction(sc, qc, reg);
        if (!res.success) failed++;
      }
      if (failed === 0) {
        setTemplateQuotas((prev) =>
          prev.filter((item) => !selectedKeys.includes(`${item.serviceCode}:::${item.quotaCode}:::${item.awsRegion}`))
        );
        setSelectedKeys([]);
        setShowDeleteModal(false);
        setBanner({
          type: "success",
          message: `Successfully deleted ${selectedKeys.length} quota request(s) from the template.`,
        });
      } else {
        setBanner({
          type: "error",
          message: `Failed to delete ${failed} of ${selectedKeys.length} quota requests.`,
        });
      }
    } catch (e: any) {
      setBanner({ type: "error", message: e.message || "An error occurred." });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#16191f]">Quota request template</h1>
        <p className="text-sm text-[#545b64] mt-1">
          A quota request template automatically requests quota increases when new accounts are created in your AWS Organization.
        </p>
      </div>

      {/* Banner */}
      {banner && (
        <div
          className={`p-4 rounded border text-sm flex items-start justify-between ${
            banner.type === "success"
              ? "bg-[#ecf7ed] border-[#a4e7a5] text-[#1d8102]"
              : "bg-[#fdf2f2] border-[#f8b4b4] text-[#d13212]"
          }`}
        >
          <span>{banner.message}</span>
          <button onClick={() => setBanner(null)} className="text-gray-500 hover:text-black font-bold ml-4">
            ✕
          </button>
        </div>
      )}

      {/* Association Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-base font-bold text-[#16191f]">Template association status</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs text-[#545b64]">Current status:</span>
              {associated ? (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#ecf7ed] text-[#1d8102] border border-[#a4e7a5]">
                  Associated
                </span>
              ) : (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-[#f2f3f3] text-[#545b64] border border-[#d5dbdb]">
                  Not associated
                </span>
              )}
            </div>
            <p className="text-xs text-[#545b64] mt-2">
              {associated
                ? "The template is active. Any new account created in your AWS Organization will automatically have these quota increase requests applied."
                : "Associate your quota request template to enable automatic quota increases for new accounts created in your AWS Organization."}
            </p>
          </div>
          <div>
            <button
              onClick={handleToggleAssociation}
              disabled={isTogglingAssociation}
              className={`font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm ${
                associated
                  ? "bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f]"
                  : "bg-[#ec7211] hover:bg-[#eb5f07] text-white"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              {isTogglingAssociation
                ? "Updating..."
                : associated
                ? "Disassociate quota request template"
                : "Associate quota request template"}
            </button>
          </div>
        </div>
      </div>

      {/* Template Requests Table Card */}
      <div className="bg-white border border-[#eaeded] rounded shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-[#16191f]">
              Configured quota requests in template ({templateQuotas.length})
            </h2>
            <p className="text-xs text-[#545b64]">
              These quota increases will be requested for each newly created AWS account in your organization.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowDeleteModal(true)}
              disabled={selectedKeys.length === 0}
              className={`font-bold text-[13px] px-3 rounded-[2px] transition-colors border ${
                selectedKeys.length > 0
                  ? "bg-white border-[#d13212] text-[#d13212] hover:bg-[#fff5f5]"
                  : "bg-[#f2f3f3] border-[#eaeded] text-[#959da5] cursor-not-allowed"
              }`}
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Delete from template
            </button>
            <button
              onClick={handleOpenAddModal}
              className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
              style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
            >
              Add quota to template
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="border border-[#eaeded] rounded overflow-x-auto">
          <table className="w-full text-left text-[13px] text-[#16191f]">
            <thead className="bg-[#fafafa] text-[#545b64] text-[11px] font-bold uppercase border-b border-[#eaeded]">
              <tr>
                <th className="p-3 w-10 text-center">
                  <input
                    type="checkbox"
                    checked={
                      templateQuotas.length > 0 &&
                      selectedKeys.length === templateQuotas.length
                    }
                    onChange={() => {
                      if (selectedKeys.length === templateQuotas.length) {
                        setSelectedKeys([]);
                      } else {
                        setSelectedKeys(
                          templateQuotas.map(
                            (item) => `${item.serviceCode}:::${item.quotaCode}:::${item.awsRegion}`
                          )
                        );
                      }
                    }}
                    className="rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                  />
                </th>
                <th className="p-3">Service Name</th>
                <th className="p-3">Quota Name</th>
                <th className="p-3">AWS Region</th>
                <th className="p-3">Desired Value</th>
                <th className="p-3">Global Quota</th>
                <th className="p-3">Quota Code</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#eaeded]">
              {templateQuotas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-xs text-[#545b64]">
                    <p className="font-semibold text-sm text-[#16191f]">No quota requests in template</p>
                    <p className="text-xs mt-1">
                      Configure quota increases to be automatically requested when new accounts join your organization.
                    </p>
                    <button
                      onClick={handleOpenAddModal}
                      className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm mt-3"
                      style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                    >
                      Add quota to template
                    </button>
                  </td>
                </tr>
              ) : (
                templateQuotas.map((item) => {
                  const key = `${item.serviceCode}:::${item.quotaCode}:::${item.awsRegion}`;
                  const isChecked = selectedKeys.includes(key);
                  return (
                    <tr
                      key={key}
                      className={`hover:bg-[#f9f9f9] transition-colors ${
                        isChecked ? "bg-[#f2f8fd]" : ""
                      }`}
                    >
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {
                            if (isChecked) {
                              setSelectedKeys(selectedKeys.filter((k) => k !== key));
                            } else {
                              setSelectedKeys([...selectedKeys, key]);
                            }
                          }}
                          className="rounded border-[#aab7b8] text-[#0073bb] focus:ring-0"
                        />
                      </td>
                      <td className="p-3 font-medium text-[#16191f]">{item.serviceName}</td>
                      <td className="p-3">
                        <Link
                          href={`/service-quotas/services/${encodeURIComponent(
                            item.serviceCode
                          )}/${encodeURIComponent(item.quotaCode)}`}
                          className="text-[#0073bb] hover:underline"
                        >
                          {item.quotaName}
                        </Link>
                      </td>
                      <td className="p-3 text-xs font-mono text-[#545b64]">{item.awsRegion}</td>
                      <td className="p-3 font-mono font-bold">{item.desiredValue.toLocaleString()}</td>
                      <td className="p-3 text-xs">{item.globalQuota ? "Yes" : "No"}</td>
                      <td className="p-3 font-mono text-xs text-[#545b64]">{item.quotaCode}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Quota to Template Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Add quota to template</h3>
            <p className="text-xs text-[#545b64]">
              Select a service, quota, and desired limit to include in the organization template.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">
                  Service
                </label>
                <select
                  value={selectedServiceCode}
                  onChange={(e) => handleServiceChange(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] bg-white focus:outline-none focus:border-[#0073bb]"
                >
                  {services.map((s) => (
                    <option key={s.serviceCode} value={s.serviceCode}>
                      {s.serviceName} ({s.serviceCode})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">
                  Quota
                </label>
                {modalLoadingQuotas ? (
                  <div className="text-xs text-[#545b64] py-1">Loading quotas...</div>
                ) : serviceQuotasList.length === 0 ? (
                  <div className="text-xs text-[#545b64] py-1">No quotas found for this service.</div>
                ) : (
                  <select
                    value={selectedQuotaCode}
                    onChange={(e) => {
                      setSelectedQuotaCode(e.target.value);
                      const q = serviceQuotasList.find((item) => item.quotaCode === e.target.value);
                      if (q) setDesiredValue(String(q.value + 5));
                    }}
                    className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] bg-white focus:outline-none focus:border-[#0073bb]"
                  >
                    {serviceQuotasList.map((q) => (
                      <option key={q.quotaCode} value={q.quotaCode}>
                        {q.quotaName} (Current: {q.value})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">
                  AWS Region
                </label>
                <select
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full text-[13px] px-3 py-1.5 border border-[#aab7b8] rounded-[2px] bg-white focus:outline-none focus:border-[#0073bb]"
                >
                  <option value="us-east-1">US East (N. Virginia) us-east-1</option>
                  <option value="us-east-2">US East (Ohio) us-east-2</option>
                  <option value="us-west-1">US West (N. California) us-west-1</option>
                  <option value="us-west-2">US West (Oregon) us-west-2</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#16191f] mb-1">
                  Desired value <span className="text-[#d13212]">*</span>
                </label>
                <input
                  type="number"
                  value={desiredValue}
                  onChange={(e) => {
                    setDesiredValue(e.target.value);
                    if (addError) setAddError("");
                  }}
                  className={`w-full text-[13px] px-3 py-1.5 border rounded-[2px] focus:outline-none ${
                    addError ? "border-[#d13212] bg-[#fff5f5]" : "border-[#aab7b8] focus:border-[#0073bb]"
                  }`}
                />
                {addError && <p className="text-xs text-[#d13212] mt-1 font-medium">{addError}</p>}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-[#eaeded]">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                disabled={isSubmittingAdd}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmitAdd}
                disabled={isSubmittingAdd || !selectedQuotaCode}
                className="bg-[#ec7211] hover:bg-[#eb5f07] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors shadow-sm"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isSubmittingAdd ? "Adding..." : "Add to template"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded border border-[#eaeded] shadow-xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[#16191f]">Delete quota request from template?</h3>
            <p className="text-sm text-[#545b64]">
              Are you sure you want to remove {selectedKeys.length} quota request(s) from the organization template?
              New accounts created in your organization will not automatically request these increases.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={isDeleting}
                className="bg-white border border-[#879596] hover:bg-[#f2f3f3] text-[#16191f] font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteSelected}
                disabled={isDeleting}
                className="bg-[#d13212] hover:bg-[#a82a0c] text-white font-bold text-[13px] px-4 rounded-[2px] transition-colors"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
