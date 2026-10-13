// Server-side chat assistant: answers questions about the app's data by letting
// Claude call read-only tools that query Supabase. Runs only on the server so the
// Anthropic API key never reaches the browser.
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';

const MODEL = 'claude-opus-5-5';
const MAX_TOOL_ROUNDS = 8;
const MAX_HISTORY = 20;
const MAX_MESSAGE_CHARS = 2000;
const MAX_ROWS = 100;

// Mirrors DEFAULT_CATEGORIES in src/App.jsx
const CATEGORIES = {
  'cat-1': 'Food & Dining',
  'cat-2': 'Transport',
  'cat-3': 'Shopping',
  'cat-4': 'Entertainment',
  'cat-5': 'Selfcare',
  'cat-6': 'Healthcare',
  'cat-7': 'Housing',
  'cat-8': 'Grocery',
  'cat-9': 'Education',
  'cat-10': 'Other',
};

const DATE_PROP = (what) => ({ type: 'string', description: `${what} date, YYYY-MM-DD (inclusive)` });

const TOOLS = [
  {
    name: 'search_expenses',
    description:
      'List individual expense records matching optional filters, newest first. Also returns the total amount and count of ALL matches (not just the rows shown). Use for "what did I spend on X", "show my last expenses", "biggest expense".',
    input_schema: {
      type: 'object',
      properties: {
        start_date: DATE_PROP('Start'),
        end_date: DATE_PROP('End'),
        category: { type: 'string', enum: Object.values(CATEGORIES), description: 'Category name' },
        added_by: { type: 'string', description: 'Person who added it, e.g. Tamil or Pooja' },
        text: { type: 'string', description: 'Case-insensitive text to find in the description' },
        min_amount: { type: 'number' },
        max_amount: { type: 'number' },
        sort: { type: 'string', enum: ['newest', 'oldest', 'largest', 'smallest'] },
        limit: { type: 'integer', description: `Rows to return, max ${MAX_ROWS}. Default 20.` },
      },
    },
  },
  {
    name: 'summarize_expenses',
    description:
      'Total spending grouped by category, month, day, or person, with optional filters. Use for totals, comparisons and breakdowns.',
    input_schema: {
      type: 'object',
      properties: {
        group_by: { type: 'string', enum: ['category', 'month', 'day', 'added_by', 'none'] },
        start_date: DATE_PROP('Start'),
        end_date: DATE_PROP('End'),
        category: { type: 'string', enum: Object.values(CATEGORIES) },
        added_by: { type: 'string' },
        text: { type: 'string', description: 'Case-insensitive text to find in the description' },
      },
      required: ['group_by'],
    },
  },
  {
    name: 'get_loans_and_chits',
    description:
      'Chit funds and loans (taken or given) with their installment progress: amount paid so far, remaining, paid/pending months and the next pending due date. Set include_installments to get the month-by-month schedule.',
    input_schema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Case-insensitive text to match the scheme title' },
        type: { type: 'string', enum: ['Chit Fund', 'Loan Taken', 'Loan Given'] },
        include_installments: { type: 'boolean' },
      },
    },
  },
  {
    name: 'get_menstrual_cycles',
    description:
      'Logged period cycles (start and end dates, flow days), average cycle length and a predicted next start date.',
    input_schema: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Most recent cycles to return. Default 12.' },
      },
    },
  },
];

let supabaseClient;
function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
    const key = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    if (!url || !key) throw new Error('Supabase is not configured on the server');
    supabaseClient = createClient(url, key);
  }
  return supabaseClient;
}

async function fetchAll(table, orderColumn, ascending = false) {
  const { data, error } = await getSupabase().from(table).select('*').order(orderColumn, { ascending });
  if (error) throw new Error(`Could not read ${table}: ${error.message}`);
  return data || [];
}

const round = (n) => Math.round(Number(n || 0) * 100) / 100;

function filterExpenses(rows, f) {
  const text = f.text?.toLowerCase();
  const addedBy = f.added_by?.toLowerCase();
  return rows.filter((e) => {
    const date = e.expense_date || '';
    if (f.start_date && date < f.start_date) return false;
    if (f.end_date && date > f.end_date) return false;
    if (f.category && CATEGORIES[e.category_id] !== f.category) return false;
    if (addedBy && (e.added_by || '').toLowerCase() !== addedBy) return false;
    if (text && !(e.description || '').toLowerCase().includes(text)) return false;
    if (f.min_amount != null && Number(e.amount) < f.min_amount) return false;
    if (f.max_amount != null && Number(e.amount) > f.max_amount) return false;
    return true;
  });
}

