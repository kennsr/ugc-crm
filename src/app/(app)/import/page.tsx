"use client";
import { useState } from "react";
import { CheckCircle, Video, FolderOpen, User, DollarSign, AlertCircle } from "lucide-react";
import { useImport } from "@/lib/queries/import";

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent = false,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border ${
        accent
          ? "border-[var(--accent)]/30 bg-[var(--accent)]/5"
          : "border-[var(--border)] bg-[var(--bg-secondary)]"
      }`}
    >
      <div
        className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center ${
          accent ? "bg-[var(--accent)]/15" : "bg-[var(--bg-tertiary)]"
        }`}
      >
        <Icon size={18} className={accent ? "text-[var(--accent)]" : "text-[var(--text-muted)]"} />
      </div>
      <div>
        <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wide leading-none mb-1">
          {label}
        </p>
        <p className={`text-base font-semibold leading-none ${accent ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
          {value}
        </p>
        {sub && <p className="text-[10px] text-[var(--text-muted)] mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function ErrorList({ errors }: { errors: string[] }) {
  return (
    <div className="mt-3 p-3 rounded-lg border border-[var(--danger)]/30 bg-[var(--danger)]/5">
      <div className="flex items-center gap-2 mb-2">
        <AlertCircle size={14} className="text-[var(--danger)]" />
        <p className="text-[11px] font-semibold text-[var(--danger)]">{errors.length} import error{errors.length !== 1 ? "s" : ""}</p>
      </div>
      <ul className="space-y-1">
        {errors.map((e, i) => (
          <li key={i} className="text-[10px] text-[var(--text-muted)] pl-5">
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<{
    imported: number;
    campaignsCreated: number;
    accountsCreated: number;
    finance: { totalIncome: number; totalExpense: number };
    errors?: string[];
    debug?: { sheetsFound: string[]; accountRows: number; videoRows: number; financeRows: number };
  } | null>(null);

  const importMutation = useImport();

  function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setResult(null);
    importMutation.mutate(file, {
      onSuccess: (data) => setResult(data),
      onError: (err: Error) => setResult({
        imported: 0,
        campaignsCreated: 0,
        accountsCreated: 0,
        finance: { totalIncome: 0, totalExpense: 0 },
        errors: [err.message],
      }),
    });
  }

  const hasErrors = result && result.errors && result.errors.length > 0;
  const isLoading = importMutation.isPending;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1>Import / Export</h1>
          <p className="text-[var(--text-muted)] text-[11px] mt-1">
            Upload a spreadsheet to import data, or export your CRM data as an xlsx file.
          </p>
        </div>
        <a href="/api/import/export" className="btn btn-secondary text-[11px]">Export Data</a>
      </div>

      <form onSubmit={handleUpload} className="card card-pad space-y-4">
        <div>
          <label className="text-[var(--text-muted)] text-[11px] block mb-2">Upload .xlsx file</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }}
            className="text-[11px]"
          />
        </div>
        <div className="flex items-center gap-3">
          <button disabled={!file || isLoading} type="submit" className="btn btn-primary">
            {isLoading ? "Importing..." : "Run Import"}
          </button>
          <a href="/api/import/template" download className="btn btn-ghost text-[var(--text-muted)] text-[11px]">
            Download Template
          </a>
        </div>
      </form>

      {result && !isLoading && (
        <div className="card card-pad space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-[var(--accent)]" />
            <h3>Import Complete</h3>
          </div>

          <div className="grid grid-cols-4 gap-2">
            <StatCard
              icon={Video}
              label="Videos Imported"
              value={result.imported}
              sub={result.debug ? `${result.debug.videoRows} rows read` : undefined}
              accent
            />
            <StatCard
              icon={User}
              label="Accounts Created"
              value={result.accountsCreated}
              sub={result.debug ? `${result.debug.accountRows} account rows` : undefined}
            />
            <StatCard
              icon={FolderOpen}
              label="Campaigns Created"
              value={result.campaignsCreated}
            />
            <StatCard
              icon={DollarSign}
              label="Total Income"
              value={`${result.finance.totalIncome.toLocaleString()} IDR`}
              sub={result.debug ? `${result.debug.financeRows} finance rows` : undefined}
            />
          </div>

          {result.finance.totalExpense > 0 && (
            <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)]">
              <span>Net:</span>
              <span className={result.finance.totalIncome - result.finance.totalExpense >= 0 ? "text-[var(--accent)]" : "text-[var(--danger)]"}>
                {(result.finance.totalIncome - result.finance.totalExpense).toLocaleString()} IDR
              </span>
            </div>
          )}

          {hasErrors && <ErrorList errors={result.errors!} />}
        </div>
      )}

      <div className="card card-pad">
        <h3 className="mb-2">What gets imported</h3>
        <ul className="text-[11px] text-[var(--text-muted)] space-y-1">
          <li><strong>Accounts</strong> — Name, Username, Platform, Campaign, Email, Notes (from <em>Account</em> sheet)</li>
          <li><strong>Campaigns</strong> — auto-created from Account sheet Campaign column</li>
          <li><strong>Videos</strong> — Name, File Name, Campaign, Status, Uploaded At, Earnings, Notes (from <em>Videos</em> sheet)</li>
          <li><strong>Finance totals</strong> — income and expense from Finance sheet</li>
          <li>Performance data — views, likes, etc. must be added manually per video</li>
          <li>AI tags — generated after 5+ videos have performance data</li>
        </ul>
        <p className="text-[10px] text-[var(--text-muted)] mt-3">
          Don&apos;t have a file?{" "}
          <a href="/api/import/template" download className="text-[var(--accent)] underline">
            Download the template
          </a>{" "}
          to get started.
        </p>
      </div>
    </div>
  );
}
