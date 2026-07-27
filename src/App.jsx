import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import {
  Wallet,
  TrendingDown,
  PiggyBank,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  LayoutDashboard,
  Receipt,
  PieChart as PieChartIcon,
  Utensils,
  Car,
  ShoppingBag,
  Tv,
  Zap,
  HeartPulse,
  Home,
  Plane,
  GraduationCap,
  MoreHorizontal,
  Calendar,
  AlertCircle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// --- SEEDED CATEGORIES ---
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Food & Dining', color: '#f97316', icon: 'Utensils' },
  { id: 'cat-2', name: 'Transport', color: '#3b82f6', icon: 'Car' },
  { id: 'cat-3', name: 'Shopping', color: '#ec4899', icon: 'ShoppingBag' },
  { id: 'cat-4', name: 'Entertainment', color: '#8b5cf6', icon: 'Tv' },
  { id: 'cat-5', name: 'Utilities', color: '#eab308', icon: 'Zap' },
  { id: 'cat-6', name: 'Healthcare', color: '#ef4444', icon: 'HeartPulse' },
  { id: 'cat-7', name: 'Housing', color: '#78716c', icon: 'Home' },
  { id: 'cat-8', name: 'Travel', color: '#06b6d4', icon: 'Plane' },
  { id: 'cat-9', name: 'Education', color: '#10b981', icon: 'GraduationCap' },
  { id: 'cat-10', name: 'Other', color: '#94a3b8', icon: 'MoreHorizontal' },
];

const ICON_MAP = {
  Utensils, Car, ShoppingBag, Tv, Zap, HeartPulse, Home, Plane, GraduationCap, MoreHorizontal
};

// --- HELPER UTILS ---
const formatCurrency = (val) => `₹${Number(val || 0).toLocaleString('en-IN')}`;

const getMonthKey = (dateStr) => {
  const d = dateStr ? new Date(dateStr) : new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

const getCurrentMonthKey = () => getMonthKey();

const getLast6Months = () => {
  const months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(getMonthKey(d.toISOString()));
  }
  return months;
};