const shapeExpense = (e) => ({
  date: e.expense_date,
  amount: Number(e.amount),
  category: CATEGORIES[e.category_id] || 'Other',
  description: e.description,
  added_by: e.added_by,
});

async function searchExpenses(input) {
  const matches = filterExpenses(await fetchAll('expenses', 'expense_date'), input);
  const sorters = {
    newest: (a, b) => (b.expense_date || '').localeCompare(a.expense_date || ''),
    oldest: (a, b) => (a.expense_date || '').localeCompare(b.expense_date || ''),
    largest: (a, b) => Number(b.amount) - Number(a.amount),
    smallest: (a, b) => Number(a.amount) - Number(b.amount),
  };
  matches.sort(sorters[input.sort] || sorters.newest);
  const limit = Math.min(Math.max(Number(input.limit) || 20, 1), MAX_ROWS);
  return {
    match_count: matches.length,
    total_amount: round(matches.reduce((sum, e) => sum + Number(e.amount || 0), 0)),
    rows_shown: Math.min(limit, matches.length),
    expenses: matches.slice(0, limit).map(shapeExpense),
  };
}

async function summarizeExpenses(input) {
  const matches = filterExpenses(await fetchAll('expenses', 'expense_date'), input);
  const keyFor = {
    category: (e) => CATEGORIES[e.category_id] || 'Other',
    month: (e) => (e.expense_date || '').slice(0, 7),
    day: (e) => e.expense_date,
    added_by: (e) => e.added_by || 'Unknown',
    none: () => 'all',
  }[input.group_by] || (() => 'all');

  const groups = new Map();
  for (const e of matches) {
    const key = keyFor(e);
    const g = groups.get(key) || { group: key, total_amount: 0, count: 0 };
    g.total_amount += Number(e.amount || 0);
    g.count += 1;
    groups.set(key, g);
  }
  const total = matches.reduce((sum, e) => sum + Number(e.amount || 0), 0);
  return {
    match_count: matches.length,
    total_amount: round(total),
    groups: [...groups.values()]
      .map((g) => ({ ...g, total_amount: round(g.total_amount) }))
      .sort((a, b) => b.total_amount - a.total_amount),
  };
}

async function getLoansAndChits(input) {
  const [schemes, installments] = await Promise.all([
    fetchAll('loans_and_chits', 'created_at'),
    fetchAll('scheme_installments', 'month_number', true),
  ]);
  const title = input.title?.toLowerCase();
  return {
    schemes: schemes
      .filter((s) => (!title || (s.title || '').toLowerCase().includes(title)) && (!input.type || s.type === input.type))
      .map((s) => {
        const insts = installments.filter((i) => i.scheme_id === s.id);
        const paid = insts.filter((i) => i.status === 'Paid');
        const pending = insts.filter((i) => i.status !== 'Paid');
        const amountPaid = insts.reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);
        const result = {
          title: s.title,
          type: s.type,
          start_date: s.start_date,
          total_months: s.total_months,
          monthly_amount: Number(s.monthly_amount),
          total_target_amount: Number(s.total_target_amount),
          amount_paid: round(amountPaid),
          amount_remaining: round(Number(s.total_target_amount || 0) - amountPaid),
          months_paid: paid.length,
          months_pending: pending.length,
          next_due_date: pending[0]?.due_date || null,
          added_by: s.added_by,
          notes: s.general_notes || '',
        };
        if (input.include_installments) {
          result.installments = insts.map((i) => ({
            month: i.month_number,
            due_date: i.due_date,
            status: i.status,
            amount_paid: Number(i.amount_paid || 0),
            payment_date: i.payment_date,
            notes: i.notes || '',
          }));
        }
        return result;
      }),
  };
}

