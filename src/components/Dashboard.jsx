// src/components/Dashboard.jsx
import { useState, useEffect } from 'react';
import { Plus, Trash2, Eye, Shield, Sun, Moon, Download } from 'lucide-react';
import { Line, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { initialTransactions } from '../data/transactions';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [role, setRole] = useState('admin');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [transactions, setTransactions] = useState(initialTransactions);
  
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    category: 'Food',
    date: new Date().toISOString().split('T')[0],
  });

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'morning';
    if (hour < 17) return 'afternoon';
    return 'evening';
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
      setIsDarkMode(savedTheme === 'dark');
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = Math.abs(
    transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0)
  );

  const currentBalance = totalIncome - totalExpense;

  const filteredTransactions = transactions
    .filter(tx => {
      const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === 'all' || tx.type === filterType;
      return matchesSearch && matchesType;
    })
    .sort((a, b) => new Date(b.date) - new Date(a.date));

  const getSpendingData = () => {
    const categoryMap = {};
    transactions
      .filter(t => t.type === 'expense')
      .forEach(t => {
        const amount = Math.abs(t.amount);
        categoryMap[t.category] = (categoryMap[t.category] || 0) + amount;
      });
    const labels = Object.keys(categoryMap);
    const values = Object.values(categoryMap);
    return {
      labels: labels.length > 0 ? labels : ['No expenses yet'],
      datasets: [{
        data: values.length > 0 ? values : [1],
        backgroundColor: ['#00ff9d', '#22d3ee', '#ec4899', '#a855f7', '#f59e0b', '#8b5cf6'],
        borderColor: isDarkMode ? '#18181b' : '#ffffff',
        borderWidth: 6,
      }]
    };
  };

  const balanceTrendData = {
    labels: ['Oct 25', 'Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26'],
    datasets: [{
      label: 'Balance',
      data: [68200, 89100, 73400, 102500, 97800, currentBalance],
      borderColor: '#00ff9d',
      backgroundColor: 'rgba(0, 255, 157, 0.1)',
      tension: 0.4,
      borderWidth: 3.5,
      pointRadius: 4,
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        grid: { color: isDarkMode ? '#27272a' : '#e5e5e5' },
        ticks: { color: isDarkMode ? '#a1a1aa' : '#525252' }
      },
      x: {
        grid: { color: isDarkMode ? '#27272a' : '#e5e5e5' },
        ticks: { color: isDarkMode ? '#a1a1aa' : '#525252' }
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          color: isDarkMode ? '#d4d4d8' : '#525252',
          padding: 18,
          font: { size: 13 }
        }
      }
    }
  };

  const handleAddTransaction = () => {
    if (!newTransaction.description || !newTransaction.amount) {
      alert("Please enter both description and amount");
      return;
    }
    const amountValue = parseFloat(newTransaction.amount);
    const finalAmount = newTransaction.type === 'income' ? amountValue : -amountValue;
    const newEntry = {
      id: Date.now(),
      date: newTransaction.date,
      description: newTransaction.description,
      amount: finalAmount,
      type: newTransaction.type,
      category: newTransaction.category,
    };
    setTransactions([newEntry, ...transactions]);
    setShowAddModal(false);
    setNewTransaction({
      description: '',
      amount: '',
      type: 'expense',
      category: 'Food',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const handleDelete = (id) => {
    if (role !== 'admin') return;
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const exportCSV = () => {
    const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
    const rows = transactions.map(tx => [
      tx.date,
      `"${tx.description}"`,
      tx.category,
      tx.type,
      tx.amount
    ]);
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `fintrack-transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`min-h-screen transition-colors ${isDarkMode ? 'bg-zinc-950 text-zinc-100' : 'bg-zinc-50 text-zinc-900'}`}>

      {/* Header */}
      <header className={`sticky top-0 z-50 border-b ${isDarkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'}`}>
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-4 md:py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500 rounded-2xl flex items-center justify-center text-white text-2xl">📊</div>
            <div className="font-semibold tracking-tighter text-3xl md:text-4xl">FinTrack</div>
          </div>

          {/* Desktop Tabs */}
          <div className="hidden md:flex border rounded-3xl p-1 bg-zinc-900 border-zinc-700">
            {['overview', 'transactions', 'insights'].map(tab => (
              <button
                key={tab}
                onClick={() => setCurrentTab(tab)}
                className={`px-6 lg:px-8 py-3 rounded-3xl font-medium transition-all ${
                  currentTab === tab
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 md:gap-4">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className={`p-3 rounded-2xl ${isDarkMode ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'}`}
            >
              {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
            </button>

            <div className={`hidden sm:flex border rounded-3xl p-1 text-xs font-medium ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200'}`}>
              <button onClick={() => setRole('viewer')} className={`px-6 py-2 rounded-3xl flex items-center gap-1.5 ${role === 'viewer' ? 'bg-emerald-500 text-white' : ''}`}>
                <Eye size={16} /> Viewer
              </button>
              <button onClick={() => setRole('admin')} className={`px-6 py-2 rounded-3xl flex items-center gap-1.5 ${role === 'admin' ? 'bg-emerald-500 text-white' : ''}`}>
                <Shield size={16} /> Admin
              </button>
            </div>

            <button
              onClick={exportCSV}
              className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium px-5 md:px-6 py-3 rounded-2xl transition-colors"
            >
              <Download size={18} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Mobile Tabs */}
        <div className="md:hidden border-t border-zinc-800 bg-zinc-900 px-4 py-3">
          <select
            value={currentTab}
            onChange={(e) => setCurrentTab(e.target.value)}
            className="w-full bg-zinc-800 border border-zinc-700 rounded-2xl px-4 py-3 text-base"
          >
            <option value="overview">Overview</option>
            <option value="transactions">Transactions</option>
            <option value="insights">Insights</option>
          </select>
        </div>
      </header>

      <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 py-8 md:py-10">

        {/* OVERVIEW */}
        {currentTab === 'overview' && (
          <div className="space-y-10">
            <div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight">
                Good {getGreeting()}
              </h1>
              <p className="text-emerald-500 mt-2 text-lg flex items-center gap-2">
                {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                <span className="text-zinc-400">•</span>
                <span className="font-medium">{role === 'admin' ? 'Admin' : 'Viewer'} Mode</span>
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
              <div className={`p-6 md:p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-emerald-500/20' : 'bg-white border-emerald-200 shadow'}`}>
                <p className="text-emerald-500 text-sm font-medium">TOTAL BALANCE</p>
                <p className="text-4xl md:text-5xl font-semibold mt-3">₹{currentBalance.toLocaleString('en-IN')}</p>
              </div>
              <div className={`p-6 md:p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-cyan-500/20' : 'bg-white border-cyan-200 shadow'}`}>
                <p className="text-cyan-500 text-sm font-medium">INCOME</p>
                <p className="text-4xl md:text-5xl font-semibold mt-3">₹{totalIncome.toLocaleString('en-IN')}</p>
              </div>
              <div className={`p-6 md:p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-pink-500/20' : 'bg-white border-pink-200 shadow'}`}>
                <p className="text-pink-500 text-sm font-medium">EXPENSES</p>
                <p className="text-4xl md:text-5xl font-semibold mt-3">₹{totalExpense.toLocaleString('en-IN')}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8">
              <div className={`lg:col-span-8 p-6 md:p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200 shadow'}`}>
                <h2 className="text-2xl font-semibold mb-6">Balance Trend • Last 6 Months</h2>
                <div className="h-64 md:h-80 lg:h-96">
                  <Line data={balanceTrendData} options={chartOptions} />
                </div>
              </div>
              <div className={`lg:col-span-4 p-6 md:p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200 shadow'}`}>
                <h2 className="text-2xl font-semibold mb-6">Spending Breakdown</h2>
                <div className="h-64 md:h-80">
                  <Doughnut data={getSpendingData()} options={doughnutOptions} />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TRANSACTIONS - with horizontal scroll on mobile */}
        {currentTab === 'transactions' && (
          <div className="space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
              <h2 className="text-4xl font-semibold">Transactions</h2>
              <div className="flex flex-wrap gap-3 w-full md:w-auto">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={`border rounded-2xl px-5 py-3 w-full md:w-80 outline-none ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'}`}
                />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className={`border rounded-2xl px-5 py-3 ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-300'}`}
                >
                  <option value="all">All</option>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                {role === 'admin' && (
                  <button
                    onClick={() => setShowAddModal(true)}
                    className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-3 rounded-2xl font-medium"
                  >
                    <Plus size={20} /> Add Transaction
                  </button>
                )}
              </div>
            </div>

            <div className={`border rounded-3xl overflow-hidden ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200 shadow'} overflow-x-auto`}>
              <table className="w-full min-w-[650px]">
                {/* Table content same as your original */}
                <thead className={isDarkMode ? 'bg-zinc-950' : 'bg-zinc-100'}>
                  <tr>
                    <th className="text-left px-6 md:px-8 py-5 font-medium">Date</th>
                    <th className="text-left px-6 md:px-8 py-5 font-medium">Description</th>
                    <th className="text-left px-6 md:px-8 py-5 font-medium">Category</th>
                    <th className="text-right px-6 md:px-8 py-5 font-medium">Amount</th>
                    {role === 'admin' && <th className="w-16"></th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredTransactions.map(tx => (
                    <tr key={tx.id} className={`border-t ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-800/70' : 'border-zinc-200 hover:bg-zinc-50'}`}>
                      <td className="px-6 md:px-8 py-5 font-mono text-sm">{new Date(tx.date).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 md:px-8 py-5">{tx.description}</td>
                      <td className="px-6 md:px-8 py-5">
                        <span className={`px-4 py-1 text-xs font-medium rounded-full ${tx.type === 'income' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300' : 'bg-pink-100 text-pink-700 dark:bg-pink-900 dark:text-pink-300'}`}>
                          {tx.category}
                        </span>
                      </td>
                      <td className={`px-6 md:px-8 py-5 text-right font-semibold ${tx.type === 'income' ? 'text-emerald-500' : 'text-pink-500'}`}>
                        {tx.type === 'income' ? '+' : ''}₹{Math.abs(tx.amount).toLocaleString('en-IN')}
                      </td>
                      {role === 'admin' && (
                        <td className="px-4">
                          <button onClick={() => handleDelete(tx.id)} className="text-red-400 hover:text-red-500 p-2">
                            <Trash2 size={18} />
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* INSIGHTS */}
        {currentTab === 'insights' && (
          <div>
            <h2 className="text-4xl font-semibold mb-10">Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200 shadow'}`}>
                <p className="text-pink-500">Highest Spending</p>
                <p className="text-5xl font-bold mt-6">Housing</p>
                <p className="text-6xl font-bold text-pink-500 mt-2">₹22,000</p>
              </div>
              <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200 shadow'}`}>
                <p className="text-emerald-500">Income Growth</p>
                <p className="text-6xl font-bold mt-8">+22%</p>
              </div>
              <div className={`p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-zinc-700' : 'bg-white border-zinc-200 shadow'}`}>
                <p className="text-emerald-500">Smart Tip</p>
                <p className="mt-6">Your food spending has decreased by 18% this month.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Transaction Modal - unchanged */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-[100] p-4">
          <div className={`w-full max-w-md p-8 rounded-3xl border ${isDarkMode ? 'bg-zinc-900 border-emerald-400/30' : 'bg-white border-emerald-200 shadow-xl'}`}>
            <h3 className="text-2xl font-semibold mb-8">Add New Transaction</h3>
            {/* ... rest of modal same as your original ... */}
            <div className="space-y-6">
              <input type="text" placeholder="Description" value={newTransaction.description} onChange={(e) => setNewTransaction({ ...newTransaction, description: e.target.value })} className={`w-full px-5 py-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300'}`} />
              <div className="grid grid-cols-2 gap-4">
                <select value={newTransaction.type} onChange={(e) => setNewTransaction({ ...newTransaction, type: e.target.value })} className={`px-5 py-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300'}`}>
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                </select>
                <input type="number" placeholder="Amount ₹" value={newTransaction.amount} onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })} className={`px-5 py-4 rounded-2xl border outline-none ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300'}`} />
              </div>
              <select value={newTransaction.category} onChange={(e) => setNewTransaction({ ...newTransaction, category: e.target.value })} className={`w-full px-5 py-4 rounded-2xl border ${isDarkMode ? 'bg-zinc-800 border-zinc-700' : 'bg-white border-zinc-300'}`}>
                {['Salary', 'Freelance', 'Food', 'Transport', 'Housing', 'Entertainment', 'Utilities'].map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-4 mt-10">
              <button onClick={() => setShowAddModal(false)} className={`flex-1 py-4 rounded-2xl border font-medium ${isDarkMode ? 'border-zinc-700 hover:bg-zinc-800' : 'border-zinc-300 hover:bg-zinc-100'}`}>Cancel</button>
              <button onClick={handleAddTransaction} className="flex-1 bg-emerald-500 text-white py-4 rounded-2xl font-medium hover:bg-emerald-600">Add Transaction</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}