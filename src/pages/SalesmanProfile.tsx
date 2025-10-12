import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { teamService, TeamUser } from '../services/teamService';

import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

// Reusable detail item component
const DetailItem: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <div className="mb-2">
      <span className="font-semibold text-gray-700 dark:text-gray-300">{label}:</span> <span>{value}</span>
    </div>
  );
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#A64CFF', '#FF4C4C'];

const SalesmanProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { token, user } = useAuth();

  const [profile, setProfile] = useState<TeamUser | null>(null);
  const [leadStages, setLeadStages] = useState<any[]>([]);
  const [quoteStatuses, setQuoteStatuses] = useState<any[]>([]);
  const [invoiceStatuses, setInvoiceStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<'month' | 'last_month' | 'quarter'>('month');

  useEffect(() => {
    if (!token || !id) return;

    setLoading(true);
    setError(null);

    if (user?.type !== 'ADMIN' && user?.id !== id) {
      setError('You are not authorized to view this profile.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const charData = await teamService.getPerformance(id, period, token);
        if (!charData.success) {
          throw new Error('Failed to load data');
        }
        setProfile(charData.user);
        setLeadStages(charData.leadStagesSummary.map((x: any) => ({
          stage: x.stage,
          count: Number(x.count),
          totalAmount: Number(x.totalAmount),
        })));
        setQuoteStatuses(charData.quoteStatusSummary.map((x: any) => ({
          status: x.status,
          count: Number(x.count),
          totalAmount: Number(x.totalAmount),
        })));
        setInvoiceStatuses(charData.invoiceStatusSummary.map((x: any) => ({
          status: x.status,
          count: Number(x.count),
          totalAmount: Number(x.totalAmount),
        })));
      } catch (e) {
        setError((e as Error).message || 'Server error');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id, period, token, user]);

  if (loading) return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 flex items-center justify-center text-lg font-semibold text-gray-600 dark:text-gray-300">
        Loading...
      </main>
    </div>
  );

  if (error) return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1 p-6 flex items-center justify-center text-lg font-semibold text-red-600 dark:text-red-400">
        {error}
      </main>
    </div>
  );

  if (!profile) return null;

  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
      <Sidebar />

      <main className="flex-1 p-8 max-w-7xl mx-auto overflow-y-auto">
        {/* Profile Header */}
        <header className="mb-8">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            {profile.name} - Salesman Profile
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {profile.designation || 'No designation specified'}
          </p>
        </header>

        {/* Personal Information Section */}
        <section className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow mb-8 text-gray-900 dark:text-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
          <DetailItem label="Email" value={profile.email} />
          <DetailItem label="Designation" value={profile.designation} />
          <DetailItem label="Created At" value={new Date(profile.createdAt || '').toLocaleDateString()} />
        </section>

        {/* Period Selector */}
        <section className="mb-8">
          <label htmlFor="period-select" className="block text-gray-700 dark:text-gray-300 font-semibold mb-2">
            Select Data Period
          </label>
          <select
            id="period-select"
            value={period}
            onChange={e => setPeriod(e.target.value as any)}
            className="p-3 border rounded-md shadow focus:outline-none focus:ring-2 focus:ring-sky-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          >
            <option value="month">This Month</option>
            <option value="last_month">Last Month</option>
            <option value="quarter">Last 3 Months</option>
          </select>
        </section>

        {/* Charts grid container */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Leads by Stage Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Leads by Stage (Count)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={leadStages}>
                <XAxis dataKey="stage" stroke="#8884d8" />
                <YAxis stroke="#8884d8" />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#8884d8" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Quotes Amount by Status Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Quotes Amount by Status</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={quoteStatuses}
                  dataKey="totalAmount"
                  nameKey="status"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#82ca9d"
                  label
                >
                  {quoteStatuses.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `$${value.toFixed(2)}`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Paid Invoices Summary Chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Paid Invoices Summary</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={invoiceStatuses}>
                <XAxis dataKey="status" stroke="#FF8042" />
                <YAxis stroke="#FF8042" />
                <Tooltip formatter={(value: number) => `${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="count" fill="#FF8042" name="Count" />
                <Bar dataKey="totalAmount" fill="#FFBB28" name="Total Amount" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </main>
    </div>
  );
};

export default SalesmanProfile;