async function getMenstrualCycles(input) {
  const cycles = await fetchAll('menstrual_cycles', 'start_date');
  const dayMs = 24 * 60 * 60 * 1000;
  const gaps = [];
  for (let i = 0; i < cycles.length - 1; i++) {
    gaps.push(Math.round((new Date(cycles[i].start_date) - new Date(cycles[i + 1].start_date)) / dayMs));
  }
  const avg = gaps.length ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length) : null;
  const predicted =
    avg && cycles[0]
      ? new Date(new Date(cycles[0].start_date).getTime() + avg * dayMs).toISOString().slice(0, 10)
      : null;
  const limit = Math.min(Math.max(Number(input.limit) || 12, 1), MAX_ROWS);
  return {
    cycle_count: cycles.length,
    average_cycle_length_days: avg,
    predicted_next_start: predicted,
    cycles: cycles.slice(0, limit).map((c) => ({
      start_date: c.start_date,
      end_date: c.end_date,
      flow_days: Math.round((new Date(c.end_date) - new Date(c.start_date)) / dayMs) + 1,
    })),
  };
}

const TOOL_HANDLERS = {
  search_expenses: searchExpenses,
  summarize_expenses: summarizeExpenses,
  get_loans_and_chits: getLoansAndChits,
  get_menstrual_cycles: getMenstrualCycles,
};

function systemPrompt(userName) {
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' });
  return `You are the assistant inside "Tamil Pooja Suite", a household app shared by Tamil and Pooja that tracks expenses, chit funds and loans, and menstrual cycles.
Answer questions about their data by calling the tools; never guess numbers. Use the totals the tools return instead of adding rows yourself.
Today is ${today} (India). Resolve relative dates like "this month" or "last week" against it. You are talking with ${userName || 'a signed-in user'}; "I" or "my" usually refers to the household's data, filtered by added_by only when they clearly mean their own entries.
Amounts are Indian rupees: write them like ₹12,500.
Keep answers short and conversational, a few sentences or a short list. The chat shows plain text, so don't use markdown: no ** or #, and start list lines with •. If the data has nothing that matches, say so plainly.
You can only read data. If asked to add, edit or delete something, explain that they can do it from the app's screens.`;
}

function sanitizeHistory(messages) {
  if (!Array.isArray(messages)) return [];
  const clean = messages
    .filter((m) => (m?.role === 'user' || m?.role === 'assistant') && typeof m.content === 'string' && m.content.trim())
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role, content: m.content.slice(0, MAX_MESSAGE_CHARS) }));
  while (clean.length && clean[0].role !== 'user') clean.shift();
  return clean;
}

export async function answerChat({ messages, userName }) {
  if (!process.env.ANTHROPIC_API_KEY) {
    const err = new Error('The assistant is not set up yet: ANTHROPIC_API_KEY is missing on the server.');
    err.status = 503;
    err.expose = true;
    throw err;
  }
  const history = sanitizeHistory(messages);
  if (!history.length || history[history.length - 1].role !== 'user') {
    const err = new Error('Send a question to ask.');
    err.status = 400;
    err.expose = true;
    throw err;
  }

  const client = new Anthropic();
  const conversation = [...history];

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 16000,
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      output_config: { effort: 'medium' },
      system: systemPrompt(userName),
      tools: TOOLS,
      messages: conversation,
    });

    if (response.stop_reason === 'refusal') {
      return { reply: "Sorry, I can't help with that one." };
    }

    if (response.stop_reason !== 'tool_use') {
      const text = response.content
        .filter((b) => b.type === 'text')
        .map((b) => b.text)
        .join('\n')
        .trim();
      return { reply: text || "I couldn't find an answer to that." };
    }

    conversation.push({ role: 'assistant', content: response.content });
    const toolResults = await Promise.all(
      response.content
        .filter((b) => b.type === 'tool_use')
        .map(async (block) => {
          const handler = TOOL_HANDLERS[block.name];
          try {
            if (!handler) throw new Error(`Unknown tool ${block.name}`);
            const result = await handler(block.input || {});
            return { type: 'tool_result', tool_use_id: block.id, content: JSON.stringify(result) };
          } catch (e) {
            return { type: 'tool_result', tool_use_id: block.id, content: e.message, is_error: true };
          }
        }),
    );
    conversation.push({ role: 'user', content: toolResults });
  }

  return { reply: 'That question needed more lookups than I can do at once. Could you narrow it down?' };
}
