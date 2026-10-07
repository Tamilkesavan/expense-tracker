import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabaseClient';
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  LayoutDashboard,
  Receipt,
  Utensils,
  Car,
  ShoppingBag,
  Tv,
  Zap,
  HeartPulse,
  Home,
  GraduationCap,
  MoreHorizontal,
  Calendar,
  AlertCircle,
  User,
  Search,
  FileText,
  Sparkles,
  Flame,
  Clock,
  LogOut,
  Lock,
  ArrowRight,
  ShieldCheck,
  Landmark,
  ChevronDown,
  ChevronUp,
  Settings,
  Coins,
  Award
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

// --- ALLOWED USER LOGINS (Tamil, Pooja) ---
const ALLOWED_USERS = [
  { username: 'tamil', password: 'tamil', name: 'Tamil' },
  { username: 'pooja', password: 'pooja', name: 'Pooja' },
];

// --- SEEDED CATEGORIES ---
const DEFAULT_CATEGORIES = [
  { id: 'cat-1', name: 'Food & Dining', color: '#FF7A29', icon: 'Utensils' },
  { id: 'cat-2', name: 'Transport', color: '#3b82f6', icon: 'Car' },
  { id: 'cat-3', name: 'Shopping', color: '#FF3B6E', icon: 'ShoppingBag' },
  { id: 'cat-4', name: 'Entertainment', color: '#8b5cf6', icon: 'Tv' },
  { id: 'cat-5', name: 'Utilities', color: '#B8860B', icon: 'Zap' },
  { id: 'cat-6', name: 'Healthcare', color: '#ef4444', icon: 'HeartPulse' },
  { id: 'cat-7', name: 'Housing', color: '#78716c', icon: 'Home' },
  { id: 'cat-8', name: 'Grocery', color: '#06b6d4', icon: 'ShoppingBag' },
  { id: 'cat-9', name: 'Education', color: '#10b981', icon: 'GraduationCap' },
  { id: 'cat-10', name: 'Other', color: '#7A5C4C', icon: 'MoreHorizontal' },
];

const ICON_MAP = {
  Utensils, Car, ShoppingBag, Tv, Zap, HeartPulse, Home, GraduationCap, MoreHorizontal
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

const formatDateFormatted = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const calculateDaysDiff = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  const diffTime = Math.abs(e - s);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
};

// Helper for Green-to-Red Dynamic Progress Bar Gradient
const getProgressBarGradient = (percentage) => {
  if (percentage >= 100) {
    return 'linear-gradient(90deg, #F43F5E, #BE123C)';
  } else if (percentage >= 65) {
    return 'linear-gradient(90deg, #F59E0B, #F97316, #F43F5E)';
  } else if (percentage >= 35) {
    return 'linear-gradient(90deg, #10B981, #FBBF24, #F59E0B)';
  }
  return 'linear-gradient(90deg, #10B981, #34D399)';
};

