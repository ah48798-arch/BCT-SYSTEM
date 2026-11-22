import { PaymentRecord, ExpenseRecord, ExchangeRate, StandardPaymentMethod } from '../types/database.types';
import { bctStore } from './store';

export type { StandardPaymentMethod };

export type FinancialTimeRange = '30d' | 'quarter' | 'all' | 'custom';

export interface DateRangeBounds {
  start: Date;
  end: Date;
}

export interface PaymentMethodDefinition {
  id: StandardPaymentMethod;
  name_ar: string;
  name_en: string;
  channel_ar: string;
  channel_en: string;
  default_account_ar: string;
  default_account_en: string;
  color: string;
}

export const PAYMENT_METHODS_CATALOG: PaymentMethodDefinition[] = [
  {
    id: 'bank_transfer',
    name_ar: 'تحويل بنكي رسمي',
    name_en: 'Bank Transfer',
    channel_ar: 'حساب بنكي جاري',
    channel_en: 'Commercial Bank Account',
    default_account_ar: 'البنك الأهلي المصري (حساب العمليات والتحصيل)',
    default_account_en: 'National Bank of Egypt (Ops & Collections)',
    color: 'emerald'
  },
  {
    id: 'cash',
    name_ar: 'نقداً بالخزينة',
    name_en: 'Cash',
    channel_ar: 'الخزينة النقدية الرئيسية',
    channel_en: 'Main Physical Vault',
    default_account_ar: 'خزينة المقر الرئيسي (القاهرة)',
    default_account_en: 'Headquarters Vault (Cairo)',
    color: 'amber'
  },
  {
    id: 'instapay',
    name_ar: 'إنستاباي',
    name_en: 'InstaPay',
    channel_ar: 'شبكة المدفوعات اللحظية IPN',
    channel_en: 'Instant Payment Network (IPN)',
    default_account_ar: 'حساب التحصيل اللحظي BCT-IPN',
    default_account_en: 'BCT Instant Collection Account',
    color: 'indigo'
  },
  {
    id: 'vodafone_cash',
    name_ar: 'فودافون كاش',
    name_en: 'Vodafone Cash',
    channel_ar: 'محفظة إلكترونية للشركات',
    channel_en: 'Corporate Mobile Wallet',
    default_account_ar: 'محفظة فودافون كاش الرسمية للشركة',
    default_account_en: 'Corporate Vodafone Cash Wallet',
    color: 'rose'
  }
];

/**
 * Normalizes payment methods including legacy aliases and variations.
 * Safe fallback to 'unclassified' preserves historic references without data loss.
 */
export function normalizePaymentMethod(method?: string | null): StandardPaymentMethod | 'unclassified' {
  if (!method) return 'unclassified';
  const m = String(method).toLowerCase().trim();
  if (
    m === 'bank_transfer' ||
    m === 'bank' ||
    m === 'card' ||
    m === 'pos' ||
    m === 'wire' ||
    m === 'تحويل بنكي' ||
    m === 'تحويل بنكي رسمي'
  ) {
    return 'bank_transfer';
  }
  if (
    m === 'cash' ||
    m === 'petty_cash' ||
    m === 'treasury' ||
    m === 'نقدا' ||
    m === 'نقداً' ||
    m === 'نقداً بالخزينة'
  ) {
    return 'cash';
  }
  if (
    m === 'instapay' ||
    m === 'insta' ||
    m === 'إنستاباي' ||
    m === 'انستاباي'
  ) {
    return 'instapay';
  }
  if (
    m === 'vodafone_cash' ||
    m === 'vodafone' ||
    m === 'vfcash' ||
    m === 'فودافون كاش'
  ) {
    return 'vodafone_cash';
  }
  return 'unclassified';
}

