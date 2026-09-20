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
    return 'linear-gradient(90deg, #FF3B6E, #C4114A)';
  } else if (percentage >= 65) {
    return 'linear-gradient(90deg, #FFC93C, #FF7A29, #FF3B6E)';
  } else if (percentage >= 35) {
    return 'linear-gradient(90deg, #10b981, #FFC93C, #FF7A29)';
  }
  return 'linear-gradient(90deg, #10b981, #34d399)';
};

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

  // Page background: Keep consistent white/cream glass for all tabs except menstrual
  const pageBackground = currentView === 'menstrual' ? '#0B0614' : 'transparent';

  // --- GLOSSY LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="glass-card" style={{ width: '100%', maxWidth: '400px', background: 'rgba(255, 255, 255, 0.94)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #FF7A29, #FF3B6E)', color: 'white', borderRadius: '18px', padding: '16px', marginBottom: '14px' }}>
              <Wallet size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#2B160E' }}>Tamil Pooja Suite</h2>
            <p style={{ fontSize: '0.85rem', color: '#6E5347', fontWeight: '600' }}>Cloud Personal Finance Portal</p>
          </div>

          {authError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '10px 14px', borderRadius: '12px', fontSize: '0.82rem', marginBottom: '16px', textAlign: 'center', fontWeight: '600' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <input
              type="text"
              required
              autoComplete="off"
              placeholder="Username (tamil / pooja)"
              value={authUsername}
              onChange={(e) => setAuthUsername(e.target.value)}
            />
            <input
              type="password"
              required
              autoComplete="off"
              placeholder="Password"
              value={authPassword}
              onChange={(e) => setAuthPassword(e.target.value)}
            />
            <button type="submit" className="btn-primary" style={{ height: '46px', width: '100%' }}>
              Log In <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: '22px', textAlign: 'center', color: '#6E5347', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <ShieldCheck size={14} color="#0FA968" /> Encrypted Cloud Sync Active
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', paddingBottom: '48px', background: pageBackground, transition: 'background 0.3s ease' }}>
      {/* NAVIGATION */}
      <nav
        className="glass-nav"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '14px 24px',
          background: currentView === 'menstrual' ? 'rgba(11, 6, 20, 0.9)' : undefined,
          borderColor: currentView === 'menstrual' ? 'rgba(255, 46, 122, 0.3)' : undefined
        }}
      >
        <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                background: currentView === 'menstrual' ? 'linear-gradient(135deg, #FF2E7A, #9A1750)' : 'linear-gradient(135deg, #FF7A29, #FF3B6E)',
                color: 'white',
                borderRadius: '12px',
                padding: '10px',
                display: 'flex',
                boxShadow: '0 4px 14px rgba(255,122,41,0.3)'
              }}
            >
              {currentView === 'menstrual' ? <Flame size={20} /> : <Wallet size={20} />}
            </div>
            <div>
              <h1
                style={{
                  fontWeight: '800',
                  fontSize: '1.2rem',
                  color: currentView === 'menstrual' ? '#ffffff' : '#2B160E'
                }}
              >
                Tamil Pooja Suite
              </h1>
              <span
                style={{
                  fontSize: '0.75rem',
                  color: currentView === 'menstrual' ? '#FF2E7A' : '#6E5347',
                  fontWeight: '600'
                }}
              >
                {currentView === 'menstrual' ? 'Dark Rose Cycle Tracker' : 'Personal Finance & Chits Suite'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <div
              style={{
                display: 'flex',
                background: currentView === 'menstrual' ? 'rgba(28, 14, 42, 0.85)' : 'rgba(255, 255, 255, 0.75)',
                padding: '4px',
                borderRadius: '99px',
                border: currentView === 'menstrual' ? '1px solid rgba(255, 46, 122, 0.3)' : '1px solid var(--line)'
              }}
            >
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'transactions', label: 'Transactions', icon: Receipt },
                { id: 'loans', label: 'Loans & Chits', icon: Landmark },
                { id: 'menstrual', label: 'Menstrual Tracker', icon: HeartPulse }
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = currentView === tab.id;
                const isMenstrualTab = tab.id === 'menstrual';
                return (
                  <button
                    key={tab.id}
                    onClick={() => setCurrentView(tab.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '8px 16px',
                      borderRadius: '99px',
                      border: 'none',
                      background: isActive
                        ? isMenstrualTab
                          ? 'linear-gradient(135deg, #FF2E7A, #9A1750)'
                          : 'linear-gradient(135deg, #FF7A29, #FF3B6E)'
                        : 'transparent',
                      color: isActive ? '#ffffff' : currentView === 'menstrual' ? '#94a3b8' : '#6E5347',
                      fontWeight: isActive ? '700' : '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer'
                    }}
                  >
                    <Icon size={15} /> <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="user-badge"><User size={13} /> {currentUser}</span>
              <button onClick={handleLogout} title="Log Out" className="btn-secondary" style={{ height: '36px', width: '36px', padding: 0, borderRadius: '10px', color: '#ef4444' }}>
                <LogOut size={16} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* MAIN CONTAINER */}
      <main style={{ maxWidth: '1120px', margin: '28px auto 0', padding: '0 16px' }}>
        {isLoading ? (
          <div style={{ padding: '80px 0', textAlign: 'center', color: '#FF7A29' }}>
            <p style={{ fontWeight: '700' }}>Loading data...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: DASHBOARD */}
            {currentView === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* HERO ACTION BAR WITH ADD EXPENSE BUTTON & DAILY PACE */}
                <div
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    padding: '20px 24px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(255, 239, 214, 0.8))',
                    border: '1.5px solid rgba(255, 122, 41, 0.3)',
                    boxShadow: '0 8px 30px rgba(255, 122, 41, 0.12)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #FF7A29, #FF3B6E)', color: 'white', padding: '14px', borderRadius: '18px', display: 'flex' }}>
                      <Sparkles size={26} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#2B160E', letterSpacing: '-0.01em' }}>
                        Welcome back, {currentUser}!
                      </h2>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '3px', flexWrap: 'wrap', fontSize: '0.8rem', color: '#6E5347' }}>
                        <span>Daily Pace: <strong>{formatCurrency(dailyAverageSpend)} / day</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* ADD NEW EXPENSE HERO BUTTON */}
                  <button className="btn-glossy-hero" onClick={() => setIsAddExpenseOpen(true)}>
                    <Plus size={18} /> Add New Expense
                  </button>
                </div>

                {/* 4 CORE DASHBOARD KPI CARDS (DIRECTLY BELOW HERO) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
                  
                  {/* CARD 1: TOTAL SPENT (CURRENT MONTH) */}
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6E5347', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        TOTAL SPENT
                      </span>
                      <div style={{ padding: '8px', borderRadius: '10px', background: '#fef2f2', color: '#FF3B6E' }}>
                        <TrendingDown size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#2B160E', marginTop: '12px' }}>
                      {formatCurrency(currentMonthExpensesTotal)}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#6E5347', marginTop: '4px', display: 'block' }}>
                      Total spend in {formatMonthLabel(currentMonthKey)}
                    </span>
                  </div>

                  {/* CARD 2: LOGGED EXPENSES COUNT */}
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6E5347', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        LOGGED EXPENSES
                      </span>
                      <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255, 201, 60, 0.2)', color: '#B8860B' }}>
                        <Receipt size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#2B160E', marginTop: '12px' }}>
                      {currentMonthExpensesCount} <span style={{ fontSize: '1rem', color: '#6E5347' }}>Entries</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#6E5347', marginTop: '4px', display: 'block' }}>
                      Recorded transactions this month
                    </span>
                  </div>

                  {/* CARD 3: NO-EXPENSE DAYS */}
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6E5347', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        NO-EXPENSE DAYS
                      </span>
                      <div style={{ padding: '8px', borderRadius: '10px', background: '#ecfdf5', color: '#0FA968' }}>
                        <Award size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0FA968', marginTop: '12px' }}>
                      {noExpenseDaysCount} <span style={{ fontSize: '1rem' }}>Days Clean</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#6E5347', marginTop: '4px', display: 'block' }}>
                      Zero-spend days saved this month
                    </span>
                  </div>

                  {/* CARD 4: TOTAL SPENT TODAY */}
                  <div className="glass-card" style={{ border: todaySpentTotal > 0 ? '1.5px solid rgba(255, 122, 41, 0.4)' : undefined }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6E5347', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        SPENT TODAY
                      </span>
                      <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255, 122, 41, 0.15)', color: '#FF7A29' }}>
                        <Clock size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: '800', color: todaySpentTotal > 0 ? '#E85D04' : '#0FA968', marginTop: '12px' }}>
                      {formatCurrency(todaySpentTotal)}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#6E5347', marginTop: '4px', display: 'block' }}>
                      {todayExpensesCount > 0 ? `${todayExpensesCount} transaction${todayExpensesCount === 1 ? '' : 's'} logged today` : '₹0 spent so far today'}
                    </span>
                  </div>

                </div>

                {/* CHARTS ROW */}
                <div className="grid-2">
                  <div className="glass-card">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#2B160E', marginBottom: '20px' }}>Monthly Spending Trend</h3>
                    <div style={{ width: '100%', height: '220px' }}>
                      <ResponsiveContainer>
                        <AreaChart data={monthlyTrendData}>
                          <defs>
                            <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#FF7A29" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#FF3B6E" stopOpacity={0.0} />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="month" stroke="#6E5347" fontSize={12} tickLine={false} />
                          <YAxis stroke="#6E5347" fontSize={12} tickLine={false} />
                          <Tooltip formatter={(value) => formatCurrency(value)} />
                          <Area type="monotone" dataKey="amount" stroke="#FF7A29" strokeWidth={2.5} fillOpacity={1} fill="url(#trendGradient)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  <div className="glass-card">
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#2B160E', marginBottom: '20px' }}>
                      Category Breakdown ({formatMonthLabel(currentMonthKey)})
                    </h3>
                    <div style={{ display: 'flex', alignItems: 'center', height: '220px' }}>
                      <div style={{ width: '50%', height: '100%' }}>
                        <ResponsiveContainer>
                          <PieChart>
                            <Pie data={categoryBreakdownData} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                              {categoryBreakdownData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Pie>
                            <Tooltip formatter={(val) => formatCurrency(val)} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      <div style={{ width: '50%', maxHeight: '180px', overflowY: 'auto', paddingLeft: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {categoryBreakdownData.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                              <span style={{ color: '#2B160E', fontWeight: '600' }}>{item.name}</span>
                            </div>
                            <span style={{ fontWeight: '800', color: '#2B160E' }}>{formatCurrency(item.value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* HISTORICAL PEAK BENCHMARKS & CATEGORY HEADROOM RADAR */}
                <div className="glass-card" style={{ padding: '24px', border: '1.5px solid rgba(212, 160, 23, 0.3)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '10px' }}>
                    <div>
                      <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#FF7A29', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255, 122, 41, 0.12)', padding: '3px 10px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <TrendingUp size={13} /> CATEGORY BENCHMARK MATRIX
                      </span>
                      <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#2B160E', marginTop: '6px' }}>
                        Historical Peak Spending vs. This Month
                      </h3>
                      <p style={{ fontSize: '0.8rem', color: '#6E5347', marginTop: '2px' }}>
                        Tracks your all-time record spend for each category and measures your current month headroom
                      </p>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#6E5347', background: '#FAF6EE', padding: '6px 12px', borderRadius: '10px', border: '1px solid var(--line)' }}>
                        Current Month: <strong>{formatMonthLabel(currentMonthKey)}</strong>
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
                    {allTimeCategoryPeaks.map((cat) => {
                      const IconComponent = ICON_MAP[cat.icon] || MoreHorizontal;
                      return (
                        <div
                          key={cat.id}
                          style={{
                            padding: '16px 18px',
                            background: '#ffffff',
                            borderRadius: '16px',
                            border: cat.isCurrentMonthPeak
                              ? '1.5px solid #FF3B6E'
                              : cat.pctOfPeak >= 75
                              ? '1.5px solid #FFCB4D'
                              : '1px solid var(--line)',
                            boxShadow: '0 4px 14px rgba(43, 22, 14, 0.03)',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ background: cat.color + '18', color: cat.color, padding: '8px', borderRadius: '10px', display: 'flex' }}>
                                <IconComponent size={18} />
                              </div>
                              <div>
                                <span style={{ fontWeight: '800', color: '#2B160E', fontSize: '0.95rem' }}>{cat.name}</span>
                              </div>
                            </div>

                            {cat.isCurrentMonthPeak ? (
                              <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#ffffff', background: 'linear-gradient(135deg, #FF3B6E, #C4114A)', padding: '3px 8px', borderRadius: '99px' }}>
                                🔥 Record High Month!
                              </span>
                            ) : cat.pctOfPeak >= 75 ? (
                              <span style={{ fontSize: '0.7rem', fontWeight: '800', color: '#b45309', background: '#fef3c7', padding: '3px 8px', borderRadius: '99px' }}>
                                ⚠️ {cat.pctOfPeak}% of Record
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.7rem', fontWeight: '700', color: '#0FA968', background: '#ecfdf5', padding: '3px 8px', borderRadius: '99px' }}>
                                ✅ {cat.pctOfPeak}% of Record
                              </span>
                            )}
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', padding: '10px 12px', background: '#FAF6EE', borderRadius: '12px', border: '1px solid rgba(212, 160, 23, 0.15)' }}>
                            <div>
                              <span style={{ fontSize: '0.68rem', color: '#6E5347', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>ALL-TIME PEAK</span>
                              <strong style={{ fontSize: '1.05rem', color: '#2B160E', fontWeight: '800', marginTop: '2px', display: 'block' }}>
                                {formatCurrency(cat.peakAmount)}
                              </strong>
                              <span style={{ fontSize: '0.7rem', color: '#E85D04', fontWeight: '600' }}>Month: {cat.peakMonth}</span>
                            </div>

                            <div style={{ textAlign: 'right' }}>
                              <span style={{ fontSize: '0.68rem', color: '#6E5347', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>THIS MONTH SPENT</span>
                              <strong style={{ fontSize: '1.05rem', color: cat.isCurrentMonthPeak ? '#FF3B6E' : '#2B160E', fontWeight: '800', marginTop: '2px', display: 'block' }}>
                                {formatCurrency(cat.currentMonthSpend)}
                              </strong>
                              <span style={{ fontSize: '0.7rem', color: '#6E5347' }}>
                                {cat.headroom > 0 ? `${formatCurrency(cat.headroom)} under peak` : 'At Peak'}
                              </span>
                            </div>
                          </div>

                          <div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: '#6E5347', marginBottom: '5px' }}>
                              <span>Month Usage vs Record</span>
                              <strong style={{ color: '#2B160E' }}>{cat.pctOfPeak}%</strong>
                            </div>
                            <div style={{ height: '7px', width: '100%', background: 'rgba(212, 160, 23, 0.18)', borderRadius: '99px', overflow: 'hidden' }}>
                              <div
                                style={{
                                  height: '100%',
                                  width: `${cat.pctOfPeak}%`,
                                  background: getProgressBarGradient(cat.pctOfPeak),
                                  borderRadius: '99px',
                                  transition: 'width 0.3s ease'
                                }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* RECENT TRANSACTIONS CONTAINER */}
                <div className="glass-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '800', color: '#2B160E' }}>Recent Transactions</h3>
                    <button className="btn-secondary" style={{ height: '34px', fontSize: '0.8rem' }} onClick={() => setCurrentView('transactions')}>
                      View All <ArrowRight size={14} />
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '12px' }}>
                    {recentExpenses.map((e) => {
                      const cat = categories.find((c) => c.id === e.category_id);
                      return (
                        <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: '#ffffff', borderRadius: '14px', border: '1px solid var(--line)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat ? cat.color : '#6E5347' }} />
                            <div>
                              <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#2B160E' }}>{e.description}</div>
                              <div style={{ fontSize: '0.78rem', color: '#6E5347' }}>
                                {cat ? cat.name : 'Other'} • {e.expense_date} • <span className="user-badge" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>{e.added_by || currentUser}</span>
                              </div>
                            </div>
                          </div>
                          <div style={{ fontWeight: '800', color: '#FF3B6E', fontSize: '0.95rem' }}>-{formatCurrency(e.amount)}</div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>
            )}

            {/* VIEW 2: TRANSACTIONS */}
            {currentView === 'transactions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#2B160E' }}>Transactions</h2>
                    <p style={{ fontSize: '0.8rem', color: '#6E5347' }}>Records for {formatMonthLabel(selectedMonth)}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button className="btn-pdf" onClick={handleExportPDF}><FileText size={16} /> Export PDF</button>
                    <button className="btn-primary" onClick={() => setIsAddExpenseOpen(true)}><Plus size={16} /> Add Expense</button>
                  </div>
                </div>

                <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700', display: 'block', marginBottom: '6px' }}>SEARCH KEYWORD</label>
                    <input type="text" placeholder="Filter descriptions..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700', display: 'block', marginBottom: '6px' }}>CATEGORY</label>
                    <select value={selectedCategoryFilter} onChange={(e) => setSelectedCategoryFilter(e.target.value)}>
                      <option value="ALL">All Categories</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700', display: 'block', marginBottom: '6px' }}>MONTH SELECTOR</label>
                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                  </div>
                </div>

                {isPreviousMonthSelected && (
                  <div className="glass-card" style={{ padding: '20px 24px', border: '1.5px solid rgba(255, 122, 41, 0.35)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6E5347', textTransform: 'uppercase' }}>HISTORICAL SUMMARY</span>
                        <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#2B160E', marginTop: '2px' }}>{formatMonthLabel(selectedMonth)} — Category Breakdown</h3>
                      </div>
                      <div style={{ background: 'rgba(255,122,41,0.12)', border: '1px solid rgba(255,122,41,0.3)', padding: '6px 16px', borderRadius: '12px', textAlign: 'right' }}>
                        <span style={{ fontSize: '0.7rem', color: '#6E5347', display: 'block', fontWeight: '700' }}>MONTH TOTAL SPENT</span>
                        <strong style={{ fontSize: '1.15rem', color: '#E85D04', fontWeight: '800' }}>{formatCurrency(selectedMonthTotalSpend)}</strong>
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '12px' }}>
                      {selectedMonthCategorySpend.map((cat) => {
                        const IconComponent = ICON_MAP[cat.icon] || MoreHorizontal;
                        const percentage = selectedMonthTotalSpend > 0 ? Math.round((cat.total / selectedMonthTotalSpend) * 100) : 0;
                        return (
                          <div key={cat.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#ffffff', borderRadius: '14px', border: '1px solid var(--line)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ background: cat.color + '18', color: cat.color, padding: '8px', borderRadius: '10px' }}><IconComponent size={16} /></div>
                              <div><div style={{ fontSize: '0.88rem', fontWeight: '700', color: '#2B160E' }}>{cat.name}</div><div style={{ fontSize: '0.72rem', color: '#6E5347' }}>{cat.count} entries ({percentage}%)</div></div>
                            </div>
                            <div style={{ fontWeight: '800', color: '#2B160E', fontSize: '0.95rem' }}>{formatCurrency(cat.total)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>Description</th><th>Category</th><th>Added By</th><th>Date</th><th>Amount</th><th style={{ textAlign: 'right' }}>Actions</th></tr></thead>
                      <tbody>
                        {filteredExpenses.map((exp) => {
                          const cat = categories.find((c) => c.id === exp.category_id);
                          return (
                            <tr key={exp.id}>
                              <td style={{ fontWeight: '700', color: '#2B160E' }}>{exp.description}</td>
                              <td><div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat ? cat.color : '#6E5347' }} />{cat ? cat.name : 'Other'}</div></td>
                              <td><span className="user-badge"><User size={12} /> {exp.added_by || currentUser}</span></td>
                              <td style={{ color: '#6E5347' }}>{exp.expense_date}</td>
                              <td style={{ color: '#FF3B6E', fontWeight: '800' }}>-{formatCurrency(exp.amount)}</td>
                              <td style={{ textAlign: 'right' }}>
                                <button onClick={() => setDeleteTargetId(exp.id)} style={{ background: '#fef2f2', color: '#FF3B6E', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 3: LOANS & CHITS (CLEAN PORCELAIN & GOLD GLASSMORPHISM) */}
            {currentView === 'loans' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                
                {/* HEADER ROW */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.35rem', fontWeight: '800', color: '#2B160E', letterSpacing: '-0.01em' }}>
                      Loans & Chit Funds
                    </h2>
                    <p style={{ fontSize: '0.8rem', color: '#6E5347', marginTop: '2px' }}>
                      Track monthly variable payments, dividend gains & loan repayments
                    </p>
                  </div>
                  <button className="btn-primary" onClick={() => setIsAddSchemeOpen(true)}>
                    <Plus size={16} /> Add Chit / Loan
                  </button>
                </div>

                {/* 4 KPI CARDS (LIGHT WHITE GLASS) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '20px' }}>
                  
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6E5347', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        ACTIVE SCHEMES
                      </span>
                      <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(255, 122, 41, 0.15)', color: '#FF7A29' }}>
                        <Landmark size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#2B160E', marginTop: '12px' }}>
                      {schemes.length} <span style={{ fontSize: '1rem', color: '#6E5347', fontWeight: '600' }}>Active</span>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#6E5347', marginTop: '4px', display: 'block' }}>
                      Chits & Loans enrolled
                    </span>
                  </div>

                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6E5347', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        TOTAL TARGET VALUE
                      </span>
                      <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(212, 160, 23, 0.15)', color: '#D4A017' }}>
                        <Coins size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#FF7A29', marginTop: '12px' }}>
                      {formatCurrency(schemes.reduce((acc, s) => acc + Number(s.total_target_amount), 0))}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#6E5347', marginTop: '4px', display: 'block' }}>
                      Cumulative nominal target
                    </span>
                  </div>

                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#6E5347', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        ACTUAL CASH PAID
                      </span>
                      <div style={{ padding: '8px', borderRadius: '10px', background: '#fef2f2', color: '#FF3B6E' }}>
                        <TrendingDown size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#FF3B6E', marginTop: '12px' }}>
                      {formatCurrency(installments.reduce((acc, i) => acc + Number(i.amount_paid || 0), 0))}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#6E5347', marginTop: '4px', display: 'block' }}>
                      Total money contributed
                    </span>
                  </div>

                  <div className="glass-card" style={{ border: '1.5px solid rgba(16, 185, 129, 0.35)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '800', color: '#0FA968', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        TOTAL DIVIDEND SAVED
                      </span>
                      <div style={{ padding: '8px', borderRadius: '10px', background: '#ecfdf5', color: '#0FA968' }}>
                        <Award size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.85rem', fontWeight: '800', color: '#0FA968', marginTop: '12px' }}>
                      {formatCurrency(
                        installments.reduce((acc, i) => {
                          const sch = schemes.find((s) => s.id === i.scheme_id);
                          if (!sch || i.status !== 'Paid') return acc;
                          const base = Number(sch.monthly_amount);
                          const paid = Number(i.amount_paid);
                          return acc + (base > paid ? base - paid : 0);
                        }, 0)
                      )}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#6E5347', marginTop: '4px', display: 'block' }}>
                      Auction discounts earned
                    </span>
                  </div>

                </div>

                {/* SCHEMES CONTAINER */}
                {schemes.length === 0 ? (
                  <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: '#6E5347' }}>
                    <Landmark size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.95rem' }}>
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
                        <div
                          key={sch.id}
                          className="glass-card"
                          style={{
                            borderColor: isSelected ? '#FF7A29' : undefined,
                            borderWidth: isSelected ? '2px' : '1px'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#FF7A29', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,122,41,0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                                {sch.type}
                              </span>
                              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#2B160E', marginTop: '6px' }}>
                                {sch.title}
                              </h3>
                            </div>

                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenEditScheme(sch)}
                                title="Edit Scheme Details"
                                style={{ background: '#FFF8ED', color: '#B8860B', border: '1px solid var(--line)', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                              >
                                <Settings size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteScheme(sch.id)}
                                title="Delete Scheme"
                                style={{ background: '#fef2f2', color: '#FF3B6E', border: 'none', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '12px', fontSize: '0.85rem' }}>
                            <div>
                              <span style={{ color: '#6E5347', display: 'block', fontSize: '0.75rem' }}>Monthly Base</span>
                              <strong style={{ color: '#2B160E' }}>{formatCurrency(sch.monthly_amount)} / mo</strong>
                            </div>
                            <div>
                              <span style={{ color: '#6E5347', display: 'block', fontSize: '0.75rem' }}>Target Value</span>
                              <strong style={{ color: '#2B160E' }}>{formatCurrency(sch.total_target_amount)}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#6E5347', display: 'block', fontSize: '0.75rem' }}>Progress</span>
                              <strong style={{ color: '#2B160E' }}>{paidInsts.length} of {sch.total_months} Months</strong>
                            </div>
                            <div>
                              <span style={{ color: '#6E5347', display: 'block', fontSize: '0.75rem' }}>Actual Paid</span>
                              <strong style={{ color: '#FF3B6E' }}>{formatCurrency(totalCashPaid)}</strong>
                            </div>
                          </div>

                          {/* DIVIDEND SAVED BADGE */}
                          {sch.type === 'Chit Fund' && (
                            <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', padding: '8px 12px', borderRadius: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.78rem', color: '#0FA968', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Coins size={14} /> Dividend Saved So Far
                              </span>
                              <strong style={{ fontSize: '0.92rem', color: '#0FA968', fontWeight: '800' }}>
                                +{formatCurrency(totalDividendSaved)}
                              </strong>
                            </div>
                          )}

                          {/* PROGRESS BAR */}
                          <div style={{ height: '8px', width: '100%', background: 'var(--line)', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px' }}>
                            <div style={{ height: '100%', width: `${progressPct}%`, background: getProgressBarGradient(progressPct), borderRadius: '99px', transition: 'width 0.3s ease' }} />
                          </div>

                          {sch.general_notes && (
                            <p style={{ fontSize: '0.8rem', color: '#6E5347', fontStyle: 'italic', marginBottom: '16px', background: 'rgba(255,255,255,0.6)', padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--line)' }}>
                              "{sch.general_notes}"
                            </p>
                          )}

                          <button
                            className={isSelected ? "btn-primary" : "btn-secondary"}
                            style={{ width: '100%', height: '38px', fontSize: '0.85rem' }}
                            onClick={() => setSelectedSchemeId(isSelected ? null : sch.id)}
                          >
                            {isSelected ? 'Hide Installment Schedule' : 'View Monthly Schedule & Notes'} {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* EXPANDED SCHEDULE TABLE (CLEAN WHITE GLASSMORPHISM) */}
                {selectedSchemeId && (() => {
                  const sch = schemes.find((s) => s.id === selectedSchemeId);
                  if (!sch) return null;
                  const schInsts = installments.filter((i) => i.scheme_id === sch.id);

                  return (
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '2px solid #FF7A29' }}>
                      <div style={{ padding: '18px 24px', background: 'rgba(255, 122, 41, 0.08)', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#2B160E' }}>{sch.title} - Monthly Schedule</h3>
                          <p style={{ fontSize: '0.8rem', color: '#6E5347' }}>Base Installment: {formatCurrency(sch.monthly_amount)} / month | Type: {sch.type}</p>
                        </div>
                        <button className="btn-secondary" style={{ height: '32px', fontSize: '0.78rem' }} onClick={() => setSelectedSchemeId(null)}>
                          Close Table <X size={14} />
                        </button>
                      </div>

                      <div className="table-container">
                        <table>
                          <thead>
                            <tr>
                              <th>Month #</th>
                              <th>Scheduled Due Date</th>
                              <th>Base Amount</th>
                              <th>Actual Paid (₹)</th>
                              <th>Dividend Benefit</th>
                              <th>Status</th>
                              <th>Custom Month Notes</th>
                              <th style={{ textAlign: 'right' }}>Actions</th>
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
                                  <td style={{ fontWeight: '800', color: '#FF7A29' }}>Month {inst.month_number}</td>
                                  <td style={{ color: '#6E5347' }}>{inst.due_date}</td>
                                  <td style={{ fontWeight: '700', color: '#2B160E' }}>{formatCurrency(baseAmt)}</td>
                                  
                                  <td>
                                    {isEditing ? (
                                      <input
                                        type="number"
                                        style={{ width: '110px', height: '34px' }}
                                        value={instForm.amount_paid}
                                        onChange={(e) => setInstForm({ ...instForm, amount_paid: e.target.value })}
                                      />
                                    ) : (
                                      <span style={{ fontWeight: '800', color: inst.status === 'Paid' ? '#FF3B6E' : '#94a3b8' }}>
                                        {inst.status === 'Paid' ? formatCurrency(paidAmt) : '₹0'}
                                      </span>
                                    )}
                                  </td>

                                  <td>
                                    {dividendBenefit > 0 ? (
                                      <span style={{ background: '#ecfdf5', color: '#0FA968', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800' }}>
                                        +{formatCurrency(dividendBenefit)} Saved
                                      </span>
                                    ) : (
                                      <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>-</span>
                                    )}
                                  </td>

                                  <td>
                                    <span
                                      style={{
                                        background: inst.status === 'Paid' ? '#ecfdf5' : '#fef3c7',
                                        color: inst.status === 'Paid' ? '#0FA968' : '#b45309',
                                        padding: '4px 10px',
                                        borderRadius: '99px',
                                        fontSize: '0.78rem',
                                        fontWeight: '800'
                                      }}
                                    >
                                      {inst.status}
                                    </span>
                                  </td>

                                  <td>
                                    {isEditing ? (
                                      <input
                                        type="text"
                                        placeholder="e.g. Paid via GPay / Auction taken"
                                        style={{ minWidth: '180px', height: '34px' }}
                                        value={instForm.notes}
                                        onChange={(e) => setInstForm({ ...instForm, notes: e.target.value })}
                                      />
                                    ) : (
                                      <span style={{ fontSize: '0.82rem', color: '#6E5347' }}>{inst.notes || '—'}</span>
                                    )}
                                  </td>

                                  <td style={{ textAlign: 'right' }}>
                                    {isEditing ? (
                                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                        <button
                                          style={{ background: '#0FA968', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                                          onClick={() => handleUpdateInstallment(inst.id, instForm.amount_paid, instForm.notes, 'Paid')}
                                        >
                                          <Check size={14} />
                                        </button>
                                        <button
                                          style={{ background: '#FF3B6E', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
                                          onClick={() => setEditingInstId(null)}
                                        >
                                          <X size={14} />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        className="btn-secondary"
                                        style={{ height: '30px', padding: '0 10px', fontSize: '0.75rem' }}
                                        onClick={() => {
                                          setEditingInstId(inst.id);
                                          setInstForm({ amount_paid: String(inst.amount_paid || sch.monthly_amount), notes: inst.notes || '' });
                                        }}
                                      >
                                        <Edit2 size={12} /> Log Payment
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
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div className="grid-3">
                  <div className="dark-glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>AVG FLOW DURATION</span><Clock size={18} color="#FF2E7A" /></div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', marginTop: '12px' }}>{avgCycleDays > 0 ? `${avgCycleDays} Days` : 'No Data'}</div>
                  </div>
                  <div className="dark-glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>TOTAL LOGGED CYCLES</span><Flame size={18} color="#FF2E7A" /></div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', marginTop: '12px' }}>{cycles.length}</div>
                  </div>
                  <div className="dark-glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8' }}>LAST RECORDED PERIOD</span><Sparkles size={18} color="#FF2E7A" /></div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FF2E7A', marginTop: '14px' }}>{cycles.length > 0 ? formatDateFormatted(cycles[0].start_date) : 'None Yet'}</div>
                  </div>
                </div>

                <div className="dark-glass-card" style={{ border: '1px solid rgba(255, 42, 109, 0.4)' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff', marginBottom: '16px' }}>Log Period Cycle</h3>
                  <form onSubmit={handleAddCycle} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'end' }}>
                    <div><label style={{ fontSize: '0.78rem', color: '#FF2E7A', fontWeight: '700', display: 'block', marginBottom: '6px' }}>START DATE</label><input type="date" required className="dark-input" value={cycleForm.start_date} onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })} /></div>
                    <div><label style={{ fontSize: '0.78rem', color: '#FF2E7A', fontWeight: '700', display: 'block', marginBottom: '6px' }}>END DATE</label><input type="date" required className="dark-input" value={cycleForm.end_date} onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })} /></div>
                    <button type="submit" className="btn-neon" style={{ width: '100%' }}><Plus size={16} /> Save Range</button>
                  </form>
                </div>

                <div className="grid-3">
                  {cycles.map((item) => (
                    <div key={item.id} className="dark-glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                        <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#FF2E7A' }}>{formatMonthLabel(getMonthKey(item.start_date))}</span>
                        <button onClick={() => handleDeleteCycle(item.id)} style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}><Trash2 size={14} /></button>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: '#ffffff', marginBottom: '12px' }}>{formatDateFormatted(item.start_date)} — {formatDateFormatted(item.end_date)}</div>
                      <span style={{ fontSize: '0.9rem', fontWeight: '800', background: 'linear-gradient(135deg, #FF2E7A, #9A1750)', color: 'white', padding: '4px 12px', borderRadius: '99px', textAlign: 'center' }}>
                        {calculateDaysDiff(item.start_date, item.end_date)} Days Flow
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: ADD EXPENSE */}
      {isAddExpenseOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 22, 14, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#2B160E' }}>Add New Expense</h3>
              <button onClick={() => setIsAddExpenseOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6E5347' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>AMOUNT (₹)</label><input type="number" required placeholder="e.g. 250" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} /></div>
              <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>CATEGORY</label><select value={expenseForm.category_id} onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })}>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
              <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>DESCRIPTION</label><input type="text" placeholder="e.g. Fuel, Flowers..." value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} /></div>
              <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>ADDED BY</label><input type="text" value={expenseForm.added_by} onChange={(e) => setExpenseForm({ ...expenseForm, added_by: e.target.value })} /></div>
              <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>DATE</label><input type="date" required value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} /></div>
              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>Save Expense</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SCHEME */}
      {isAddSchemeOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 22, 14, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '460px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#2B160E' }}>Add New Chit / Loan</h3>
              <button onClick={() => setIsAddSchemeOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6E5347' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleAddScheme} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>SCHEME TITLE</label><input type="text" required placeholder="e.g. Sri Lakshmi 20-Month Chit" value={schemeForm.title} onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>TYPE</label><select value={schemeForm.type} onChange={(e) => setSchemeForm({ ...schemeForm, type: e.target.value })}><option value="Chit Fund">Chit Fund</option><option value="Loan Taken">Loan Taken</option><option value="Loan Given">Loan Given</option></select></div>
                <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>DURATION (MONTHS)</label><input type="number" required value={schemeForm.total_months} onChange={(e) => setSchemeForm({ ...schemeForm, total_months: e.target.value })} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>MONTHLY BASE (₹)</label><input type="number" required value={schemeForm.monthly_amount} onChange={(e) => setSchemeForm({ ...schemeForm, monthly_amount: e.target.value })} /></div>
                <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>START DATE</label><input type="date" required value={schemeForm.start_date} onChange={(e) => setSchemeForm({ ...schemeForm, start_date: e.target.value })} /></div>
              </div>
              <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>ORGANIZER & GENERAL NOTES</label><textarea rows="3" placeholder="Write organizer details, auction payout rules, or contact info..." value={schemeForm.general_notes} onChange={(e) => setSchemeForm({ ...schemeForm, general_notes: e.target.value })} /></div>
              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>Save Scheme & Generate Schedule</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SCHEME */}
      {editingSchemeId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 22, 14, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '460px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#2B160E' }}>Edit Chit / Loan Scheme</h3>
              <button onClick={() => setEditingSchemeId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6E5347' }}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveEditedScheme} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>SCHEME TITLE</label><input type="text" required value={schemeForm.title} onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })} /></div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>TYPE</label><select value={schemeForm.type} onChange={(e) => setSchemeForm({ ...schemeForm, type: e.target.value })}><option value="Chit Fund">Chit Fund</option><option value="Loan Taken">Loan Taken</option><option value="Loan Given">Loan Given</option></select></div>
                <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>DURATION (MONTHS)</label><input type="number" required value={schemeForm.total_months} onChange={(e) => setSchemeForm({ ...schemeForm, total_months: e.target.value })} /></div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>MONTHLY BASE (₹)</label><input type="number" required value={schemeForm.monthly_amount} onChange={(e) => setSchemeForm({ ...schemeForm, monthly_amount: e.target.value })} /></div>
                <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>START DATE</label><input type="date" required value={schemeForm.start_date} onChange={(e) => setSchemeForm({ ...schemeForm, start_date: e.target.value })} /></div>
              </div>
              <div><label style={{ fontSize: '0.78rem', color: '#6E5347', fontWeight: '700' }}>ORGANIZER & GENERAL NOTES</label><textarea rows="3" value={schemeForm.general_notes} onChange={(e) => setSchemeForm({ ...schemeForm, general_notes: e.target.value })} /></div>
              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>Save Scheme Changes</button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteTargetId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(43, 22, 14, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '360px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#2B160E', marginBottom: '8px' }}>Confirm Delete</h3>
            <p style={{ fontSize: '0.9rem', color: '#6E5347', marginBottom: '24px' }}>Are you sure you want to delete this expense record?</p>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button className="btn-secondary" onClick={() => setDeleteTargetId(null)}>Cancel</button>
              <button className="btn-primary" style={{ background: '#FF3B6E' }} onClick={handleDeleteExpense}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}