import React, { useState, useMemo } from 'react';
import { AccountMovement, FinancialAccount, InternalTransfer, StandardPaymentMethod, PaymentRecord, ExpenseRecord } from '../../types/database.types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { bctStore } from '../../services/store';
import { 
  BookOpen, 
  ArrowUpRight, 
  ArrowDownLeft, 
  RotateCcw, 
  Search, 
  Printer, 
  Calendar, 
  DollarSign, 
  CreditCard, 
  Building, 
  Wallet, 
  Zap, 
  Smartphone, 
  Plus, 
  Check, 
  X,
  Scale,
  ArrowRightLeft,
  FileText
} from 'lucide-react';
import { PrintablePaymentVoucher } from './PrintablePaymentVoucher';

interface AccountMovementLedgerProps {
  onOpenReceipt?: (payment: PaymentRecord) => void;
  onOpenPaymentVoucher?: (expense: ExpenseRecord) => void;
}

export const AccountMovementLedger: React.FC<AccountMovementLedgerProps> = ({ 
  onOpenReceipt, 
  onOpenPaymentVoucher 
}) => {
  const { language, isRtl } = useLanguage();
  const { currentUser, hasPermission } = useAuth();

  const [movements, setMovements] = useState<AccountMovement[]>(() => bctStore.getAccountMovements());
  const [accounts] = useState<FinancialAccount[]>(() => bctStore.getFinancialAccounts());
  const exchangeRate = bctStore.getExchangeRate();
  const rate = exchangeRate.rate || 50.0;

  // Filter States (Requirement E)
  const [selectedAccountId, setSelectedAccountId] = useState<string>('all');
  const [selectedChannel, setSelectedChannel] = useState<StandardPaymentMethod | 'all'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<'all' | 'EGP' | 'USD'>('all');
  const [currencyMode, setCurrencyMode] = useState<'original' | 'egp_eq' | 'usd_eq'>('original');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Internal Transfer Modal State (Requirement H)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [fromAccountId, setFromAccountId] = useState<string>('acc-bank-01');
  const [toAccountId, setToAccountId] = useState<string>('acc-cash-01');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [transferCurrency, setTransferCurrency] = useState<'EGP' | 'USD'>('EGP');
  const [transferNotes, setTransferNotes] = useState<string>('');
  const [transferError, setTransferError] = useState<string>('');

  // Active Voucher Modal Preview
  const [viewExpenseVoucher, setViewExpenseVoucher] = useState<ExpenseRecord | null>(null);

  const refreshMovements = () => {
    bctStore.reconcileAccountMovements();
    setMovements(bctStore.getAccountMovements());
  };

  const handleResetFilters = () => {
    setSelectedAccountId('all');
    setSelectedChannel('all');
    setSelectedCurrency('all');
    setDateFrom('');
    setDateTo('');
    setSelectedDocType('all');
    setSearchQuery('');
  };

  const hasActiveFilters = 
    selectedAccountId !== 'all' ||
    selectedChannel !== 'all' ||
    selectedCurrency !== 'all' ||
    dateFrom !== '' ||
    dateTo !== '' ||
    selectedDocType !== 'all' ||
    searchQuery !== '';

  // Calculate Opening Balance prior to Date From (Requirement B & F)
  const { openingBalanceEGP, openingBalanceUSD } = useMemo(() => {
    if (!dateFrom) {
      return { openingBalanceEGP: 0, openingBalanceUSD: 0 };
    }

    const fromTime = new Date(`${dateFrom}T00:00:00Z`).getTime();
    let opEGP = 0;
    let opUSD = 0;

    movements.forEach(m => {
      const mTime = new Date(m.posting_date).getTime();
      if (mTime < fromTime) {
        // Match account if filtered
        if (selectedAccountId !== 'all' && m.account_id !== selectedAccountId) return;
        if (selectedChannel !== 'all' && m.channel !== selectedChannel) return;

        if (m.currency === 'USD') {
          opUSD += m.debit_amount - m.credit_amount;
        } else {
          opEGP += m.debit_amount - m.credit_amount;
        }
      }
    });

    return { openingBalanceEGP: opEGP, openingBalanceUSD: opUSD };
  }, [movements, dateFrom, selectedAccountId, selectedChannel]);

  // Filtered movements for the table
  const filteredMovements = useMemo(() => {
    const fromTime = dateFrom ? new Date(`${dateFrom}T00:00:00Z`).getTime() : 0;
    const toTime = dateTo ? new Date(`${dateTo}T23:59:59Z`).getTime() : Infinity;

    return movements.filter(m => {
      const mTime = new Date(m.posting_date).getTime();
      if (mTime < fromTime || mTime > toTime) return false;

      if (selectedAccountId !== 'all' && m.account_id !== selectedAccountId) return false;
      if (selectedChannel !== 'all' && m.channel !== selectedChannel) return false;
      if (selectedCurrency !== 'all' && m.currency !== selectedCurrency) return false;

      if (selectedDocType !== 'all') {
        if (selectedDocType === 'receipts' && m.document_type !== 'receipt_voucher') return false;
        if (selectedDocType === 'payments' && m.document_type !== 'payment_voucher' && m.document_type !== 'incentive_voucher') return false;
        if (selectedDocType === 'transfers' && m.document_type !== 'transfer_in' && m.document_type !== 'transfer_out') return false;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesDoc = m.document_number.toLowerCase().includes(q);
        const matchesDesc = (m.description_ar + ' ' + m.description_en).toLowerCase().includes(q);
        const matchesRef = (m.transaction_reference || '').toLowerCase().includes(q);
        const matchesUser = (m.recorded_by || '').toLowerCase().includes(q);
        if (!matchesDoc && !matchesDesc && !matchesRef && !matchesUser) return false;
      }

      return true;
    });
  }, [movements, selectedAccountId, selectedChannel, selectedCurrency, selectedDocType, dateFrom, dateTo, searchQuery]);

  // Calculate Ledger Totals within the Filtered Range (Requirement F)
  const ledgerTotals = useMemo(() => {
    let totalDebitEGP = 0;
    let totalDebitUSD = 0;
    let totalCreditEGP = 0;
    let totalCreditUSD = 0;

    filteredMovements.forEach(m => {
      if (m.currency === 'USD') {
        totalDebitUSD += m.debit_amount;
        totalCreditUSD += m.credit_amount;
      } else {
        totalDebitEGP += m.debit_amount;
        totalCreditEGP += m.credit_amount;
      }
    });

    const closingBalanceEGP = openingBalanceEGP + totalDebitEGP - totalCreditEGP;
    const closingBalanceUSD = openingBalanceUSD + totalDebitUSD - totalCreditUSD;

    return {
      totalDebitEGP,
      totalDebitUSD,
      totalCreditEGP,
      totalCreditUSD,
      closingBalanceEGP,
      closingBalanceUSD
    };
  }, [filteredMovements, openingBalanceEGP, openingBalanceUSD]);

  // Handle Internal Transfer Submission
  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const amountNum = parseFloat(transferAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      setTransferError(isRtl ? 'يرجى إدخال مبلغ تحويل صحيح أكبر من صفر' : 'Please enter a valid amount');
      return;
    }

    const fromAcc = accounts.find(a => a.id === fromAccountId);
    const toAcc = accounts.find(a => a.id === toAccountId);

    const res = bctStore.createInternalTransfer({
      from_account_id: fromAccountId,
      from_account_name: fromAcc?.account_name_ar || fromAccountId,
      to_account_id: toAccountId,
      to_account_name: toAcc?.account_name_ar || toAccountId,
      amount: amountNum,
      currency: transferCurrency,
      transfer_date: new Date().toISOString(),
      reference_note: transferNotes
    }, currentUser.username);

    if (res.success) {
      setIsTransferModalOpen(false);
      setTransferAmount('');
      setTransferNotes('');
      setTransferError('');
      refreshMovements();
    } else {
      setTransferError(res.message || 'فشل التحويل');
    }
  };

  // Open voucher document handler (Requirement G)
  const handleOpenDocument = (movement: AccountMovement) => {
    if (movement.source_entity_type === 'payment_record') {
      const payment = bctStore.getPayments().find(p => p.id === movement.source_entity_id || p.receipt_code === movement.document_number);
      if (payment && onOpenReceipt) {
        onOpenReceipt(payment);
      }
    } else if (movement.source_entity_type === 'expense_record') {
      const exp = bctStore.getExpenses().find(e => e.id === movement.source_entity_id || e.voucher_code === movement.document_number);
      if (exp) {
        if (onOpenPaymentVoucher) {
          onOpenPaymentVoucher(exp);
        } else {
          setViewExpenseVoucher(exp);
        }
      }
    }
  };

  return (
    <div className="space-y-6">

      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-bct-navy">
              {isRtl ? 'كشف حركة الحسابات' : 'Account Movement Ledger'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
              {isRtl ? 'الأستاذ المساعد للحسابات' : 'Financial Ledger'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isRtl
              ? 'تتبع حركات المقبوضات والمدفوعات والأرصدة التراكمية لكل حساب مالي وفق الترتيب الزمني المحاسبي الموثق.'
              : 'Audit-ready debit, credit, and running balance ledger for all company financial accounts.'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Display Mode */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setCurrencyMode('original')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                currencyMode === 'original' ? 'bg-white text-bct-navy font-bold shadow-xs' : 'text-slate-600'
              }`}
            >
              {isRtl ? 'العملات الأصلية' : 'Original'}
            </button>
            <button
              onClick={() => setCurrencyMode('egp_eq')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                currencyMode === 'egp_eq' ? 'bg-white text-bct-navy font-bold shadow-xs' : 'text-slate-600'
              }`}
            >
              {isRtl ? 'معادل ج.م' : 'EGP Eq.'}
            </button>
            <button
              onClick={() => setCurrencyMode('usd_eq')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${
                currencyMode === 'usd_eq' ? 'bg-white text-bct-navy font-bold shadow-xs' : 'text-slate-600'
              }`}
            >
              {isRtl ? 'معادل $' : 'USD Eq.'}
            </button>
          </div>

          {/* Internal Transfer Action Button (Requirement H) */}
          {hasPermission('finance:approve') && (
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition cursor-pointer shadow-xs"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>{isRtl ? 'تحويل بين الحسابات' : 'Internal Transfer'}</span>
            </button>
          )}

          {/* Print/Export Ledger */}
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-xs"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>{isRtl ? 'طباعة الكشف' : 'Print Ledger'}</span>
          </button>
        </div>
      </div>

      {/* Ledger Summary Cards (Requirement F) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Opening Balance */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-bold">
            <span>{isRtl ? 'الرصيد الافتتاحي (قبل الفترة):' : 'Opening Balance:'}</span>
            <Scale className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {currencyMode === 'original' ? (
              <div className="space-y-0.5">
                <div>{openingBalanceEGP.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ج.م</span></div>
                {openingBalanceUSD !== 0 && (
                  <div className="text-sm font-bold text-emerald-700">${openingBalanceUSD.toLocaleString()}</div>
                )}
              </div>
            ) : currencyMode === 'egp_eq' ? (
              `${Math.round(openingBalanceEGP + openingBalanceUSD * rate).toLocaleString()} ج.م`
            ) : (
              `$${Math.round(openingBalanceUSD + openingBalanceEGP / rate).toLocaleString()}`
            )}
          </div>
          <div className="text-[10px] text-slate-400">
            {dateFrom ? (isRtl ? `تراكم الحركات السابقة لتاريخ ${dateFrom}` : `Prior to ${dateFrom}`) : (isRtl ? 'رصيد بداية النشاط المالي' : 'Initial recorded balance')}
          </div>
        </div>

        {/* Card 2: Total Debits (Receipts) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs font-bold">
            <span>{isRtl ? 'إجمالي المقبوضات (مدين):' : 'Total Debits (Receipts):'}</span>
            <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">
            {currencyMode === 'original' ? (
              <div className="space-y-0.5">
                <div>+{ledgerTotals.totalDebitEGP.toLocaleString()} <span className="text-xs font-semibold text-emerald-800">ج.م</span></div>
                {ledgerTotals.totalDebitUSD > 0 && (
                  <div className="text-sm font-bold text-emerald-700">+${ledgerTotals.totalDebitUSD.toLocaleString()}</div>
                )}
              </div>
            ) : currencyMode === 'egp_eq' ? (
              `+${Math.round(ledgerTotals.totalDebitEGP + ledgerTotals.totalDebitUSD * rate).toLocaleString()} ج.م`
            ) : (
              `+$${Math.round(ledgerTotals.totalDebitUSD + ledgerTotals.totalDebitEGP / rate).toLocaleString()}`
            )}
          </div>
          <div className="text-[10px] text-emerald-700 font-medium">
            {isRtl ? 'تحصيلات مؤكدة وتحويلات واردة تزيد الأصول' : 'Increases financial account assets'}
          </div>
        </div>

        {/* Card 3: Total Credits (Payments) */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200 bg-rose-50/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-rose-800 text-xs font-bold">
            <span>{isRtl ? 'إجمالي المدفوعات (دائن):' : 'Total Credits (Payments):'}</span>
            <ArrowUpRight className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-xl font-black text-rose-700">
            {currencyMode === 'original' ? (
              <div className="space-y-0.5">
                <div>-{ledgerTotals.totalCreditEGP.toLocaleString()} <span className="text-xs font-semibold text-rose-800">ج.م</span></div>
                {ledgerTotals.totalCreditUSD > 0 && (
                  <div className="text-sm font-bold text-rose-700">-${ledgerTotals.totalCreditUSD.toLocaleString()}</div>
                )}
              </div>
            ) : currencyMode === 'egp_eq' ? (
              `-${Math.round(ledgerTotals.totalCreditEGP + ledgerTotals.totalCreditUSD * rate).toLocaleString()} ج.م`
            ) : (
              `-$${Math.round(ledgerTotals.totalCreditUSD + ledgerTotals.totalCreditEGP / rate).toLocaleString()}`
            )}
          </div>
          <div className="text-[10px] text-rose-700 font-medium">
            {isRtl ? 'مصروفات مسددة وتحويلات صادرة تخفض الأصول' : 'Decreases financial account assets'}
          </div>
        </div>

        {/* Card 4: Closing Balance */}
        <div className="bg-white p-4 rounded-2xl border border-bct-navy/20 bg-slate-50 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-bct-navy text-xs font-bold">
            <span>{isRtl ? 'الرصيد الختامي التراكمي:' : 'Closing Balance:'}</span>
            <DollarSign className="w-4 h-4 text-bct-navy" />
          </div>
          <div className="text-xl font-black text-bct-navy">
            {currencyMode === 'original' ? (
              <div className="space-y-0.5">
                <div>{ledgerTotals.closingBalanceEGP.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ج.م</span></div>
                {ledgerTotals.closingBalanceUSD !== 0 && (
                  <div className="text-sm font-bold text-emerald-700">${ledgerTotals.closingBalanceUSD.toLocaleString()}</div>
                )}
              </div>
            ) : currencyMode === 'egp_eq' ? (
              `${Math.round(ledgerTotals.closingBalanceEGP + ledgerTotals.closingBalanceUSD * rate).toLocaleString()} ج.م`
            ) : (
              `$${Math.round(ledgerTotals.closingBalanceUSD + ledgerTotals.closingBalanceEGP / rate).toLocaleString()}`
            )}
          </div>
          <div className="text-[10px] text-slate-500 font-medium">
            {isRtl ? 'الرصيد الفعلي المتاح بالحسابات المحددة' : 'Actual available net balance'}
          </div>
        </div>

      </div>

      {/* Filter Toolbar (Requirement E) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 text-xs">
          
          {/* Account Filter */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">{isRtl ? 'الحساب المالي:' : 'Account:'}</label>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="w-full p-2 border rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold"
            >
              <option value="all">{isRtl ? 'كافة الحسابات' : 'All Accounts'}</option>
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>{acc.account_name_ar}</option>
              ))}
            </select>
          </div>

          {/* Payment Method / Channel */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">{isRtl ? 'قناة الدفع:' : 'Channel:'}</label>
            <select
              value={selectedChannel}
              onChange={(e) => setSelectedChannel(e.target.value as any)}
              className="w-full p-2 border rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold"
            >
              <option value="all">{isRtl ? 'كل القنوات' : 'All Channels'}</option>
              <option value="bank_transfer">{isRtl ? 'تحويل بنكي رسمي' : 'Bank Transfer'}</option>
              <option value="cash">{isRtl ? 'نقداً بالخزينة' : 'Cash Treasury'}</option>
              <option value="instapay">{isRtl ? 'إنستاباي IPN' : 'InstaPay'}</option>
              <option value="vodafone_cash">{isRtl ? 'فودافون كاش' : 'Vodafone Cash'}</option>
            </select>
          </div>

          {/* Currency */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">{isRtl ? 'العملة:' : 'Currency:'}</label>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as any)}
              className="w-full p-2 border rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold"
            >
              <option value="all">{isRtl ? 'كل العملات' : 'All Currencies'}</option>
              <option value="EGP">{isRtl ? 'جنيه مصري (EGP)' : 'EGP'}</option>
              <option value="USD">{isRtl ? 'دولار أمريكي (USD)' : 'USD'}</option>
            </select>
          </div>

          {/* Document Type */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">{isRtl ? 'نوع الحركة:' : 'Movement Type:'}</label>
            <select
              value={selectedDocType}
              onChange={(e) => setSelectedDocType(e.target.value)}
              className="w-full p-2 border rounded-xl bg-slate-50 focus:bg-white text-xs font-semibold"
            >
              <option value="all">{isRtl ? 'كافة الحركات' : 'All Movements'}</option>
              <option value="receipts">{isRtl ? 'سندات قبض (مدين)' : 'Receipts (Debits)'}</option>
              <option value="payments">{isRtl ? 'سندات صرف (دائن)' : 'Payments (Credits)'}</option>
              <option value="transfers">{isRtl ? 'تحويلات بين الحسابات' : 'Internal Transfers'}</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">{isRtl ? 'من تاريخ:' : 'Date From:'}</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full p-2 border rounded-xl bg-slate-50 focus:bg-white text-xs"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-slate-600 font-bold mb-1">{isRtl ? 'إلى تاريخ:' : 'Date To:'}</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full p-2 border rounded-xl bg-slate-50 focus:bg-white text-xs"
            />
          </div>

        </div>

        {/* Search & Reset */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="relative w-full sm:w-80">
            <Search className="w-3.5 h-3.5 absolute top-2.5 start-2.5 text-slate-400" />
            <input
              type="text"
              placeholder={isRtl ? 'بحث برقم السند، البيان، المعاملة، أو المستخدم...' : 'Search document, reference, or user...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="ps-8 pe-3 py-1.5 border rounded-xl text-xs bg-slate-50 focus:bg-white w-full"
            />
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500 font-medium">
              {isRtl ? `عرض ${filteredMovements.length} حركة محاسبية` : `Showing ${filteredMovements.length} movements`}
            </span>
            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetFilters}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 cursor-pointer shadow-xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Prior Period Opening Balance Banner (Requirement: Opening balance prior to Date From) */}
      {dateFrom && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-xs">
          <div className="flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="font-extrabold">
              {isRtl ? `الرصيد الافتتاحي ما قبل الفترة (${dateFrom}):` : `Opening Balance prior to ${dateFrom}:`}
            </span>
            <span className="tabular-nums font-black text-amber-900 text-sm">
              {openingBalanceEGP.toLocaleString()} ج.م {openingBalanceUSD !== 0 ? `| $${openingBalanceUSD.toLocaleString()}` : ''}
            </span>
          </div>
          <span className="text-[11px] text-amber-800 font-medium">
            {isRtl ? 'تراكم إجمالي التحصيلات مخصوماً منها المصروفات المنصرفة قبل تاريخ البداية' : 'Net accumulation prior to selected start date'}
          </span>
        </div>
      )}

      {/* ============================================================== */}
      {/* LEDGER TABLE (Requirement A)                                    */}
      {/* ============================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* A. RESPONSIVE CARDS VIEW FOR SMALL & MEDIUM SCREENS (< lg) - ZERO HORIZONTAL SCROLLING */}
        <div className="lg:hidden space-y-3 p-3">
          {filteredMovements.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              {isRtl ? 'لا توجد حركات مالية مطابقة للفلاتر المحددة' : 'No account movements found'}
            </div>
          ) : (
            filteredMovements.map((m) => {
              const isDebit = m.debit_amount > 0;
              const isCredit = m.credit_amount > 0;

              return (
                <div key={m.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2.5">
                  {/* Card Header: Doc Number + Date + Debit/Credit Amount */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-1.5 font-mono font-bold text-bct-navy text-xs">
                      <button
                        type="button"
                        onClick={() => handleOpenDocument(m)}
                        className="hover:underline cursor-pointer"
                        title={isRtl ? 'عرض مستند السند الأصلي' : 'View voucher'}
                      >
                        {m.document_number}
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-400">
                        {m.posting_date?.split('T')[0] || '-'}
                      </span>
                      {isDebit && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                          +{m.debit_amount.toLocaleString()} {m.currency}
                        </span>
                      )}
                      {isCredit && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-black bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                          -{m.credit_amount.toLocaleString()} {m.currency}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Description & Account */}
                  <div>
                    <div className="font-semibold text-slate-800 text-xs">
                      {isRtl ? m.description_ar : m.description_en}
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium mt-0.5">
                      {m.account_name_ar} {m.channel ? `• ${m.channel}` : ''}
                    </div>
                  </div>

                  {/* Details Grid: Balance, Tx Ref, User, Action */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/70 p-2 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{isRtl ? 'الرصيد التراكمي:' : 'Running Balance:'}</span>
                      <span className="font-black text-slate-900 tabular-nums">
                        {m.running_balance.toLocaleString()} {m.currency}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{isRtl ? 'رقم المعاملة:' : 'Tx Ref:'}</span>
                      <span className="font-mono text-slate-700 font-bold">
                        {m.transaction_reference || '—'}
                      </span>
                    </div>
                  </div>

                  {/* Footer: User & Action */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                    <span>{isRtl ? 'المسجل:' : 'Recorded by:'} <strong className="text-slate-700">{m.recorded_by}</strong></span>
                    {(m.source_entity_type === 'payment_record' || m.source_entity_type === 'expense_record') && (
                      <button
                        type="button"
                        onClick={() => handleOpenDocument(m)}
                        className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
                        title={isRtl ? 'عرض وطباعة السند المالي' : 'View & Print Document'}
                      >
                        <Printer className="w-3 h-3" />
                        <span>{isRtl ? 'عرض السند' : 'View'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* B. FULL VISIBILITY TABLE FOR DESKTOPS & LAPTOPS (lg+) - NO HORIZONTAL SCROLLBAR */}
        <div className="hidden lg:block w-full overflow-hidden">
          <table className="w-full text-xs text-start border-collapse table-auto xl:table-fixed">
            <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] xl:text-xs">
              <tr>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[8%]">{isRtl ? 'تاريخ القيد' : 'Date'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[13%]">{isRtl ? 'رقم المستند' : 'Doc No'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[13%]">{isRtl ? 'الحساب المالي' : 'Account'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[18%]">{isRtl ? 'البيان والمعاملة' : 'Description & Tx'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[10%]">{isRtl ? 'مدين (تحصيل)' : 'Debit'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[10%]">{isRtl ? 'دائن (صرف)' : 'Credit'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[5%]">{isRtl ? 'العملة' : 'Cur'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[12%]">{isRtl ? 'الرصيد التراكمي' : 'Running Balance'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[6%]">{isRtl ? 'المستخدم' : 'User'}</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-end whitespace-nowrap w-[5%]">{isRtl ? 'السند' : 'Action'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-10 text-center text-slate-400">
                    {isRtl ? 'لا توجد حركات مالية مطابقة للفلاتر المحددة' : 'No account movements found'}
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isDebit = m.debit_amount > 0;
                  const isCredit = m.credit_amount > 0;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/70 transition">
                      {/* 1. Date */}
                      <td className="py-2 px-2 xl:px-2.5 text-slate-600 font-mono text-[11px] whitespace-nowrap tabular-nums">
                        {m.posting_date?.split('T')[0] || '-'}
                      </td>

                      {/* 2. Document Number */}
                      <td className="py-2 px-2 xl:px-2.5 font-mono font-bold text-bct-navy whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenDocument(m)}
                          className="hover:underline cursor-pointer inline-flex items-center gap-1"
                          title={isRtl ? 'عرض مستند السند الأصلي' : 'View voucher'}
                        >
                          <span>{m.document_number}</span>
                        </button>
                      </td>

                      {/* 3. Account Name */}
                      <td className="py-2 px-2 xl:px-2.5">
                        <div className="font-semibold text-slate-800 text-[11px] truncate max-w-[140px]" title={m.account_name_ar}>
                          {m.account_name_ar}
                        </div>
                        {m.channel && (
                          <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">
                            {m.channel}
                          </div>
                        )}
                      </td>

                      {/* 4. Description & Tx Ref */}
                      <td className="py-2 px-2 xl:px-2.5 text-slate-800">
                        <div className="font-semibold text-[11px] leading-tight line-clamp-1" title={isRtl ? m.description_ar : m.description_en}>
                          {isRtl ? m.description_ar : m.description_en}
                        </div>
                        {m.transaction_reference && (
                          <div className="text-[10px] font-mono text-bct-navy font-bold whitespace-nowrap mt-0.5">
                            {m.transaction_reference}
                          </div>
                        )}
                      </td>

                      {/* 5. Debit */}
                      <td className="py-2 px-2 xl:px-2.5 font-black whitespace-nowrap tabular-nums">
                        {isDebit ? (
                          <span className="text-emerald-700">
                            +{m.debit_amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* 6. Credit */}
                      <td className="py-2 px-2 xl:px-2.5 font-black whitespace-nowrap tabular-nums">
                        {isCredit ? (
                          <span className="text-rose-700">
                            -{m.credit_amount.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-slate-300 font-normal">—</span>
                        )}
                      </td>

                      {/* 7. Currency */}
                      <td className="py-2 px-2 xl:px-2.5 text-slate-500 font-mono text-[10px] font-bold whitespace-nowrap">
                        {m.currency}
                      </td>

                      {/* 8. Running Balance */}
                      <td className="py-2 px-2 xl:px-2.5 tabular-nums font-black text-slate-900 text-[11px] whitespace-nowrap">
                        {m.running_balance.toLocaleString()}
                      </td>

                      {/* 9. Recorded By */}
                      <td className="py-2 px-2 xl:px-2.5 text-slate-600 text-[10px] whitespace-nowrap">
                        {m.recorded_by}
                      </td>

                      {/* 10. Actions */}
                      <td className="py-2 px-2 xl:px-2.5 text-end whitespace-nowrap">
                        {(m.source_entity_type === 'payment_record' || m.source_entity_type === 'expense_record') && (
                          <button
                            type="button"
                            onClick={() => handleOpenDocument(m)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                            title={isRtl ? 'عرض وطباعة السند المالي' : 'View & Print Document'}
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MODAL: INTERNAL ACCOUNT TRANSFER (Requirement H)               */}
      {/* ============================================================== */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-bct-navy">
                <ArrowRightLeft className="w-5 h-5" />
                <h3 className="text-sm font-black text-slate-900">
                  {isRtl ? 'إجراء تحويل مالي بين الحسابات' : 'Internal Account Transfer'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-[11px] text-slate-500">
              {isRtl
                ? 'يتم قيد حركة صادر (دائن) للحساب المحول منه وحركة وارد (مدين) للحساب المحول إليه مع حفظ توازن الأستاذ دون تصنيفها كإيراد أو مصروف جديد.'
                : 'Double-entry transfer preserving ledger balance without counting as revenue or operating expense.'}
            </p>

            <form onSubmit={handleExecuteTransfer} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'من الحساب (صادر / دائن) *' : 'From Account (Source / Credit) *'}
                </label>
                <select
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white text-xs font-bold"
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.account_name_ar}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'إلى الحساب (وارد / مدين) *' : 'To Account (Destination / Debit) *'}
                </label>
                <select
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white text-xs font-bold"
                  required
                >
                  {accounts.map(acc => (
                    <option key={acc.id} value={acc.id}>{acc.account_name_ar}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'المبلغ المحول *' : 'Amount *'}
                  </label>
                  <input
                    type="number"
                    value={transferAmount}
                    onChange={(e) => setTransferAmount(e.target.value)}
                    required
                    placeholder="25000"
                    className="w-full p-2.5 border rounded-xl text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'العملة *' : 'Currency *'}
                  </label>
                  <select
                    value={transferCurrency}
                    onChange={(e) => setTransferCurrency(e.target.value as any)}
                    className="w-full p-2.5 border rounded-xl bg-white text-xs font-bold"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'بيان وسبب التحويل' : 'Reference Notes'}
                </label>
                <input
                  type="text"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  placeholder={isRtl ? 'مثال: تغذية الخزينة النقدية من الحساب البنكي' : 'e.g., Vault replenishment'}
                  className="w-full p-2.5 border rounded-xl text-xs"
                />
              </div>

              {transferError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                  {transferError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-bct-navy hover:bg-bct-dark text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تنفيذ التحويل' : 'Execute Transfer'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Standalone Expense Voucher Preview */}
      {viewExpenseVoucher && (
        <PrintablePaymentVoucher
          expense={viewExpenseVoucher}
          onClose={() => setViewExpenseVoucher(null)}
        />
      )}

    </div>
  );
};