export function getPaymentMethodDetails(method?: string | null, language: 'ar' | 'en' = 'ar'): {
  id: StandardPaymentMethod | 'unclassified';
  name: string;
  channel: string;
  defaultAccount: string;
  color: string;
} {
  const normalized = normalizePaymentMethod(method);
  const found = PAYMENT_METHODS_CATALOG.find(c => c.id === normalized);
  if (found) {
    return {
      id: found.id,
      name: language === 'ar' ? found.name_ar : found.name_en,
      channel: language === 'ar' ? found.channel_ar : found.channel_en,
      defaultAccount: language === 'ar' ? found.default_account_ar : found.default_account_en,
      color: found.color
    };
  }
  return {
    id: 'unclassified',
    name: language === 'ar' ? 'غير مصنف' : 'Unclassified',
    channel: language === 'ar' ? 'قيد المراجعة المحاسبية' : 'Under Review',
    defaultAccount: language === 'ar' ? 'حساب معلق' : 'Suspense Account',
    color: 'slate'
  };
}

export interface FinancialFilterOptions {
  dateBounds?: DateRangeBounds | null;
  paymentMethod?: StandardPaymentMethod | 'all' | 'unclassified';
  currency?: 'all' | 'EGP' | 'USD';
}

export interface AccountFinancialBreakdown {
  id: StandardPaymentMethod | 'unclassified';
  name_ar: string;
  name_en: string;
  channel_ar: string;
  channel_en: string;
  default_account_ar: string;
  default_account_en: string;
  color: string;

  // Confirmed Collections
  confirmedEGP: number;
  confirmedUSD: number;
  confirmedCount: number;
  totalCollectedInEGP: number;
  totalCollectedInUSD: number;

  // Approved Expenses (Commitments: status === 'approved' || status === 'paid')
  approvedExpenseEGP: number;
  approvedExpenseUSD: number;
  approvedExpenseCount: number;
  totalApprovedExpenseInEGP: number;
  totalApprovedExpenseInUSD: number;

  // Paid Expenses (Cash Outflows: status === 'paid')
  paidExpenseEGP: number;
  paidExpenseUSD: number;
  paidExpenseCount: number;
  totalPaidExpenseInEGP: number;
  totalPaidExpenseInUSD: number;

  // Net Collections (Confirmed Collections - Approved Expenses)
  netCollectionsEGP: number;
  netCollectionsUSD: number;
  totalNetCollectionsInEGP: number;
  totalNetCollectionsInUSD: number;
  netStatus: 'positive' | 'negative' | 'zero';

  // Actual Net Cash Movement (Confirmed Received - Actually Paid)
  netCashEGP: number;
  netCashUSD: number;
  totalNetCashInEGP: number;
  totalNetCashInUSD: number;
  unpaidApprovedCommitmentsEGP: number;
  unpaidApprovedCommitmentsUSD: number;
}

export interface FinancialSummary {
  // Collections (only status === 'confirmed')
  confirmedEGP: number;
  confirmedUSD: number;
  confirmedCount: number;
  pendingEGP: number;
  pendingUSD: number;
  pendingCount: number;
  totalCollectedInEGP: number;
  totalCollectedInUSD: number;

  // Approved Expenses Commitments (status === 'approved' || status === 'paid')
  approvedExpenseEGP: number;
  approvedExpenseUSD: number;
  approvedExpenseCount: number;
  totalApprovedExpenseInEGP: number;
  totalApprovedExpenseInUSD: number;

  // Pending Expenses (status === 'pending_approval')
  pendingExpenseEGP: number;
  pendingExpenseUSD: number;
  pendingExpenseCount: number;

  // Actually Paid Out Expenses (status === 'paid')
  paidExpenseEGP: number;
  paidExpenseUSD: number;
  paidExpenseCount: number;
  totalPaidExpenseInEGP: number;
  totalPaidExpenseInUSD: number;

  // Net Collections After Approved Expenses (Metric A: Confirmed Collections - Approved Expenses)
  netCollectionsEGP: number;
  netCollectionsUSD: number;
  totalNetCollectionsInEGP: number;
  totalNetCollectionsInUSD: number;
  netStatus: 'positive' | 'negative' | 'zero';
  netMarginPercentage: number;

