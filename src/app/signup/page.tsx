export default function SignupPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0a0a0f]">
      <div className="w-full max-w-sm p-6 text-center">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#00FF88]">GENOS UGC</h1>
          <p className="text-xs text-[#666] mt-1">Creator Intelligence Platform</p>
        </div>

        <div className="p-4 bg-[#111118] border border-[#1e1e2e] rounded">
          <p className="text-sm text-white font-bold mb-2">Signups Currently Closed</p>
          <p className="text-xs text-[#666] mb-4">
            Account creation is disabled while we finalize our infrastructure.
            Contact the admin to get access.
          </p>
          <p className="text-xs text-[#444]">
            Email: <span className="text-[#00FF88]">kennardfx@gmail.com</span>
          </p>
        </div>

        <div className="mt-6">
          <a href="/login" className="text-xs text-[#555] hover:text-[#00FF88] transition-colors">
            ← Back to Sign In
          </a>
        </div>
      </div>
    </div>
  );
}
