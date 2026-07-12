import { useEffect, useState } from "react";
import { Download, TrendingUp, BarChart3, Activity } from "lucide-react";
import { apiGet, type ApiError } from "../../lib/api";

import type { AnalyticsData } from "../../lib/types";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [pending, setPending] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    apiGet<AnalyticsData>("/analytics")
      .then(setData)
      .catch((err) => setError((err as ApiError).message))
      .finally(() => setPending(false));
  }, []);

  const handleExportCsv = () => {
    // We can simply set window.location to the CSV endpoint if we don't need auth header in query string, 
    // but we use JWT in headers. So we fetch via standard fetch and trigger download.
    const token = localStorage.getItem("transitops_token");
    fetch("/api/analytics/export.csv", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = "transitops-report.csv";
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => {
        alert("Failed to export CSV");
      });
  };

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">Analytics</h1>
        <button
          onClick={handleExportCsv}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
        >
          <Download className="size-4" /> Export CSV
        </button>
      </div>

      {error && (
        <div className="mt-4 rounded-xl bg-red-50 p-4 text-sm text-red-800">
          {error}
        </div>
      )}

      {pending && (
        <div className="mt-8 text-center text-sm text-mist-500">Loading analytics...</div>
      )}

      {data && (
        <>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-2xl bg-white p-5 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]">
              <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase flex items-center gap-2">
                <TrendingUp className="size-4" /> Avg ROI
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">
                {data.avgVehicleRoiPct !== null ? `${data.avgVehicleRoiPct}%` : "N/A"}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]">
              <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase flex items-center gap-2">
                <Activity className="size-4" /> Fleet Utilization
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">{data.fleetUtilizationPct}%</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]">
              <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase flex items-center gap-2">
                <BarChart3 className="size-4" /> Total Op Cost
              </p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">₹{data.totalOperationalCost.toLocaleString("en-IN")}</p>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]">
              <p className="text-xs font-semibold tracking-wide text-ink-500 uppercase">Fuel Efficiency</p>
              <p className="mt-2 text-3xl font-extrabold tracking-tight">
                {data.fuelEfficiencyKmPerL !== null ? `${data.fuelEfficiencyKmPerL} km/L` : "N/A"}
              </p>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="rounded-2xl bg-white p-6 shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)]">
              <h2 className="text-lg font-bold text-ink-900 mb-6">Revenue Trend (Last 6 Months)</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data.monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#6B7280" }} tickFormatter={(val) => `₹${val/1000}k`} />
                    <Tooltip cursor={{ fill: "#F3F4F6" }} formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl bg-white shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] overflow-hidden">
              <h2 className="px-6 pt-5 pb-3 text-lg font-bold text-ink-900 border-b border-mist-100">Top Costliest Vehicles</h2>
              <table className="w-full text-left text-sm">
                <thead className="bg-mist-50/50">
                  <tr className="text-xs text-ink-500 uppercase tracking-wide">
                    <th className="px-6 py-3 font-semibold">Vehicle</th>
                    <th className="px-6 py-3 font-semibold text-right">Operational Cost</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist-100">
                  {data.costliestVehicles.map(v => (
                    <tr key={v.vehicleId} className="hover:bg-mist-50/50">
                      <td className="px-6 py-4 font-medium text-ink-900">
                        {v.name} <span className="text-xs text-ink-500">({v.registrationNumber})</span>
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-ink-900 text-red-600">
                        ₹{v.operationalCost.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                  {data.costliestVehicles.length === 0 && (
                    <tr>
                      <td colSpan={2} className="px-6 py-8 text-center text-mist-500">No cost data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
          
          <div className="mt-8 rounded-2xl bg-white shadow-[0_12px_40px_-16px_rgba(22,50,60,0.15)] overflow-hidden">
            <h2 className="px-6 pt-5 pb-3 text-lg font-bold text-ink-900 border-b border-mist-100">Vehicle ROI Breakdown</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-mist-50/50">
                  <tr className="text-xs text-ink-500 uppercase tracking-wide">
                    <th className="px-6 py-3 font-semibold">Vehicle</th>
                    <th className="px-6 py-3 font-semibold text-right">Revenue</th>
                    <th className="px-6 py-3 font-semibold text-right">Fuel Cost</th>
                    <th className="px-6 py-3 font-semibold text-right">Maint. Cost</th>
                    <th className="px-6 py-3 font-semibold text-right">Acquisition</th>
                    <th className="px-6 py-3 font-semibold text-right text-indigo-600">ROI %</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-mist-100">
                  {data.vehicleRoi.map(v => (
                    <tr key={v.vehicleId} className="hover:bg-mist-50/50">
                      <td className="px-6 py-4 font-medium text-ink-900">
                        {v.name} <span className="text-xs text-ink-500">({v.registrationNumber})</span>
                      </td>
                      <td className="px-6 py-4 text-right text-ink-700">₹{v.revenue.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-right text-ink-700">₹{v.fuelCost.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-right text-ink-700">₹{v.maintenanceCost.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-right text-ink-700">₹{v.acquisitionCost.toLocaleString("en-IN")}</td>
                      <td className="px-6 py-4 text-right font-bold text-indigo-600">{v.roiPct}%</td>
                    </tr>
                  ))}
                  {data.vehicleRoi.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-mist-500">No ROI data available.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