  // Net Cash Balance / Movement (Metric B: Confirmed Receipts - Actually Paid Expenses)
  netCashEGP: number;
  netCashUSD: number;
  totalNetCashInEGP: number;
  totalNetCashInUSD: number;
  unpaidApprovedCommitmentsEGP: number;
  unpaidApprovedCommitmentsUSD: number;

  // Account / Payment Method Breakdowns
  accountBreakdowns: AccountFinancialBreakdown[];
  unclassifiedCount: number;

  // Config & Metadata
  exchangeRate: number;
  exchangeRateNotes: string;
}

export const EMPTY_FINANCIAL_SUMMARY: FinancialSummary = {
  confirmedEGP: 0,
  confirmedUSD: 0,
  confirmedCount: 0,
  pendingEGP: 0,
  pendingUSD: 0,
  pendingCount: 0,
  totalCollectedInEGP: 0,
  totalCollectedInUSD: 0,
  approvedExpenseEGP: 0,
  approvedExpenseUSD: 0,
  approvedExpenseCount: 0,
  totalApprovedExpenseInEGP: 0,
  totalApprovedExpenseInUSD: 0,
  pendingExpenseEGP: 0,
  pendingExpenseUSD: 0,
  pendingExpenseCount: 0,
  paidExpenseEGP: 0,
  paidExpenseUSD: 0,
  paidExpenseCount: 0,
  totalPaidExpenseInEGP: 0,
  totalPaidExpenseInUSD: 0,
  netCollectionsEGP: 0,
  netCollectionsUSD: 0,
  totalNetCollectionsInEGP: 0,
  totalNetCollectionsInUSD: 0,
  netStatus: 'zero',
  netMarginPercentage: 0,
  netCashEGP: 0,
  netCashUSD: 0,
  totalNetCashInEGP: 0,
  totalNetCashInUSD: 0,
  unpaidApprovedCommitmentsEGP: 0,
  unpaidApprovedCommitmentsUSD: 0,
  accountBreakdowns: [],
  unclassifiedCount: 0,
  exchangeRate: 50,
  exchangeRateNotes: ''
};

/**
 * Derives start and end date boundaries for consistent reporting periods
 */
export function getDateRangeBounds(
  timeRange: FinancialTimeRange,
  customRange?: { start: string; end: string } | null
): DateRangeBounds | null {
  const now = new Date();

  if (timeRange === '30d') {
    const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return { start, end: now };
  }

  if (timeRange === 'quarter') {
    const currentMonth = now.getMonth(); // 0-11
    const quarterStartMonth = Math.floor(currentMonth / 3) * 3;
    const start = new Date(now.getFullYear(), quarterStartMonth, 1, 0, 0, 0, 0);
    return { start, end: now };
  }

  if (timeRange === 'custom' && customRange?.start && customRange?.end) {
    const start = new Date(customRange.start + 'T00:00:00');
    const end = new Date(customRange.end + 'T23:59:59.999');
    return { start, end };
  }

  return null; // 'all'
}

/**
 * Filters payments consistently within given date bounds
 */
export function filterPaymentsByDate(
  payments: PaymentRecord[],
  bounds: DateRangeBounds | null
): PaymentRecord[] {
  if (!bounds) return payments;
  return payments.filter(p => {
    const d = new Date(p.created_at || (p as any).payment_date || Date.now());
    return d >= bounds.start && d <= bounds.end;
  });
}

/**
 * Filters expenses consistently within given date bounds
 */
export function filterExpensesByDate(
  expenses: ExpenseRecord[],
  bounds: DateRangeBounds | null
): ExpenseRecord[] {
  if (!bounds) return expenses;
  return expenses.filter(e => {
    const d = new Date(e.created_at || (e as any).approved_at || Date.now());
    return d >= bounds.start && d <= bounds.end;
  });
}

/**
 * Combined filtering for payments (Date + Payment Method + Currency)
 */