const formatMonthLabel = (monthKey) => {
  if (!monthKey) return '';
  const [year, month] = monthKey.split('-');
  const date = new Date(year, parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};

export default function App() {
  // --- VIEW STATE ---
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard | transactions | budgets

  // --- DATABASE DATA STATES ---
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA FROM SUPABASE ---
  useEffect(() => {
    fetchCloudData();
  }, []);

  const fetchCloudData = async () => {
    setIsLoading(true);

    // Fetch expenses
    const { data: expData, error: expErr } = await supabase
      .from('expenses')
      .select('*')
      .order('expense_date', { ascending: false });
    if (!expErr && expData) setExpenses(expData);

    // Fetch incomes
    const { data: incData, error: incErr } = await supabase
      .from('incomes')
      .select('*')
      .order('income_date', { ascending: false });
    if (!incErr && incData) setIncomes(incData);

    // Fetch budgets
    const { data: bdgData, error: bdgErr } = await supabase
      .from('budgets')
      .select('*');
    if (!bdgErr && bdgData) setBudgets(bdgData);

    setIsLoading(false);
  };

  // --- FILTER STATES ---
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');

  // --- MODAL STATES ---
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddIncomeOpen, setIsAddIncomeOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState(null);

  // Form inputs
  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category_id: DEFAULT_CATEGORIES[0].id,
    description: '',
    expense_date: new Date().toISOString().split('T')[0]
  });

  const [incomeForm, setIncomeForm] = useState({
    amount: '',
    description: '',
    income_date: new Date().toISOString().split('T')[0]
  });

  // Inline budget editing state
  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [tempBudgetAmount, setTempBudgetAmount] = useState('');

  // --- DERIVED METRICS ---
  const currentMonthKey = getCurrentMonthKey();

  const currentMonthExpensesTotal = useMemo(() => {
    return expenses
      .filter((e) => e.expense_date?.startsWith(currentMonthKey))
      .reduce((acc, e) => acc + Number(e.amount), 0);
  }, [expenses, currentMonthKey]);

  const currentMonthIncomeTotal = useMemo(() => {
    return incomes
      .filter((i) => i.income_date?.startsWith(currentMonthKey))
      .reduce((acc, i) => acc + Number(i.amount), 0);
  }, [incomes, currentMonthKey]);

  const currentMonthBalance = currentMonthIncomeTotal - currentMonthExpensesTotal;
  const currentMonthSavings = currentMonthBalance > 0 ? currentMonthBalance : 0;

  // Monthly Spending Trend (Last 6 Months)
  const monthlyTrendData = useMemo(() => {
    const months = getLast6Months();
    return months.map((mKey) => {
      const total = expenses
        .filter((e) => e.expense_date?.startsWith(mKey))
        .reduce((acc, e) => acc + Number(e.amount), 0);
      return {
        month: formatMonthLabel(mKey),
        amount: total
      };
    });
  }, [expenses]);

  // Current Month Category Breakdown for Donut Chart
  const categoryBreakdownData = useMemo(() => {
    const currentMonthExpenses = expenses.filter((e) =>
      e.expense_date?.startsWith(currentMonthKey)
    );

    return categories
      .map((cat) => {
        const value = currentMonthExpenses
          .filter((e) => e.category_id === cat.id)
          .reduce((acc, e) => acc + Number(e.amount), 0);
        return {
          name: cat.name,
          value,
          color: cat.color
        };
      })
      .filter((item) => item.value > 0);
  }, [expenses, categories, currentMonthKey]);

  // Category Spend mapping for Budgets Page / Dashboard Progress Bars
  const categorySpendMap = useMemo(() => {
    const map = {};
    expenses
      .filter((e) => e.expense_date?.startsWith(selectedMonth))
      .forEach((e) => {
        map[e.category_id] = (map[e.category_id] || 0) + Number(e.amount);
      });
    return map;
  }, [expenses, selectedMonth]);

  // --- SUPABASE DATABASE HANDLERS ---
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) return;

    const newExpense = {
      id: 'exp-' + Date.now(),
      category_id: expenseForm.category_id,
      amount: Number(expenseForm.amount),
      description: expenseForm.description || 'Expense',
      expense_date: expenseForm.expense_date,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('expenses').insert([newExpense]);

    if (!error) {
      setExpenses((prev) => [newExpense, ...prev]);
      setIsAddExpenseOpen(false);
      setExpenseForm({
        amount: '',
        category_id: DEFAULT_CATEGORIES[0].id,
        description: '',
        expense_date: new Date().toISOString().split('T')[0]
      });
    } else {
      alert('Error saving expense to database: ' + error.message);
    }
  };

  const handleAddIncome = async (e) => {
    e.preventDefault();
    if (!incomeForm.amount || Number(incomeForm.amount) <= 0) return;

    const newIncome = {
      id: 'inc-' + Date.now(),
      amount: Number(incomeForm.amount),
      description: incomeForm.description || 'Income',
      income_date: incomeForm.income_date,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('incomes').insert([newIncome]);

    if (!error) {
      setIncomes((prev) => [newIncome, ...prev]);
      setIsAddIncomeOpen(false);
      setIncomeForm({
        amount: '',
        description: '',
        income_date: new Date().toISOString().split('T')[0]
      });
    } else {
      alert('Error saving income to database: ' + error.message);
    }
  };

  const handleDeleteExpense = async () => {
    if (!deleteTargetId) return;

    const { error } = await supabase.from('expenses').delete().eq('id', deleteTargetId);

    if (!error) {
      setExpenses((prev) => prev.filter((e) => e.id !== deleteTargetId));
      setDeleteTargetId(null);
    } else {
      alert('Error deleting expense: ' + error.message);
    }
  };

  const handleSaveBudget = async (categoryId) => {
    const val = Number(tempBudgetAmount);
    const budgetPayload = {
      id: 'bdg-' + categoryId + '-' + selectedMonth,
      category_id: categoryId,
      month: selectedMonth,
      amount: val
    };

    const { error } = await supabase.from('budgets').upsert(budgetPayload);

    if (!error) {
      await fetchCloudData();
      setEditingBudgetId(null);
      setTempBudgetAmount('');
    } else {
      alert('Error saving budget: ' + error.message);
    }
  };

  // Filtered Expenses List for Transactions Page
  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesMonth = selectedMonth ? e.expense_date?.startsWith(selectedMonth) : true;
      const matchesCategory =
        selectedCategoryFilter === 'ALL' ? true : e.category_id === selectedCategoryFilter;
      return matchesMonth && matchesCategory;
    });
  }, [expenses, selectedMonth, selectedCategoryFilter]);

  // Recent 5 expenses for Dashboard
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date))
      .slice(0, 5);
  }, [expenses]);

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '40px' }}>
      {/* --- STICKY FROSTED NAV BAR --- */}
      <nav
        className="glass-nav"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              background: '#731358',
              color: 'white',
              borderRadius: '12px',
              padding: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            <Wallet size={20} />
          </div>
          <span style={{ fontWeight: '700', fontSize: '1.15rem', color: '#1e293b' }}>
            Tamil Pooja Expense Tracker
          </span>
        </div>

        {/* Navigation Pills */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255, 255, 255, 0.5)',
            padding: '4px',
            borderRadius: '999px',
            border: '1px solid rgba(255, 255, 255, 0.8)',
            gap: '4px'
          }}
        >
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'transactions', label: 'Transactions', icon: Receipt },
            { id: 'budgets', label: 'Budgets', icon: PieChartIcon }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCurrentView(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 16px',
                  borderRadius: '999px',
                  border: 'none',
                  background: isActive ? '#731358' : 'transparent',
                  color: isActive ? '#ffffff' : '#64748b',
                  fontWeight: isActive ? '600' : '500',
                  fontSize: '0.9rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* --- PAGE CONTENT CONTAINER --- */}
      <main style={{ maxWidth: '1120px', margin: '24px auto', padding: '0 16px' }}>
        {isLoading ? (
          <div style={{ padding: '60px', textAlign: 'center', color: '#731358' }}>
            <p style={{ fontWeight: '600', fontSize: '1.1rem' }}>Connecting to Supabase Database...</p>
          </div>
        ) : (
          <>
            {/* PAGE 1: DASHBOARD */}
            {currentView === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* 4 KPI Cards Grid */}
                <div className="grid-4">
                  {/* Balance Card */}
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>BALANCE</span>
                      <Wallet size={18} color="#731358" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#1e293b', marginTop: '8px' }}>
                      {formatCurrency(currentMonthBalance)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                      This month net
                    </div>
                  </div>

                  {/* Income Card with Add Affordance */}
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>INCOME</span>
                      <button
                        onClick={() => setIsAddIncomeOpen(true)}
                        style={{
                          background: 'rgba(115, 19, 88, 0.1)',
                          color: '#731358',
                          border: 'none',
                          borderRadius: '6px',
                          padding: '2px 8px',
                          fontSize: '0.75rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '2px'
                        }}
                      >
                        <Plus size={12} /> Add
                      </button>
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#10b981', marginTop: '8px' }}>
                      {formatCurrency(currentMonthIncomeTotal)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                      Total logged income
                    </div>
                  </div>

                  {/* Spent Card */}
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>SPENT</span>
                      <TrendingDown size={18} color="#ef4444" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#ef4444', marginTop: '8px' }}>
                      {formatCurrency(currentMonthExpensesTotal)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                      Total logged expenses
                    </div>
                  </div>

                  {/* Savings Card */}
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#64748b' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>SAVINGS</span>
                      <PiggyBank size={18} color="#731358" />
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#731358', marginTop: '8px' }}>
                      {formatCurrency(currentMonthSavings)}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '4px' }}>
                      Positive balance
                    </div>
                  </div>
                </div>

                {/* Charts Row */}
                <div className="grid-2">
                  {/* Area Chart: Monthly Spending Trend */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '16px' }}>
                      Monthly Spending Trend
                    </h3>
                    {monthlyTrendData.every((d) => d.amount === 0) ? (
                      <div
                        style={{
                          height: '220px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8'
                        }}
                      >
                        <AlertCircle size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontSize: '0.9rem' }}>No spending data for the last 6 months</p>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '220px' }}>
                        <ResponsiveContainer>
                          <AreaChart data={monthlyTrendData}>
                            <defs>
                              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#731358" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#731358" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                            <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Area
                              type="monotone"
                              dataKey="amount"
                              stroke="#731358"
                              strokeWidth={2}
                              fillOpacity={1}
                              fill="url(#trendGradient)"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  {/* Donut Chart: Current Month Category Breakdown */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '16px' }}>
                      Category Breakdown ({formatMonthLabel(currentMonthKey)})
                    </h3>
                    {categoryBreakdownData.length === 0 ? (
                      <div
                        style={{
                          height: '220px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#94a3b8'
                        }}
                      >
                        <AlertCircle size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontSize: '0.9rem' }}>No expenses logged this month</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', height: '220px' }}>
                        <div style={{ width: '50%', height: '100%' }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie
                                data={categoryBreakdownData}
                                innerRadius={50}
                                outerRadius={75}
                                paddingAngle={3}
                                dataKey="value"
                              >
                                {categoryBreakdownData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(val) => formatCurrency(val)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>

                        {/* Color Dot Legend */}
                        <div
                          style={{
                            width: '50%',
                            maxHeight: '180px',
                            overflowY: 'auto',
                            paddingLeft: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}
                        >
                          {categoryBreakdownData.map((item, idx) => (
                            <div
                              key={idx}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                fontSize: '0.8rem'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span
                                  style={{
                                    width: '10px',
                                    height: '10px',
                                    borderRadius: '50%',
                                    background: item.color
                                  }}
                                />
                                <span style={{ color: '#1e293b' }}>{item.name}</span>
                              </div>
                              <span style={{ fontWeight: '600', color: '#64748b' }}>
                                {formatCurrency(item.value)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Row: Budget Progress & Recent Transactions */}
                <div className="grid-2">
                  {/* Budget Progress Bars */}
                  <div className="glass-card">
                    <h3 style={{ fontSize: '1rem', color: '#1e293b', marginBottom: '16px' }}>
                      Budget Progress
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                      {categories.slice(0, 6).map((cat) => {
                        const spent = categorySpendMap[cat.id] || 0;
                        const budgetObj = budgets.find(
                          (b) => b.category_id === cat.id && b.month === currentMonthKey
                        );
                        const budgetAmt = budgetObj ? budgetObj.amount : 0;
                        const isOver = budgetAmt > 0 && spent > budgetAmt;
                        const pct = budgetAmt > 0 ? Math.min(Math.round((spent / budgetAmt) * 100), 100) : 0;

                        return (
                          <div key={cat.id}>
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem',
                                marginBottom: '4px'
                              }}
                            >
                              <span style={{ fontWeight: '500', color: '#1e293b' }}>{cat.name}</span>
                              <span
                                style={{
                                  color: isOver ? '#ef4444' : '#64748b',
                                  fontWeight: isOver ? '700' : '500'
                                }}
                              >
                                {formatCurrency(spent)}{' '}
                                <span style={{ color: '#94a3b8' }}>
                                  / {budgetAmt > 0 ? formatCurrency(budgetAmt) : 'No Budget'}
                                </span>
                              </span>
                            </div>
                            <div
                              style={{
                                height: '8px',
                                width: '100%',
                                background: 'rgba(226, 232, 240, 0.6)',
                                borderRadius: '4px',
                                overflow: 'hidden'
                              }}
                            >
                              <div
                                style={{
                                  height: '100%',
                                  width: `${pct}%`,
                                  background: isOver ? '#ef4444' : '#731358',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Recent Transactions List */}
                  <div className="glass-card">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '16px'
                      }}
                    >
                      <h3 style={{ fontSize: '1rem', color: '#1e293b' }}>Recent Transactions</h3>
                      <button
                        onClick={() => setIsAddExpenseOpen(true)}
                        style={{
                          background: '#731358',
                          color: 'white',
                          border: 'none',
                          borderRadius: '8px',
                          padding: '6px 12px',
                          fontSize: '0.8rem',
                          fontWeight: '600',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        <Plus size={14} /> Add Expense
                      </button>
                    </div>

                    {recentExpenses.length === 0 ? (
                      <div style={{ padding: '30px 0', textAlign: 'center', color: '#94a3b8' }}>
                        <Receipt size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontSize: '0.9rem' }}>No expenses recorded in database.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {recentExpenses.map((e) => {
                          const cat = categories.find((c) => c.id === e.category_id);
                          return (
                            <div
                              key={e.id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '10px 12px',
                                background: 'rgba(255, 255, 255, 0.5)',
                                borderRadius: '10px'
                              }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span
                                  style={{
                                    width: '12px',
                                    height: '12px',
                                    borderRadius: '50%',
                                    background: cat ? cat.color : '#94a3b8'
                                  }}
                                />
                                <div>
                                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#1e293b' }}>
                                    {e.description}
                                  </div>
                                  <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                                    {cat ? cat.name : 'Uncategorized'} • {e.expense_date}
                                  </div>
                                </div>
                              </div>
                              <div style={{ fontWeight: '700', color: '#ef4444', fontSize: '0.95rem' }}>
                                -{formatCurrency(e.amount)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 2: TRANSACTIONS */}
            {currentView === 'transactions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <h2 style={{ fontSize: '1.4rem', color: '#1e293b' }}>Transactions</h2>
                  <button
                    onClick={() => setIsAddExpenseOpen(true)}
                    style={{
                      background: '#731358',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '10px 18px',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <Plus size={16} /> Add Expense
                  </button>
                </div>

                {/* Filters */}
                <div
                  className="glass-card"
                  style={{
                    display: 'flex',
                    gap: '16px',
                    flexWrap: 'wrap',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                      Filter Category
                    </label>
                    <select
                      value={selectedCategoryFilter}
                      onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        fontSize: '0.9rem',
                        background: 'white'
                      }}
                    >
                      <option value="ALL">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', flex: '1 1 200px' }}>
                    <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                      Filter Month
                    </label>
                    <input
                      type="month"
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        outline: 'none',
                        fontSize: '0.9rem',
                        background: 'white'
                      }}
                    />
                  </div>
                </div>

                {/* Table */}
                <div className="glass-card" style={{ padding: '0', overflow: 'hidden' }}>
                  <div className="table-container">
                    {filteredExpenses.length === 0 ? (
                      <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                        <AlertCircle size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontSize: '0.95rem' }}>No transactions match your current filter.</p>
                      </div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th style={{ textAlign: 'right' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredExpenses.map((exp) => {
                            const cat = categories.find((c) => c.id === exp.category_id);
                            return (
                              <tr key={exp.id}>
                                <td style={{ fontWeight: '600' }}>{exp.description}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span
                                      style={{
                                        width: '10px',
                                        height: '10px',
                                        borderRadius: '50%',
                                        background: cat ? cat.color : '#94a3b8'
                                      }}
                                    />
                                    {cat ? cat.name : 'Other'}
                                  </div>
                                </td>
                                <td style={{ color: '#64748b' }}>{exp.expense_date}</td>
                                <td style={{ color: '#ef4444', fontWeight: '700' }}>
                                  -{formatCurrency(exp.amount)}
                                </td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    onClick={() => setDeleteTargetId(exp.id)}
                                    style={{
                                      background: 'rgba(239, 68, 68, 0.1)',
                                      color: '#ef4444',
                                      border: 'none',
                                      borderRadius: '6px',
                                      padding: '6px 10px',
                                      cursor: 'pointer'
                                    }}
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PAGE 3: BUDGETS */}
            {currentView === 'budgets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '12px'
                  }}
                >
                  <h2 style={{ fontSize: '1.4rem', color: '#1e293b' }}>Monthly Budgets</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="#731358" />
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.9rem',
                        background: 'white',
                        fontWeight: '600',
                        color: '#1e293b'
                      }}
                    >
                      {getLast6Months().map((m) => (
                        <option key={m} value={m}>
                          {formatMonthLabel(m)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Summary Cards */}
                <div className="grid-3">
                  <div className="glass-card">
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                      TOTAL BUDGET
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#731358', marginTop: '6px' }}>
                      {formatCurrency(
                        budgets
                          .filter((b) => b.month === selectedMonth)
                          .reduce((acc, b) => acc + Number(b.amount), 0)
                      )}
                    </div>
                  </div>

                  <div className="glass-card">
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                      TOTAL SPENT
                    </div>
                    <div style={{ fontSize: '1.6rem', fontWeight: '700', color: '#ef4444', marginTop: '6px' }}>
                      {formatCurrency(
                        Object.values(categorySpendMap).reduce((a, b) => a + b, 0)
                      )}
                    </div>
                  </div>

                  <div className="glass-card">
                    <div style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: '600' }}>
                      LEFT TO SPEND
                    </div>
                    {(() => {
                      const totalB = budgets
                        .filter((b) => b.month === selectedMonth)
                        .reduce((acc, b) => acc + Number(b.amount), 0);
                      const totalS = Object.values(categorySpendMap).reduce((a, b) => a + b, 0);
                      const left = totalB - totalS;
                      return (
                        <div
                          style={{
                            fontSize: '1.6rem',
                            fontWeight: '700',
                            color: left >= 0 ? '#10b981' : '#ef4444',
                            marginTop: '6px'
                          }}
                        >
                          {formatCurrency(left)}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Category Grid */}
                <div className="grid-3">
                  {categories.map((cat) => {
                    const IconComponent = ICON_MAP[cat.icon] || MoreHorizontal;
                    const spent = categorySpendMap[cat.id] || 0;
                    const budgetObj = budgets.find(
                      (b) => b.category_id === cat.id && b.month === selectedMonth
                    );
                    const budgetAmount = budgetObj ? budgetObj.amount : 0;
                    const isOver = budgetAmount > 0 && spent > budgetAmount;
                    const pct = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
                    const isEditing = editingBudgetId === cat.id;

                    return (
                      <div key={cat.id} className="glass-card">
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <div
                              style={{
                                background: cat.color + '20',
                                color: cat.color,
                                padding: '6px',
                                borderRadius: '8px'
                              }}
                            >
                              <IconComponent size={18} />
                            </div>
                            <span style={{ fontWeight: '600', color: '#1e293b' }}>{cat.name}</span>
                          </div>

                          {!isEditing ? (
                            <button
                              onClick={() => {
                                setEditingBudgetId(cat.id);
                                setTempBudgetAmount(budgetAmount ? String(budgetAmount) : '');
                              }}
                              style={{
                                background: 'transparent',
                                border: 'none',
                                color: '#64748b',
                                cursor: 'pointer'
                              }}
                            >
                              <Edit2 size={16} />
                            </button>
                          ) : (
                            <div style={{ display: 'flex', gap: '4px' }}>
                              <button
                                onClick={() => handleSaveBudget(cat.id)}
                                style={{
                                  background: '#10b981',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <Check size={14} />
                              </button>
                              <button
                                onClick={() => setEditingBudgetId(null)}
                                style={{
                                  background: '#ef4444',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '4px',
                                  padding: '2px 6px',
                                  cursor: 'pointer'
                                }}
                              >
                                <X size={14} />
                              </button>
                            </div>
                          )}
                        </div>

                        <div style={{ marginBottom: '12px' }}>
                          {isEditing ? (
                            <input
                              type="number"
                              placeholder="Set budget ₹"
                              value={tempBudgetAmount}
                              onChange={(e) => setTempBudgetAmount(e.target.value)}
                              style={{
                                width: '100%',
                                padding: '6px 8px',
                                borderRadius: '6px',
                                border: '1px solid #731358',
                                fontSize: '0.9rem'
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                fontSize: '0.85rem'
                              }}
                            >
                              <span style={{ color: '#64748b' }}>Spent: {formatCurrency(spent)}</span>
                              <span style={{ fontWeight: '600', color: '#1e293b' }}>
                                Budget: {budgetAmount > 0 ? formatCurrency(budgetAmount) : 'Not Set'}
                              </span>
                            </div>
                          )}
                        </div>

                        <div
                          style={{
                            height: '8px',
                            width: '100%',
                            background: 'rgba(226, 232, 240, 0.6)',
                            borderRadius: '4px',
                            overflow: 'hidden',
                            marginBottom: '6px'
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              width: `${Math.min(pct, 100)}%`,
                              background: isOver ? '#ef4444' : '#731358',
                              transition: 'width 0.3s ease'
                            }}
                          />
                        </div>

                        <div
                          style={{
                            fontSize: '0.75rem',
                            textAlign: 'right',
                            color: isOver ? '#ef4444' : '#64748b',
                            fontWeight: isOver ? '700' : '500'
                          }}
                        >
                          {budgetAmount > 0 ? `${pct}% used` : 'No Limit'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* --- MODAL: ADD EXPENSE --- */}
      {isAddExpenseOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '16px'
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', background: 'white' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', color: '#1e293b' }}>Add New Expense</h3>
              <button
                onClick={() => setIsAddExpenseOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 250"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    marginTop: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                  Category
                </label>
                <select
                  value={expenseForm.category_id}
                  onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    marginTop: '4px',
                    fontSize: '0.95rem'
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Flowers and Pooja items"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    marginTop: '4px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Date</label>
                <input
                  type="date"
                  required
                  value={expenseForm.expense_date}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    marginTop: '4px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: '#731358',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: ADD INCOME --- */}
      {isAddIncomeOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '16px'
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', background: 'white' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}
            >
              <h3 style={{ fontSize: '1.1rem', color: '#1e293b' }}>Add Income</h3>
              <button
                onClick={() => setIsAddIncomeOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddIncome} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                  Amount (₹)
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 50000"
                  value={incomeForm.amount}
                  onChange={(e) => setIncomeForm({ ...incomeForm, amount: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    marginTop: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>
                  Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Salary"
                  value={incomeForm.description}
                  onChange={(e) => setIncomeForm({ ...incomeForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    marginTop: '4px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '600' }}>Date</label>
                <input
                  type="date"
                  required
                  value={incomeForm.income_date}
                  onChange={(e) => setIncomeForm({ ...incomeForm, income_date: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    marginTop: '4px',
                    fontSize: '0.95rem'
                  }}
                />
              </div>

              <button
                type="submit"
                style={{
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '12px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  marginTop: '8px'
                }}
              >
                Save Income
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL: DELETE CONFIRMATION --- */}
      {deleteTargetId && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.4)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 200,
            padding: '16px'
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '360px', background: 'white' }}>
            <h3 style={{ fontSize: '1.1rem', color: '#1e293b', marginBottom: '8px' }}>
              Confirm Delete
            </h3>
            <p style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '20px' }}>
              Are you sure you want to delete this expense record from Supabase?
            </p>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDeleteTargetId(null)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: 'white',
                  color: '#64748b',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteExpense}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  background: '#ef4444',
                  color: 'white',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}