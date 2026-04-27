"use client";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { useVideos } from "@/lib/queries/videos";
import { useCampaigns } from "@/lib/queries/campaigns";

const COLORS = ["#00FF88", "#00BFFF", "#FFD700", "#FF6B6B", "#B388FF", "#FF8A65"];

export default function AnalyticsPage() {
  const { data: videos = [] } = useVideos();
  const { data: campaigns = [] } = useCampaigns();

  const posted = videos.filter((v) => v.status === "posted" && v.earnings > 0);

  const campaignEarnings = campaigns.map((c) => {
    const cVideos = posted.filter((v) => v.campaign?.brandName === c.brandName);
    const earnings = cVideos.reduce((s, v) => s + v.earnings, 0);
    return { name: c.brandName, earnings };
  }).filter((c) => c.earnings > 0);

  const platformMap: Record<string, number> = {};
  posted.forEach((v) => {
    platformMap[v.platform] = (platformMap[v.platform] || 0) + v.earnings;
  });
  const platformData = Object.entries(platformMap).map(([name, value]) => ({ name, value }));

  const hookMap: Record<string, { views: number; earnings: number; count: number }> = {};
  posted.filter((v) => v.hookType).forEach((v) => {
    if (!hookMap[v.hookType!]) hookMap[v.hookType!] = { views: 0, earnings: 0, count: 0 };
    hookMap[v.hookType!].views += v.views;
    hookMap[v.hookType!].earnings += v.earnings;
    hookMap[v.hookType!].count++;
  });
  const hookData = Object.entries(hookMap).map(([name, d]) => ({
    name: name || "untagged",
    avgViews: Math.round(d.views / d.count),
    avgEarnings: parseFloat((d.earnings / d.count).toFixed(2)),
    count: d.count,
  }));

  const totalViews = posted.reduce((s, v) => s + v.views, 0);
  const totalEarnings = posted.reduce((s, v) => s + v.earnings, 0);
  const totalLikes = posted.reduce((s, v) => s + (v as unknown as Record<string, number>)["likes"], 0);
  const avgEngagement = posted.length > 0 ? ((totalLikes / totalViews) * 100).toFixed(1) : "0";

  return (
    <div className="p-6 space-y-6">
      <h1>Analytics</h1>

      <div className="grid grid-cols-4 gap-4">
        <div className="stat-card">
          <p className="label">Total Videos Tracked</p>
          <p className="value">{videos.length}</p>
        </div>
        <div className="stat-card">
          <p className="label">Videos with Earnings</p>
          <p className="value">{posted.length}</p>
        </div>
        <div className="stat-card">
          <p className="label">Avg Engagement Rate</p>
          <p className="value">{avgEngagement}%</p>
        </div>
        <div className="stat-card">
          <p className="label">Total Earnings (USD)</p>
          <p className="value">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="card card-pad">
          <h3 className="mb-4">Earnings by Campaign (USD)</h3>
          {campaignEarnings.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={campaignEarnings}>
                <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 10 }} />
                <YAxis tick={{ fill: "#888", fontSize: 10 }} />
                <Tooltip contentStyle={{ background: "#111", border: "1px solid #1e1e2e", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
                <Bar dataKey="earnings" fill="#00FF88" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-[var(--text-muted)] py-8 text-center text-[11px]">Add earnings data to videos to see analytics</p>
          )}
        </div>

        <div className="card card-pad">
          <h3 className="mb-4">Earnings by Platform</h3>
          {platformData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={platformData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name }) => name}>
                    {platformData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "#111", border: "1px solid #1e1e2e", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2">
                {platformData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-[11px]">{d.name}: ${d.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-[var(--text-muted)] py-8 text-center text-[11px]">No platform data yet</p>
          )}
        </div>
      </div>

      <div className="card card-pad">
        <h3 className="mb-4">Hook Type Performance</h3>
        {hookData.length > 0 ? (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={hookData}>
              <XAxis dataKey="name" tick={{ fill: "#888", fontSize: 10 }} />
              <YAxis tick={{ fill: "#888", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#111", border: "1px solid #1e1e2e", borderRadius: 8 }} labelStyle={{ color: "#fff" }} />
              <Bar dataKey="avgViews" name="Avg Views" fill="#00BFFF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-[var(--text-muted)] text-[11px]">Tag videos with hook types (curiosity, shock, story, educational) to see hook performance analysis.</p>
        )}
      </div>

      <div className="card card-pad">
        <h3 className="mb-2">AI Recommendations</h3>
        <p className="text-[var(--text-muted)] text-[11px]">AI-powered recommendations activate after 5+ videos have performance data.</p>
        <div className="mt-3 p-3 bg-[var(--bg-tertiary)] rounded text-[11px] text-[var(--text-muted)]">
          {posted.length < 5
            ? `${5 - posted.length} more video(s) needed before AI analysis activates. Currently: ${posted.length}/5.`
            : "AI analysis ready. Running analysis..."}
        </div>
      </div>
    </div>
  );
}