export function filterPaymentsByOptions(
  payments: PaymentRecord[],
  options?: FinancialFilterOptions | DateRangeBounds | null
): PaymentRecord[] {
  if (!options) return payments;
  const isBoundsOnly = 'start' in options && 'end' in options;
  const bounds = isBoundsOnly ? (options as DateRangeBounds) : (options as FinancialFilterOptions).dateBounds;
  const method = isBoundsOnly ? undefined : (options as FinancialFilterOptions).paymentMethod;
  const curr = isBoundsOnly ? undefined : (options as FinancialFilterOptions).currency;

  let result = filterPaymentsByDate(payments, bounds || null);

  if (method && method !== 'all') {
    result = result.filter(p => normalizePaymentMethod(p.payment_method) === method);
  }

  if (curr && curr !== 'all') {
    result = result.filter(p => p.currency === curr);
  }

  return result;
}

/**
 * Combined filtering for expenses (Date + Payment Method + Currency)
 */
export function filterExpensesByOptions(
  expenses: ExpenseRecord[],
  options?: FinancialFilterOptions | DateRangeBounds | null
): ExpenseRecord[] {
  if (!options) return expenses;
  const isBoundsOnly = 'start' in options && 'end' in options;
  const bounds = isBoundsOnly ? (options as DateRangeBounds) : (options as FinancialFilterOptions).dateBounds;
  const method = isBoundsOnly ? undefined : (options as FinancialFilterOptions).paymentMethod;
  const curr = isBoundsOnly ? undefined : (options as FinancialFilterOptions).currency;

  let result = filterExpensesByDate(expenses, bounds || null);

  if (method && method !== 'all') {
    result = result.filter(e => normalizePaymentMethod(e.payment_method) === method);
  }

  if (curr && curr !== 'all') {
    result = result.filter(e => e.currency === curr);
  }

  return result;
}

/**
 * Pure calculation function for financial aggregates across accounts, currencies and periods.
 * Enforces strict accounting separation between:
 * 1. Confirmed Collections
 * 2. Approved Expenses (Accrued commitments)
 * 3. Net Collections After Expenses (Confirmed Collections - Approved Expenses)
 * 4. Actually Paid Expenses & Net Cash Balance
 * 5. Breakdown by Payment Method / Financial Channel
 */
