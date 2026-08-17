import React, { useState } from 'react';
import { BarChart2, Download, Calendar, Filter, FileText } from 'lucide-react';
import Navbar from '../../components/Navbar';
import Sidebar from '../../components/Sidebar';
import { NoiseTimeChart, ViolationsBarChart } from '../../components/NoiseChart';
import { HISTORICAL_NOISE_HOURLY } from '../../data/mockData';

const Reports = () => {
  const [timeframe, setTimeframe] = useState('7days');

  const chartData = HISTORICAL_NOISE_HOURLY.map(h => ({
    time: h.time,
    measured: h.avgNoise,
    violations: h.violations
  }));

  const handleExportCSV = () => {
    alert("Simulating export of official municipal noise audit CSV report...");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Navbar mode="police" />

      <div className="flex flex-1">
        <Sidebar />

        <main className="flex-1 p-6 md:p-8 space-y-6 max-w-7xl mx-auto w-full overflow-x-hidden">
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h1 className="text-3xl font-extrabold text-white">Compliance Analytics & Audit Reports</h1>
              <p className="text-xs text-slate-400">Statistical breakdown of noise violations, festival compliance trends, and official export records.</p>
            </div>

            <button
              onClick={handleExportCSV}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            >
              <Download className="w-4 h-4" /> Export Official CSV Report
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-base text-white">Cumulative Acoustic Telemetry</h3>
              <NoiseTimeChart data={chartData} permittedThreshold={75} height={280} />
            </div>

            <div className="glass-panel p-6 rounded-3xl border border-slate-800 space-y-4">
              <h3 className="font-extrabold text-base text-white">Sustained Violation Frequency</h3>
              <ViolationsBarChart data={chartData} height={280} />
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default Reports;
