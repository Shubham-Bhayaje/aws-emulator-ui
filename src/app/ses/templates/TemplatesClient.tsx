"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  SESTemplateSummary,
  SESTemplateDetails,
  createTemplateAction,
  deleteTemplateAction,
  getTemplateAction,
} from "../actions";
import SendTestEmailModal from "../components/SendTestEmailModal";

interface TemplatesClientProps {
  initialTemplates: SESTemplateSummary[];
}

export default function TemplatesClient({ initialTemplates }: TemplatesClientProps) {
  const router = useRouter();
  const [templates, setTemplates] = useState<SESTemplateSummary[]>(initialTemplates);
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  // Preview Modal
  const [previewTemplate, setPreviewTemplate] = useState<SESTemplateDetails | null>(null);
  const [previewTab, setPreviewTab] = useState<"html" | "text" | "rendered">("rendered");
  const [previewLoading, setPreviewLoading] = useState(false);

  // Create Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newSubjectPart, setNewSubjectPart] = useState("");
  const [newHtmlPart, setNewHtmlPart] = useState("<h1>Hello {{name}},</h1>\n<p>Thank you for signing up!</p>");
  const [newTextPart, setNewTextPart] = useState("Hello {{name}},\nThank you for signing up!");
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete Modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Send Test Email Modal
  const [isTestEmailOpen, setIsTestEmailOpen] = useState(false);
  const [testEmailData, setTestEmailData] = useState<{ subject: string; html: string; text: string }>({
    subject: "",
    html: "",
    text: "",
  });

  const filtered = templates.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenPreview = async (name: string) => {
    setPreviewLoading(true);
    const res = await getTemplateAction(name);
    setPreviewLoading(false);
    if (res.success && res.template) {
      setPreviewTemplate(res.template);
      setPreviewTab("rendered");
    }
  };

  const handleOpenTestEmail = async (name: string) => {
    const res = await getTemplateAction(name);
    if (res.success && res.template) {
      setTestEmailData({
        subject: res.template.subjectPart,
        html: res.template.htmlPart || "",
        text: res.template.textPart || "",
      });
      setIsTestEmailOpen(true);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreateLoading(true);
    setCreateError(null);

    const res = await createTemplateAction({
      name: newTemplateName.trim(),
      subjectPart: newSubjectPart.trim(),
      htmlPart: newHtmlPart.trim() || undefined,
      textPart: newTextPart.trim() || undefined,
    });

    setCreateLoading(false);
    if (res.success) {
      setIsCreateModalOpen(false);
      setNewTemplateName("");
      setNewSubjectPart("");
      router.refresh();
      const updated = await import("../actions").then((a) => a.listTemplatesAction());
      if (updated.success) setTemplates(updated.templates);
    } else {
      setCreateError(res.error || "Failed to create email template.");
    }
  };

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;
    if (deleteConfirmText.toLowerCase() !== "delete") {
      setDeleteError('Please type "delete" to confirm.');
      return;
    }

    setDeleteLoading(true);
    setDeleteError(null);

    const res = await deleteTemplateAction(selectedTemplate);
    setDeleteLoading(false);

    if (res.success) {
      setTemplates((prev) => prev.filter((t) => t.name !== selectedTemplate));
      setSelectedTemplate(null);
      setIsDeleteModalOpen(false);
      setDeleteConfirmText("");
      router.refresh();
    } else {
      setDeleteError(res.error || "Failed to delete template.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-bold text-[#16191f]">Email templates</h1>
          <p className="text-[13px] text-[#545b64]">
            Create reusable HTML and text email templates with replacement tags for personalized transactional messaging.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => selectedTemplate && handleOpenTestEmail(selectedTemplate)}
            disabled={!selectedTemplate}
            className="px-3 text-[13px] font-medium text-[#16191f] bg-white border border-[#aab7b8] rounded hover:bg-[#fafafa] disabled:opacity-50"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Send test email
          </button>
          <button
            onClick={() => {
              setDeleteConfirmText("");
              setDeleteError(null);
              setIsDeleteModalOpen(true);
            }}
            disabled={!selectedTemplate}
            className="px-3 text-[13px] font-medium text-[#d13212] bg-white border border-[#d13212] rounded hover:bg-[#fdf2f2] disabled:opacity-50"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Delete
          </button>
          <button
            onClick={() => {
              setCreateError(null);
              setIsCreateModalOpen(true);
            }}
            className="px-4 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] rounded"
            style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
          >
            Create template
          </button>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="p-3 bg-white border border-[#eaeded] rounded-t-md">
        <div className="w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search templates"
            className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px] bg-white placeholder-[#879596]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border-x border-b border-[#eaeded] rounded-b-md shadow-sm overflow-x-auto">
        <table className="w-full text-left text-[13px] text-[#16191f] border-collapse">
          <thead>
            <tr className="border-b border-[#eaeded] bg-[#fafafa] text-[#545b64] text-[12px]">
              <th className="py-2.5 px-3 w-8"></th>
              <th className="py-2.5 px-3 font-semibold">Template name</th>
              <th className="py-2.5 px-3 font-semibold">Created</th>
              <th className="py-2.5 px-3 font-semibold w-24 text-center">Preview</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-8 text-center text-[#545b64]">
                  {templates.length === 0 ? (
                    <div className="space-y-2">
                      <p>No email templates found in your Amazon SES account.</p>
                      <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="inline-block px-3 py-1 text-[12px] font-semibold text-white bg-[#ec7211] rounded"
                      >
                        Create template
                      </button>
                    </div>
                  ) : (
                    "No templates match the search query."
                  )}
                </td>
              </tr>
            ) : (
              filtered.map((item) => {
                const isSelected = selectedTemplate === item.name;

                return (
                  <tr
                    key={item.name}
                    onClick={() => setSelectedTemplate(item.name)}
                    className={`border-b border-[#eaeded] cursor-pointer transition-colors ${
                      isSelected ? "bg-[#f2f8fd]" : "hover:bg-[#fafafa]"
                    }`}
                  >
                    <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="radio"
                        name="templateSelection"
                        checked={isSelected}
                        onChange={() => setSelectedTemplate(item.name)}
                        className="accent-[#ec7211]"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-medium text-[#16191f]">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-3 text-[#545b64]">
                      {item.createdTimestamp
                        ? new Date(item.createdTimestamp).toLocaleString()
                        : "Unknown"}
                    </td>
                    <td className="py-2.5 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => handleOpenPreview(item.name)}
                        className="text-[12px] text-[#0972d3] hover:underline font-medium"
                      >
                        Preview
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Preview Modal */}
      {previewTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
              <div>
                <h3 className="text-[16px] font-bold text-[#16191f]">
                  Preview: {previewTemplate.name}
                </h3>
                <p className="text-[12px] text-[#545b64]">
                  Subject: <span className="font-semibold text-[#16191f]">{previewTemplate.subjectPart}</span>
                </p>
              </div>
              <button
                onClick={() => setPreviewTemplate(null)}
                className="text-[#545b64] text-[18px] font-bold p-1"
              >
                ×
              </button>
            </div>

            <div className="border-b border-[#eaeded] px-6 flex gap-4 text-[13px] bg-white">
              <button
                onClick={() => setPreviewTab("rendered")}
                className={`py-2 font-medium border-b-2 ${
                  previewTab === "rendered"
                    ? "border-b-[#ec7211] text-[#ec7211]"
                    : "border-b-transparent text-[#545b64]"
                }`}
              >
                HTML Rendered
              </button>
              <button
                onClick={() => setPreviewTab("html")}
                className={`py-2 font-medium border-b-2 ${
                  previewTab === "html"
                    ? "border-b-[#ec7211] text-[#ec7211]"
                    : "border-b-transparent text-[#545b64]"
                }`}
              >
                HTML Source
              </button>
              <button
                onClick={() => setPreviewTab("text")}
                className={`py-2 font-medium border-b-2 ${
                  previewTab === "text"
                    ? "border-b-[#ec7211] text-[#ec7211]"
                    : "border-b-transparent text-[#545b64]"
                }`}
              >
                Plain text
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              {previewTab === "rendered" && (
                <div className="p-4 border border-[#d5dbdb] rounded bg-white min-h-[200px]">
                  {previewTemplate.htmlPart ? (
                    <div dangerouslySetInnerHTML={{ __html: previewTemplate.htmlPart }} />
                  ) : (
                    <pre className="font-mono text-[12px] whitespace-pre-wrap text-[#545b64]">
                      {previewTemplate.textPart || "No content."}
                    </pre>
                  )}
                </div>
              )}

              {previewTab === "html" && (
                <pre className="p-3 bg-[#fafafa] border border-[#eaeded] rounded text-[12px] font-mono whitespace-pre-wrap overflow-x-auto text-[#16191f]">
                  {previewTemplate.htmlPart || "No HTML content specified."}
                </pre>
              )}

              {previewTab === "text" && (
                <pre className="p-3 bg-[#fafafa] border border-[#eaeded] rounded text-[12px] font-mono whitespace-pre-wrap overflow-x-auto text-[#16191f]">
                  {previewTemplate.textPart || "No plain text content specified."}
                </pre>
              )}
            </div>

            <div className="px-6 py-3 border-t border-[#eaeded] bg-[#fafafa] flex justify-end">
              <button
                onClick={() => setPreviewTemplate(null)}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Template Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-[#eaeded] flex items-center justify-between bg-[#fafafa]">
              <h3 className="text-[16px] font-bold text-[#16191f]">Create email template</h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-[#545b64] text-[18px] font-bold p-1"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateTemplate} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 space-y-4 overflow-y-auto flex-1 text-[13px]">
                {createError && (
                  <div className="p-2 bg-[#fdf2f2] border-l-4 border-l-[#d13212] text-[#d13212] text-[12px] rounded">
                    {createError}
                  </div>
                )}

                <div>
                  <label className="block font-semibold mb-1">
                    Template name <span className="text-[#d13212]">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="e.g. WelcomeTemplate"
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded"
                    required
                  />
                  <p className="text-[11px] text-[#545b64] mt-1">
                    Can contain up to 64 letters, numbers, hyphens, and underscores.
                  </p>
                </div>

                <div>
                  <label className="block font-semibold mb-1">
                    Subject line <span className="text-[#d13212]">*</span>
                  </label>
                  <input
                    type="text"
                    value={newSubjectPart}
                    onChange={(e) => setNewSubjectPart(e.target.value)}
                    placeholder="e.g. Welcome to {{appName}}, {{name}}!"
                    className="w-full px-3 py-1.5 border border-[#aab7b8] rounded"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">HTML content</label>
                  <textarea
                    rows={5}
                    value={newHtmlPart}
                    onChange={(e) => setNewHtmlPart(e.target.value)}
                    className="w-full px-3 py-2 border border-[#aab7b8] rounded font-mono text-[12px]"
                  />
                </div>

                <div>
                  <label className="block font-semibold mb-1">Plain text content</label>
                  <textarea
                    rows={3}
                    value={newTextPart}
                    onChange={(e) => setNewTextPart(e.target.value)}
                    className="w-full px-3 py-2 border border-[#aab7b8] rounded font-mono text-[12px]"
                  />
                </div>
              </div>

              <div className="px-6 py-3 border-t border-[#eaeded] bg-[#fafafa] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded]"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-5 text-[13px] font-semibold text-white bg-[#ec7211] hover:bg-[#eb5f07] disabled:opacity-50 rounded"
                  style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
                >
                  {createLoading ? "Saving..." : "Create template"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedTemplate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-md shadow-2xl border border-[#d5dbdb] w-full max-w-md p-6 space-y-4">
            <h3 className="text-[16px] font-bold text-[#16191f]">
              Delete template: {selectedTemplate}?
            </h3>
            <p className="text-[13px] text-[#545b64]">
              Emails currently referencing this template via SendTemplatedEmail will fail.
            </p>
            {deleteError && (
              <div className="p-2 bg-[#fdf2f2] border-l-4 border-l-[#d13212] text-[#d13212] text-[12px] rounded">
                {deleteError}
              </div>
            )}
            <div className="space-y-1">
              <label className="text-[12px] font-semibold text-[#16191f]">
                To confirm deletion, type <span className="font-bold text-[#d13212]">delete</span> below:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="delete"
                className="w-full px-3 py-1.5 border border-[#aab7b8] rounded text-[13px]"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2 border-t border-[#eaeded]">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 text-[13px] font-medium text-[#16191f] border border-[#aab7b8] rounded hover:bg-[#eaeded]"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteTemplate}
                disabled={deleteLoading || deleteConfirmText.toLowerCase() !== "delete"}
                className="px-4 text-[13px] font-semibold text-white bg-[#d13212] hover:bg-[#ba2d0f] disabled:opacity-50 rounded"
                style={{ height: "32px", minHeight: "32px", maxHeight: "32px", whiteSpace: "nowrap" }}
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Send Test Email Modal */}
      <SendTestEmailModal
        isOpen={isTestEmailOpen}
        onClose={() => setIsTestEmailOpen(false)}
        defaultSubject={testEmailData.subject}
        defaultBodyHtml={testEmailData.html}
        defaultBodyText={testEmailData.text}
      />
    </div>
  );
}
