"use client";
import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

type Video = { id: string; title: string; campaign?: { brandName: string }; views: number; earnings: number; platform: string; hookType?: string; niche?: string; status: string };
type Campaign = { id: string; brandName: string; _count?: { videos: number } };

const COLORS = ["#00FF88", "#00BFFF", "#FFD700", "#FF6B6B", "#B388FF", "#FF8A65"];

export default function AnalyticsPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    fetch("/api/videos").then((r) => r.json()).then(setVideos);
    fetch("/api/campaigns").then((r) => r.json()).then(setCampaigns);
  }, []);

  const posted = videos.filter((v) => v.status === "posted" && v.earnings > 0);

  // Campaign earnings chart
  const campaignEarnings = campaigns.map((c) => {
    const cVideos = posted.filter((v) => v.campaign?.brandName === c.brandName);
    const earnings = cVideos.reduce((s, v) => s + v.earnings, 0);
    return { name: c.brandName, earnings };
  }).filter((c) => c.earnings > 0);

  // Platform split
  const platformMap: Record<string, number> = {};
  posted.forEach((v) => {
    platformMap[v.platform] = (platformMap[v.platform] || 0) + v.earnings;
  });
  const platformData = Object.entries(platformMap).map(([name, value]) => ({ name, value }));

  // Hook type analysis
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

  const barColors = ["#00FF88", "#00BFFF", "#FFD700", "#FF6B6B"];

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-bold">Analytics</h1>

      {/* Overview */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#666]">Total Videos Tracked</p>
          <p className="text-2xl font-bold text-white">{videos.length}</p>
        </div>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#666]">Videos with Earnings</p>
          <p className="text-2xl font-bold text-[#00FF88]">{posted.length}</p>
        </div>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#666]">Avg Engagement Rate</p>
          <p className="text-2xl font-bold text-[#FFD700]">{avgEngagement}%</p>
        </div>
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <p className="text-xs text-[#666]">Total Earnings (USD)</p>
          <p className="text-2xl font-bold text-[#00FF88]">${totalEarnings.toFixed(2)}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Campaign Earnings */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <h3 className="text-sm font-bold mb-4">Earnings by Campaign (USD)</h3>
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
            <p className="text-xs text-[#444] py-8 text-center">Add earnings data to videos to see analytics</p>
          )}
        </div>

        {/* Platform Split */}
        <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
          <h3 className="text-sm font-bold mb-4">Earnings by Platform</h3>
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
                    <div className="w-3 h-3 rounded" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-white">{d.name}: ${d.value.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#444] py-8 text-center">No platform data yet</p>
          )}
        </div>
      </div>

      {/* Hook Type Analysis */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
        <h3 className="text-sm font-bold mb-4">Hook Type Performance</h3>
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
          <p className="text-xs text-[#444] py-4">Tag videos with hook types (curiosity, shock, story, educational) to see hook performance analysis. {videos.length > 0 ? "None tagged yet." : "Add videos first."}</p>
        )}
      </div>

      {/* AI Recommendations placeholder */}
      <div className="bg-[#111118] border border-[#1e1e2e] rounded p-4">
        <h3 className="text-sm font-bold mb-2">🤖 AI Recommendations</h3>
        <p className="text-xs text-[#555]">AI-powered recommendations activate after 5+ videos have performance data (views + earnings).</p>
        <div className="mt-3 p-3 bg-[#0a0a0f] rounded text-xs text-[#444] border border-[#1e1e2e]">
          {posted.length < 5
            ? `📊 ${5 - posted.length} more video(s) needed before AI analysis activates. Currently: ${posted.length}/5.`
            : "✅ AI analysis ready. Running analysis..."}
        </div>
      </div>
    </div>
  );
}