export function calculateFinancialSummary(
  payments: PaymentRecord[],
  expenses: ExpenseRecord[],
  exchangeRate: ExchangeRate,
  filterParam?: FinancialFilterOptions | DateRangeBounds | null
): FinancialSummary {
  const rate = exchangeRate?.rate && exchangeRate.rate > 0 ? exchangeRate.rate : 56.0;

  let bounds: DateRangeBounds | null = null;
  let paymentMethodFilter: StandardPaymentMethod | 'all' | 'unclassified' = 'all';
  let currencyFilter: 'all' | 'EGP' | 'USD' = 'all';

  if (filterParam) {
    if ('start' in filterParam && 'end' in filterParam) {
      bounds = filterParam as DateRangeBounds;
    } else {
      const opts = filterParam as FinancialFilterOptions;
      bounds = opts.dateBounds || null;
      paymentMethodFilter = opts.paymentMethod || 'all';
      currencyFilter = opts.currency || 'all';
    }
  }

  // 1. Overall filtered dataset for top summary indicators
  const activePayments = filterPaymentsByOptions(payments, {
    dateBounds: bounds,
    paymentMethod: paymentMethodFilter,
    currency: currencyFilter
  });

  const activeExpenses = filterExpensesByOptions(expenses, {
    dateBounds: bounds,
    paymentMethod: paymentMethodFilter,
    currency: currencyFilter
  });

  // Confirmed Payments / Collections (Strictly status === 'confirmed')
  const confirmedPayments = activePayments.filter(p => p.status === 'confirmed');
  const confirmedCount = confirmedPayments.length;

  const confirmedEGP = confirmedPayments
    .filter(p => p.currency === 'EGP')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const confirmedUSD = confirmedPayments
    .filter(p => p.currency === 'USD')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Pending Clearance Payments
  const pendingPayments = activePayments.filter(p => p.status === 'pending');
  const pendingCount = pendingPayments.length;

  const pendingEGP = pendingPayments
    .filter(p => p.currency === 'EGP')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const pendingUSD = pendingPayments
    .filter(p => p.currency === 'USD')
    .reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  // Approved Expenses (Commitments: status === 'approved' || status === 'paid' to ensure exactly one count per item)
  const approvedExpenses = activeExpenses.filter(e => e.status === 'approved' || e.status === 'paid');
  const approvedExpenseCount = approvedExpenses.length;

  const approvedExpenseEGP = approvedExpenses
    .filter(e => e.currency === 'EGP')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const approvedExpenseUSD = approvedExpenses
    .filter(e => e.currency === 'USD')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Pending Approval Expenses (Excluded from Net Collections until approved)
  const pendingExpenses = activeExpenses.filter(e => e.status === 'pending_approval');
  const pendingExpenseCount = pendingExpenses.length;

  const pendingExpenseEGP = pendingExpenses
    .filter(e => e.currency === 'EGP')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const pendingExpenseUSD = pendingExpenses
    .filter(e => e.currency === 'USD')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Actually Paid Expenses (Cash Outflows: status === 'paid')
  const paidExpenses = activeExpenses.filter(e => e.status === 'paid');
  const paidExpenseCount = paidExpenses.length;

  const paidExpenseEGP = paidExpenses
    .filter(e => e.currency === 'EGP')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  const paidExpenseUSD = paidExpenses
    .filter(e => e.currency === 'USD')
    .reduce((sum, e) => sum + (Number(e.amount) || 0), 0);

  // Converted totals using single official exchange rate policy
  const totalCollectedInEGP = confirmedEGP + (confirmedUSD * rate);
  const totalCollectedInUSD = confirmedUSD + (rate > 0 ? confirmedEGP / rate : 0);

  const totalApprovedExpenseInEGP = approvedExpenseEGP + (approvedExpenseUSD * rate);
  const totalApprovedExpenseInUSD = approvedExpenseUSD + (rate > 0 ? approvedExpenseEGP / rate : 0);

  const totalPaidExpenseInEGP = paidExpenseEGP + (paidExpenseUSD * rate);
  const totalPaidExpenseInUSD = paidExpenseUSD + (rate > 0 ? paidExpenseEGP / rate : 0);

  // Metric A: Net Collections After Approved Expenses (Confirmed Collections - Approved Expenses)
  const netCollectionsEGP = confirmedEGP - approvedExpenseEGP;
  const netCollectionsUSD = confirmedUSD - approvedExpenseUSD;
  const totalNetCollectionsInEGP = totalCollectedInEGP - totalApprovedExpenseInEGP;
  const totalNetCollectionsInUSD = totalCollectedInUSD - totalApprovedExpenseInUSD;

  let netStatus: 'positive' | 'negative' | 'zero' = 'zero';
  if (totalNetCollectionsInEGP > 0) netStatus = 'positive';
  else if (totalNetCollectionsInEGP < 0) netStatus = 'negative';

  const netMarginPercentage = totalCollectedInEGP > 0
    ? Math.round((totalNetCollectionsInEGP / totalCollectedInEGP) * 1000) / 10
    : 0;

  // Metric B: Net Cash Balance / Movement (Confirmed Received - Actually Paid Out)
  const netCashEGP = confirmedEGP - paidExpenseEGP;
  const netCashUSD = confirmedUSD - paidExpenseUSD;
  const totalNetCashInEGP = totalCollectedInEGP - totalPaidExpenseInEGP;
  const totalNetCashInUSD = totalCollectedInUSD - totalPaidExpenseInUSD;

  const unpaidApprovedCommitmentsEGP = approvedExpenseEGP - paidExpenseEGP;
  const unpaidApprovedCommitmentsUSD = approvedExpenseUSD - paidExpenseUSD;

  // 2. Account / Payment Method Breakdown Calculations
  // Evaluated on period & currency filtered transactions
  const periodPayments = filterPaymentsByOptions(payments, {
    dateBounds: bounds,
    currency: currencyFilter
  });
  const periodExpenses = filterExpensesByOptions(expenses, {
    dateBounds: bounds,
    currency: currencyFilter
  });

  const accountBreakdowns: AccountFinancialBreakdown[] = PAYMENT_METHODS_CATALOG.map(cat => {
    const pForMethod = periodPayments.filter(p => normalizePaymentMethod(p.payment_method) === cat.id);
    const eForMethod = periodExpenses.filter(e => normalizePaymentMethod(e.payment_method) === cat.id);

    const mConfirmed = pForMethod.filter(p => p.status === 'confirmed');
    const mConfirmedCount = mConfirmed.length;
    const mConfirmedEGP = mConfirmed.filter(p => p.currency === 'EGP').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const mConfirmedUSD = mConfirmed.filter(p => p.currency === 'USD').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const mTotalCollectedInEGP = mConfirmedEGP + (mConfirmedUSD * rate);
    const mTotalCollectedInUSD = mConfirmedUSD + (rate > 0 ? mConfirmedEGP / rate : 0);

    const mApprovedExp = eForMethod.filter(e => e.status === 'approved' || e.status === 'paid');
    const mApprovedExpCount = mApprovedExp.length;
    const mApprovedExpEGP = mApprovedExp.filter(e => e.currency === 'EGP').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const mApprovedExpUSD = mApprovedExp.filter(e => e.currency === 'USD').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const mTotalApprovedExpInEGP = mApprovedExpEGP + (mApprovedExpUSD * rate);
    const mTotalApprovedExpInUSD = mApprovedExpUSD + (rate > 0 ? mApprovedExpEGP / rate : 0);

    const mPaidExp = eForMethod.filter(e => e.status === 'paid');
    const mPaidExpCount = mPaidExp.length;
    const mPaidExpEGP = mPaidExp.filter(e => e.currency === 'EGP').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const mPaidExpUSD = mPaidExp.filter(e => e.currency === 'USD').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const mTotalPaidExpInEGP = mPaidExpEGP + (mPaidExpUSD * rate);
    const mTotalPaidExpInUSD = mPaidExpUSD + (rate > 0 ? mPaidExpEGP / rate : 0);

    const mNetEGP = mConfirmedEGP - mApprovedExpEGP;
    const mNetUSD = mConfirmedUSD - mApprovedExpUSD;
    const mTotalNetInEGP = mTotalCollectedInEGP - mTotalApprovedExpInEGP;
    const mTotalNetInUSD = mTotalCollectedInUSD - mTotalApprovedExpInUSD;

    let mNetStatus: 'positive' | 'negative' | 'zero' = 'zero';
    if (mTotalNetInEGP > 0) mNetStatus = 'positive';
    else if (mTotalNetInEGP < 0) mNetStatus = 'negative';

    const mNetCashEGP = mConfirmedEGP - mPaidExpEGP;
    const mNetCashUSD = mConfirmedUSD - mPaidExpUSD;
    const mTotalNetCashInEGP = mTotalCollectedInEGP - mTotalPaidExpInEGP;
    const mTotalNetCashInUSD = mTotalCollectedInUSD - mTotalPaidExpInUSD;

    const mUnpaidCommitmentsEGP = mApprovedExpEGP - mPaidExpEGP;
    const mUnpaidCommitmentsUSD = mApprovedExpUSD - mPaidExpUSD;

    return {
      id: cat.id,
      name_ar: cat.name_ar,
      name_en: cat.name_en,
      channel_ar: cat.channel_ar,
      channel_en: cat.channel_en,
      default_account_ar: cat.default_account_ar,
      default_account_en: cat.default_account_en,
      color: cat.color,

      confirmedEGP: mConfirmedEGP,
      confirmedUSD: mConfirmedUSD,
      confirmedCount: mConfirmedCount,
      totalCollectedInEGP: mTotalCollectedInEGP,
      totalCollectedInUSD: mTotalCollectedInUSD,

      approvedExpenseEGP: mApprovedExpEGP,
      approvedExpenseUSD: mApprovedExpUSD,
      approvedExpenseCount: mApprovedExpCount,
      totalApprovedExpenseInEGP: mTotalApprovedExpInEGP,
      totalApprovedExpenseInUSD: mTotalApprovedExpInUSD,

      paidExpenseEGP: mPaidExpEGP,
      paidExpenseUSD: mPaidExpUSD,
      paidExpenseCount: mPaidExpCount,
      totalPaidExpenseInEGP: mTotalPaidExpInEGP,
      totalPaidExpenseInUSD: mTotalPaidExpInUSD,

      netCollectionsEGP: mNetEGP,
      netCollectionsUSD: mNetUSD,
      totalNetCollectionsInEGP: mTotalNetInEGP,
      totalNetCollectionsInUSD: mTotalNetInUSD,
      netStatus: mNetStatus,

      netCashEGP: mNetCashEGP,
      netCashUSD: mNetCashUSD,
      totalNetCashInEGP: mTotalNetCashInEGP,
      totalNetCashInUSD: mTotalNetCashInUSD,
      unpaidApprovedCommitmentsEGP: mUnpaidCommitmentsEGP,
      unpaidApprovedCommitmentsUSD: mUnpaidCommitmentsUSD
    };
  });

  // Check for any unclassified transactions to ensure 100% auditing visibility
  const unclassifiedPayments = periodPayments.filter(p => normalizePaymentMethod(p.payment_method) === 'unclassified');
  const unclassifiedExpenses = periodExpenses.filter(e => normalizePaymentMethod(e.payment_method) === 'unclassified');
  const unclassifiedCount = unclassifiedPayments.length + unclassifiedExpenses.length;

  if (unclassifiedCount > 0) {
    const uConfirmed = unclassifiedPayments.filter(p => p.status === 'confirmed');
    const uConfirmedCount = uConfirmed.length;
    const uConfirmedEGP = uConfirmed.filter(p => p.currency === 'EGP').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const uConfirmedUSD = uConfirmed.filter(p => p.currency === 'USD').reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const uTotalCollectedInEGP = uConfirmedEGP + (uConfirmedUSD * rate);
    const uTotalCollectedInUSD = uConfirmedUSD + (rate > 0 ? uConfirmedEGP / rate : 0);

    const uApprovedExp = unclassifiedExpenses.filter(e => e.status === 'approved' || e.status === 'paid');
    const uApprovedExpCount = uApprovedExp.length;
    const uApprovedExpEGP = uApprovedExp.filter(e => e.currency === 'EGP').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const uApprovedExpUSD = uApprovedExp.filter(e => e.currency === 'USD').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const uTotalApprovedExpInEGP = uApprovedExpEGP + (uApprovedExpUSD * rate);
    const uTotalApprovedExpInUSD = uApprovedExpUSD + (rate > 0 ? uApprovedExpEGP / rate : 0);

    const uPaidExp = unclassifiedExpenses.filter(e => e.status === 'paid');
    const uPaidExpCount = uPaidExp.length;
    const uPaidExpEGP = uPaidExp.filter(e => e.currency === 'EGP').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const uPaidExpUSD = uPaidExp.filter(e => e.currency === 'USD').reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
    const uTotalPaidExpInEGP = uPaidExpEGP + (uPaidExpUSD * rate);
    const uTotalPaidExpInUSD = uPaidExpUSD + (rate > 0 ? uPaidExpEGP / rate : 0);

    const uNetEGP = uConfirmedEGP - uApprovedExpEGP;
    const uNetUSD = uConfirmedUSD - uApprovedExpUSD;
    const uTotalNetInEGP = uTotalCollectedInEGP - uTotalApprovedExpInEGP;
    const uTotalNetInUSD = uTotalCollectedInUSD - uTotalApprovedExpInUSD;

    accountBreakdowns.push({
      id: 'unclassified',
      name_ar: 'غير مصنف (قيد المراجعة)',
      name_en: 'Unclassified (Audit Pending)',
      channel_ar: 'حساب غير محدد',
      channel_en: 'Unspecified Account',
      default_account_ar: 'حساب وسيط معلق',
      default_account_en: 'Suspense Clearing Account',
      color: 'slate',

      confirmedEGP: uConfirmedEGP,
      confirmedUSD: uConfirmedUSD,
      confirmedCount: uConfirmedCount,
      totalCollectedInEGP: uTotalCollectedInEGP,
      totalCollectedInUSD: uTotalCollectedInUSD,

      approvedExpenseEGP: uApprovedExpEGP,
      approvedExpenseUSD: uApprovedExpUSD,
      approvedExpenseCount: uApprovedExpCount,
      totalApprovedExpenseInEGP: uTotalApprovedExpInEGP,
      totalApprovedExpenseInUSD: uTotalApprovedExpInUSD,

      paidExpenseEGP: uPaidExpEGP,
      paidExpenseUSD: uPaidExpUSD,
      paidExpenseCount: uPaidExpCount,
      totalPaidExpenseInEGP: uTotalPaidExpInEGP,
      totalPaidExpenseInUSD: uTotalPaidExpInUSD,

      netCollectionsEGP: uNetEGP,
      netCollectionsUSD: uNetUSD,
      totalNetCollectionsInEGP: uTotalNetInEGP,
      totalNetCollectionsInUSD: uTotalNetInUSD,
      netStatus: uTotalNetInEGP > 0 ? 'positive' : uTotalNetInEGP < 0 ? 'negative' : 'zero',

      netCashEGP: uConfirmedEGP - uPaidExpEGP,
      netCashUSD: uConfirmedUSD - uPaidExpUSD,
      totalNetCashInEGP: uTotalCollectedInEGP - uTotalPaidExpInEGP,
      totalNetCashInUSD: uTotalCollectedInUSD - uTotalPaidExpInUSD,
      unpaidApprovedCommitmentsEGP: uApprovedExpEGP - uPaidExpEGP,
      unpaidApprovedCommitmentsUSD: uApprovedExpUSD - uPaidExpUSD
    });
  }

  return {
    confirmedEGP,
    confirmedUSD,
    confirmedCount,
    pendingEGP,
    pendingUSD,
    pendingCount,
    totalCollectedInEGP,
    totalCollectedInUSD,

    approvedExpenseEGP,
    approvedExpenseUSD,
    approvedExpenseCount,
    totalApprovedExpenseInEGP,
    totalApprovedExpenseInUSD,

    pendingExpenseEGP,
    pendingExpenseUSD,
    pendingExpenseCount,

    paidExpenseEGP,
    paidExpenseUSD,
    paidExpenseCount,
    totalPaidExpenseInEGP,
    totalPaidExpenseInUSD,

    netCollectionsEGP,
    netCollectionsUSD,
    totalNetCollectionsInEGP,
    totalNetCollectionsInUSD,
    netStatus,
    netMarginPercentage,

    netCashEGP,
    netCashUSD,
    totalNetCashInEGP,
    totalNetCashInUSD,
    unpaidApprovedCommitmentsEGP,
    unpaidApprovedCommitmentsUSD,

    accountBreakdowns,
    unclassifiedCount,

    exchangeRate: rate,
    exchangeRateNotes: exchangeRate?.source || 'BCT Official Treasury Rate'
  };
}

/**
 * Returns current snapshot of financial summary directly from bctStore
 */
export function getStoreFinancialSummary(filterOptionsOrBounds?: FinancialFilterOptions | DateRangeBounds | null): FinancialSummary {
  return calculateFinancialSummary(
    bctStore.getPayments(),
    bctStore.getExpenses(),
    bctStore.getExchangeRate(),
    filterOptionsOrBounds
  );
}
