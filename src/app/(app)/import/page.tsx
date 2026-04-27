"use client";
import { useState } from "react";
import { CheckCircle, Video, FolderOpen, DollarSign, AlertCircle } from "lucide-react";

type ImportResult = {
  imported: number;
  campaignsCreated: number;
  finance: { totalIncome: number; totalExpense: number };
  errors?: string[];
  debug?: {
    sheetsFound: string[];
    accountRows: number;
    videoRows: number;
    financeRows: number;
  };
};

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
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setLoading(true);
    setResult(null);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await fetch("/api/import", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
      } else {
        setResult({
          imported: 0,
          campaignsCreated: 0,
          finance: { totalIncome: 0, totalExpense: 0 },
          errors: [data.error],
        });
      }
    } catch (err) {
      setResult({
        imported: 0,
        campaignsCreated: 0,
        finance: { totalIncome: 0, totalExpense: 0 },
        errors: [`Upload failed: ${err}`],
      });
    }
    setLoading(false);
  }

  const hasErrors = result && result.errors && result.errors.length > 0;

  return (
    <div className="p-6 space-y-6 max-w-2xl">
      <div>
        <h1>Import Spreadsheet</h1>
        <p className="text-[var(--text-muted)] text-[11px] mt-1">
          Upload your UGC_Engine v1.0 xlsx — Video, Account, and Finance data will be imported into the CRM.
        </p>
      </div>

      <form onSubmit={handleUpload} className="card card-pad space-y-4">
        <div>
          <label className="text-[var(--text-muted)] text-[11px] block mb-2">Select .xlsx file</label>
          <input
            type="file"
            accept=".xlsx"
            onChange={(e) => { setFile(e.target.files?.[0] || null); setResult(null); }}
            className="text-[11px]"
          />
        </div>
        <button disabled={!file || loading} type="submit" className="btn btn-primary">
          {loading ? "Importing..." : "Run Import"}
        </button>
      </form>

      {result && !loading && (
        <div className="card card-pad space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle size={16} className="text-[var(--accent)]" />
            <h3>Import Complete</h3>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <StatCard
              icon={Video}
              label="Videos Imported"
              value={result.imported}
              sub={result.debug ? `${result.debug.videoRows} rows read from sheet` : undefined}
              accent
            />
            <StatCard
              icon={FolderOpen}
              label="Campaigns Created"
              value={result.campaignsCreated}
              sub={result.debug ? `${result.debug.accountRows} account rows` : undefined}
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
          <li>Videos — title, file name, campaign, posted date, status</li>
          <li>Campaigns — auto-created from Account sheet</li>
          <li>Finance totals — income, expense from Finance sheet</li>
          <li>Performance data — not in spreadsheet, must be added manually per video</li>
          <li>AI tags — will be generated after 5+ videos have performance data</li>
        </ul>
      </div>
    </div>
  );
}