// --- UI PRESENTATION HELPERS ---
const NAV_TABS = [
  { id: 'dashboard', label: 'Dashboard', shortLabel: 'Home', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', shortLabel: 'Expenses', icon: Receipt },
  { id: 'loans', label: 'Loans & Chits', shortLabel: 'Loans', icon: Landmark },
  { id: 'menstrual', label: 'Menstrual Tracker', shortLabel: 'Cycle', icon: HeartPulse }
];

const formatCompactCurrency = (val) => {
  const num = Number(val || 0);
  return num >= 1000 ? `₹${Math.round(num / 100) / 10}k` : `₹${num}`;
};

const CHART_TOOLTIP_STYLE = {
  borderRadius: '12px',
  border: '1px solid #E6E8F0',
  boxShadow: '0 12px 32px -12px rgba(15, 23, 42, 0.25)',
  fontSize: '0.82rem',
  fontWeight: 600
};

function StatCard({ label, icon: Icon, tone, value, unit, hint, valueClass = '', cardClass = '' }) {
  return (
    <div className={`card stat-card ${cardClass}`}>
      <div className="stat-top">
        <span className="stat-label">{label}</span>
        <span className={`stat-icon tone-${tone}`}><Icon size={18} /></span>
      </div>
      <div className={`stat-value ${valueClass}`}>
        {value}
        {unit && <span className="stat-unit"> {unit}</span>}
      </div>
      {hint && <span className="stat-hint">{hint}</span>}
    </div>
  );
}

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('pooja_suite_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState(() => {
    return localStorage.getItem('pooja_suite_username') || 'Tamil';
  });
  const [authUsername, setAuthUsername] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- VIEW STATE (4 TABS) ---
  const [currentView, setCurrentView] = useState('dashboard');
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [installments, setInstallments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // --- FETCH DATA WHEN AUTHENTICATED ---
  useEffect(() => {
    if (isAuthenticated) {
      fetchCloudData();
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const fetchCloudData = async () => {
    setIsLoading(true);
    try {
      const { data: expData } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
      if (expData) setExpenses(expData);

      const { data: cycData } = await supabase.from('menstrual_cycles').select('*').order('start_date', { ascending: false });
      if (cycData) setCycles(cycData);

      const { data: schData } = await supabase.from('loans_and_chits').select('*').order('created_at', { ascending: false });
      if (schData) setSchemes(schData);

      const { data: instData } = await supabase.from('scheme_installments').select('*').order('month_number', { ascending: true });
      if (instData) setInstallments(instData);
    } catch (err) {
      console.error('Error fetching cloud data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // --- LOGIN HANDLER ---
  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const inputUser = authUsername.trim().toLowerCase();

    const foundUser = ALLOWED_USERS.find(
      (u) => u.username.toLowerCase() === inputUser && u.password === authPassword
    );

    if (foundUser) {
      localStorage.setItem('pooja_suite_auth', 'true');
      localStorage.setItem('pooja_suite_username', foundUser.name);
      setIsAuthenticated(true);
      setCurrentUser(foundUser.name);
      setExpenseForm((prev) => ({ ...prev, added_by: foundUser.name }));
      setAuthError('');
      setAuthUsername('');
      setAuthPassword('');
    } else {
      setAuthError('Invalid username or password!');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('pooja_suite_auth');
    localStorage.removeItem('pooja_suite_username');
    setIsAuthenticated(false);
    setExpenses([]);
    setCycles([]);
    setSchemes([]);
    setInstallments([]);
  };

  // --- FILTER & SEARCH STATES ---
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // --- MODAL & FORM STATES ---
  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [isAddSchemeOpen, setIsAddSchemeOpen] = useState(false);
  const [editingSchemeId, setEditingSchemeId] = useState(null);
  const [deleteTargetId, setDeleteTargetId] = useState(null);
  const [selectedSchemeId, setSelectedSchemeId] = useState(null);

  const [expenseForm, setExpenseForm] = useState({
    amount: '',
    category_id: DEFAULT_CATEGORIES[0].id,
    description: '',
    added_by: currentUser,
    expense_date: new Date().toISOString().split('T')[0]
  });

  const [schemeForm, setSchemeForm] = useState({
    title: '',
    type: 'Chit Fund',
    total_months: '20',
    monthly_amount: '10000',
    start_date: new Date().toISOString().split('T')[0],
    general_notes: ''
  });

  const [cycleForm, setCycleForm] = useState({
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  });

  const [editingInstId, setEditingInstId] = useState(null);
  const [instForm, setInstForm] = useState({ amount_paid: '', notes: '' });

  // --- COMPUTED DASHBOARD METRICS ---
  const currentMonthKey = getCurrentMonthKey();
  const todayDateStr = new Date().toISOString().split('T')[0];

  const currentMonthExpenses = useMemo(() => {
    return expenses.filter((e) => e.expense_date?.startsWith(currentMonthKey));
  }, [expenses, currentMonthKey]);

  // 1. Total Spent Current Month
  const currentMonthExpensesTotal = useMemo(() => {
    return currentMonthExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  }, [currentMonthExpenses]);

  // 2. Total Logged Expenses Count
  const currentMonthExpensesCount = currentMonthExpenses.length;

  // 3. Number of Days with No Expenses Entered
  const noExpenseDaysCount = useMemo(() => {
    const today = new Date();
    const [currYear, currMonth] = currentMonthKey.split('-').map(Number);
    
    let daysToConsider = today.getDate();
    if (today.getFullYear() !== currYear || (today.getMonth() + 1) !== currMonth) {
      daysToConsider = new Date(currYear, currMonth, 0).getDate();
    }

    const loggedDatesSet = new Set(
      currentMonthExpenses
        .map((e) => e.expense_date)
        .filter(Boolean)
    );

    return Math.max(0, daysToConsider - loggedDatesSet.size);
  }, [currentMonthExpenses, currentMonthKey]);

  // 4. Total Spent Today & Entry Count
  const todayExpensesList = useMemo(() => {
    return expenses.filter((e) => e.expense_date === todayDateStr);
  }, [expenses, todayDateStr]);

  const todaySpentTotal = useMemo(() => {
    return todayExpensesList.reduce((acc, e) => acc + Number(e.amount), 0);
  }, [todayExpensesList]);

  const todayExpensesCount = todayExpensesList.length;

  // Daily Pace
  const daysElapsedThisMonth = new Date().getDate() || 1;
  const dailyAverageSpend = Math.round(currentMonthExpensesTotal / daysElapsedThisMonth);

  // Category Peak Spending Benchmark Data
  const allTimeCategoryPeaks = useMemo(() => {
    const catMonthSpendMap = {};

    expenses.forEach((e) => {
      if (!e.category_id || !e.expense_date) return;
      const mKey = getMonthKey(e.expense_date);
      if (!catMonthSpendMap[e.category_id]) {
        catMonthSpendMap[e.category_id] = {};
      }
      catMonthSpendMap[e.category_id][mKey] = (catMonthSpendMap[e.category_id][mKey] || 0) + Number(e.amount);
    });

    return categories.map((cat) => {
      const monthData = catMonthSpendMap[cat.id] || {};
      let peakMonth = null;
      let peakAmount = 0;

      Object.entries(monthData).forEach(([mKey, amt]) => {
        if (amt > peakAmount) {
          peakAmount = amt;
          peakMonth = mKey;
        }
      });

      const currentMonthSpend = monthData[currentMonthKey] || 0;
      const pctOfPeak = peakAmount > 0 ? Math.min(Math.round((currentMonthSpend / peakAmount) * 100), 100) : 0;
      const headroom = Math.max(0, peakAmount - currentMonthSpend);
      const isCurrentMonthPeak = peakMonth === currentMonthKey && peakAmount > 0;

      return {
        ...cat,
        peakMonth: peakMonth ? formatMonthLabel(peakMonth) : 'No Data',
        peakAmount,
        currentMonthSpend,
        pctOfPeak,
        headroom,
        isCurrentMonthPeak
      };
    }).sort((a, b) => b.peakAmount - a.peakAmount);
  }, [expenses, categories, currentMonthKey]);

  const monthlyTrendData = useMemo(() => {
    const months = getLast6Months();
    return months.map((mKey) => {
      const total = expenses
        .filter((e) => e.expense_date?.startsWith(mKey))
        .reduce((acc, e) => acc + Number(e.amount), 0);
      return { month: formatMonthLabel(mKey), amount: total };
    });
  }, [expenses]);

  const categoryBreakdownData = useMemo(() => {
    return categories
      .map((cat) => {
        const value = currentMonthExpenses
          .filter((e) => e.category_id === cat.id)
          .reduce((acc, e) => acc + Number(e.amount), 0);
        return { name: cat.name, value, color: cat.color };
      })
      .filter((item) => item.value > 0);
  }, [currentMonthExpenses, categories]);

  // Previous Month Breakdown in Transactions Tab
  const isPreviousMonthSelected = selectedMonth && selectedMonth !== currentMonthKey;

  const selectedMonthCategorySpend = useMemo(() => {
    if (!isPreviousMonthSelected) return [];

    const monthExpenses = expenses.filter((e) => e.expense_date?.startsWith(selectedMonth));

    return categories
      .map((cat) => {
        const matchingExpenses = monthExpenses.filter((e) => e.category_id === cat.id);
        const total = matchingExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const count = matchingExpenses.length;
        return {
          ...cat,
          total,
          count
        };
      })
      .filter((cat) => cat.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [expenses, selectedMonth, isPreviousMonthSelected, categories]);

  const selectedMonthTotalSpend = useMemo(() => {
    return selectedMonthCategorySpend.reduce((acc, c) => acc + c.total, 0);
  }, [selectedMonthCategorySpend]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e) => {
      const matchesMonth = selectedMonth ? e.expense_date?.startsWith(selectedMonth) : true;
      const matchesCategory =
        selectedCategoryFilter === 'ALL' ? true : e.category_id === selectedCategoryFilter;
      const query = searchQuery.toLowerCase().trim();
      const matchesSearch =
        query === ''
          ? true
          : (e.description || '').toLowerCase().includes(query) ||
            (e.added_by || '').toLowerCase().includes(query);

      return matchesMonth && matchesCategory && matchesSearch;
    });
  }, [expenses, selectedMonth, selectedCategoryFilter, searchQuery]);

  const searchTotalAmount = useMemo(() => {
    return filteredExpenses.reduce((acc, e) => acc + Number(e.amount), 0);
  }, [filteredExpenses]);

  // Menstrual metrics
  const avgCycleDays = useMemo(() => {
    if (cycles.length === 0) return 0;
    const totalDays = cycles.reduce((acc, c) => acc + calculateDaysDiff(c.start_date, c.end_date), 0);
    return Math.round(totalDays / cycles.length);
  }, [cycles]);

  // Export PDF Handler
  const handleExportPDF = () => {
    if (filteredExpenses.length === 0) {
      alert('No transactions available to print/export.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const tableRows = filteredExpenses.map((exp, index) => {
      const cat = categories.find((c) => c.id === exp.category_id);
      return `
        <tr>
          <td>${index + 1}</td>
          <td><strong>${exp.description}</strong></td>
          <td>${cat ? cat.name : 'Other'}</td>
          <td>${exp.added_by || currentUser}</td>
          <td>${exp.expense_date}</td>
          <td style="color: #ef4444; font-weight: bold;">-${formatCurrency(exp.amount)}</td>
        </tr>
      `;
    }).join('');

    printWindow.document.write(`
      <html>
        <head>
          <title>Tamil Pooja Suite - Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #2B160E; }
            h1 { font-size: 20px; color: #FF7A29; margin-bottom: 4px; }
            p { font-size: 13px; color: #6E5347; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #FFEED2; color: #D4A017; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid rgba(212, 160, 23, 0.2); font-size: 13px; }
            .total-banner { background: #FAF6EE; border: 1px solid rgba(212, 160, 23, 0.3); padding: 14px; border-radius: 8px; margin-top: 20px; text-align: right; font-size: 16px; font-weight: bold; color: #E85D04; }
          </style>
        </head>
        <body>
          <h1>Tamil Pooja Suite - Expense Statement</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-IN')} | Month: ${formatMonthLabel(selectedMonth)} | Count: ${filteredExpenses.length}</p>
          <table>
            <thead><tr><th>#</th><th>Description</th><th>Category</th><th>Added By</th><th>Date</th><th>Amount</th></tr></thead>
            <tbody>${tableRows}</tbody>
          </table>
          <div class="total-banner">Total Filtered Outflow: ${formatCurrency(searchTotalAmount)}</div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // Add Expense
  const handleAddExpense = async (e) => {
    e.preventDefault();
    if (!expenseForm.amount || Number(expenseForm.amount) <= 0) return;

    const newExpense = {
      id: 'exp-' + Date.now(),
      category_id: expenseForm.category_id,
      amount: Number(expenseForm.amount),
      description: expenseForm.description || 'Expense',
      added_by: expenseForm.added_by || currentUser,
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
        added_by: currentUser,
        expense_date: new Date().toISOString().split('T')[0]
      });
    } else {
      alert('Error saving expense: ' + error.message);
    }
  };

  // Delete Expense
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

  // Add Scheme
  const handleAddScheme = async (e) => {
    e.preventDefault();
    const months = parseInt(schemeForm.total_months) || 12;
    const monthlyAmt = parseFloat(schemeForm.monthly_amount) || 0;
    const targetAmt = months * monthlyAmt;

    const newScheme = {
      id: 'sch-' + Date.now(),
      title: schemeForm.title || 'New Scheme',
      type: schemeForm.type,
      total_months: months,
      monthly_amount: monthlyAmt,
      total_target_amount: targetAmt,
      start_date: schemeForm.start_date,
      added_by: currentUser,
      general_notes: schemeForm.general_notes,
      created_at: new Date().toISOString()
    };

    const { error: schErr } = await supabase.from('loans_and_chits').insert([newScheme]);

    if (!schErr) {
      const newInstallments = [];
      const startDateObj = new Date(schemeForm.start_date);

      for (let i = 1; i <= months; i++) {
        const dueDate = new Date(startDateObj.getFullYear(), startDateObj.getMonth() + (i - 1), 10);
        newInstallments.push({
          id: `inst-${newScheme.id}-${i}`,
          scheme_id: newScheme.id,
          month_number: i,
          due_date: dueDate.toISOString().split('T')[0],
          amount_paid: 0,
          status: 'Pending',
          payment_date: null,
          notes: ''
        });
      }

      await supabase.from('scheme_installments').insert(newInstallments);

      setSchemes((prev) => [newScheme, ...prev]);
      setInstallments((prev) => [...newInstallments, ...prev]);
      setSelectedSchemeId(newScheme.id);
      setIsAddSchemeOpen(false);
      setSchemeForm({
        title: '',
        type: 'Chit Fund',
        total_months: '20',
        monthly_amount: '10000',
        start_date: new Date().toISOString().split('T')[0],
        general_notes: ''
      });
    } else {
      alert('Error creating scheme: ' + schErr.message);
    }
  };

  const handleOpenEditScheme = (sch) => {
    setEditingSchemeId(sch.id);
    setSchemeForm({
      title: sch.title,
      type: sch.type,
      total_months: String(sch.total_months),
      monthly_amount: String(sch.monthly_amount),
      start_date: sch.start_date,
      general_notes: sch.general_notes || ''
    });
  };

  const handleSaveEditedScheme = async (e) => {
    e.preventDefault();
    if (!editingSchemeId) return;

    const months = parseInt(schemeForm.total_months) || 12;
    const monthlyAmt = parseFloat(schemeForm.monthly_amount) || 0;

    const updatedPayload = {
      title: schemeForm.title,
      type: schemeForm.type,
      total_months: months,
      monthly_amount: monthlyAmt,
      total_target_amount: months * monthlyAmt,
      start_date: schemeForm.start_date,
      general_notes: schemeForm.general_notes
    };

    const { error } = await supabase
      .from('loans_and_chits')
      .update(updatedPayload)
      .eq('id', editingSchemeId);

    if (!error) {
      setSchemes((prev) =>
        prev.map((s) => (s.id === editingSchemeId ? { ...s, ...updatedPayload } : s))
      );
      setEditingSchemeId(null);
      setSchemeForm({
        title: '',
        type: 'Chit Fund',
        total_months: '20',
        monthly_amount: '10000',
        start_date: new Date().toISOString().split('T')[0],
        general_notes: ''
      });
    } else {
      alert('Error updating scheme: ' + error.message);
    }
  };

  const handleUpdateInstallment = async (instId, amountPaid, notes, status) => {
    const updatedPayload = {
      amount_paid: Number(amountPaid) || 0,
      notes: notes || '',
      status: status || (Number(amountPaid) > 0 ? 'Paid' : 'Pending'),
      payment_date: Number(amountPaid) > 0 ? new Date().toISOString().split('T')[0] : null
    };

    const { error } = await supabase.from('scheme_installments').update(updatedPayload).eq('id', instId);

    if (!error) {
      setInstallments((prev) =>
        prev.map((item) => (item.id === instId ? { ...item, ...updatedPayload } : item))
      );
      setEditingInstId(null);
    } else {
      alert('Error updating installment: ' + error.message);
    }
  };

  const handleDeleteScheme = async (schemeId) => {
    if (!window.confirm('Are you sure you want to delete this Chit/Loan scheme and all its installment records?')) return;

    const { error } = await supabase.from('loans_and_chits').delete().eq('id', schemeId);
    if (!error) {
      setSchemes((prev) => prev.filter((s) => s.id !== schemeId));
      setInstallments((prev) => prev.filter((i) => i.scheme_id !== schemeId));
      if (selectedSchemeId === schemeId) setSelectedSchemeId(null);
    } else {
      alert('Error deleting scheme: ' + error.message);
    }
  };

  const handleAddCycle = async (e) => {
    e.preventDefault();
    if (!cycleForm.start_date || !cycleForm.end_date) return;

    if (new Date(cycleForm.end_date) < new Date(cycleForm.start_date)) {
      alert('End date cannot be before start date!');
      return;
    }

    const newCycle = {
      id: 'cyc-' + Date.now(),
      start_date: cycleForm.start_date,
      end_date: cycleForm.end_date,
      created_at: new Date().toISOString()
    };

    const { error } = await supabase.from('menstrual_cycles').insert([newCycle]);

    if (!error) {
      setCycles((prev) => [newCycle, ...prev].sort((a, b) => new Date(b.start_date) - new Date(a.start_date)));
      setCycleForm({
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0]
      });
    } else {
      alert('Error saving period cycle: ' + error.message);
    }
  };

  const handleDeleteCycle = async (id) => {
    const { error } = await supabase.from('menstrual_cycles').delete().eq('id', id);
    if (!error) {
      setCycles((prev) => prev.filter((c) => c.id !== id));
    } else {
      alert('Error deleting record: ' + error.message);
    }
  };

  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.expense_date) - new Date(a.expense_date))
      .slice(0, 6);
  }, [expenses]);

  // Rose accent theme for the menstrual tracker tab; indigo everywhere else
  const isRoseTheme = currentView === 'menstrual';
  const todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  // --- LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="login-page">
        <div className="login-card">
          <div className="login-brand">
            <div className="brand-mark brand-mark-lg">
              <Wallet size={28} />
            </div>
            <h2 className="login-title">Tamil Pooja Suite</h2>
            <p className="login-subtitle">Cloud Personal Finance Portal</p>
          </div>

          {authError && (
            <div className="alert alert-error" role="alert">
              <AlertCircle size={16} /> {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="form-stack">
            <div className="field">
              <label className="field-label" htmlFor="login-username">Username</label>
              <div className="input-with-icon">
                <User size={16} className="input-icon" />
                <input
                  id="login-username"
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Username (tamil / pooja)"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label className="field-label" htmlFor="login-password">Password</label>
              <div className="input-with-icon">
                <Lock size={16} className="input-icon" />
                <input
                  id="login-password"
                  type="password"
                  required
                  autoComplete="off"
                  placeholder="Password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: '4px' }}>
              Log In <ArrowRight size={16} />
            </button>
          </form>

          <div className="login-footer">
            <ShieldCheck size={14} /> Encrypted Cloud Sync Active
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell" data-theme={isRoseTheme ? 'rose' : undefined}>
      {/* SIDEBAR (DESKTOP) */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark">{isRoseTheme ? <Flame size={20} /> : <Wallet size={20} />}</div>
          <div>
            <div className="brand-name">Tamil Pooja Suite</div>
            <div className="brand-sub">{isRoseTheme ? 'Rose Cycle Tracker' : 'Personal Finance & Chits Suite'}</div>
          </div>
        </div>

        <nav className="nav-list" aria-label="Main navigation">
          <span className="nav-section">Menu</span>
          {NAV_TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                data-tab={tab.id}
                className={`nav-item${isActive ? ' active' : ''}`}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => setCurrentView(tab.id)}
              >
                <Icon size={18} /> <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <span className="avatar">{currentUser.charAt(0)}</span>
            <div className="user-chip-text">
              <span className="user-chip-name">{currentUser}</span>
              <span className="user-chip-role">Signed in</span>
            </div>
            <button onClick={handleLogout} title="Log Out" aria-label="Log out" className="icon-btn icon-btn-dark">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* TOPBAR (TABLET / MOBILE) */}
      <header className="topbar">
        <div className="topbar-brand">
          <div className="brand-mark">{isRoseTheme ? <Flame size={18} /> : <Wallet size={18} />}</div>
          <div>
            <div className="brand-name">Tamil Pooja Suite</div>
            <div className="brand-sub">{isRoseTheme ? 'Rose Cycle Tracker' : 'Personal Finance & Chits Suite'}</div>
          </div>
        </div>
        <div className="topbar-actions">
          <span className="avatar avatar-sm" title={currentUser}>{currentUser.charAt(0)}</span>
          <button onClick={handleLogout} title="Log Out" aria-label="Log out" className="icon-btn icon-btn-danger">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      {/* MAIN CONTAINER */}
      <main className="main">
        <div className="content">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <p>Loading data...</p>
            </div>
          ) : (
            <>
              {/* VIEW 1: DASHBOARD */}
              {currentView === 'dashboard' && (
                <div className="page">
                  {/* HERO WITH ADD EXPENSE BUTTON & DAILY PACE */}
                  <section className="hero">
                    <div className="hero-content">
                      <span className="hero-eyebrow"><Calendar size={14} /> {todayLabel}</span>
                      <h2 className="hero-title">Welcome back, {currentUser}!</h2>
                      <div className="hero-meta">
                        <span className="hero-pill">
                          <Sparkles size={14} /> Daily Pace: <strong>{formatCurrency(dailyAverageSpend)} / day</strong>
                        </span>
                      </div>
                    </div>
                    <button className="btn btn-hero" onClick={() => setIsAddExpenseOpen(true)}>
                      <Plus size={18} /> Add New Expense
                    </button>
                  </section>

                  {/* 4 CORE KPI CARDS */}
                  <div className="stat-grid">
                    <StatCard
                      label="Total Spent"
                      icon={TrendingDown}
                      tone="rose"
                      value={formatCurrency(currentMonthExpensesTotal)}
                      hint={`Total spend in ${formatMonthLabel(currentMonthKey)}`}
                    />
                    <StatCard
                      label="Logged Expenses"
                      icon={Receipt}
                      tone="amber"
                      value={currentMonthExpensesCount}
                      unit="Entries"
                      hint="Recorded transactions this month"
                    />
                    <StatCard
                      label="No-Expense Days"
                      icon={Award}
                      tone="emerald"
                      value={noExpenseDaysCount}
                      unit="Days Clean"
                      valueClass="text-success"
                      hint="Zero-spend days saved this month"
                    />
                    <StatCard
                      label="Spent Today"
                      icon={Clock}
                      tone="indigo"
                      value={formatCurrency(todaySpentTotal)}
                      valueClass={todaySpentTotal > 0 ? 'text-warning' : 'text-success'}
                      cardClass={todaySpentTotal > 0 ? 'stat-card-highlight' : ''}
                      hint={todayExpensesCount > 0 ? `${todayExpensesCount} transaction${todayExpensesCount === 1 ? '' : 's'} logged today` : '₹0 spent so far today'}
                    />
                  </div>

                  {/* CHARTS ROW */}
                  <div className="grid-2">
                    <div className="card">
                      <div className="card-header">
                        <div>
                          <h3 className="card-title">Monthly Spending Trend</h3>
                          <p className="card-subtitle">Last 6 months</p>
                        </div>
                      </div>
                      <div className="chart-box">
                        <ResponsiveContainer>
                          <AreaChart data={monthlyTrendData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                            <defs>
                              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#6D5DFC" stopOpacity={0.35} />
                                <stop offset="100%" stopColor="#6D5DFC" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <CartesianGrid stroke="#EEF0F6" strokeDasharray="4 4" vertical={false} />
                            <XAxis dataKey="month" stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} dy={6} />
                            <YAxis stroke="#94A3B8" fontSize={12} tickLine={false} axisLine={false} width={52} tickFormatter={formatCompactCurrency} />
                            <Tooltip formatter={(value) => formatCurrency(value)} contentStyle={CHART_TOOLTIP_STYLE} cursor={{ stroke: '#C7C2FB', strokeWidth: 1 }} />
                            <Area type="monotone" dataKey="amount" stroke="#5B4CF0" strokeWidth={2.5} fillOpacity={1} fill="url(#trendGradient)" activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="card">
                      <div className="card-header">
                        <div>
                          <h3 className="card-title">Category Breakdown</h3>
                          <p className="card-subtitle">{formatMonthLabel(currentMonthKey)}</p>
                        </div>
                      </div>
                      {categoryBreakdownData.length === 0 ? (
                        <div className="empty-inline">No expenses logged this month yet.</div>
                      ) : (
                        <div className="donut-layout">
                          <div className="donut-chart">
                            <ResponsiveContainer>
                              <PieChart>
                                <Pie data={categoryBreakdownData} innerRadius="64%" outerRadius="92%" paddingAngle={3} cornerRadius={4} stroke="none" dataKey="value">
                                  {categoryBreakdownData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                                </Pie>
                                <Tooltip formatter={(val) => formatCurrency(val)} contentStyle={CHART_TOOLTIP_STYLE} />
                              </PieChart>
                            </ResponsiveContainer>
                            <div className="donut-center">
                              <span>Total</span>
                              <strong>{formatCurrency(categoryBreakdownData.reduce((acc, item) => acc + item.value, 0))}</strong>
                            </div>
                          </div>
                          <ul className="legend-list">
                            {categoryBreakdownData.map((item, idx) => (
                              <li key={idx} className="legend-item">
                                <span className="legend-dot" style={{ background: item.color }} />
                                <span className="legend-name">{item.name}</span>
                                <span className="legend-value">{formatCurrency(item.value)}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* HISTORICAL PEAK BENCHMARKS */}
                  <div className="card">
                    <div className="card-header card-header-wrap">
                      <div>
                        <span className="eyebrow"><TrendingUp size={13} /> Category Benchmark Matrix</span>
                        <h3 className="card-title card-title-lg">Historical Peak Spending vs. This Month</h3>
                        <p className="card-subtitle">
                          Tracks your all-time record spend for each category and measures your current month headroom
                        </p>
                      </div>
                      <span className="chip">
                        <Calendar size={14} /> Current Month: <strong>{formatMonthLabel(currentMonthKey)}</strong>
                      </span>
                    </div>

                    <div className="bench-grid">
                      {allTimeCategoryPeaks.map((cat) => {
                        const IconComponent = ICON_MAP[cat.icon] || MoreHorizontal;
                        const benchState = cat.isCurrentMonthPeak ? 'peak' : cat.pctOfPeak >= 75 ? 'warn' : 'ok';
                        return (
                          <div key={cat.id} className={`bench-card bench-${benchState}`}>
                            <div className="bench-head">
                              <div className="bench-name">
                                <span className="cat-icon cat-icon-sm" style={{ background: cat.color + '1A', color: cat.color }}>
                                  <IconComponent size={17} />
                                </span>
                                <span>{cat.name}</span>
                              </div>

                              {benchState === 'peak' ? (
                                <span className="badge badge-danger"><Flame size={12} /> Record High Month!</span>
                              ) : benchState === 'warn' ? (
                                <span className="badge badge-warning"><AlertCircle size={12} /> {cat.pctOfPeak}% of Record</span>
                              ) : (
                                <span className="badge badge-success"><Check size={12} /> {cat.pctOfPeak}% of Record</span>
                              )}
                            </div>

                            <div className="bench-stats">
                              <div>
                                <span className="mini-label">All-Time Peak</span>
                                <strong className="mini-value">{formatCurrency(cat.peakAmount)}</strong>
                                <span className="mini-note accent">Month: {cat.peakMonth}</span>
                              </div>
                              <div className="text-right">
                                <span className="mini-label">This Month Spent</span>
                                <strong className={`mini-value${cat.isCurrentMonthPeak ? ' text-danger' : ''}`}>
                                  {formatCurrency(cat.currentMonthSpend)}
                                </strong>
                                <span className="mini-note">
                                  {cat.headroom > 0 ? `${formatCurrency(cat.headroom)} under peak` : 'At Peak'}
                                </span>
                              </div>
                            </div>

                            <div>
                              <div className="progress-meta">
                                <span>Month Usage vs Record</span>
                                <strong>{cat.pctOfPeak}%</strong>
                              </div>
                              <div className="progress">
                                <div className="progress-bar" style={{ width: `${cat.pctOfPeak}%`, background: getProgressBarGradient(cat.pctOfPeak) }} />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RECENT TRANSACTIONS */}
                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Recent Transactions</h3>
                      <button className="btn btn-secondary btn-sm" onClick={() => setCurrentView('transactions')}>
                        View All <ArrowRight size={14} />
                      </button>
                    </div>
                    {recentExpenses.length === 0 ? (
                      <div className="empty-inline">No transactions recorded yet.</div>
                    ) : (
                      <div className="txn-grid">
                        {recentExpenses.map((e) => {
                          const cat = categories.find((c) => c.id === e.category_id);
                          const IconComponent = (cat && ICON_MAP[cat.icon]) || MoreHorizontal;
                          const catColor = cat ? cat.color : '#64748B';
                          return (
                            <div key={e.id} className="txn-item">
                              <span className="cat-icon" style={{ background: catColor + '1A', color: catColor }}>
                                <IconComponent size={18} />
                              </span>
                              <div className="txn-main">
                                <div className="txn-title">{e.description}</div>
                                <div className="txn-meta">
                                  <span>{cat ? cat.name : 'Other'}</span>•<span>{e.expense_date}</span>
                                  <span className="user-badge user-badge-sm">{e.added_by || currentUser}</span>
                                </div>
                              </div>
                              <div className="txn-amount">-{formatCurrency(e.amount)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 2: TRANSACTIONS */}
              {currentView === 'transactions' && (
                <div className="page">
                  <div className="page-header">
                    <div>
                      <h2 className="page-title">Transactions</h2>
                      <p className="page-subtitle">Records for {formatMonthLabel(selectedMonth)}</p>
                    </div>
                    <div className="page-actions">
                      <button className="btn btn-export" onClick={handleExportPDF}><FileText size={16} /> Export PDF</button>
                      <button className="btn btn-primary" onClick={() => setIsAddExpenseOpen(true)}><Plus size={16} /> Add Expense</button>
                    </div>
                  </div>

                  <div className="card filter-bar">
                    <div className="field">
                      <label className="field-label" htmlFor="txn-search">Search Keyword</label>
                      <div className="input-with-icon">
                        <Search size={16} className="input-icon" />
                        <input id="txn-search" type="text" placeholder="Filter descriptions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                      </div>
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="txn-category">Category</label>
                      <select id="txn-category" value={selectedCategoryFilter} onChange={(e) => setSelectedCategoryFilter(e.target.value)}>
                        <option value="ALL">All Categories</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="field">
                      <label className="field-label" htmlFor="txn-month">Month</label>
                      <input id="txn-month" type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                    </div>
                  </div>

                  {isPreviousMonthSelected && (
                    <div className="card">
                      <div className="card-header card-header-wrap">
                        <div>
                          <span className="eyebrow">Historical Summary</span>
                          <h3 className="card-title card-title-lg">{formatMonthLabel(selectedMonth)} — Category Breakdown</h3>
                        </div>
                        <div className="month-total">
                          <span className="mini-label">Month Total Spent</span>
                          <strong>{formatCurrency(selectedMonthTotalSpend)}</strong>
                        </div>
                      </div>
                      <div className="cat-summary-grid">
                        {selectedMonthCategorySpend.map((cat) => {
                          const IconComponent = ICON_MAP[cat.icon] || MoreHorizontal;
                          const percentage = selectedMonthTotalSpend > 0 ? Math.round((cat.total / selectedMonthTotalSpend) * 100) : 0;
                          return (
                            <div key={cat.id} className="cat-summary-item">
                              <span className="cat-icon cat-icon-sm" style={{ background: cat.color + '1A', color: cat.color }}><IconComponent size={16} /></span>
                              <div className="txn-main">
                                <div className="txn-title">{cat.name}</div>
                                <div className="txn-meta">{cat.count} entries ({percentage}%)</div>
                              </div>
                              <strong>{formatCurrency(cat.total)}</strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  <div className="summary-strip">
                    <span>Showing <strong>{filteredExpenses.length}</strong> transaction{filteredExpenses.length === 1 ? '' : 's'}</span>
                    <span className="summary-total">Filtered Total <strong>-{formatCurrency(searchTotalAmount)}</strong></span>
                  </div>

                  <div className="card table-card">
                    {filteredExpenses.length === 0 ? (
                      <div className="empty-state">
                        <span className="empty-icon"><Receipt size={28} /></span>
                        <p>No transactions match these filters.</p>
                      </div>
                    ) : (
                      <div className="table-container">
                        <table className="data-table data-table-stack">
                          <thead><tr><th>Description</th><th>Category</th><th>Added By</th><th>Date</th><th>Amount</th><th className="th-right">Actions</th></tr></thead>
                          <tbody>
                            {filteredExpenses.map((exp) => {
                              const cat = categories.find((c) => c.id === exp.category_id);
                              return (
                                <tr key={exp.id}>
                                  <td className="cell-strong cell-title" data-label="Description">{exp.description}</td>
                                  <td data-label="Category">
                                    <span className="cell-inline"><span className="cat-dot" style={{ background: cat ? cat.color : '#64748B' }} />{cat ? cat.name : 'Other'}</span>
                                  </td>
                                  <td data-label="Added By"><span className="user-badge"><User size={12} /> {exp.added_by || currentUser}</span></td>
                                  <td className="cell-muted" data-label="Date">{exp.expense_date}</td>
                                  <td className="cell-amount" data-label="Amount">-{formatCurrency(exp.amount)}</td>
                                  <td className="cell-actions">
                                    <button onClick={() => setDeleteTargetId(exp.id)} className="icon-btn icon-btn-danger" title="Delete expense" aria-label="Delete expense"><Trash2 size={15} /></button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* VIEW 3: LOANS & CHITS */}
              {currentView === 'loans' && (
                <div className="page">
                  <div className="page-header">
                    <div>
                      <h2 className="page-title">Loans & Chit Funds</h2>
                      <p className="page-subtitle">Track monthly variable payments, dividend gains & loan repayments</p>
                    </div>
                    <div className="page-actions">
                      <button className="btn btn-primary" onClick={() => setIsAddSchemeOpen(true)}>
                        <Plus size={16} /> Add Chit / Loan
                      </button>
                    </div>
                  </div>

                  <div className="stat-grid">
                    <StatCard
                      label="Active Schemes"
                      icon={Landmark}
                      tone="indigo"
                      value={schemes.length}
                      unit="Active"
                      hint="Chits & Loans enrolled"
                    />
                    <StatCard
                      label="Total Target Value"
                      icon={Coins}
                      tone="amber"
                      value={formatCurrency(schemes.reduce((acc, s) => acc + Number(s.total_target_amount), 0))}
                      valueClass="text-primary"
                      hint="Cumulative nominal target"
                    />
                    <StatCard
                      label="Actual Cash Paid"
                      icon={TrendingDown}
                      tone="rose"
                      value={formatCurrency(installments.reduce((acc, i) => acc + Number(i.amount_paid || 0), 0))}
                      valueClass="text-danger"
                      hint="Total money contributed"
                    />
                    <StatCard
                      label="Total Dividend Saved"
                      icon={Award}
                      tone="emerald"
                      value={formatCurrency(
                        installments.reduce((acc, i) => {
                          const sch = schemes.find((s) => s.id === i.scheme_id);
                          if (!sch || i.status !== 'Paid') return acc;
                          const base = Number(sch.monthly_amount);
                          const paid = Number(i.amount_paid);
                          return acc + (base > paid ? base - paid : 0);
                        }, 0)
                      )}
                      valueClass="text-success"
                      cardClass="stat-card-success"
                      hint="Auction discounts earned"
                    />
                  </div>

                  {/* SCHEMES */}
                  {schemes.length === 0 ? (
                    <div className="card empty-state">
                      <span className="empty-icon"><Landmark size={28} /></span>
                      <p>
                        No Chit Funds or Loans enrolled yet. Click <strong>+ Add Chit / Loan</strong> above to set up your first scheme.
                      </p>
                    </div>
                  ) : (
                    <div className="grid-2">
                      {schemes.map((sch) => {
                        const schInsts = installments.filter((i) => i.scheme_id === sch.id);
                        const paidInsts = schInsts.filter((i) => i.status === 'Paid');
                        const totalCashPaid = schInsts.reduce((acc, i) => acc + Number(i.amount_paid || 0), 0);
                        const totalDividendSaved = schInsts.reduce((acc, i) => {
                          if (i.status !== 'Paid') return acc;
                          const base = Number(sch.monthly_amount);
                          const paid = Number(i.amount_paid);
                          return acc + (base > paid ? base - paid : 0);
                        }, 0);
                        const progressPct = Math.round((paidInsts.length / sch.total_months) * 100) || 0;
                        const isSelected = selectedSchemeId === sch.id;

                        return (
                          <div key={sch.id} className={`card scheme-card${isSelected ? ' is-selected' : ''}`}>
                            <div className="scheme-head">
                              <div>
                                <span className="badge badge-primary">{sch.type}</span>
                                <h3 className="scheme-title">{sch.title}</h3>
                              </div>
                              <div className="scheme-actions">
                                <button onClick={() => handleOpenEditScheme(sch)} title="Edit Scheme Details" aria-label="Edit scheme details" className="icon-btn">
                                  <Settings size={16} />
                                </button>
                                <button onClick={() => handleDeleteScheme(sch.id)} title="Delete Scheme" aria-label="Delete scheme" className="icon-btn icon-btn-danger">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>

                            <div className="scheme-stats">
                              <div className="scheme-stat">
                                <span className="mini-label">Monthly Base</span>
                                <strong>{formatCurrency(sch.monthly_amount)} / mo</strong>
                              </div>
                              <div className="scheme-stat">
                                <span className="mini-label">Target Value</span>
                                <strong>{formatCurrency(sch.total_target_amount)}</strong>
                              </div>
                              <div className="scheme-stat">
                                <span className="mini-label">Progress</span>
                                <strong>{paidInsts.length} of {sch.total_months} Months</strong>
                              </div>
                              <div className="scheme-stat">
                                <span className="mini-label">Actual Paid</span>
                                <strong className="text-danger">{formatCurrency(totalCashPaid)}</strong>
                              </div>
                            </div>

                            <div>
                              <div className="progress-meta">
                                <span>Months completed</span>
                                <strong>{progressPct}%</strong>
                              </div>
                              <div className="progress">
                                <div className="progress-bar" style={{ width: `${progressPct}%`, background: getProgressBarGradient(progressPct) }} />
                              </div>
                            </div>

                            {/* DIVIDEND SAVED BADGE */}
                            {sch.type === 'Chit Fund' && (
                              <div className="dividend-banner">
                                <span><Coins size={14} /> Dividend Saved So Far</span>
                                <strong>+{formatCurrency(totalDividendSaved)}</strong>
                              </div>
                            )}

                            {sch.general_notes && (
                              <p className="scheme-notes">"{sch.general_notes}"</p>
                            )}

                            <button
                              className={`btn btn-block ${isSelected ? 'btn-primary' : 'btn-secondary'}`}
                              onClick={() => setSelectedSchemeId(isSelected ? null : sch.id)}
                            >
                              {isSelected ? 'Hide Installment Schedule' : 'View Monthly Schedule & Notes'} {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* EXPANDED SCHEDULE TABLE */}
                  {selectedSchemeId && (() => {
                    const sch = schemes.find((s) => s.id === selectedSchemeId);
                    if (!sch) return null;
                    const schInsts = installments.filter((i) => i.scheme_id === sch.id);

                    return (
                      <div className="card table-card">
                        <div className="table-card-header">
                          <div>
                            <h3 className="card-title">{sch.title} - Monthly Schedule</h3>
                            <p className="card-subtitle">Base Installment: {formatCurrency(sch.monthly_amount)} / month | Type: {sch.type}</p>
                          </div>
                          <button className="btn btn-secondary btn-sm" onClick={() => setSelectedSchemeId(null)}>
                            Close Table <X size={14} />
                          </button>
                        </div>

                        <div className="table-container">
                          <table className="data-table">
                            <thead>
                              <tr>
                                <th>Month #</th>
                                <th>Scheduled Due Date</th>
                                <th>Base Amount</th>
                                <th>Actual Paid (₹)</th>
                                <th>Dividend Benefit</th>
                                <th>Status</th>
                                <th>Custom Month Notes</th>
                                <th className="th-right">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {schInsts.map((inst) => {
                                const isEditing = editingInstId === inst.id;
                                const baseAmt = Number(sch.monthly_amount);
                                const paidAmt = Number(inst.amount_paid);
                                const dividendBenefit = inst.status === 'Paid' && baseAmt > paidAmt ? baseAmt - paidAmt : 0;

                                return (
                                  <tr key={inst.id}>
                                    <td className="cell-month">Month {inst.month_number}</td>
                                    <td className="cell-muted">{inst.due_date}</td>
                                    <td className="cell-strong">{formatCurrency(baseAmt)}</td>

                                    <td>
                                      {isEditing ? (
                                        <input
                                          type="number"
                                          className="input-sm"
                                          style={{ width: '120px' }}
                                          value={instForm.amount_paid}
                                          onChange={(e) => setInstForm({ ...instForm, amount_paid: e.target.value })}
                                        />
                                      ) : (
                                        <span className={inst.status === 'Paid' ? 'cell-amount' : 'cell-muted'} style={{ fontWeight: 800 }}>
                                          {inst.status === 'Paid' ? formatCurrency(paidAmt) : '₹0'}
                                        </span>
                                      )}
                                    </td>

                                    <td>
                                      {dividendBenefit > 0 ? (
                                        <span className="badge badge-success">+{formatCurrency(dividendBenefit)} Saved</span>
                                      ) : (
                                        <span className="cell-muted">-</span>
                                      )}
                                    </td>

                                    <td>
                                      <span className={`badge ${inst.status === 'Paid' ? 'badge-success' : 'badge-warning'}`}>
                                        {inst.status === 'Paid' ? <Check size={12} /> : <Clock size={12} />} {inst.status}
                                      </span>
                                    </td>

                                    <td>
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          className="input-sm"
                                          placeholder="e.g. Paid via GPay / Auction taken"
                                          style={{ minWidth: '200px' }}
                                          value={instForm.notes}
                                          onChange={(e) => setInstForm({ ...instForm, notes: e.target.value })}
                                        />
                                      ) : (
                                        <span className="cell-muted" style={{ fontSize: '0.84rem' }}>{inst.notes || '—'}</span>
                                      )}
                                    </td>

                                    <td className="cell-actions">
                                      {isEditing ? (
                                        <div className="inline-actions">
                                          <button
                                            className="icon-btn icon-btn-success"
                                            title="Save payment"
                                            aria-label="Save payment"
                                            onClick={() => handleUpdateInstallment(inst.id, instForm.amount_paid, instForm.notes, 'Paid')}
                                          >
                                            <Check size={15} />
                                          </button>
                                          <button
                                            className="icon-btn icon-btn-danger"
                                            title="Cancel"
                                            aria-label="Cancel editing"
                                            onClick={() => setEditingInstId(null)}
                                          >
                                            <X size={15} />
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          className="btn btn-secondary btn-sm"
                                          onClick={() => {
                                            setEditingInstId(inst.id);
                                            setInstForm({ amount_paid: String(inst.amount_paid || sch.monthly_amount), notes: inst.notes || '' });
                                          }}
                                        >
                                          <Edit2 size={13} /> Log Payment
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* VIEW 4: MENSTRUAL TRACKER */}
              {currentView === 'menstrual' && (
                <div className="page">
                  <section className="hero">
                    <div className="hero-content">
                      <span className="hero-eyebrow"><HeartPulse size={14} /> Menstrual Tracker</span>
                      <h2 className="hero-title">Cycle Overview</h2>
                      <div className="hero-meta">
                        <span className="hero-pill"><Calendar size={14} /> Log and review your period cycles</span>
                      </div>
                    </div>
                  </section>

                  <div className="grid-3">
                    <StatCard
                      label="Avg Flow Duration"
                      icon={Clock}
                      tone="indigo"
                      value={avgCycleDays > 0 ? `${avgCycleDays} Days` : 'No Data'}
                    />
                    <StatCard
                      label="Total Logged Cycles"
                      icon={Flame}
                      tone="indigo"
                      value={cycles.length}
                    />
                    <StatCard
                      label="Last Recorded Period"
                      icon={Sparkles}
                      tone="indigo"
                      value={cycles.length > 0 ? formatDateFormatted(cycles[0].start_date) : 'None Yet'}
                      valueClass="text-primary stat-value-sm"
                    />
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h3 className="card-title">Log Period Cycle</h3>
                    </div>
                    <form onSubmit={handleAddCycle} className="cycle-form">
                      <div className="field">
                        <label className="field-label" htmlFor="cycle-start">Start Date</label>
                        <input id="cycle-start" type="date" required value={cycleForm.start_date} onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })} />
                      </div>
                      <div className="field">
                        <label className="field-label" htmlFor="cycle-end">End Date</label>
                        <input id="cycle-end" type="date" required value={cycleForm.end_date} onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })} />
                      </div>
                      <button type="submit" className="btn btn-primary"><Plus size={16} /> Save Range</button>
                    </form>
                  </div>

                  <h3 className="section-title">Cycle History</h3>
                  {cycles.length === 0 ? (
                    <div className="card empty-state">
                      <span className="empty-icon"><HeartPulse size={28} /></span>
                      <p>No cycles logged yet. Add your first range above.</p>
                    </div>
                  ) : (
                    <div className="grid-3">
                      {cycles.map((item) => (
                        <div key={item.id} className="card cycle-card">
                          <div className="cycle-card-head">
                            <span className="cycle-month">
                              <span className="stat-icon tone-indigo" style={{ width: '32px', height: '32px' }}><Calendar size={15} /></span>
                              {formatMonthLabel(getMonthKey(item.start_date))}
                            </span>
                            <button onClick={() => handleDeleteCycle(item.id)} className="icon-btn icon-btn-danger" title="Delete record" aria-label="Delete cycle record"><Trash2 size={15} /></button>
                          </div>
                          <div className="cycle-range">{formatDateFormatted(item.start_date)} — {formatDateFormatted(item.end_date)}</div>
                          <span className="cycle-days">
                            <Flame size={14} /> {calculateDaysDiff(item.start_date, item.end_date)} Days Flow
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* BOTTOM NAVIGATION (TABLET / MOBILE) */}
      <nav className="bottom-nav" aria-label="Main navigation">
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentView === tab.id;
          return (
            <button
              key={tab.id}
              data-tab={tab.id}
              className={`bottom-nav-item${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'page' : undefined}
              aria-label={tab.label}
              onClick={() => setCurrentView(tab.id)}
            >
              <Icon size={20} />
              <span>{tab.shortLabel}</span>
            </button>
          );
        })}
      </nav>

      {/* MODAL: ADD EXPENSE */}
      {isAddExpenseOpen && (
        <div className="modal-backdrop">
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="add-expense-title">
            <div className="modal-header">
              <h3 id="add-expense-title" className="modal-title">Add New Expense</h3>
              <button onClick={() => setIsAddExpenseOpen(false)} className="icon-btn" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddExpense} className="form-stack">
              <div className="field"><label className="field-label" htmlFor="exp-amount">Amount (₹)</label><input id="exp-amount" type="number" required placeholder="e.g. 250" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} /></div>
              <div className="field"><label className="field-label" htmlFor="exp-category">Category</label><select id="exp-category" value={expenseForm.category_id} onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div className="field"><label className="field-label" htmlFor="exp-description">Description</label><input id="exp-description" type="text" placeholder="e.g. Fuel, Flowers..." value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} /></div>
              <div className="form-grid-2">
                <div className="field"><label className="field-label" htmlFor="exp-added-by">Added By</label><input id="exp-added-by" type="text" value={expenseForm.added_by} onChange={(e) => setExpenseForm({ ...expenseForm, added_by: e.target.value })} /></div>
                <div className="field"><label className="field-label" htmlFor="exp-date">Date</label><input id="exp-date" type="date" required value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} /></div>
              </div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: '4px' }}>Save Expense</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SCHEME */}
      {isAddSchemeOpen && (
        <div className="modal-backdrop">
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="add-scheme-title">
            <div className="modal-header">
              <h3 id="add-scheme-title" className="modal-title">Add New Chit / Loan</h3>
              <button onClick={() => setIsAddSchemeOpen(false)} className="icon-btn" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleAddScheme} className="form-stack">
              <div className="field"><label className="field-label" htmlFor="add-sch-title">Scheme Title</label><input id="add-sch-title" type="text" required placeholder="e.g. Sri Lakshmi 20-Month Chit" value={schemeForm.title} onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })} /></div>
              <div className="form-grid-2">
                <div className="field"><label className="field-label" htmlFor="add-sch-type">Type</label><select id="add-sch-type" value={schemeForm.type} onChange={(e) => setSchemeForm({ ...schemeForm, type: e.target.value })}><option value="Chit Fund">Chit Fund</option><option value="Loan Taken">Loan Taken</option><option value="Loan Given">Loan Given</option></select></div>
                <div className="field"><label className="field-label" htmlFor="add-sch-months">Duration (Months)</label><input id="add-sch-months" type="number" required value={schemeForm.total_months} onChange={(e) => setSchemeForm({ ...schemeForm, total_months: e.target.value })} /></div>
              </div>
              <div className="form-grid-2">
                <div className="field"><label className="field-label" htmlFor="add-sch-amount">Monthly Base (₹)</label><input id="add-sch-amount" type="number" required value={schemeForm.monthly_amount} onChange={(e) => setSchemeForm({ ...schemeForm, monthly_amount: e.target.value })} /></div>
                <div className="field"><label className="field-label" htmlFor="add-sch-start">Start Date</label><input id="add-sch-start" type="date" required value={schemeForm.start_date} onChange={(e) => setSchemeForm({ ...schemeForm, start_date: e.target.value })} /></div>
              </div>
              <div className="field"><label className="field-label" htmlFor="add-sch-notes">Organizer & General Notes</label><textarea id="add-sch-notes" rows="3" placeholder="Write organizer details, auction payout rules, or contact info..." value={schemeForm.general_notes} onChange={(e) => setSchemeForm({ ...schemeForm, general_notes: e.target.value })} /></div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: '4px' }}>Save Scheme & Generate Schedule</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SCHEME */}
      {editingSchemeId && (
        <div className="modal-backdrop">
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-labelledby="edit-scheme-title">
            <div className="modal-header">
              <h3 id="edit-scheme-title" className="modal-title">Edit Chit / Loan Scheme</h3>
              <button onClick={() => setEditingSchemeId(null)} className="icon-btn" aria-label="Close">
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveEditedScheme} className="form-stack">
              <div className="field"><label className="field-label" htmlFor="edit-sch-title">Scheme Title</label><input id="edit-sch-title" type="text" required value={schemeForm.title} onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })} /></div>
              <div className="form-grid-2">
                <div className="field"><label className="field-label" htmlFor="edit-sch-type">Type</label><select id="edit-sch-type" value={schemeForm.type} onChange={(e) => setSchemeForm({ ...schemeForm, type: e.target.value })}><option value="Chit Fund">Chit Fund</option><option value="Loan Taken">Loan Taken</option><option value="Loan Given">Loan Given</option></select></div>
                <div className="field"><label className="field-label" htmlFor="edit-sch-months">Duration (Months)</label><input id="edit-sch-months" type="number" required value={schemeForm.total_months} onChange={(e) => setSchemeForm({ ...schemeForm, total_months: e.target.value })} /></div>
              </div>
              <div className="form-grid-2">
                <div className="field"><label className="field-label" htmlFor="edit-sch-amount">Monthly Base (₹)</label><input id="edit-sch-amount" type="number" required value={schemeForm.monthly_amount} onChange={(e) => setSchemeForm({ ...schemeForm, monthly_amount: e.target.value })} /></div>
                <div className="field"><label className="field-label" htmlFor="edit-sch-start">Start Date</label><input id="edit-sch-start" type="date" required value={schemeForm.start_date} onChange={(e) => setSchemeForm({ ...schemeForm, start_date: e.target.value })} /></div>
              </div>
              <div className="field"><label className="field-label" htmlFor="edit-sch-notes">Organizer & General Notes</label><textarea id="edit-sch-notes" rows="3" value={schemeForm.general_notes} onChange={(e) => setSchemeForm({ ...schemeForm, general_notes: e.target.value })} /></div>
              <button type="submit" className="btn btn-primary btn-lg btn-block" style={{ marginTop: '4px' }}>Save Scheme Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteTargetId && (
        <div className="modal-backdrop">
          <div className="modal modal-sm" role="alertdialog" aria-modal="true" aria-labelledby="delete-title">
            <span className="modal-icon"><Trash2 size={24} /></span>
            <h3 id="delete-title" className="modal-title">Confirm Delete</h3>
            <p className="modal-text">Are you sure you want to delete this expense record?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDeleteTargetId(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={handleDeleteExpense}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
