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
  Coins
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

// --- ALLOWED USER LOGINS (Tamil, Pooja, Admin) ---
const ALLOWED_USERS = [
  { username: 'tamil', password: 'tamil', name: 'Tamil' },
  { username: 'pooja', password: 'pooja', name: 'Pooja' },
];

// --- SEEDED CATEGORIES (Updated Travel -> Grocery) ---
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
    return 'linear-gradient(90deg, #FF3B6E, #C4114A)'; // Full/Over limit -> Red
  } else if (percentage >= 65) {
    return 'linear-gradient(90deg, #FFC93C, #FF7A29, #FF3B6E)'; // High -> Yellow to Orange to Red
  } else if (percentage >= 35) {
    return 'linear-gradient(90deg, #10b981, #FFC93C, #FF7A29)'; // Medium -> Green to Gold to Orange
  }
  return 'linear-gradient(90deg, #10b981, #34d399)'; // Low/Initial -> Emerald Green
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

  // --- VIEW STATE ---
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard | transactions | budgets | loans | menstrual
  const [categories] = useState(DEFAULT_CATEGORIES);
  const [expenses, setExpenses] = useState([]);
  const [budgets, setBudgets] = useState([]);
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

    const { data: expData } = await supabase.from('expenses').select('*').order('expense_date', { ascending: false });
    if (expData) setExpenses(expData);

    const { data: bdgData } = await supabase.from('budgets').select('*');
    if (bdgData) setBudgets(bdgData);

    const { data: cycData } = await supabase.from('menstrual_cycles').select('*').order('start_date', { ascending: false });
    if (cycData) setCycles(cycData);

    const { data: schData } = await supabase.from('loans_and_chits').select('*').order('created_at', { ascending: false });
    if (schData) setSchemes(schData);

    const { data: instData } = await supabase.from('scheme_installments').select('*').order('month_number', { ascending: true });
    if (instData) setInstallments(instData);

    setIsLoading(false);
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
    setBudgets([]);
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

  const [editingBudgetId, setEditingBudgetId] = useState(null);
  const [tempBudgetAmount, setTempBudgetAmount] = useState('');

  const [editingInstId, setEditingInstId] = useState(null);
  const [instForm, setInstForm] = useState({ amount_paid: '', notes: '' });

  // --- COMPUTED EXPENSE METRICS ---
  const currentMonthKey = getCurrentMonthKey();

  const currentMonthExpensesTotal = useMemo(() => {
    return expenses
      .filter((e) => e.expense_date?.startsWith(currentMonthKey))
      .reduce((acc, e) => acc + Number(e.amount), 0);
  }, [expenses, currentMonthKey]);

  const currentMonthBudgetTotal = useMemo(() => {
    return budgets
      .filter((b) => b.month === currentMonthKey)
      .reduce((acc, b) => acc + Number(b.amount), 0);
  }, [budgets, currentMonthKey]);

  const remainingBudget = currentMonthBudgetTotal - currentMonthExpensesTotal;

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
    const currentMonthExpenses = expenses.filter((e) =>
      e.expense_date?.startsWith(currentMonthKey)
    );

    return categories
      .map((cat) => {
        const value = currentMonthExpenses
          .filter((e) => e.category_id === cat.id)
          .reduce((acc, e) => acc + Number(e.amount), 0);
        return { name: cat.name, value, color: cat.color };
      })
      .filter((item) => item.value > 0);
  }, [expenses, categories, currentMonthKey]);

  const categorySpendMap = useMemo(() => {
    const map = {};
    expenses
      .filter((e) => e.expense_date?.startsWith(selectedMonth))
      .forEach((e) => {
        map[e.category_id] = (map[e.category_id] || 0) + Number(e.amount);
      });
    return map;
  }, [expenses, selectedMonth]);

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

  // --- MENSTRUAL METRICS ---
  const avgCycleDays = useMemo(() => {
    if (cycles.length === 0) return 0;
    const totalDays = cycles.reduce((acc, c) => acc + calculateDaysDiff(c.start_date, c.end_date), 0);
    return Math.round(totalDays / cycles.length);
  }, [cycles]);

  // --- EXPORT TO FORMATTED PDF HANDLER ---
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
          <title>Tamil Pooja Suite - Expenses Report</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; padding: 24px; color: #3A1F16; }
            h1 { font-size: 20px; color: #FF7A29; margin-bottom: 4px; }
            p { font-size: 13px; color: #7A5C4C; margin-top: 0; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #FFEFD6; color: #B8860B; text-align: left; padding: 10px; font-size: 12px; text-transform: uppercase; }
            td { padding: 10px; border-bottom: 1px solid #F0DCC0; font-size: 13px; }
            .total-banner { background: #FFF8ED; border: 1px solid #F0DCC0; padding: 14px; border-radius: 8px; margin-top: 20px; text-align: right; font-size: 16px; font-weight: bold; color: #E8600F; }
          </style>
        </head>
        <body>
          <h1>Tamil Pooja Suite - Expense Report</h1>
          <p>Generated on ${new Date().toLocaleDateString('en-IN')} | Filter Month: ${formatMonthLabel(selectedMonth)} | Total Count: ${filteredExpenses.length}</p>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Description</th>
                <th>Category</th>
                <th>Added By</th>
                <th>Date</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>
          <div class="total-banner">
            Total Filtered Amount: ${formatCurrency(searchTotalAmount)}
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  // --- EXPENSE HANDLERS ---
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

  // --- LOANS & CHIT FUNDS HANDLERS ---
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
    const targetAmt = months * monthlyAmt;

    const updatedPayload = {
      title: schemeForm.title,
      type: schemeForm.type,
      total_months: months,
      monthly_amount: monthlyAmt,
      total_target_amount: targetAmt,
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
      .slice(0, 5);
  }, [expenses]);

  // --- GLOSSY LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{ position: 'absolute', top: '-10%', left: '-5%', width: '380px', height: '380px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 122, 41, 0.5) 0%, rgba(255, 59, 110, 0.1) 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '-10%', right: '-5%', width: '420px', height: '420px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(255, 59, 110, 0.5) 0%, rgba(255, 201, 60, 0.1) 70%)', filter: 'blur(70px)', pointerEvents: 'none' }} />

        <div
          className="glass-card"
          style={{
            width: '100%',
            maxWidth: '400px',
            padding: '36px 30px',
            background: 'rgba(255, 255, 255, 0.88)',
            backdropFilter: 'blur(28px)',
            WebkitBackdropFilter: 'blur(28px)',
            border: '1.5px solid rgba(255, 255, 255, 0.95)',
            borderRadius: '24px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.18), 0 10px 20px rgba(255, 59, 110, 0.12)',
            zIndex: 10
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div style={{ display: 'inline-flex', background: 'linear-gradient(135deg, #FF7A29, #FF3B6E)', color: 'white', borderRadius: '18px', padding: '16px', marginBottom: '14px', boxShadow: '0 6px 20px rgba(255, 122, 41, 0.35)' }}>
              <Wallet size={32} />
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: '800', color: '#3A1F16', letterSpacing: '-0.02em' }}>Tamil Pooja Suite</h2>
            <p style={{ fontSize: '0.85rem', color: '#7A5C4C', marginTop: '4px', fontWeight: '600' }}>Cloud Personal Finance Portal</p>
          </div>

          {authError && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#ef4444', padding: '10px 14px', borderRadius: '12px', fontSize: '0.82rem', marginBottom: '16px', textAlign: 'center', fontWeight: '600' }}>
              {authError}
            </div>
          )}

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>USERNAME</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <User size={16} color="#7A5C4C" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type="text"
                  required
                  autoComplete="off"
                  placeholder="Enter your username"
                  value={authUsername}
                  onChange={(e) => setAuthUsername(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>PASSWORD</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Lock size={16} color="#7A5C4C" style={{ position: 'absolute', left: '14px' }} />
                <input
                  type="password"
                  required
                  autoComplete="off"
                  placeholder="Enter your password"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  style={{ paddingLeft: '40px' }}
                />
              </div>
            </div>

            <button type="submit" className="btn-primary" style={{ marginTop: '10px', width: '100%', height: '46px', fontSize: '0.95rem' }}>
              Log In <ArrowRight size={16} />
            </button>
          </form>

          <div style={{ marginTop: '22px', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', color: '#7A5C4C', fontSize: '0.75rem', fontWeight: '600' }}>
            <ShieldCheck size={14} color="#10b981" /> Protected & Encrypted Cloud Sync
          </div>
        </div>
      </div>
    );
  }

  // --- MAIN APP RENDER (AUTHENTICATED) ---
  return (
    <div style={{ minHeight: '100vh', paddingBottom: '48px', background: currentView === 'menstrual' ? '#0d0714' : 'transparent', transition: 'background 0.3s ease' }}>
      {/* HEADER / NAVIGATION */}
      <nav className="glass-nav" style={{ position: 'sticky', top: 0, zIndex: 100, padding: '14px 24px', background: currentView === 'menstrual' ? 'rgba(13, 7, 20, 0.9)' : undefined, borderColor: currentView === 'menstrual' ? 'rgba(255, 59, 110, 0.3)' : undefined }}>
        <div style={{ maxWidth: '1120px', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: currentView === 'menstrual' ? 'linear-gradient(135deg, #FF2A6D, #9A1750)' : 'linear-gradient(135deg, #FF7A29, #FF3B6E)', color: 'white', borderRadius: '12px', padding: '10px', display: 'flex', boxShadow: '0 4px 14px rgba(255,42,109,0.3)' }}>
              {currentView === 'menstrual' ? <Flame size={20} /> : <Wallet size={20} />}
            </div>
            <div>
              <h1 style={{ fontWeight: '800', fontSize: '1.2rem', color: currentView === 'menstrual' ? '#ffffff' : '#3A1F16', letterSpacing: '-0.02em' }}>
                Tamil Pooja Suite
              </h1>
              <span style={{ fontSize: '0.75rem', color: currentView === 'menstrual' ? '#FF2A6D' : '#7A5C4C', fontWeight: '600' }}>
                {currentView === 'menstrual' ? 'Dark Rose Cycle Tracker' : 'Finance, Chits & Budget Suite'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {/* 5 Navigation Pills */}
            <div style={{ display: 'flex', background: currentView === 'menstrual' ? 'rgba(28, 15, 42, 0.8)' : 'rgba(255, 255, 255, 0.7)', padding: '4px', borderRadius: '99px', border: currentView === 'menstrual' ? '1px solid rgba(255, 59, 110, 0.3)' : '1px solid #F0DCC0' }}>
              {[
                { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
                { id: 'transactions', label: 'Transactions', icon: Receipt },
                { id: 'budgets', label: 'Budgets', icon: PieChartIcon },
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
                          ? 'linear-gradient(135deg, #FF2A6D, #9A1750)'
                          : 'linear-gradient(135deg, #FF7A29, #FF3B6E)'
                        : 'transparent',
                      color: isActive ? '#ffffff' : currentView === 'menstrual' ? '#94a3b8' : '#7A5C4C',
                      fontWeight: isActive ? '700' : '600',
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isActive ? '0 4px 14px rgba(255,42,109,0.35)' : 'none'
                    }}
                  >
                    <Icon size={15} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Active User Badge & Logout Button */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="user-badge">
                <User size={13} /> {currentUser}
              </span>
              <button
                onClick={handleLogout}
                title="Log Out"
                className="btn-secondary"
                style={{
                  height: '36px',
                  width: '36px',
                  padding: 0,
                  borderRadius: '10px',
                  color: '#ef4444'
                }}
              >
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
            <div style={{ display: 'inline-block', padding: '16px', borderRadius: '50%', background: 'rgba(255,122,41,0.12)', marginBottom: '12px' }}>
              <Wallet size={32} />
            </div>
            <p style={{ fontWeight: '700', fontSize: '1.05rem', color: currentView === 'menstrual' ? '#ffffff' : '#3A1F16' }}>Loading data...</p>
          </div>
        ) : (
          <>
            {/* VIEW 1: DASHBOARD */}
            {currentView === 'dashboard' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                
                {/* HERO BAR - CLEAN GREETING & GLOSSY BUTTON (justifyContent fixed) */}
                <div
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '16px',
                    padding: '18px 24px',
                    background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.88), rgba(255, 239, 214, 0.75))',
                    border: '1.5px solid rgba(255, 122, 41, 0.3)',
                    boxShadow: '0 8px 30px rgba(255, 122, 41, 0.12)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #FF7A29, #FF3B6E)', color: 'white', padding: '12px', borderRadius: '16px', display: 'flex', boxShadow: '0 4px 14px rgba(255,122,41,0.3)' }}>
                      <Sparkles size={24} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#3A1F16', letterSpacing: '-0.01em' }}>
                        Welcome back, {currentUser}!
                      </h2>
                    </div>
                  </div>

                  {/* HIGH-IMPACT GLOSSY BUTTON */}
                  <button className="btn-glossy-hero" onClick={() => setIsAddExpenseOpen(true)}>
                    <Plus size={18} /> Add New Expense
                  </button>
                </div>

                {/* 4 KPI CARDS */}
                <div className="grid-4">
                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A5C4C', letterSpacing: '0.05em' }}>TOTAL SPENT</span>
                      <div style={{ padding: '6px', borderRadius: '8px', background: '#fef2f2', color: '#FF3B6E' }}><TrendingDown size={18} /></div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#3A1F16', marginTop: '12px', letterSpacing: '-0.02em' }}>
                      {formatCurrency(currentMonthExpensesTotal)}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#7A5C4C', marginTop: '4px', display: 'block' }}>This month's expenses</span>
                  </div>

                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A5C4C', letterSpacing: '0.05em' }}>TOTAL BUDGET</span>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255,122,41,0.12)', color: '#FF7A29' }}><PiggyBank size={18} /></div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#3A1F16', marginTop: '12px', letterSpacing: '-0.02em' }}>
                      {formatCurrency(currentMonthBudgetTotal)}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#7A5C4C', marginTop: '4px', display: 'block' }}>Allocated limits</span>
                  </div>

                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A5C4C', letterSpacing: '0.05em' }}>BUDGET LEFT</span>
                      <div style={{ padding: '6px', borderRadius: '8px', background: remainingBudget >= 0 ? '#ecfdf5' : '#fef2f2', color: remainingBudget >= 0 ? '#10b981' : '#FF3B6E' }}><Wallet size={18} /></div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: remainingBudget >= 0 ? '#10b981' : '#FF3B6E', marginTop: '12px', letterSpacing: '-0.02em' }}>
                      {formatCurrency(remainingBudget)}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#7A5C4C', marginTop: '4px', display: 'block' }}>Available balance</span>
                  </div>

                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A5C4C', letterSpacing: '0.05em' }}>LOGGED EXPENSES</span>
                      <div style={{ padding: '6px', borderRadius: '8px', background: '#FFF8ED', color: '#B8860B' }}><Receipt size={18} /></div>
                    </div>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#3A1F16', marginTop: '12px', letterSpacing: '-0.02em' }}>
                      {expenses.filter((e) => e.expense_date?.startsWith(currentMonthKey)).length}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#7A5C4C', marginTop: '4px', display: 'block' }}>Transactions count</span>
                  </div>
                </div>

                {/* CHARTS ROW */}
                <div className="grid-2">
                  <div className="glass-card">
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#3A1F16', marginBottom: '20px' }}>Monthly Spending Trend</h3>
                    {monthlyTrendData.every((d) => d.amount === 0) ? (
                      <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7A5C4C' }}>
                        <AlertCircle size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontSize: '0.9rem' }}>No spending data for the last 6 months</p>
                      </div>
                    ) : (
                      <div style={{ width: '100%', height: '220px' }}>
                        <ResponsiveContainer>
                          <AreaChart data={monthlyTrendData}>
                            <defs>
                              <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#FF7A29" stopOpacity={0.4} />
                                <stop offset="95%" stopColor="#FF3B6E" stopOpacity={0.0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="#7A5C4C" fontSize={12} tickLine={false} />
                            <YAxis stroke="#7A5C4C" fontSize={12} tickLine={false} />
                            <Tooltip formatter={(value) => formatCurrency(value)} />
                            <Area type="monotone" dataKey="amount" stroke="#FF7A29" strokeWidth={2.5} fillOpacity={1} fill="url(#trendGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                  </div>

                  <div className="glass-card">
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#3A1F16', marginBottom: '20px' }}>
                      Category Breakdown ({formatMonthLabel(currentMonthKey)})
                    </h3>
                    {categoryBreakdownData.length === 0 ? (
                      <div style={{ height: '220px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#7A5C4C' }}>
                        <AlertCircle size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontSize: '0.9rem' }}>No expenses logged this month</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', height: '220px' }}>
                        <div style={{ width: '50%', height: '100%' }}>
                          <ResponsiveContainer>
                            <PieChart>
                              <Pie data={categoryBreakdownData} innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                                {categoryBreakdownData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
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
                                <span style={{ color: '#3A1F16', fontWeight: '600' }}>{item.name}</span>
                              </div>
                              <span style={{ fontWeight: '800', color: '#3A1F16' }}>{formatCurrency(item.value)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* BOTTOM ROW */}
                <div className="grid-2">
                  <div className="glass-card">
                    <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#3A1F16', marginBottom: '20px' }}>Budget Progress</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                      {categories.slice(0, 6).map((cat) => {
                        const spent = categorySpendMap[cat.id] || 0;
                        const budgetObj = budgets.find((b) => b.category_id === cat.id && b.month === currentMonthKey);
                        const budgetAmt = budgetObj ? budgetObj.amount : 0;
                        const isOver = budgetAmt > 0 && spent > budgetAmt;
                        const pct = budgetAmt > 0 ? Math.min(Math.round((spent / budgetAmt) * 100), 100) : 0;

                        return (
                          <div key={cat.id}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                              <span style={{ fontWeight: '700', color: '#3A1F16' }}>{cat.name}</span>
                              <span style={{ color: isOver ? '#FF3B6E' : '#7A5C4C', fontWeight: isOver ? '800' : '600' }}>
                                {formatCurrency(spent)} <span style={{ color: '#7A5C4C', opacity: 0.8 }}>/ {budgetAmt > 0 ? formatCurrency(budgetAmt) : 'No Limit'}</span>
                              </span>
                            </div>
                            {/* GREEN-TO-RED DYNAMIC PROGRESS BAR */}
                            <div style={{ height: '8px', width: '100%', background: '#F0DCC0', borderRadius: '99px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${pct}%`, background: getProgressBarGradient(pct), borderRadius: '99px', transition: 'width 0.3s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div className="glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: '800', color: '#3A1F16' }}>Recent Transactions</h3>
                    </div>

                    {recentExpenses.length === 0 ? (
                      <div style={{ padding: '40px 0', textAlign: 'center', color: '#7A5C4C' }}>
                        <Receipt size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontSize: '0.9rem' }}>No expenses recorded in database.</p>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {recentExpenses.map((e) => {
                          const cat = categories.find((c) => c.id === e.category_id);
                          return (
                            <div key={e.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', background: '#ffffff', borderRadius: '14px', border: '1px solid #F0DCC0' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: cat ? cat.color : '#7A5C4C', flexShrink: 0 }} />
                                <div>
                                  <div style={{ fontSize: '0.9rem', fontWeight: '700', color: '#3A1F16' }}>{e.description}</div>
                                  <div style={{ fontSize: '0.78rem', color: '#7A5C4C', marginTop: '2px' }}>
                                    {cat ? cat.name : 'Other'} • {e.expense_date} • <span className="user-badge" style={{ fontSize: '0.72rem', padding: '2px 6px' }}>{e.added_by || currentUser}</span>
                                  </div>
                                </div>
                              </div>
                              <div style={{ fontWeight: '800', color: '#FF3B6E', fontSize: '0.95rem' }}>-{formatCurrency(e.amount)}</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* VIEW 2: TRANSACTIONS */}
            {currentView === 'transactions' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#3A1F16' }}>Transactions</h2>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button className="btn-pdf" onClick={handleExportPDF}>
                      <FileText size={16} /> Export PDF
                    </button>
                    <button className="btn-primary" onClick={() => setIsAddExpenseOpen(true)}>
                      <Plus size={16} /> Add Expense
                    </button>
                  </div>
                </div>

                <div className="glass-card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>SEARCH KEYWORD</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Search size={16} color="#7A5C4C" style={{ position: 'absolute', left: '12px' }} />
                      <input
                        type="text"
                        placeholder="Filter e.g. flower, Tamil..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        style={{ paddingLeft: '36px', paddingRight: '32px' }}
                      />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery('')} style={{ position: 'absolute', right: '10px', background: 'none', border: 'none', color: '#7A5C4C', cursor: 'pointer' }}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>CATEGORY</label>
                    <select value={selectedCategoryFilter} onChange={(e) => setSelectedCategoryFilter(e.target.value)}>
                      <option value="ALL">All Categories</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>MONTH</label>
                    <input type="month" value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} />
                  </div>
                </div>

                {searchQuery.trim() !== '' && (
                  <div className="glass-card" style={{ background: 'rgba(255, 122, 41, 0.1)', border: '1px solid rgba(255, 122, 41, 0.25)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ background: '#FF7A29', color: 'white', borderRadius: '50%', padding: '6px', display: 'flex' }}><Search size={16} /></div>
                      <span style={{ fontSize: '0.92rem', color: '#3A1F16' }}>
                        Found <strong>{filteredExpenses.length}</strong> transaction{filteredExpenses.length === 1 ? '' : 's'} matching <strong style={{ color: '#E8600F' }}>"{searchQuery}"</strong>
                      </span>
                    </div>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#E8600F' }}>
                      Total: {formatCurrency(searchTotalAmount)}
                    </div>
                  </div>
                )}

                <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
                  <div className="table-container">
                    {filteredExpenses.length === 0 ? (
                      <div style={{ padding: '50px 20px', textAlign: 'center', color: '#7A5C4C' }}>
                        <AlertCircle size={36} style={{ marginBottom: '8px', opacity: 0.5 }} />
                        <p style={{ fontSize: '0.92rem' }}>
                          {searchQuery ? `No transactions match "${searchQuery}".` : 'No transactions found for selected filters.'}
                        </p>
                      </div>
                    ) : (
                      <table>
                        <thead>
                          <tr>
                            <th>Description</th>
                            <th>Category</th>
                            <th>Added By</th>
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
                                <td style={{ fontWeight: '700', color: '#3A1F16' }}>{exp.description}</td>
                                <td>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: cat ? cat.color : '#7A5C4C' }} />
                                    {cat ? cat.name : 'Other'}
                                  </div>
                                </td>
                                <td>
                                  <span className="user-badge">
                                    <User size={12} /> {exp.added_by || currentUser}
                                  </span>
                                </td>
                                <td style={{ color: '#7A5C4C' }}>{exp.expense_date}</td>
                                <td style={{ color: '#FF3B6E', fontWeight: '800' }}>-{formatCurrency(exp.amount)}</td>
                                <td style={{ textAlign: 'right' }}>
                                  <button
                                    onClick={() => setDeleteTargetId(exp.id)}
                                    style={{ background: '#fef2f2', color: '#FF3B6E', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
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

            {/* VIEW 3: BUDGETS */}
            {currentView === 'budgets' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#3A1F16' }}>Monthly Budgets</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="#FF7A29" />
                    <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} style={{ width: 'auto' }}>
                      {getLast6Months().map((m) => (
                        <option key={m} value={m}>{formatMonthLabel(m)}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid-3">
                  <div className="glass-card">
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A5C4C', letterSpacing: '0.05em' }}>TOTAL BUDGET</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#FF7A29', marginTop: '8px' }}>
                      {formatCurrency(budgets.filter((b) => b.month === selectedMonth).reduce((acc, b) => acc + Number(b.amount), 0))}
                    </div>
                  </div>

                  <div className="glass-card">
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A5C4C', letterSpacing: '0.05em' }}>TOTAL SPENT</span>
                    <div style={{ fontSize: '1.6rem', fontWeight: '800', color: '#FF3B6E', marginTop: '8px' }}>
                      {formatCurrency(Object.values(categorySpendMap).reduce((a, b) => a + b, 0))}
                    </div>
                  </div>

                  <div className="glass-card">
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A5C4C', letterSpacing: '0.05em' }}>LEFT TO SPEND</span>
                    {(() => {
                      const totalB = budgets.filter((b) => b.month === selectedMonth).reduce((acc, b) => acc + Number(b.amount), 0);
                      const totalS = Object.values(categorySpendMap).reduce((a, b) => a + b, 0);
                      const left = totalB - totalS;
                      return (
                        <div style={{ fontSize: '1.6rem', fontWeight: '800', color: left >= 0 ? '#10b981' : '#FF3B6E', marginTop: '8px' }}>
                          {formatCurrency(left)}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                <div className="grid-3">
                  {categories.map((cat) => {
                    const IconComponent = ICON_MAP[cat.icon] || MoreHorizontal;
                    const spent = categorySpendMap[cat.id] || 0;
                    const budgetObj = budgets.find((b) => b.category_id === cat.id && b.month === selectedMonth);
                    const budgetAmount = budgetObj ? budgetObj.amount : 0;
                    const isOver = budgetAmount > 0 && spent > budgetAmount;
                    const pct = budgetAmount > 0 ? Math.round((spent / budgetAmount) * 100) : 0;
                    const isEditing = editingBudgetId === cat.id;

                    return (
                      <div key={cat.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <div style={{ background: cat.color + '15', color: cat.color, padding: '8px', borderRadius: '10px', display: 'flex' }}>
                                <IconComponent size={18} />
                              </div>
                              <span style={{ fontWeight: '700', color: '#3A1F16', fontSize: '0.95rem' }}>{cat.name}</span>
                            </div>

                            {!isEditing ? (
                              <button onClick={() => { setEditingBudgetId(cat.id); setTempBudgetAmount(budgetAmount ? String(budgetAmount) : ''); }} style={{ background: 'none', border: 'none', color: '#7A5C4C', cursor: 'pointer' }}>
                                <Edit2 size={16} />
                              </button>
                            ) : (
                              <div style={{ display: 'flex', gap: '4px' }}>
                                <button onClick={() => handleSaveBudget(cat.id)} style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}><Check size={14} /></button>
                                <button onClick={() => setEditingBudgetId(null)} style={{ background: '#FF3B6E', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}><X size={14} /></button>
                              </div>
                            )}
                          </div>

                          <div style={{ marginBottom: '14px' }}>
                            {isEditing ? (
                              <input type="number" placeholder="Set budget ₹" value={tempBudgetAmount} onChange={(e) => setTempBudgetAmount(e.target.value)} autoFocus />
                            ) : (
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                                <span style={{ color: '#7A5C4C' }}>Spent: {formatCurrency(spent)}</span>
                                <span style={{ fontWeight: '700', color: '#3A1F16' }}>Budget: {budgetAmount > 0 ? formatCurrency(budgetAmount) : 'Not Set'}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div>
                          {/* GREEN-TO-RED DYNAMIC PROGRESS BAR */}
                          <div style={{ height: '8px', width: '100%', background: '#F0DCC0', borderRadius: '99px', overflow: 'hidden', marginBottom: '6px' }}>
                            <div style={{ height: '100%', width: `${Math.min(pct, 100)}%`, background: getProgressBarGradient(pct), borderRadius: '99px', transition: 'width 0.3s ease' }} />
                          </div>
                          <div style={{ fontSize: '0.75rem', textAlign: 'right', color: isOver ? '#FF3B6E' : '#7A5C4C', fontWeight: '500' }}>
                            {budgetAmount > 0 ? `${pct}% limit used` : 'No Limit Set'}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIEW 4: LOANS & CHIT FUNDS */}
            {currentView === 'loans' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#3A1F16' }}>Loans & Chit Funds</h2>
                    <p style={{ fontSize: '0.8rem', color: '#7A5C4C', marginTop: '2px' }}>Track monthly chit fund variable payments, dividends & loan repayments</p>
                  </div>
                  <button className="btn-primary" onClick={() => setIsAddSchemeOpen(true)}>
                    <Plus size={16} /> Add Chit / Loan
                  </button>
                </div>

                <div className="grid-4">
                  <div className="glass-card">
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A5C4C', letterSpacing: '0.05em' }}>ACTIVE SCHEMES</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#3A1F16', marginTop: '10px' }}>
                      {schemes.length} Active
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#7A5C4C', marginTop: '4px', display: 'block' }}>Chits & Loans enrolled</span>
                  </div>

                  <div className="glass-card">
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A5C4C', letterSpacing: '0.05em' }}>TOTAL TARGET VALUE</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#FF7A29', marginTop: '10px' }}>
                      {formatCurrency(schemes.reduce((acc, s) => acc + Number(s.total_target_amount), 0))}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#7A5C4C', marginTop: '4px', display: 'block' }}>Nominal scheme value</span>
                  </div>

                  <div className="glass-card">
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A5C4C', letterSpacing: '0.05em' }}>ACTUAL CASH PAID</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#FF3B6E', marginTop: '10px' }}>
                      {formatCurrency(installments.reduce((acc, i) => acc + Number(i.amount_paid || 0), 0))}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#7A5C4C', marginTop: '4px', display: 'block' }}>Total money contributed</span>
                  </div>

                  <div className="glass-card">
                    <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#7A5C4C', letterSpacing: '0.05em' }}>TOTAL DIVIDEND SAVED</span>
                    <div style={{ fontSize: '1.75rem', fontWeight: '800', color: '#10b981', marginTop: '10px' }}>
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
                    <span style={{ fontSize: '0.78rem', color: '#7A5C4C', marginTop: '4px', display: 'block' }}>Chit auction discounts</span>
                  </div>
                </div>

                {schemes.length === 0 ? (
                  <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: '#7A5C4C' }}>
                    <Landmark size={40} style={{ marginBottom: '12px', opacity: 0.4 }} />
                    <p style={{ fontSize: '0.95rem' }}>No Chit Funds or Loans enrolled yet. Click <strong>+ Add Chit / Loan</strong> above to set up your first scheme.</p>
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
                        <div key={sch.id} className="glass-card" style={{ borderColor: isSelected ? '#FF7A29' : undefined, borderWidth: isSelected ? '2px' : '1px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                            <div>
                              <span style={{ fontSize: '0.72rem', fontWeight: '800', color: '#FF7A29', textTransform: 'uppercase', letterSpacing: '0.06em', background: 'rgba(255,122,41,0.12)', padding: '2px 8px', borderRadius: '6px' }}>
                                {sch.type}
                              </span>
                              <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#3A1F16', marginTop: '6px' }}>{sch.title}</h3>
                            </div>

                            {/* EDIT SCHEME & DELETE SCHEME BUTTONS */}
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenEditScheme(sch)}
                                title="Edit Scheme Details"
                                style={{ background: '#FFF8ED', color: '#B8860B', border: '1px solid #F0DCC0', borderRadius: '8px', padding: '6px', cursor: 'pointer' }}
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
                              <span style={{ color: '#7A5C4C', display: 'block', fontSize: '0.75rem' }}>Monthly Base</span>
                              <strong style={{ color: '#3A1F16' }}>{formatCurrency(sch.monthly_amount)} / mo</strong>
                            </div>
                            <div>
                              <span style={{ color: '#7A5C4C', display: 'block', fontSize: '0.75rem' }}>Target Value</span>
                              <strong style={{ color: '#3A1F16' }}>{formatCurrency(sch.total_target_amount)}</strong>
                            </div>
                            <div>
                              <span style={{ color: '#7A5C4C', display: 'block', fontSize: '0.75rem' }}>Progress</span>
                              <strong style={{ color: '#3A1F16' }}>{paidInsts.length} of {sch.total_months} Months</strong>
                            </div>
                            <div>
                              <span style={{ color: '#7A5C4C', display: 'block', fontSize: '0.75rem' }}>Actual Paid</span>
                              <strong style={{ color: '#FF3B6E' }}>{formatCurrency(totalCashPaid)}</strong>
                            </div>
                          </div>

                          {/* PER-SCHEME DIVIDEND SAVED OVERVIEW BANNER */}
                          {sch.type === 'Chit Fund' && (
                            <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '8px 12px', borderRadius: '10px', marginBottom: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontSize: '0.78rem', color: '#10b981', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Coins size={14} /> Dividend Saved So Far
                              </span>
                              <strong style={{ fontSize: '0.92rem', color: '#10b981', fontWeight: '800' }}>
                                +{formatCurrency(totalDividendSaved)}
                              </strong>
                            </div>
                          )}

                          {/* GREEN-TO-RED DYNAMIC PROGRESS BAR */}
                          <div style={{ height: '8px', width: '100%', background: '#F0DCC0', borderRadius: '99px', overflow: 'hidden', marginBottom: '16px' }}>
                            <div style={{ height: '100%', width: `${progressPct}%`, background: getProgressBarGradient(progressPct), borderRadius: '99px', transition: 'width 0.3s ease' }} />
                          </div>

                          {sch.general_notes && (
                            <p style={{ fontSize: '0.8rem', color: '#7A5C4C', fontStyle: 'italic', marginBottom: '16px', background: 'rgba(255,255,255,0.6)', padding: '8px 10px', borderRadius: '8px', border: '1px solid #F0DCC0' }}>
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

                {selectedSchemeId && (() => {
                  const sch = schemes.find((s) => s.id === selectedSchemeId);
                  if (!sch) return null;
                  const schInsts = installments.filter((i) => i.scheme_id === sch.id);

                  return (
                    <div className="glass-card" style={{ padding: 0, overflow: 'hidden', border: '2px solid #FF7A29' }}>
                      <div style={{ padding: '18px 24px', background: 'rgba(255, 122, 41, 0.08)', borderBottom: '1px solid #F0DCC0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
                        <div>
                          <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#3A1F16' }}>{sch.title} - Monthly Schedule</h3>
                          <p style={{ fontSize: '0.8rem', color: '#7A5C4C' }}>Base Installment: {formatCurrency(sch.monthly_amount)} / month | Type: {sch.type}</p>
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
                                  <td style={{ color: '#7A5C4C' }}>{inst.due_date}</td>
                                  <td style={{ fontWeight: '700', color: '#3A1F16' }}>{formatCurrency(baseAmt)}</td>
                                  
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
                                      <span style={{ background: '#ecfdf5', color: '#10b981', padding: '2px 8px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: '800' }}>
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
                                        color: inst.status === 'Paid' ? '#10b981' : '#b45309',
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
                                      <span style={{ fontSize: '0.82rem', color: '#7A5C4C' }}>{inst.notes || '—'}</span>
                                    )}
                                  </td>

                                  <td style={{ textAlign: 'right' }}>
                                    {isEditing ? (
                                      <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end' }}>
                                        <button
                                          style={{ background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '4px 8px', cursor: 'pointer' }}
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

            {/* VIEW 5: MENSTRUAL TRACKER */}
            {currentView === 'menstrual' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
                <div className="grid-3">
                  <div className="dark-glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em' }}>AVG FLOW DURATION</span>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255, 42, 109, 0.15)', color: '#FF2A6D' }}>
                        <Clock size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', marginTop: '12px' }}>
                      {avgCycleDays > 0 ? `${avgCycleDays} Days` : 'No Data'}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Average period length</span>
                  </div>

                  <div className="dark-glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em' }}>TOTAL LOGGED CYCLES</span>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255, 42, 109, 0.15)', color: '#FF2A6D' }}>
                        <Flame size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#ffffff', marginTop: '12px' }}>
                      {cycles.length}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Saved monthly cycles</span>
                  </div>

                  <div className="dark-glass-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', letterSpacing: '0.05em' }}>LAST RECORDED PERIOD</span>
                      <div style={{ padding: '6px', borderRadius: '8px', background: 'rgba(255, 42, 109, 0.15)', color: '#FF2A6D' }}>
                        <Sparkles size={18} />
                      </div>
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: '800', color: '#FF2A6D', marginTop: '14px' }}>
                      {cycles.length > 0 ? formatDateFormatted(cycles[0].start_date) : 'None Yet'}
                    </div>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '4px', display: 'block' }}>Start date of recent period</span>
                  </div>
                </div>

                <div className="dark-glass-card" style={{ border: '1px solid rgba(255, 42, 109, 0.4)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <div style={{ background: 'linear-gradient(135deg, #FF2A6D, #9A1750)', padding: '8px', borderRadius: '10px', color: 'white' }}>
                      <HeartPulse size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#ffffff' }}>Log Period Cycle</h3>
                      <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Select start date and end date of your cycle</p>
                    </div>
                  </div>

                  <form onSubmit={handleAddCycle} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', alignItems: 'end' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#FF2A6D', fontWeight: '700', display: 'block', marginBottom: '6px' }}>START DATE</label>
                      <input
                        type="date"
                        required
                        className="dark-input"
                        value={cycleForm.start_date}
                        onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', color: '#FF2A6D', fontWeight: '700', display: 'block', marginBottom: '6px' }}>END DATE</label>
                      <input
                        type="date"
                        required
                        className="dark-input"
                        value={cycleForm.end_date}
                        onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })}
                      />
                    </div>

                    <div>
                      <button type="submit" className="btn-neon" style={{ width: '100%' }}>
                        <Plus size={16} /> Save Period Range
                      </button>
                    </div>
                  </form>
                </div>

                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#ffffff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Calendar size={18} color="#FF2A6D" /> Period History Grid
                  </h3>

                  {cycles.length === 0 ? (
                    <div className="dark-glass-card" style={{ padding: '60px 20px', textAlign: 'center', color: '#94a3b8' }}>
                      <HeartPulse size={40} style={{ marginBottom: '12px', opacity: 0.4, color: '#FF2A6D' }} />
                      <p style={{ fontSize: '0.95rem' }}>No period cycles logged yet. Use the form above to record your first cycle.</p>
                    </div>
                  ) : (
                    <div className="grid-3">
                      {cycles.map((item) => {
                        const days = calculateDaysDiff(item.start_date, item.end_date);
                        return (
                          <div key={item.id} className="dark-glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                                <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#FF2A6D', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                  {formatMonthLabel(getMonthKey(item.start_date))}
                                </span>
                                <button
                                  onClick={() => handleDeleteCycle(item.id)}
                                  style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444', border: 'none', borderRadius: '8px', padding: '6px 10px', cursor: 'pointer' }}
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>

                              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
                                <div style={{ background: 'rgba(15, 8, 24, 0.6)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 59, 110, 0.15)' }}>
                                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>START DATE</div>
                                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                                    {formatDateFormatted(item.start_date)}
                                  </div>
                                </div>

                                <div style={{ background: 'rgba(15, 8, 24, 0.6)', padding: '10px 12px', borderRadius: '10px', border: '1px solid rgba(255, 59, 110, 0.15)' }}>
                                  <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: '600' }}>END DATE</div>
                                  <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#ffffff', marginTop: '2px' }}>
                                    {formatDateFormatted(item.end_date)}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid rgba(255, 59, 110, 0.15)' }}>
                              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Total Duration</span>
                              <span style={{ fontSize: '0.9rem', fontWeight: '800', background: 'linear-gradient(135deg, #FF2A6D, #9A1750)', color: 'white', padding: '4px 12px', borderRadius: '99px', boxShadow: '0 2px 10px rgba(255,42,109,0.3)' }}>
                                {days} Days Flow
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* MODAL: ADD EXPENSE */}
      {isAddExpenseOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(58, 31, 22, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '420px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#3A1F16' }}>Add New Expense</h3>
              <button onClick={() => setIsAddExpenseOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A5C4C' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddExpense} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>AMOUNT (₹)</label>
                <input type="number" required placeholder="e.g. 250" value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>CATEGORY</label>
                <select value={expenseForm.category_id} onChange={(e) => setExpenseForm({ ...expenseForm, category_id: e.target.value })}>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>DESCRIPTION</label>
                <input type="text" placeholder="e.g. Flowers and Pooja items" value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>ADDED BY (PERSON NAME)</label>
                <input type="text" placeholder="e.g. Tamil / Pooja" value={expenseForm.added_by} onChange={(e) => setExpenseForm({ ...expenseForm, added_by: e.target.value })} />
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>DATE</label>
                <input type="date" required value={expenseForm.expense_date} onChange={(e) => setExpenseForm({ ...expenseForm, expense_date: e.target.value })} />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                Save Expense
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SCHEME */}
      {isAddSchemeOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(58, 31, 22, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '460px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#3A1F16' }}>Add New Chit / Loan</h3>
              <button onClick={() => setIsAddSchemeOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A5C4C' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddScheme} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>SCHEME TITLE</label>
                <input type="text" required placeholder="e.g. Sri Lakshmi 20-Month Chit" value={schemeForm.title} onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>TYPE</label>
                  <select value={schemeForm.type} onChange={(e) => setSchemeForm({ ...schemeForm, type: e.target.value })}>
                    <option value="Chit Fund">Chit Fund</option>
                    <option value="Loan Taken">Loan Taken</option>
                    <option value="Loan Given">Loan Given</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>DURATION (MONTHS)</label>
                  <input type="number" required placeholder="e.g. 20" value={schemeForm.total_months} onChange={(e) => setSchemeForm({ ...schemeForm, total_months: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>MONTHLY BASE (₹)</label>
                  <input type="number" required placeholder="e.g. 10000" value={schemeForm.monthly_amount} onChange={(e) => setSchemeForm({ ...schemeForm, monthly_amount: e.target.value })} />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>START DATE</label>
                  <input type="date" required value={schemeForm.start_date} onChange={(e) => setSchemeForm({ ...schemeForm, start_date: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>ORGANIZER & GENERAL NOTES</label>
                <textarea rows="3" placeholder="Write organizer details, auction payout rules, or contact info..." value={schemeForm.general_notes} onChange={(e) => setSchemeForm({ ...schemeForm, general_notes: e.target.value })} />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                Save Scheme & Generate Schedule
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT SCHEME */}
      {editingSchemeId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(58, 31, 22, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '460px', background: '#ffffff' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#3A1F16' }}>Edit Chit / Loan Scheme</h3>
              <button onClick={() => setEditingSchemeId(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#7A5C4C' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditedScheme} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>SCHEME TITLE</label>
                <input type="text" required value={schemeForm.title} onChange={(e) => setSchemeForm({ ...schemeForm, title: e.target.value })} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>TYPE</label>
                  <select value={schemeForm.type} onChange={(e) => setSchemeForm({ ...schemeForm, type: e.target.value })}>
                    <option value="Chit Fund">Chit Fund</option>
                    <option value="Loan Taken">Loan Taken</option>
                    <option value="Loan Given">Loan Given</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>DURATION (MONTHS)</label>
                  <input type="number" required value={schemeForm.total_months} onChange={(e) => setSchemeForm({ ...schemeForm, total_months: e.target.value })} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>MONTHLY BASE (₹)</label>
                  <input type="number" required value={schemeForm.monthly_amount} onChange={(e) => setSchemeForm({ ...schemeForm, monthly_amount: e.target.value })} />
                </div>

                <div>
                  <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>START DATE</label>
                  <input type="date" required value={schemeForm.start_date} onChange={(e) => setSchemeForm({ ...schemeForm, start_date: e.target.value })} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.78rem', color: '#7A5C4C', fontWeight: '700', display: 'block', marginBottom: '6px' }}>ORGANIZER & GENERAL NOTES</label>
                <textarea rows="3" value={schemeForm.general_notes} onChange={(e) => setSchemeForm({ ...schemeForm, general_notes: e.target.value })} />
              </div>

              <button type="submit" className="btn-primary" style={{ marginTop: '8px' }}>
                Save Scheme Changes
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DELETE CONFIRMATION */}
      {deleteTargetId && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(58, 31, 22, 0.45)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200, padding: '16px' }}>
          <div className="glass-card" style={{ width: '100%', maxWidth: '360px', background: '#ffffff' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#3A1F16', marginBottom: '8px' }}>Confirm Delete</h3>
            <p style={{ fontSize: '0.9rem', color: '#7A5C4C', marginBottom: '24px' }}>
              Are you sure you want to delete this expense record from Supabase?
            </p>

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