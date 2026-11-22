import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { 
  calculateFinancialSummary, 
  filterPaymentsByDate, 
  filterExpensesByDate,
  filterPaymentsByOptions,
  filterExpensesByOptions,
  getDateRangeBounds, 
  FinancialTimeRange,
  FinancialFilterOptions,
  StandardPaymentMethod,
  PAYMENT_METHODS_CATALOG,
  normalizePaymentMethod,
  getPaymentMethodDetails,
  AccountFinancialBreakdown
} from '../services/financialAggregator';
import { PaymentRecord, ExpenseRecord, DepartmentBudget, ExchangeRate } from '../types/database.types';
import { PrintablePaymentVoucher } from '../components/finance/PrintablePaymentVoucher';
import { EmployeeIncentiveSection } from '../components/finance/EmployeeIncentiveSection';
import { AccountMovementLedger } from '../components/finance/AccountMovementLedger';
import { 
  Wallet, 
  Receipt, 
  CheckCircle, 
  Plus, 
  ShieldCheck, 
  AlertCircle, 
  TrendingUp, 
  ArrowDownLeft, 
  Search, 
  X, 
  FileCheck2, 
  DollarSign, 
  Printer, 
  Download,
  Edit3, 
  Check, 
  AlertTriangle, 
  Building, 
  Building2,
  TrendingDown, 
  ArrowRight, 
  ArrowLeft, 
  Calendar, 
  Layers, 
  FileText, 
  BadgePercent, 
  RotateCcw, 
  Scale, 
  Filter,
  CreditCard,
  Zap,
  Smartphone,
  Award,
  BookOpen,
  Lock,
  XCircle,
  Ban
} from 'lucide-react';

export const FinanceDashboard: React.FC = () => {
  const { t, language, isRtl } = useLanguage();
  const { currentUser, isSuperAdmin, hasPermission } = useAuth();

  const location = useLocation();
  const navigate = useNavigate();

  // Unified single source of truth for Finance navigation (Modifications 3, 4, 5)
  const activeTab: 'payments' | 'expenses' | 'budgets' | 'incentives' | 'ledger' = useMemo(() => {
    const path = location.pathname.toLowerCase();
    if (path.includes('/finance/expenses')) return 'expenses';
    if (path.includes('/finance/budgets')) return 'budgets';
    if (path.includes('/finance/incentives')) return 'incentives';
    if (path.includes('/finance/ledger')) return 'ledger';
    if (path.includes('/finance/payments')) return 'payments';
    return 'payments';
  }, [location.pathname]);

  const handleTabChange = (targetTab: 'payments' | 'expenses' | 'budgets' | 'incentives' | 'ledger') => {
    navigate(`/finance/${targetTab}`);
  };

  // Currency View Mode (Fix 12)
  const [currencyView, setCurrencyView] = useState<'original' | 'egp_eq' | 'usd_eq'>('original');

  // Store data (lazy initializers to prevent unnecessary reads on re-render)
  const [payments, setPayments] = useState<PaymentRecord[]>(() => bctStore.getPayments());
  const [expenses, setExpenses] = useState<ExpenseRecord[]>(() => bctStore.getExpenses());
  const [budgets, setBudgets] = useState<DepartmentBudget[]>(() => bctStore.getBudgets());
  const [exchangeRate, setExchangeRate] = useState<ExchangeRate>(() => bctStore.getExchangeRate());
  const students = bctStore.getStudents();
  const studentFiles = bctStore.getStudentFiles();
  const departments = bctStore.getDepartments();
  const financialAccounts = bctStore.getFinancialAccounts();

  // Modals state
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isRateModalOpen, setIsRateModalOpen] = useState(false);
  const [receiptToPrint, setReceiptToPrint] = useState<PaymentRecord | null>(null);
  const [voucherToPrint, setVoucherToPrint] = useState<ExpenseRecord | null>(null);

  // Period filter states (Requirement 7)
  const [timeRange, setTimeRange] = useState<FinancialTimeRange>('all');
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customStart, setCustomStart] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEnd, setCustomEnd] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [appliedCustomRange, setAppliedCustomRange] = useState<{ start: string; end: string } | null>(null);
  const [dateError, setDateError] = useState<string | null>(null);

  // Standardized Payment Method / Account Filter & Currency Filter (Requirements 3, 4, 5)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<StandardPaymentMethod | 'all' | 'unclassified'>('all');
  const [selectedCurrency, setSelectedCurrency] = useState<'all' | 'EGP' | 'USD'>('all');

  // Reversal modal state (Requirement 4 & 5)
  const [paymentToReverse, setPaymentToReverse] = useState<PaymentRecord | null>(null);
  const [reversalReason, setReversalReason] = useState('');
  const [reversalError, setReversalError] = useState('');

  // Mark Expense as Paid modal state (Requirement 8)
  const [expenseToPay, setExpenseToPay] = useState<ExpenseRecord | null>(null);
  const [payoutMethod, setPayoutMethod] = useState<StandardPaymentMethod>('bank_transfer');
  const [payoutNotes, setPayoutNotes] = useState('');

  // Payment Method Correction state (Requirement 8 & Store Audit)
  const [paymentToCorrect, setPaymentToCorrect] = useState<PaymentRecord | null>(null);
  const [expenseToCorrect, setExpenseToCorrect] = useState<ExpenseRecord | null>(null);
  const [correctMethod, setCorrectMethod] = useState<StandardPaymentMethod>('bank_transfer');
  const [correctReason, setCorrectReason] = useState('');
  const [correctError, setCorrectError] = useState('');

  // Edit Pending Payment Receipt modal state (Strictly before confirmation)
  const [paymentToEdit, setPaymentToEdit] = useState<PaymentRecord | null>(null);
  const [editPaymentFormData, setEditPaymentFormData] = useState({
    payment_date: '',
    amount: '',
    currency: 'EGP',
    payment_method: 'bank_transfer' as PaymentRecord['payment_method'],
    financial_account_id: '',
    bank_name: '',
    student_id: '',
    student_file_id: '',
    payer_name: '',
    payment_reference: '',
    payment_description: '',
    notes: '',
    reason: ''
  });
  const [editPaymentError, setEditPaymentError] = useState('');
  const [receiptFeedback, setReceiptFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Cancel Pending Payment Receipt modal state (Strictly before confirmation)
  const [paymentToCancel, setPaymentToCancel] = useState<PaymentRecord | null>(null);
  const [cancellationReason, setCancellationReason] = useState('');
  const [cancelPaymentError, setCancelPaymentError] = useState('');

  // Filters & Search
  const [paymentFilterStatus, setPaymentFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expenseFilterCat, setExpenseFilterCat] = useState<string>('all');

  // Form states
  const [paymentFormData, setPaymentFormData] = useState({
    student_id: '',
    student_file_id: '',
    amount: '',
    currency: 'EGP',
    payment_method: 'bank_transfer' as PaymentRecord['payment_method'],
    payment_reference: '',
    bank_name: 'البنك الأهلي المصري',
    payer_name: '',
    payment_description: '',
    notes: '',
  });

  // Receipt description inline editing state
  const [isEditingReceiptDesc, setIsEditingReceiptDesc] = useState(false);
  const [editedReceiptDesc, setEditedReceiptDesc] = useState('');
  const [editDescError, setEditDescError] = useState('');

  const [expenseFormData, setExpenseFormData] = useState({
    title: '',
    category: 'operational' as ExpenseRecord['category'],
    amount: '',
    currency: 'EGP' as 'EGP' | 'USD',
    department_id: 'ops',
    payment_method: 'bank_transfer' as StandardPaymentMethod,
    bank_name: 'البنك الأهلي المصري',
    vendor_name: '',
    invoice_number: '',
    description: '',
    beneficiary_employee_id: '',
    transaction_number: '',
    incentive_type: 'file_completion',
    notes: '',
  });

  const [budgetFormData, setBudgetFormData] = useState({
    department_id: 'ops',
    fiscal_year: '2026/2027',
    period: 'Q4-2026' as 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'annual',
    allocated_amount: '',
    currency: 'EGP' as 'EGP' | 'USD',
  });

  const [newRateValue, setNewRateValue] = useState(String(exchangeRate.rate || 50.0));

  useEffect(() => {
    return bctStore.subscribe(() => {
      setPayments(bctStore.getPayments());
      setExpenses(bctStore.getExpenses());
      setBudgets(bctStore.getBudgets());
      setExchangeRate(bctStore.getExchangeRate());
    });
  }, []);

  // Consistent Period Boundaries (Requirement 7)
  const dateBounds = useMemo(() => {
    return getDateRangeBounds(timeRange, appliedCustomRange);
  }, [timeRange, appliedCustomRange]);

  // Combined Financial Filter Options (Requirements 3, 4, 5, 6)
  const filterOptions: FinancialFilterOptions = useMemo(() => ({
    dateBounds,
    paymentMethod: selectedPaymentMethod,
    currency: selectedCurrency
  }), [dateBounds, selectedPaymentMethod, selectedCurrency]);

  const hasActiveFilters = selectedPaymentMethod !== 'all' || selectedCurrency !== 'all' || timeRange !== 'all' || appliedCustomRange !== null;

  const handleResetAllFilters = () => {
    setSelectedPaymentMethod('all');
    setSelectedCurrency('all');
    setTimeRange('all');
    setAppliedCustomRange(null);
    setShowCustomPicker(false);
    setDateError(null);
  };

  // Financial aggregates by currency & account channel (Shared single source of truth - Requirements 1, 2, 3, 6, 7)
  const financialSummary = useMemo(() => {
    return calculateFinancialSummary(payments, expenses, exchangeRate, filterOptions);
  }, [payments, expenses, exchangeRate, filterOptions]);

  const {
    confirmedEGP,
    confirmedUSD,
    confirmedCount,
    pendingEGP,
    pendingUSD,
    pendingCount,
    approvedExpenseEGP,
    approvedExpenseUSD,
    approvedExpenseCount,
    totalApprovedExpenseInEGP,
    totalApprovedExpenseInUSD,
    paidExpenseEGP,
    paidExpenseUSD,
    paidExpenseCount,
    totalPaidExpenseInEGP,
    totalPaidExpenseInUSD,
    totalCollectedInEGP,
    totalCollectedInUSD,
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
    exchangeRate: rate
  } = financialSummary;

  const emergencyReserveTarget = 450000; // 3 months operational buffer
  const emergencyReserveCurrent = totalCollectedInEGP * 0.35;
  const reserveRatio = Math.min(100, Math.round((emergencyReserveCurrent / emergencyReserveTarget) * 100));

  // Filtered Payments (respecting combined filters: search, status, payment method, currency, period)
  const filteredPayments = useMemo(() => {
    const optionFiltered = filterPaymentsByOptions(payments, filterOptions);
    return optionFiltered.filter(p => {
      const matchesSearch = 
        p.receipt_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.payer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (p.student_name && p.student_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
        p.payment_reference.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = paymentFilterStatus === 'all' || p.status === paymentFilterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [payments, filterOptions, searchQuery, paymentFilterStatus]);

  // Filtered Expenses (respecting combined filters: category, payment method, currency, period)
  const filteredExpenses = useMemo(() => {
    const optionFiltered = filterExpensesByOptions(expenses, filterOptions);
    return optionFiltered.filter(e => {
      const matchesCat = expenseFilterCat === 'all' || e.category === expenseFilterCat;
      return matchesCat;
    });
  }, [expenses, filterOptions, expenseFilterCat]);

  // Period filter actions
  const handleApplyCustomDate = () => {
    if (!customStart || !customEnd) {
      setDateError(isRtl ? 'يرجى تحديد تاريخ البداية والنهاية' : 'Please select both start and end dates');
      return;
    }
    if (new Date(customStart) > new Date(customEnd)) {
      setDateError(isRtl ? 'تاريخ البداية يجب أن يكون قبل أو يساوي تاريخ النهاية' : 'Start date must be before or equal to end date');
      return;
    }
    setDateError(null);
    setAppliedCustomRange({ start: customStart, end: customEnd });
    setTimeRange('custom');
    setShowCustomPicker(false);
  };

  const handleResetDate = () => {
    setTimeRange('all');
    setAppliedCustomRange(null);
    setDateError(null);
    setShowCustomPicker(false);
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setCustomStart(d.toISOString().split('T')[0]);
    setCustomEnd(new Date().toISOString().split('T')[0]);
  };

  // Payment reversal action
  const handleOpenReversePayment = (payment: PaymentRecord) => {
    setPaymentToReverse(payment);
    setReversalReason('');
    setReversalError('');
  };

  const handleExecuteReversePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentToReverse) return;
    if (!reversalReason.trim()) {
      setReversalError(language === 'ar' ? 'يرجى كتابة سبب العكس / الاسترداد المالي' : 'Please provide reversal reason');
      return;
    }

    const res = bctStore.reversePayment(paymentToReverse.id, reversalReason.trim(), currentUser?.username || 'admin');
    if (res.success) {
      setPaymentToReverse(null);
    } else {
      setReversalError(res.message || 'فشلت عملية العكس');
    }
  };

  // Expense status actions
  const handleApproveExpense = (expId: string) => {
    bctStore.updateExpenseStatus(expId, 'approved', currentUser?.username || 'admin', currentUser?.id);
  };

  const handleRejectExpense = (expId: string) => {
    const reason = prompt(language === 'ar' ? 'يرجى إدخال سبب الرفض:' : 'Enter rejection reason:');
    if (reason !== null) {
      bctStore.updateExpenseStatus(expId, 'rejected', currentUser?.username || 'admin', undefined, reason);
    }
  };

  const handleMarkExpensePaid = (exp: ExpenseRecord) => {
    setExpenseToPay(exp);
    const norm = normalizePaymentMethod(exp.payment_method);
    setPayoutMethod(norm !== 'unclassified' ? norm : 'bank_transfer');
    setPayoutNotes('');
  };

  const handleConfirmPayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseToPay) return;

    if (expenseToPay.category === 'employee_incentives') {
      const check = bctStore.canPayExpense(expenseToPay.id);
      if (!check.allowed) {
        alert(check.reason || (language === 'ar'
          ? 'لا يمكن إصدار سند صرف الحافز لأن المعاملة لم تصل إلى مرحلة مغلق + تقييم.'
          : 'The incentive payment voucher cannot be issued because the transaction has not reached Closed & Evaluated.'
        ));
        return;
      }
    }

    const targetId = expenseToPay.id;
    const success = bctStore.updateExpenseStatus(
      targetId,
      'paid',
      currentUser?.username || 'admin',
      currentUser?.id,
      payoutNotes ? `[سداد فعلي عبر ${getPaymentMethodDetails(payoutMethod, language as any).name}]: ${payoutNotes}` : undefined,
      payoutMethod
    );

    if (success) {
      const updatedExpense = bctStore.getExpenses().find(e => e.id === targetId);
      setExpenseToPay(null);
      setPayoutNotes('');
      if (updatedExpense) {
        setVoucherToPrint(updatedExpense);
      }
    }
  };

  const handleExecuteCorrection = () => {
    if (!currentUser || !correctReason.trim()) return;
    if (paymentToCorrect) {
      const res = bctStore.updatePaymentMethod(paymentToCorrect.id, correctMethod, correctReason, currentUser.username);
      if (res.success) {
        setPaymentToCorrect(null);
        setCorrectReason('');
        setCorrectError('');
      } else {
        setCorrectError(res.message || 'فشل تعديل طريقة الدفع');
      }
    } else if (expenseToCorrect) {
      const res = bctStore.updateExpensePaymentMethod(expenseToCorrect.id, correctMethod, correctReason, currentUser.username);
      if (res.success) {
        setExpenseToCorrect(null);
        setCorrectReason('');
        setCorrectError('');
      } else {
        setCorrectError(res.message || 'فشل تعديل طريقة الصرف');
      }
    }
  };

  const handleCancelExpense = (expId: string) => {
    const reason = prompt(language === 'ar' ? 'سبب إلغاء المصروف:' : 'Cancellation reason:');
    if (reason !== null) {
      bctStore.updateExpenseStatus(expId, 'cancelled', currentUser?.username || 'admin', undefined, reason);
    }
  };

  // Actions
  const handleConfirmPayment = (paymentId: string) => {
    bctStore.confirmPayment(paymentId, currentUser?.username || 'accountant', currentUser?.id || 'emp-008');
  };

  const handleOpenEditPaymentModal = (payment: PaymentRecord) => {
    if (payment.status !== 'pending') {
      setReceiptFeedback({
        type: 'error',
        text: language === 'ar'
          ? 'لا يمكن تعديل السند بعد تأكيد السداد.'
          : 'Cannot edit receipt after payment confirmation.'
      });
      setTimeout(() => setReceiptFeedback(null), 4000);
      return;
    }
    if (!hasPermission('payments:edit_pending')) {
      setReceiptFeedback({
        type: 'error',
        text: language === 'ar'
          ? 'ليس لديك صلاحية تعديل سند تحصيل غير مؤكد.'
          : 'You do not have permission to edit pending payment receipts.'
      });
      setTimeout(() => setReceiptFeedback(null), 4000);
      return;
    }

    const matchedAccount = payment.financial_account_id
      ? financialAccounts.find(a => a.id === payment.financial_account_id)
      : undefined;

    setPaymentToEdit(payment);
    setEditPaymentError('');
    setEditPaymentFormData({
      payment_date: payment.created_at ? payment.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
      amount: String(payment.amount ?? ''),
      currency: payment.currency || 'EGP',
      payment_method: payment.payment_method || 'bank_transfer',
      financial_account_id: matchedAccount?.id || payment.financial_account_id || '',
      bank_name: payment.bank_name || payment.financial_account_name || '',
      student_id: payment.student_id || '',
      student_file_id: payment.student_file_id || '',
      payer_name: payment.payer_name || '',
      payment_reference: payment.payment_reference || '',
      payment_description: payment.payment_description || payment.notes || '',
      notes: payment.notes || '',
      reason: ''
    });
  };

  const handleSaveEditedPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentToEdit) return;

    if (paymentToEdit.status !== 'pending') {
      setEditPaymentError(
        language === 'ar'
          ? 'لا يمكن تعديل السند بعد تأكيد السداد.'
          : 'Cannot edit receipt after payment confirmation.'
      );
      return;
    }

    const parsedAmount = Number(editPaymentFormData.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setEditPaymentError(
        language === 'ar'
          ? 'يجب أن يكون مبلغ التحصيل رقماً موجباً أكبر من صفر.'
          : 'Payment amount must be a positive number greater than zero.'
      );
      return;
    }

    if (!editPaymentFormData.student_id) {
      setEditPaymentError(
        language === 'ar'
          ? 'يرجى اختيار الطالب المرتبط بالسند.'
          : 'Please select the associated student.'
      );
      return;
    }

    if (!editPaymentFormData.payer_name.trim()) {
      setEditPaymentError(
        language === 'ar'
          ? 'يرجى إدخال اسم المودع / ولي الأمر.'
          : 'Please enter the payer name.'
      );
      return;
    }

    if (!editPaymentFormData.payment_description.trim()) {
      setEditPaymentError(
        language === 'ar'
          ? 'يرجى إدخال بيان السداد (وذلك مقابل).'
          : 'Please enter the payment description.'
      );
      return;
    }

    const selectedAccount = editPaymentFormData.financial_account_id
      ? financialAccounts.find(a => a.id === editPaymentFormData.financial_account_id)
      : undefined;

    const result = bctStore.updatePendingPayment(
      paymentToEdit.id,
      {
        payment_date: editPaymentFormData.payment_date,
        amount: parsedAmount,
        currency: editPaymentFormData.currency,
        payment_method: editPaymentFormData.payment_method,
        financial_account_id: selectedAccount ? selectedAccount.id : '',
        financial_account_name: selectedAccount ? selectedAccount.account_name_ar : '',
        bank_name: selectedAccount
          ? (selectedAccount.institution_name_ar || selectedAccount.account_name_ar)
          : editPaymentFormData.bank_name.trim(),
        student_id: editPaymentFormData.student_id,
        student_file_id: editPaymentFormData.student_file_id || '',
        payer_name: editPaymentFormData.payer_name.trim(),
        payment_reference: editPaymentFormData.payment_reference.trim(),
        payment_description: editPaymentFormData.payment_description.trim(),
        notes: editPaymentFormData.notes.trim() || editPaymentFormData.payment_description.trim()
      },
      currentUser?.username || 'accountant',
      editPaymentFormData.reason.trim()
    );

    if (!result.success) {
      setEditPaymentError(
        result.message || (language === 'ar' ? 'تعذر حفظ تعديلات السند.' : 'Failed to save receipt changes.')
      );
      return;
    }

    setPaymentToEdit(null);
    setEditPaymentError('');
    setReceiptFeedback({
      type: 'success',
      text: language === 'ar'
        ? `تم حفظ تعديلات السند (${paymentToEdit.receipt_code}) بنجاح.`
        : `Receipt (${paymentToEdit.receipt_code}) updated successfully.`
    });
    setTimeout(() => setReceiptFeedback(null), 4000);
  };

  const handleOpenCancelPaymentModal = (payment: PaymentRecord) => {
    if (payment.status !== 'pending') {
      setReceiptFeedback({
        type: 'error',
        text: language === 'ar'
          ? 'لا يمكن إلغاء السند بعد تأكيد السداد. يمكن استخدام إجراء عكس السند وفق الصلاحيات المعتمدة.'
          : 'Cannot cancel receipt after payment confirmation. The receipt reversal procedure may be used according to approved permissions.'
      });
      setTimeout(() => setReceiptFeedback(null), 4000);
      return;
    }
    if (!hasPermission('payments:cancel_pending')) {
      setReceiptFeedback({
        type: 'error',
        text: language === 'ar'
          ? 'ليس لديك صلاحية إلغاء سند تحصيل غير مؤكد.'
          : 'You do not have permission to cancel pending payment receipts.'
      });
      setTimeout(() => setReceiptFeedback(null), 4000);
      return;
    }

    setPaymentToCancel(payment);
    setCancellationReason('');
    setCancelPaymentError('');
  };

  const handleExecuteCancelPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paymentToCancel) return;

    if (paymentToCancel.status !== 'pending') {
      setCancelPaymentError(
        language === 'ar'
          ? 'لا يمكن إلغاء السند بعد تأكيد السداد. يمكن استخدام إجراء عكس السند وفق الصلاحيات المعتمدة.'
          : 'Cannot cancel receipt after payment confirmation. The receipt reversal procedure may be used according to approved permissions.'
      );
      return;
    }

    const trimmedReason = cancellationReason.trim();
    if (!trimmedReason) {
      setCancelPaymentError(
        language === 'ar'
          ? 'يرجى إدخال سبب إلغاء السند (حقل إلزامي للتدقيق المالي).'
          : 'Please enter the cancellation reason (required for financial audit).'
      );
      return;
    }

    const result = bctStore.cancelPendingPayment(
      paymentToCancel.id,
      trimmedReason,
      currentUser?.username || 'accountant'
    );

    if (!result.success) {
      setCancelPaymentError(
        result.message || (language === 'ar' ? 'فشل إلغاء سند التحصيل.' : 'Failed to cancel payment receipt.')
      );
      return;
    }

    const targetCode = paymentToCancel.receipt_code;
    setPaymentToCancel(null);
    setCancellationReason('');
    setCancelPaymentError('');
    setReceiptFeedback({
      type: 'success',
      text: language === 'ar'
        ? `تم إلغاء سند التحصيل (${targetCode}) بنجاح والاحتفاظ به في السجلات لأغراض المراجعة والتدقيق.`
        : `Payment receipt (${targetCode}) cancelled successfully and retained for audit.`
    });
    setTimeout(() => setReceiptFeedback(null), 4000);
  };

  const handleCreatePayment = (e: React.FormEvent) => {
    e.preventDefault();
    const desc = paymentFormData.payment_description.trim();
    if (!paymentFormData.student_id || !paymentFormData.amount || !paymentFormData.payer_name || !desc) return;

    const student = students.find(s => s.id === paymentFormData.student_id);

    bctStore.createPayment({
      student_id: paymentFormData.student_id,
      student_name: student?.full_name_ar,
      student_file_id: paymentFormData.student_file_id || undefined,
      category_id: 'admission_fees',
      amount: Number(paymentFormData.amount),
      currency: paymentFormData.currency,
      payment_method: paymentFormData.payment_method,
      payment_reference: paymentFormData.payment_reference || `TXN-${Date.now().toString().slice(-6)}`,
      bank_name: paymentFormData.bank_name,
      payer_name: paymentFormData.payer_name,
      payment_description: desc,
      status: 'pending',
      notes: desc || paymentFormData.notes
    }, currentUser?.username || 'accountant');

    setIsPaymentModalOpen(false);
    setPaymentFormData({
      student_id: '',
      student_file_id: '',
      amount: '',
      currency: 'EGP',
      payment_method: 'bank_transfer',
      payment_reference: '',
      bank_name: 'البنك الأهلي المصري',
      payer_name: '',
      payment_description: '',
      notes: '',
    });
  };

  const handleSaveReceiptDescription = () => {
    if (!receiptToPrint || !currentUser) return;
    const trimmed = editedReceiptDesc.trim();
    if (!trimmed) {
      setEditDescError(language === 'ar' ? 'يرجى إدخال وصف السداد (لا يمكن تركه فارغاً)' : 'Payment description cannot be empty');
      return;
    }
    const res = bctStore.updatePaymentDescription(receiptToPrint.id, trimmed, currentUser.username);
    if (res.success && res.payment) {
      setReceiptToPrint(res.payment);
      setPayments(bctStore.getPayments());
      setIsEditingReceiptDesc(false);
      setEditDescError('');
    } else {
      setEditDescError(res.message || (language === 'ar' ? 'فشل حفظ التعديل' : 'Failed to save description'));
    }
  };

  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseFormData.title || !expenseFormData.amount) return;

    const selectedFile = bctStore.getStudentFiles().find(f => f.file_code === expenseFormData.transaction_number);
    const selectedEmp = bctStore.getEmployees().find(e => e.id === expenseFormData.beneficiary_employee_id);

    bctStore.createExpense({
      title_ar: expenseFormData.title,
      title_en: expenseFormData.title,
      category: expenseFormData.category,
      amount: Number(expenseFormData.amount),
      currency: expenseFormData.currency,
      department_id: expenseFormData.department_id,
      responsible_employee_id: currentUser?.id || 'emp-008',
      payment_method: expenseFormData.payment_method,
      bank_name: expenseFormData.bank_name || undefined,
      status: 'pending_approval',
      notes: expenseFormData.notes || expenseFormData.description || expenseFormData.vendor_name,
      beneficiary_employee_id: expenseFormData.beneficiary_employee_id || undefined,
      beneficiary_employee_name: selectedEmp?.full_name_ar || undefined,
      transaction_number: expenseFormData.transaction_number || undefined,
      student_file_id: selectedFile?.id || undefined,
      student_name: selectedFile?.student?.full_name_ar || undefined,
      incentive_type: expenseFormData.incentive_type || undefined,
      vendor_name: expenseFormData.vendor_name || undefined,
      invoice_number: expenseFormData.invoice_number || undefined,
    }, currentUser?.username || 'accountant');

    setIsExpenseModalOpen(false);
    setExpenseFormData({
      title: '',
      category: 'operational',
      amount: '',
      currency: 'EGP',
      department_id: 'ops',
      payment_method: 'bank_transfer',
      bank_name: 'البنك الأهلي المصري',
      vendor_name: '',
      invoice_number: '',
      description: '',
      beneficiary_employee_id: '',
      transaction_number: '',
      incentive_type: 'file_completion',
      notes: '',
    });
  };

  const handleCreateBudget = (e: React.FormEvent) => {
    e.preventDefault();
    if (!budgetFormData.allocated_amount) return;

    bctStore.createBudget({
      department_id: budgetFormData.department_id,
      department_name_ar: departments.find(d => d.id === budgetFormData.department_id)?.name_ar,
      period_type: 'quarterly',
      fiscal_period: `${budgetFormData.period} (${budgetFormData.fiscal_year})`,
      allocated_amount: Number(budgetFormData.allocated_amount),
      currency: budgetFormData.currency,
      status: 'approved',
      approved_by: currentUser?.id,
    }, currentUser?.username || 'admin');

    setIsBudgetModalOpen(false);
  };

  const handleUpdateRate = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(newRateValue);
    if (parsed > 0) {
      bctStore.updateExchangeRate(parsed, 'BCT Official Treasury Rate', currentUser?.username || 'admin');
      setIsRateModalOpen(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-bct-navy">
              {t('nav.finance')}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              {isRtl ? 'الرقابة المالية المؤسسية' : 'Financial Controls'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'الرقابة المالية ثنائية العملة (EGP / USD)، تأكيد السداد، سجل المصروفات، والموازنات التقديرية.'
              : 'Dual-currency ledger (EGP / USD), Payment receipts, OpEx registers, and Budget approvals.'}
          </p>
        </div>

        {/* Header Controls: Currency Mode Switcher & Official Treasury Rate */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Currency Switcher (Fix 12) */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setCurrencyView('original')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${currencyView === 'original' ? 'bg-white text-bct-navy font-bold shadow-xs' : 'text-slate-600'}`}
            >
              {isRtl ? 'العملات الأصلية' : 'Original'}
            </button>
            <button
              onClick={() => setCurrencyView('egp_eq')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${currencyView === 'egp_eq' ? 'bg-white text-bct-navy font-bold shadow-xs' : 'text-slate-600'}`}
            >
              {isRtl ? 'معادل ج.م' : 'EGP Eq.'}
            </button>
            <button
              onClick={() => setCurrencyView('usd_eq')}
              className={`px-2.5 py-1 rounded-lg transition cursor-pointer ${currencyView === 'usd_eq' ? 'bg-white text-bct-navy font-bold shadow-xs' : 'text-slate-600'}`}
            >
              {isRtl ? 'معادل $' : 'USD Eq.'}
            </button>
          </div>

          {/* Exchange Rate Pill */}
          <button
            onClick={hasPermission('finance:edit') ? () => { setNewRateValue(String(rate)); setIsRateModalOpen(true); } : undefined}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-xs transition ${hasPermission('finance:edit') ? 'hover:border-bct-navy cursor-pointer' : 'cursor-default'}`}
          >
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            <span>1 USD = {rate} EGP</span>
            {hasPermission('finance:edit') && (
              <span className="text-[10px] text-blue-600 underline ms-1">{isRtl ? 'تعديل' : 'Edit'}</span>
            )}
          </button>
        </div>
      </div>

      {/* Compact Financial Filter Toolbar (Requirements 3, 4, 5, 9) */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          {/* Filter 1: Payment Method / Account (Requirement 3) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5 text-bct-navy" />
              <span>{isRtl ? 'نوع الحساب / طريقة الدفع:' : 'Account / Payment Method:'}</span>
            </span>
            <select
              value={selectedPaymentMethod}
              onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:bg-white focus:border-bct-navy cursor-pointer"
            >
              <option value="all">{isRtl ? 'كل الحسابات وطرق الدفع' : 'All Accounts & Methods'}</option>
              <option value="bank_transfer">{isRtl ? 'تحويل بنكي رسمي (Bank Transfer)' : 'Bank Transfer'}</option>
              <option value="cash">{isRtl ? 'نقداً بالخزينة (Cash)' : 'Cash'}</option>
              <option value="instapay">{isRtl ? 'إنستاباي (InstaPay)' : 'InstaPay'}</option>
              <option value="vodafone_cash">{isRtl ? 'فودافون كاش (Vodafone Cash)' : 'Vodafone Cash'}</option>
            </select>
          </div>

          {/* Filter 2: Currency (Requirement 4) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isRtl ? 'العملة:' : 'Currency:'}</span>
            </span>
            <select
              value={selectedCurrency}
              onChange={(e) => setSelectedCurrency(e.target.value as any)}
              className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:bg-white focus:border-bct-navy cursor-pointer"
            >
              <option value="all">{isRtl ? 'كل العملات (All Currencies)' : 'All Currencies'}</option>
              <option value="EGP">{isRtl ? 'جنيه مصري (EGP)' : 'EGP – Egyptian Pound'}</option>
              <option value="USD">{isRtl ? 'دولار أمريكي (USD)' : 'USD – US Dollar'}</option>
            </select>
          </div>

          {/* Filter 3: Date Range Buttons (Requirement 5) */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-indigo-600" />
              <span>{isRtl ? 'الفترة الزمنية:' : 'Period:'}</span>
            </span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-semibold">
              {[
                { id: 'all', label_ar: 'الكل', label_en: 'All' },
                { id: '30d', label_ar: 'آخر 30 يوم', label_en: '30d' },
                { id: 'quarter', label_ar: 'الربع الحالي', label_en: 'Quarter' },
                { id: 'custom', label_ar: 'تحديد مخصص', label_en: 'Custom' },
              ].map(p => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => {
                    if (p.id === 'custom') {
                      setShowCustomPicker(prev => !prev);
                    } else {
                      setTimeRange(p.id as any);
                      setAppliedCustomRange(null);
                      setShowCustomPicker(false);
                    }
                  }}
                  className={`px-2 py-1 rounded-lg transition cursor-pointer text-[11px] ${
                    timeRange === p.id
                      ? 'bg-white text-bct-navy font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {isRtl ? p.label_ar : p.label_en}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toolbar Action: Reset Filters Button */}
        <div className="flex items-center gap-2">
          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetAllFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition border border-amber-200 cursor-pointer shadow-xs"
              title={isRtl ? 'إعادة ضبط كافة الفلاتر' : 'Reset all filters'}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>{isRtl ? 'إعادة ضبط الفلاتر' : 'Reset Filters'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Custom Date Range Picker Panel */}
      {showCustomPicker && (
        <div className="bg-slate-50 border border-slate-200 p-3 rounded-2xl flex flex-wrap items-center gap-3 text-xs animate-in fade-in duration-150">
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-bold">{isRtl ? 'من تاريخ:' : 'From:'}</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-600 font-bold">{isRtl ? 'إلى تاريخ:' : 'To:'}</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs bg-white text-slate-800"
            />
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleApplyCustomDate}
              className="px-3.5 py-1.5 bg-bct-navy text-white rounded-lg font-bold hover:bg-bct-dark transition cursor-pointer shadow-xs"
            >
              {isRtl ? 'تطبيق النطاق' : 'Apply'}
            </button>
            <button
              type="button"
              onClick={handleResetDate}
              className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-lg font-bold hover:bg-slate-300 transition cursor-pointer"
            >
              {isRtl ? 'إلغاء' : 'Cancel'}
            </button>
          </div>
          {dateError && (
            <span className="text-rose-600 font-bold text-xs w-full block">{dateError}</span>
          )}
        </div>
      )}

      {/* Display Active Range Info when custom */}
      {timeRange === 'custom' && appliedCustomRange && (
        <div className="flex items-center justify-between text-xs text-bct-navy bg-bct-navy/5 px-3 py-1.5 rounded-lg border border-bct-navy/20">
          <span>
            {isRtl
              ? `النطاق الزمني المحدد: من ${appliedCustomRange.start} إلى ${appliedCustomRange.end}`
              : `Active Range: From ${appliedCustomRange.start} to ${appliedCustomRange.end}`}
          </span>
          <button
            onClick={handleResetDate}
            className="text-xs text-amber-700 hover:underline flex items-center gap-1 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>{isRtl ? 'إلغاء الفلتر المخصص' : 'Reset Custom Filter'}</span>
          </button>
        </div>
      )}

      {/* Primary KPI Tiles: 5 Tiles Grid (Requirements 1, 2, 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        
        {/* Metric 1: Confirmed Collections */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              {language === 'ar' ? 'إجمالي التحصيلات المؤكدة' : 'Confirmed Collections'}
            </span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {currencyView === 'original' ? (
              <>
                <div className="text-xl font-black text-slate-800">
                  {confirmedEGP.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ج.م</span>
                </div>
                <div className="text-sm font-black text-emerald-600 mt-0.5">
                  ${confirmedUSD.toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
                </div>
              </>
            ) : currencyView === 'egp_eq' ? (
              <div className="text-2xl font-black text-slate-800">
                {Math.round(totalCollectedInEGP).toLocaleString()} <span className="text-xs font-semibold text-slate-500">ج.م (معادل)</span>
              </div>
            ) : (
              <div className="text-2xl font-black text-emerald-600">
                ${Math.round(totalCollectedInUSD).toLocaleString()} <span className="text-xs font-semibold text-slate-500">USD (Eq.)</span>
              </div>
            )}
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-2">
              <CheckCircle className="w-3 h-3" />
              <span>{language === 'ar' ? `${confirmedCount} إيصال معتمد بالخزينة` : `${confirmedCount} verified receipts`}</span>
            </span>
          </div>
        </div>

        {/* Metric 2: Approved OpEx */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              {language === 'ar' ? 'المصروفات التشغيلية المعتمدة' : 'Approved OpEx'}
            </span>
            <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
              <TrendingDown className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            {currencyView === 'original' ? (
              <>
                <div className="text-xl font-black text-rose-700">
                  {approvedExpenseEGP.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ج.م</span>
                </div>
                {approvedExpenseUSD > 0 && (
                  <div className="text-sm font-bold text-rose-600 mt-0.5">
                    ${approvedExpenseUSD.toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
                  </div>
                )}
              </>
            ) : currencyView === 'egp_eq' ? (
              <div className="text-2xl font-black text-rose-700">
                {Math.round(totalApprovedExpenseInEGP).toLocaleString()} <span className="text-xs font-semibold text-slate-500">ج.م (معادل)</span>
              </div>
            ) : (
              <div className="text-2xl font-black text-rose-600">
                ${Math.round(totalApprovedExpenseInUSD).toLocaleString()} <span className="text-xs font-semibold text-slate-500">USD (Eq.)</span>
              </div>
            )}
            <span className="text-[11px] text-slate-400 block mt-2">
              {approvedExpenseCount} {language === 'ar' ? 'بند مصروف معتمد' : 'approved items'}
            </span>
          </div>
        </div>

        {/* Metric 3: Net Collections After Expenses (صافي التحصيلات بعد المصروفات) */}
        <div className={`p-5 rounded-2xl border shadow-xs flex flex-col justify-between transition-all ${
          netStatus === 'positive'
            ? 'bg-gradient-to-br from-emerald-50/60 to-white border-emerald-300 ring-1 ring-emerald-200/50'
            : netStatus === 'negative'
            ? 'bg-gradient-to-br from-rose-50/60 to-white border-rose-300 ring-1 ring-rose-200/50'
            : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-extrabold text-slate-800 uppercase block">
                {language === 'ar' ? 'صافي التحصيلات بعد المصروفات' : 'Net Collections After Expenses'}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">
                {language === 'ar' ? 'التحصيلات المؤكدة − المصروفات المعتمدة' : 'Confirmed Collections − Approved OpEx'}
              </span>
            </div>
            <div className={`p-2 rounded-xl ${
              netStatus === 'positive' 
                ? 'bg-emerald-100 text-emerald-800' 
                : netStatus === 'negative' 
                ? 'bg-rose-100 text-rose-800' 
                : 'bg-slate-100 text-slate-600'
            }`}>
              {netStatus === 'positive' ? (
                <TrendingUp className="w-5 h-5 text-emerald-700" />
              ) : netStatus === 'negative' ? (
                <TrendingDown className="w-5 h-5 text-rose-700" />
              ) : (
                <Scale className="w-5 h-5 text-slate-600" />
              )}
            </div>
          </div>

          <div className="mt-3">
            {currencyView === 'original' ? (
              <>
                <div className={`text-xl font-black ${
                  netCollectionsEGP >= 0 ? 'text-emerald-700' : 'text-rose-700'
                }`}>
                  {netCollectionsEGP.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ج.م</span>
                </div>
                <div className={`text-sm font-black mt-0.5 ${
                  netCollectionsUSD >= 0 ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  ${netCollectionsUSD.toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
                </div>
              </>
            ) : currencyView === 'egp_eq' ? (
              <div className={`text-2xl font-black ${
                totalNetCollectionsInEGP >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                {Math.round(totalNetCollectionsInEGP).toLocaleString()} <span className="text-xs font-semibold text-slate-500">ج.م (معادل)</span>
              </div>
            ) : (
              <div className={`text-2xl font-black ${
                totalNetCollectionsInUSD >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}>
                ${Math.round(totalNetCollectionsInUSD).toLocaleString()} <span className="text-xs font-semibold text-slate-500">USD (Eq.)</span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] mt-2 pt-2 border-t border-slate-100">
              <span className={`inline-flex items-center gap-1 font-bold ${
                netStatus === 'positive' ? 'text-emerald-700' : netStatus === 'negative' ? 'text-rose-700' : 'text-slate-500'
              }`}>
                <span>{netStatus === 'positive' ? (language === 'ar' ? 'فائض تشغيلي إيجابي' : 'Operating Surplus') : netStatus === 'negative' ? (language === 'ar' ? 'عجز تشغيلي مؤقت' : 'Deficit') : (language === 'ar' ? 'متوازن' : 'Balanced')}</span>
              </span>

              <span className="tabular-nums font-bold text-slate-600">
                {netMarginPercentage}% {language === 'ar' ? 'هامش' : 'margin'}
              </span>
            </div>

            {/* Accounting Distinction: Cash Balance vs Net Commitments */}
            <div className="text-[10px] text-slate-500 mt-2 bg-slate-50/80 p-2 rounded-xl border border-slate-200 space-y-0.5">
              <div className="flex items-center justify-between font-semibold">
                <span className="text-slate-600">{language === 'ar' ? 'الرصيد النقدي الفعلي بالخزينة:' : 'Net Cash Movement:'}</span>
                <span className="text-bct-navy font-bold">{Math.round(totalNetCashInEGP).toLocaleString()} ج.م</span>
              </div>
              {unpaidApprovedCommitmentsEGP > 0 && (
                <div className="text-[9px] text-amber-700">
                  {language === 'ar'
                    ? `(${unpaidApprovedCommitmentsEGP.toLocaleString()} ج.م التزامات معتمدة قيد السحب)`
                    : `(${unpaidApprovedCommitmentsEGP.toLocaleString()} EGP unpaid commitments)`}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Metric 4: Pending Clearance */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              {language === 'ar' ? 'سدادات تنتظر التأكيد' : 'Pending Clearance'}
            </span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Receipt className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-xl font-black text-amber-700">
              {pendingEGP.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ج.م</span>
            </div>
            {pendingUSD > 0 && (
              <div className="text-sm font-bold text-amber-600 mt-0.5">
                ${pendingUSD.toLocaleString()} <span className="text-xs font-normal text-slate-500">USD</span>
              </div>
            )}
            <span className="text-[11px] text-slate-400 block mt-2">
              {pendingCount} {language === 'ar' ? 'سداد قيد المراجعة' : 'pending receipts'}
            </span>
          </div>
        </div>

        {/* Metric 5: Emergency Reserve Fund */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">
              {language === 'ar' ? 'احتياطي الطوارئ (3 أشهر)' : 'Emergency Reserve Fund'}
            </span>
            <div className="p-2 rounded-xl bg-sky-50 text-sky-700">
              <ShieldCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-baseline justify-between">
              <span className="text-xl font-black text-bct-navy">{Math.round(emergencyReserveCurrent).toLocaleString()} ج.م</span>
              <span className="text-xs font-bold text-bct-navy">{reserveRatio}%</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-500 rounded-full"
                style={{ width: `${reserveRatio}%` }}
              />
            </div>
            <span className="text-[11px] text-slate-400 block mt-2">
              {language === 'ar' ? `المستهدف: ${emergencyReserveTarget.toLocaleString()} ج.م` : `Target: ${emergencyReserveTarget.toLocaleString()} EGP`}
            </span>
          </div>
        </div>

      </div>

      {/* SECTION: Collections & Expenses by Account (Requirement 2: توزيع التحصيلات والمصروفات حسب الحساب) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-bct-navy/5 text-bct-navy border border-bct-navy/15">
              <CreditCard className="w-5 h-5 text-bct-navy" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-extrabold text-slate-800">
                  {language === 'ar' ? 'توزيع التحصيلات والمصروفات حسب الحساب' : 'Collections & Expenses by Account'}
                </h3>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                  {isRtl ? 'قنوات التحصيل والصرف المعتمدة' : 'Official Channels'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar'
                  ? 'بيان تحليلي دقيق لصافي التدفق المالي، التحصيلات، والمصروفات لكل قناة دفع وحساب مالي رسمي.'
                  : 'Analytical breakdown of collections, approved expenses, and net cash movement by payment channel.'}
              </p>
            </div>
          </div>

          {/* Quick status feedback for selected channel */}
          <div className="flex items-center gap-2">
            {selectedPaymentMethod !== 'all' && (
              <span className="text-xs bg-bct-navy/10 text-bct-navy font-bold px-2.5 py-1 rounded-lg border border-bct-navy/20 flex items-center gap-1.5">
                <span>{isRtl ? 'الحساب المفلتر:' : 'Active Filter:'}</span>
                <span>{getPaymentMethodDetails(selectedPaymentMethod, language as any).name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedPaymentMethod('all')}
                  className="ms-1 text-slate-400 hover:text-slate-700 font-bold cursor-pointer"
                  title={isRtl ? 'إلغاء تصفية الحساب' : 'Clear account filter'}
                >
                  ✕
                </button>
              </span>
            )}
            {selectedCurrency !== 'all' && (
              <span className="text-xs bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1 rounded-lg border border-emerald-200">
                {selectedCurrency}
              </span>
            )}
          </div>
        </div>

        {/* 4 Cards Grid for Accounts / Channels */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {accountBreakdowns.map((acc) => {
            const isSelected = selectedPaymentMethod === acc.id;
            const channelIcon = 
              acc.id === 'bank_transfer' ? Building :
              acc.id === 'cash' ? Wallet :
              acc.id === 'instapay' ? Zap :
              acc.id === 'vodafone_cash' ? Smartphone : CreditCard;
            const Icon = channelIcon;

            return (
              <div
                key={acc.id}
                className={`p-4 rounded-xl border transition-all relative flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-bct-navy border-bct-navy bg-slate-50/70 shadow-xs'
                    : 'border-slate-200 hover:border-slate-300 bg-white hover:shadow-xs'
                }`}
              >
                <div>
                  {/* Card Top: Icon, Name, Channel, and Filter Button */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${
                        acc.id === 'bank_transfer' ? 'bg-emerald-50 text-emerald-700' :
                        acc.id === 'cash' ? 'bg-amber-50 text-amber-700' :
                        acc.id === 'instapay' ? 'bg-indigo-50 text-indigo-700' :
                        acc.id === 'vodafone_cash' ? 'bg-rose-50 text-rose-700' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-xs text-slate-800">
                          {isRtl ? acc.name_ar : acc.name_en}
                        </h4>
                        <span className="text-[10px] text-slate-400 block font-medium">
                          {isRtl ? acc.channel_ar : acc.channel_en}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod(isSelected ? 'all' : (acc.id as any))}
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-lg transition cursor-pointer ${
                        isSelected
                          ? 'bg-bct-navy text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                      }`}
                    >
                      {isSelected ? (isRtl ? 'المحدد ✓' : 'Active') : (isRtl ? 'تصفية' : 'Filter')}
                    </button>
                  </div>

                  {/* Linked Financial Account / Institution */}
                  <div className="mt-2 text-[10px] text-slate-600 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="font-semibold block truncate">
                      {isRtl ? acc.default_account_ar : acc.default_account_en}
                    </span>
                  </div>

                  {/* Financial Metrics Strip */}
                  <div className="mt-3 space-y-1.5 text-xs">
                    {/* Confirmed Collections */}
                    <div className="flex items-baseline justify-between">
                      <span className="text-[11px] text-slate-500">{isRtl ? 'التحصيلات المؤكدة:' : 'Confirmed:'}</span>
                      <div className="text-end">
                        {currencyView === 'original' ? (
                          <>
                            <span className="font-black text-emerald-700">
                              {acc.confirmedEGP.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ج.م</span>
                            </span>
                            {acc.confirmedUSD > 0 && (
                              <span className="text-[11px] font-bold text-emerald-600 block">
                                + ${acc.confirmedUSD.toLocaleString()}
                              </span>
                            )}
                          </>
                        ) : currencyView === 'egp_eq' ? (
                          <span className="font-black text-emerald-700">
                            {Math.round(acc.totalCollectedInEGP).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ج.م (معادل)</span>
                          </span>
                        ) : (
                          <span className="font-black text-emerald-700">
                            ${Math.round(acc.totalCollectedInUSD).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">USD</span>
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 block font-mono">
                          ({acc.confirmedCount} {isRtl ? 'إيصال' : 'rcpts'})
                        </span>
                      </div>
                    </div>

                    {/* Approved Expenses */}
                    <div className="flex items-baseline justify-between border-t border-slate-100 pt-1.5">
                      <span className="text-[11px] text-slate-500">{isRtl ? 'المصروفات المعتمدة:' : 'Approved OpEx:'}</span>
                      <div className="text-end">
                        {currencyView === 'original' ? (
                          <>
                            <span className="font-bold text-rose-700">
                              {acc.approvedExpenseEGP.toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ج.م</span>
                            </span>
                            {acc.approvedExpenseUSD > 0 && (
                              <span className="text-[11px] font-bold text-rose-600 block">
                                + ${acc.approvedExpenseUSD.toLocaleString()}
                              </span>
                            )}
                          </>
                        ) : currencyView === 'egp_eq' ? (
                          <span className="font-bold text-rose-700">
                            {Math.round(acc.totalApprovedExpenseInEGP).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">ج.م</span>
                          </span>
                        ) : (
                          <span className="font-bold text-rose-700">
                            ${Math.round(acc.totalApprovedExpenseInUSD).toLocaleString()} <span className="text-[10px] font-normal text-slate-400">USD</span>
                          </span>
                        )}
                        <span className="text-[9px] text-slate-400 block font-mono">
                          ({acc.approvedExpenseCount} {isRtl ? 'بند' : 'items'})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Card Bottom: Net Collections & Actual Cash Movement */}
                <div className="mt-3 pt-2.5 border-t border-slate-200/80 space-y-1 text-xs">
                  <div className="flex items-baseline justify-between">
                    <span className="font-extrabold text-[11px] text-slate-700">{isRtl ? 'الصافي بعد المصروفات:' : 'Net After OpEx:'}</span>
                    <span className={`font-black ${
                      currencyView === 'original'
                        ? acc.netCollectionsEGP >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        : currencyView === 'egp_eq'
                        ? acc.totalNetCollectionsInEGP >= 0 ? 'text-emerald-700' : 'text-rose-700'
                        : acc.totalNetCollectionsInUSD >= 0 ? 'text-emerald-700' : 'text-rose-700'
                    }`}>
                      {currencyView === 'original'
                        ? `${acc.netCollectionsEGP.toLocaleString()} ج.م`
                        : currencyView === 'egp_eq'
                        ? `${Math.round(acc.totalNetCollectionsInEGP).toLocaleString()} ج.م`
                        : `$${Math.round(acc.totalNetCollectionsInUSD).toLocaleString()}`}
                    </span>
                  </div>

                  <div className="flex items-baseline justify-between text-[10px] text-slate-500">
                    <span>{isRtl ? 'صافي الحركة النقدية الفعلية (بالخزينة):' : 'Net Cash Movement:'}</span>
                    <span className="font-mono font-bold text-bct-navy">
                      {Math.round(acc.totalNetCashInEGP).toLocaleString()} ج.م
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="border-b border-slate-200 flex gap-2 overflow-x-auto text-xs font-bold">
        {[
          { key: 'payments', label_ar: `إيصالات التحصيل (${payments.length})`, label_en: `Collections (${payments.length})`, icon: Receipt },
          { key: 'expenses', label_ar: `سجل المصروفات (${expenses.length})`, label_en: `Expenses (${expenses.length})`, icon: TrendingDown },
          { key: 'budgets', label_ar: `الموازنات والاعتمادات (${budgets.length})`, label_en: `Budgets (${budgets.length})`, icon: Layers },
          { key: 'incentives', label_ar: `حساب حوافز الموظفين (${bctStore.getEmployeeIncentives().length})`, label_en: `Employee Incentives (${bctStore.getEmployeeIncentives().length})`, icon: Award },
          { key: 'ledger', label_ar: 'كشف حركة الحسابات', label_en: 'Account Movement Ledger', icon: BookOpen },
        ].map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => handleTabChange(tab.key as any)}
              className={`pb-3 px-4 border-b-2 transition flex items-center gap-1.5 whitespace-nowrap ${
                activeTab === tab.key
                  ? 'border-bct-navy text-bct-navy'
                  : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{language === 'ar' ? tab.label_ar : tab.label_en}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: COLLECTIONS & RECEIPTS (Fix 13 & Requirement 7) */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={language === 'ar' ? 'بحث برقم الإيصال أو اسم الطالب...' : 'Search receipt code or student...'}
                className="w-full ps-9 pe-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-bct-navy"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto justify-between md:justify-end">
              {/* Payment Method Filter Dropdown */}
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:bg-white focus:border-bct-navy cursor-pointer"
                title={isRtl ? 'تصفية حسب طريقة الدفع' : 'Filter by payment method'}
              >
                <option value="all">{isRtl ? 'كل طرق الدفع' : 'All Methods'}</option>
                <option value="bank_transfer">{isRtl ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                <option value="cash">{isRtl ? 'نقداً بالخزينة' : 'Cash'}</option>
                <option value="instapay">{isRtl ? 'إنستاباي' : 'InstaPay'}</option>
                <option value="vodafone_cash">{isRtl ? 'فودافون كاش' : 'Vodafone Cash'}</option>
              </select>

              {/* Currency Filter Dropdown */}
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as any)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 focus:bg-white focus:border-bct-navy cursor-pointer"
                title={isRtl ? 'تصفية حسب العملة' : 'Filter by currency'}
              >
                <option value="all">{isRtl ? 'كل العملات' : 'All Currencies'}</option>
                <option value="EGP">EGP (جنيه)</option>
                <option value="USD">USD (دولار)</option>
              </select>

              {/* Status Pills */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs flex-wrap">
                {[
                  { id: 'all', label_ar: 'الكل', label_en: 'All' },
                  { id: 'pending', label_ar: 'تنتظر التأكيد', label_en: 'Pending' },
                  { id: 'confirmed', label_ar: 'مؤكدة', label_en: 'Confirmed' },
                  { id: 'cancelled', label_ar: 'ملغاة', label_en: 'Cancelled' },
                  { id: 'reversed', label_ar: 'معكوسة ومستردة', label_en: 'Reversed' },
                ].map(f => (
                  <button
                    key={f.id}
                    onClick={() => setPaymentFilterStatus(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap text-[11px] ${
                      paymentFilterStatus === f.id
                        ? 'bg-bct-navy text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {language === 'ar' ? f.label_ar : f.label_en}
                  </button>
                ))}
              </div>

              {hasPermission('finance:create') && (
                <button
                  onClick={() => setIsPaymentModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>{language === 'ar' ? 'إيصال سداد' : 'New Receipt'}</span>
                </button>
              )}
            </div>
          </div>

          {receiptFeedback && (
            <div className={`mx-4 mt-3 px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 ${
              receiptFeedback.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}>
              <div className="flex items-center gap-2">
                {receiptFeedback.type === 'success' ? (
                  <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                )}
                <span>{receiptFeedback.text}</span>
              </div>
              <button
                type="button"
                onClick={() => setReceiptFeedback(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* A. RESPONSIVE CARDS VIEW FOR TABLETS & MOBILE (< lg) */}
          <div className="block lg:hidden divide-y divide-slate-100">
            {filteredPayments.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                {language === 'ar' ? 'لا توجد إيصالات تحصيل مطابقة لمعايير البحث والتصفية' : 'No collection receipts match search criteria'}
              </div>
            ) : (
              filteredPayments.map((p) => {
                const mInfo = getPaymentMethodDetails(p.payment_method, language as any);
                const channelIcon = 
                  mInfo.id === 'bank_transfer' ? Building :
                  mInfo.id === 'cash' ? Wallet :
                  mInfo.id === 'instapay' ? Zap :
                  mInfo.id === 'vodafone_cash' ? Smartphone : CreditCard;
                const Icon = channelIcon;

                return (
                  <div key={p.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition">
                    {/* Card Header: Receipt Code + Status Badge + Date */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-bct-navy text-xs" dir="ltr">
                          {p.receipt_code}
                        </span>
                        {/* Accounting Status Badge */}
                        {p.status === 'confirmed' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {language === 'ar' ? 'مؤكد ومعتمد' : 'Confirmed'}
                          </span>
                        ) : p.status === 'reversed' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {language === 'ar' ? 'معكوس' : 'Reversed'}
                          </span>
                        ) : p.status === 'cancelled' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            {language === 'ar' ? 'ملغى' : 'Cancelled'}
                          </span>
                        ) : p.status === 'rejected' ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            {language === 'ar' ? 'مرفوض' : 'Rejected'}
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            {language === 'ar' ? 'بانتظار التأكيد' : 'Pending'}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 font-semibold tabular-nums" dir="ltr">
                        {p.created_at?.split('T')[0] || '-'}
                      </div>
                    </div>

                    {/* Student Name & Amount */}
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="min-w-0 pr-2">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {p.student_name || '-'}
                        </div>
                        {(p.payment_description || p.notes) && (
                          <div className="text-[11px] text-slate-500 font-normal mt-0.5 line-clamp-1" title={p.payment_description || p.notes}>
                            {p.payment_description || p.notes}
                          </div>
                        )}
                      </div>
                      <div className="text-sm font-black text-slate-900 shrink-0">
                        <span className="tabular-nums">{p.amount.toLocaleString()}</span>{' '}
                        <span className="text-xs font-normal text-slate-500">{p.currency}</span>
                      </div>
                    </div>

                    {/* Payment Method, Account & Depositor */}
                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          {language === 'ar' ? 'طريقة الدفع والحساب' : 'Method & Account'}
                        </span>
                        <div className="flex items-center gap-1 mt-0.5">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            <Icon className="w-3 h-3" />
                            <span>{mInfo.name}</span>
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-0.5 truncate" title={p.bank_name || p.financial_account_name || mInfo.defaultAccount}>
                          {p.bank_name || p.financial_account_name || mInfo.defaultAccount}
                        </div>
                      </div>

                      <div>
                        <span className="text-slate-400 block text-[10px]">
                          {language === 'ar' ? 'اسم المودع والمرجع' : 'Depositor & Reference'}
                        </span>
                        <div className="font-medium text-slate-700 truncate mt-0.5" title={p.payer_name}>
                          {p.payer_name || '-'}
                        </div>
                        {p.payment_reference && (
                          <div className="text-[10px] text-slate-400 font-mono truncate" dir="ltr" title={p.payment_reference}>
                            {p.payment_reference}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Action Buttons Bar */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-end gap-1.5 flex-wrap">
                      {p.status === 'pending' ? (
                        <>
                          {hasPermission('payments:edit_pending') && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditPaymentModal(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-xs shadow-xs transition"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'تعديل السند' : 'Edit Receipt'}</span>
                            </button>
                          )}
                          {hasPermission('payments:cancel_pending') && (
                            <button
                              type="button"
                              onClick={() => handleOpenCancelPaymentModal(p)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-xs shadow-xs transition"
                            >
                              <XCircle className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'إلغاء السند' : 'Cancel Receipt'}</span>
                            </button>
                          )}
                          {hasPermission('payments:confirm') && (
                            <button
                              type="button"
                              onClick={() => handleConfirmPayment(p.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'تأكيد السداد' : 'Confirm Payment'}</span>
                            </button>
                          )}
                        </>
                      ) : p.status === 'confirmed' ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setReceiptToPrint(p)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>{language === 'ar' ? 'طباعة' : 'Print'}</span>
                          </button>
                          {hasPermission('finance:approve') && (
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentToReverse(p);
                                setReversalReason('');
                                setReversalError('');
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs transition border border-rose-200"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                              <span>{language === 'ar' ? 'عكس' : 'Reverse'}</span>
                            </button>
                          )}
                        </>
                      ) : p.status === 'cancelled' ? (
                        <span className="text-rose-600 text-xs font-semibold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span>{language === 'ar' ? 'سند ملغى' : 'Cancelled'}</span>
                        </span>
                      ) : (
                        <span className="text-rose-500 text-xs font-semibold">
                          {p.status === 'rejected'
                            ? (language === 'ar' ? 'مرفوض' : 'Rejected')
                            : (language === 'ar' ? 'تم العكس' : 'Reversed')}
                        </span>
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
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-[11px] xl:text-xs">
                  {/* 1. Receipt No. (11%) */}
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[11%]">
                    {language === 'ar' ? 'رقم الإيصال' : 'Receipt No.'}
                  </th>
                  {/* 2. Student Name (15%) */}
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[15%]">
                    {language === 'ar' ? 'الطالب المعني' : 'Student Name'}
                  </th>
                  {/* 3. Amount & Currency (10%) */}
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[10%]">
                    {language === 'ar' ? 'المبلغ والعملة' : 'Amount & Currency'}
                  </th>
                  {/* 4. Payment Method & Account (14%) */}
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[14%]">
                    {language === 'ar' ? 'طريقة الدفع والحساب' : 'Payment Method & Account'}
                  </th>
                  {/* 5. Date & Reference (10%) */}
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[10%]">
                    {language === 'ar' ? 'التاريخ والمرجع' : 'Date & Reference'}
                  </th>
                  {/* 6. Depositor Name (11%) */}
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[11%]">
                    {language === 'ar' ? 'اسم المودع' : 'Depositor Name'}
                  </th>
                  {/* 7. Accounting Status (11%) */}
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[11%]">
                    {language === 'ar' ? 'الحالة المحاسبية' : 'Accounting Status'}
                  </th>
                  {/* 8. Actions (18%) */}
                  <th className="py-2.5 px-2 xl:px-2.5 text-end whitespace-nowrap w-[18%]">
                    {language === 'ar' ? 'التأكيد والطباعة' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 text-xs">
                      {language === 'ar' ? 'لا توجد إيصالات تحصيل مطابقة لمعايير البحث والتصفية' : 'No collection receipts match search criteria'}
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((p) => {
                    const mInfo = getPaymentMethodDetails(p.payment_method, language as any);
                    const channelIcon = 
                      mInfo.id === 'bank_transfer' ? Building :
                      mInfo.id === 'cash' ? Wallet :
                      mInfo.id === 'instapay' ? Zap :
                      mInfo.id === 'vodafone_cash' ? Smartphone : CreditCard;
                    const Icon = channelIcon;

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 transition">
                        {/* 1. Receipt Number */}
                        <td className="py-2.5 px-2 xl:px-2.5 font-mono font-bold text-bct-navy whitespace-nowrap text-[11px] xl:text-xs">
                          <span dir="ltr">{p.receipt_code}</span>
                        </td>

                        {/* 2. Student Name */}
                        <td className="py-2.5 px-2 xl:px-2.5 text-start">
                          <div className="font-bold text-slate-900 text-[11px] xl:text-xs truncate block" title={p.student_name}>
                            {p.student_name || '-'}
                          </div>
                          {(p.payment_description || p.notes) && (
                            <div
                              className="text-[10px] text-slate-500 font-normal mt-0.5 truncate block"
                              title={p.payment_description || p.notes}
                            >
                              {p.payment_description || p.notes}
                            </div>
                          )}
                        </td>

                        {/* 3. Amount and Currency (Single Line) */}
                        <td className="py-2.5 px-2 xl:px-2.5 font-black text-slate-800 whitespace-nowrap text-[11px] xl:text-xs">
                          <span className="whitespace-nowrap">
                            <span className="tabular-nums">{p.amount.toLocaleString()}</span>{' '}
                            <span className="text-[10px] font-normal text-slate-500">{p.currency}</span>
                          </span>
                        </td>

                        {/* 4. Payment Method & Account */}
                        <td className="py-2.5 px-2 xl:px-2.5 text-slate-600">
                          <div className="flex items-center gap-1 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold whitespace-nowrap shrink-0 ${
                              mInfo.id === 'bank_transfer' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                              mInfo.id === 'cash' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                              mInfo.id === 'instapay' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                              mInfo.id === 'vodafone_cash' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              <Icon className="w-3 h-3 shrink-0" />
                              <span>{mInfo.name}</span>
                            </span>
                            {p.status === 'pending' && (hasPermission('payments:edit_pending') || hasPermission('finance:edit')) && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPaymentToCorrect(p);
                                  const norm = normalizePaymentMethod(p.payment_method);
                                  setCorrectMethod(norm !== 'unclassified' ? norm : 'bank_transfer');
                                  setCorrectReason('');
                                  setCorrectError('');
                                }}
                                className="text-slate-400 hover:text-bct-navy transition p-0.5 rounded cursor-pointer shrink-0"
                                title={isRtl ? 'تصحيح طريقة الدفع' : 'Correct Payment Method'}
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                          <div
                            className="text-[10px] text-slate-500 font-medium mt-0.5 truncate block"
                            title={p.bank_name || p.financial_account_name || mInfo.defaultAccount}
                          >
                            {p.bank_name || p.financial_account_name || mInfo.defaultAccount}
                          </div>
                        </td>

                        {/* 5. Date and Reference */}
                        <td className="py-2.5 px-2 xl:px-2.5 text-slate-600">
                          <div className="font-semibold whitespace-nowrap tabular-nums text-[11px] xl:text-xs" dir="ltr">
                            {p.created_at?.split('T')[0] || '-'}
                          </div>
                          <div
                            className="text-[10px] text-slate-400 font-mono whitespace-nowrap truncate block"
                            title={p.payment_reference}
                            dir="ltr"
                          >
                            {p.payment_reference}
                          </div>
                        </td>

                        {/* 6. Depositor Name */}
                        <td className="py-2.5 px-2 xl:px-2.5 text-slate-700 font-medium">
                          <span className="text-[11px] xl:text-xs whitespace-nowrap truncate block" title={p.payer_name}>
                            {p.payer_name || '-'}
                          </span>
                        </td>

                        {/* 7. Accounting Status */}
                        <td className="py-2.5 px-2 xl:px-2.5 whitespace-nowrap">
                          {p.status === 'confirmed' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap shrink-0">
                              {language === 'ar' ? 'مؤكد ومعتمد' : 'Confirmed'}
                            </span>
                          ) : p.status === 'reversed' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shrink-0">
                              {language === 'ar' ? 'معكوس' : 'Reversed'}
                            </span>
                          ) : p.status === 'cancelled' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap shrink-0">
                              {language === 'ar' ? 'ملغى' : 'Cancelled'}
                            </span>
                          ) : p.status === 'rejected' ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap shrink-0">
                              {language === 'ar' ? 'مرفوض' : 'Rejected'}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 whitespace-nowrap shrink-0">
                              {language === 'ar' ? 'بانتظار التأكيد' : 'Pending'}
                            </span>
                          )}
                        </td>

                        {/* 8. Actions (Compact, Single-Line, Completely Visible) */}
                        <td className="py-2.5 px-2 xl:px-2.5 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1 whitespace-nowrap flex-wrap xl:flex-nowrap shrink-0">
                            {p.status === 'pending' ? (
                              <>
                                {/* 1. Edit Receipt */}
                                {hasPermission('payments:edit_pending') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenEditPaymentModal(p)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10.5px] shadow-2xs transition cursor-pointer whitespace-nowrap shrink-0"
                                    title={language === 'ar' ? 'تعديل السند قبل تأكيد السداد' : 'Edit Receipt before confirmation'}
                                  >
                                    <Edit3 className="w-3 h-3 shrink-0" />
                                    <span>{language === 'ar' ? 'تعديل السند' : 'Edit Receipt'}</span>
                                  </button>
                                )}

                                {/* 2. Cancel Receipt */}
                                {hasPermission('payments:cancel_pending') && (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenCancelPaymentModal(p)}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50/70 hover:bg-rose-100 text-rose-700 border border-rose-300 font-bold text-[10.5px] shadow-2xs transition cursor-pointer whitespace-nowrap shrink-0"
                                    title={language === 'ar' ? 'إلغاء السند قبل تأكيد السداد' : 'Cancel Receipt before confirmation'}
                                  >
                                    <XCircle className="w-3 h-3 shrink-0" />
                                    <span>{language === 'ar' ? 'إلغاء السند' : 'Cancel Receipt'}</span>
                                  </button>
                                )}

                                {/* 3. Confirm Payment */}
                                {hasPermission('payments:confirm') ? (
                                  <button
                                    type="button"
                                    onClick={() => handleConfirmPayment(p.id)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10.5px] shadow-2xs transition cursor-pointer whitespace-nowrap shrink-0"
                                  >
                                    <Check className="w-3 h-3 shrink-0" />
                                    <span>{language === 'ar' ? 'تأكيد السداد' : 'Confirm Payment'}</span>
                                  </button>
                                ) : !hasPermission('payments:edit_pending') && !hasPermission('payments:cancel_pending') ? (
                                  <span className="text-slate-400 text-xs italic whitespace-nowrap">
                                    {language === 'ar' ? 'بانتظار التأكيد' : 'Pending Confirmation'}
                                  </span>
                                ) : null}
                              </>
                            ) : p.status === 'confirmed' ? (
                              <>
                                {/* Print Receipt */}
                                <button
                                  type="button"
                                  onClick={() => setReceiptToPrint(p)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10.5px] transition cursor-pointer whitespace-nowrap shrink-0"
                                  title={language === 'ar' ? 'طباعة الإيصال الرسمي' : 'Print Official Receipt'}
                                >
                                  <Printer className="w-3 h-3 shrink-0" />
                                  <span>{language === 'ar' ? 'طباعة' : 'Print'}</span>
                                </button>

                                {/* Reverse Receipt */}
                                {hasPermission('finance:approve') && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setPaymentToReverse(p);
                                      setReversalReason('');
                                      setReversalError('');
                                    }}
                                    className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10.5px] transition border border-rose-200 cursor-pointer whitespace-nowrap shrink-0"
                                    title={language === 'ar' ? 'عكس السداد واسترداد المبلغ' : 'Reverse Payment'}
                                  >
                                    <RotateCcw className="w-3 h-3 shrink-0" />
                                    <span>{language === 'ar' ? 'عكس' : 'Reverse'}</span>
                                  </button>
                                )}
                              </>
                            ) : p.status === 'cancelled' ? (
                              <div className="flex items-center justify-end gap-1 whitespace-nowrap shrink-0">
                                <span
                                  className="text-rose-600 text-[10.5px] font-semibold flex items-center gap-1 cursor-help whitespace-nowrap"
                                  title={p.cancellation_reason ? `${language === 'ar' ? 'سبب الإلغاء:' : 'Reason:'} ${p.cancellation_reason}` : undefined}
                                >
                                  <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                                  <span>{language === 'ar' ? 'سند ملغى' : 'Cancelled'}</span>
                                </span>
                              </div>
                            ) : (
                              <span className="text-rose-500 text-[10.5px] font-semibold whitespace-nowrap">
                                {p.status === 'rejected'
                                  ? (language === 'ar' ? 'مرفوض' : 'Rejected')
                                  : (language === 'ar' ? 'تم العكس' : 'Reversed')}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSE REGISTER (Fix 14 & Requirement 8) */}
      {activeTab === 'expenses' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden space-y-4">
          <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-1 overflow-x-auto">
                {[
                  { id: 'all', label_ar: 'كل الفئات' },
                  { id: 'employee_incentives', label_ar: 'حوافز الموظفين' },
                  { id: 'salaries', label_ar: 'الرواتب والأجور' },
                  { id: 'marketing', label_ar: 'التسويق والحملات' },
                  { id: 'rent', label_ar: 'الإيجار والمرافق' },
                  { id: 'government_fees', label_ar: 'رسوم المنصات والتوثيق' },
                  { id: 'operational', label_ar: 'المصروفات الإدارية' },
                ].map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setExpenseFilterCat(cat.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                      expenseFilterCat === cat.id
                        ? 'bg-bct-navy text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {cat.label_ar}
                  </button>
                ))}
              </div>

              {/* Payment Method Filter Dropdown */}
              <select
                value={selectedPaymentMethod}
                onChange={(e) => setSelectedPaymentMethod(e.target.value as any)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 focus:bg-white focus:border-bct-navy cursor-pointer"
                title={isRtl ? 'تصفية حسب طريقة السداد' : 'Filter by payment method'}
              >
                <option value="all">{isRtl ? 'كل طرق السداد' : 'All Methods'}</option>
                <option value="bank_transfer">{isRtl ? 'تحويل بنكي' : 'Bank Transfer'}</option>
                <option value="cash">{isRtl ? 'نقداً بالخزينة' : 'Cash'}</option>
                <option value="instapay">{isRtl ? 'إنستاباي' : 'InstaPay'}</option>
                <option value="vodafone_cash">{isRtl ? 'فودافون كاش' : 'Vodafone Cash'}</option>
              </select>

              {/* Currency Filter Dropdown */}
              <select
                value={selectedCurrency}
                onChange={(e) => setSelectedCurrency(e.target.value as any)}
                className="text-xs font-bold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 text-slate-700 focus:bg-white focus:border-bct-navy cursor-pointer"
                title={isRtl ? 'تصفية حسب العملة' : 'Filter by currency'}
              >
                <option value="all">{isRtl ? 'كل العملات' : 'All Currencies'}</option>
                <option value="EGP">EGP (جنيه)</option>
                <option value="USD">USD (دولار)</option>
              </select>
            </div>

            {hasPermission('finance:create') && (
              <button
                onClick={() => setIsExpenseModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition shadow-sm self-start md:self-auto cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'تسجيل مصروف جديد' : 'Register Expense'}</span>
              </button>
            )}
          </div>

          {/* A. RESPONSIVE CARDS VIEW FOR SMALL & MEDIUM SCREENS (< lg) - ZERO HORIZONTAL SCROLLING */}
          <div className="lg:hidden space-y-3 p-3">
            {filteredExpenses.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {language === 'ar' ? 'لا توجد مصروفات مسجلة تطابق البحث' : 'No expense records found'}
              </div>
            ) : (
              filteredExpenses.map((exp) => {
                const mInfo = getPaymentMethodDetails(exp.payment_method, language as any);
                const channelIcon = 
                  mInfo.id === 'bank_transfer' ? Building :
                  mInfo.id === 'cash' ? Wallet :
                  mInfo.id === 'instapay' ? Zap :
                  mInfo.id === 'vodafone_cash' ? Smartphone : CreditCard;
                const Icon = channelIcon;

                return (
                  <div key={exp.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2.5">
                    {/* Header: Voucher Code + Amount + Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="flex items-center gap-1.5 font-mono font-bold text-bct-navy text-xs">
                        <span>{exp.voucher_code}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-rose-700 text-xs">
                          {exp.amount.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{exp.currency}</span>
                        </span>
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                          exp.status === 'paid'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : exp.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : exp.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : exp.status === 'cancelled'
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {exp.status === 'paid'
                            ? (language === 'ar' ? 'مصروف ومسدد' : 'Paid')
                            : exp.status === 'approved'
                            ? (language === 'ar' ? 'معتمد' : 'Approved')
                            : exp.status === 'rejected'
                            ? (language === 'ar' ? 'مرفوض' : 'Rejected')
                            : exp.status === 'cancelled'
                            ? (language === 'ar' ? 'ملغي' : 'Cancelled')
                            : (language === 'ar' ? 'قيد الاعتماد' : 'Pending')}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{isRtl ? exp.title_ar : exp.title_en}</div>
                      {exp.category === 'employee_incentives' && (
                        <div className="mt-1 flex flex-wrap items-center gap-1">
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Award className="w-2.5 h-2.5 text-amber-600" />
                            <span>{isRtl ? 'حافز موظف' : 'Incentive'}</span>
                            {exp.beneficiary_employee_name && <span>• {exp.beneficiary_employee_name}</span>}
                          </span>
                          {exp.transaction_number && (
                            <span className="text-[10px] font-mono text-slate-500">
                              {isRtl ? 'المعاملة:' : 'Tx:'} <span className="font-bold text-bct-navy">{exp.transaction_number}</span>
                            </span>
                          )}
                        </div>
                      )}
                      {exp.notes && <div className="text-[10px] text-slate-500 mt-1">{exp.notes}</div>}
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/70 p-2 rounded-lg">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">{language === 'ar' ? 'التاريخ:' : 'Date:'}</span>
                        <span className="font-mono text-slate-600">{exp.created_at?.split('T')[0] || '-'}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">{language === 'ar' ? 'الإدارة:' : 'Dept:'}</span>
                        <span className="font-mono text-slate-700">{exp.department_id.toUpperCase()}</span>
                      </div>
                      <div className="col-span-2 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block">{language === 'ar' ? 'طريقة السداد:' : 'Payment Method:'}</span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-700">
                            <Icon className="w-3 h-3 text-slate-500" />
                            <span>{mInfo.name}</span>
                          </span>
                        </div>
                        <div className="text-end text-[10px] text-slate-500">
                          {exp.bank_name || exp.financial_account_name || mInfo.defaultAccount}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                      {exp.status === 'pending_approval' && hasPermission('finance:approve') && (
                        <>
                          <button
                            onClick={() => handleApproveExpense(exp.id)}
                            className="px-2.5 py-1 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] cursor-pointer shadow-xs"
                          >
                            {language === 'ar' ? 'اعتماد' : 'Approve'}
                          </button>
                          <button
                            onClick={() => handleRejectExpense(exp.id)}
                            className="px-2.5 py-1 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[11px] cursor-pointer"
                          >
                            {language === 'ar' ? 'رفض' : 'Reject'}
                          </button>
                        </>
                      )}
                      {exp.status === 'approved' && (
                        <>
                          <button
                            type="button"
                            onClick={() => setVoucherToPrint(exp)}
                            className="flex items-center gap-1 px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-bct-navy font-bold text-[11px] transition cursor-pointer"
                          >
                            <Printer className="w-3 h-3" />
                            <span>{isRtl ? 'إذن الصرف' : 'Auth'}</span>
                          </button>
                          {hasPermission('finance:approve') && (
                            <>
                              <button
                                onClick={() => handleMarkExpensePaid(exp)}
                                className="px-2.5 py-1 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-[11px] cursor-pointer shadow-xs flex items-center gap-1"
                              >
                                <Check className="w-3 h-3" />
                                <span>{language === 'ar' ? 'صرف وسداد' : 'Mark Paid'}</span>
                              </button>
                              <button
                                onClick={() => handleCancelExpense(exp.id)}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[11px] cursor-pointer"
                              >
                                {language === 'ar' ? 'إلغاء' : 'Cancel'}
                              </button>
                            </>
                          )}
                        </>
                      )}
                      {exp.status === 'paid' && (
                        <button
                          type="button"
                          onClick={() => setVoucherToPrint(exp)}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-bct-navy/10 hover:bg-bct-navy/20 text-bct-navy font-bold text-[11px] transition cursor-pointer border border-bct-navy/20 shadow-xs"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'سند الصرف' : 'Voucher'}</span>
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
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-[11px] xl:text-xs">
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[18%]">
                    {language === 'ar' ? 'بند المصروف والسند' : 'Expense Title & Voucher'}
                  </th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[9%]">
                    {language === 'ar' ? 'التاريخ' : 'Date'}
                  </th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[11%]">
                    {language === 'ar' ? 'التصنيف' : 'Category'}
                  </th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[12%]">
                    {language === 'ar' ? 'المبلغ والعملة' : 'Amount & Currency'}
                  </th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[15%]">
                    {language === 'ar' ? 'طريقة السداد والحساب' : 'Payment Method & Account'}
                  </th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[9%]">
                    {language === 'ar' ? 'الإدارة' : 'Department'}
                  </th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[10%]">
                    {language === 'ar' ? 'الحالة' : 'Status'}
                  </th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-end whitespace-nowrap w-[16%]">
                    {language === 'ar' ? 'الاعتماد والصرف' : 'Actions'}
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredExpenses.map((exp) => {
                  const mInfo = getPaymentMethodDetails(exp.payment_method, language as any);
                  const channelIcon = 
                    mInfo.id === 'bank_transfer' ? Building :
                    mInfo.id === 'cash' ? Wallet :
                    mInfo.id === 'instapay' ? Zap :
                    mInfo.id === 'vodafone_cash' ? Smartphone : CreditCard;
                  const Icon = channelIcon;

                  return (
                    <tr key={exp.id} className="hover:bg-slate-50/70 transition">
                      <td className="py-2 px-2 xl:px-2.5 font-bold text-slate-900">
                        <div className="leading-tight">{isRtl ? exp.title_ar : exp.title_en}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{exp.voucher_code}</div>
                        {exp.category === 'employee_incentives' && (
                          <div className="mt-0.5 space-y-0.5">
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                              <Award className="w-2.5 h-2.5 text-amber-600" />
                              <span>{isRtl ? 'حافز موظف' : 'Incentive'}</span>
                              {exp.beneficiary_employee_name && <span>• {exp.beneficiary_employee_name}</span>}
                            </span>
                            {exp.transaction_number && (
                              <div className="text-[9px] font-mono text-slate-500 whitespace-nowrap">
                                {isRtl ? 'المعاملة:' : 'Tx:'} <span className="font-bold text-bct-navy">{exp.transaction_number}</span>
                                {exp.eligibility_status === 'eligible' ? (
                                  <span className="ms-1 text-emerald-600 font-bold">✓</span>
                                ) : (
                                  <span className="ms-1 text-amber-600 font-bold">⏳</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        {exp.notes && <div className="text-[10px] text-slate-500 mt-0.5 truncate max-w-[180px]">{exp.notes}</div>}
                      </td>
                      <td className="py-2 px-2 xl:px-2.5 text-slate-600 tabular-nums whitespace-nowrap font-mono text-[11px]">
                        {exp.created_at?.split('T')[0] || '-'}
                      </td>
                      <td className="py-2 px-2 xl:px-2.5 font-semibold text-slate-600 whitespace-nowrap">
                        {exp.category === 'employee_incentives' ? (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 text-[10px]">
                            <Award className="w-2.5 h-2.5 text-amber-600" />
                            <span>{isRtl ? 'حوافز موظفين' : 'Incentives'}</span>
                          </span>
                        ) : (
                          <span className="text-[11px]">{exp.category}</span>
                        )}
                      </td>
                      <td className="py-2 px-2 xl:px-2.5 font-black text-rose-700 whitespace-nowrap tabular-nums">
                        {exp.amount.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{exp.currency}</span>
                      </td>
                      <td className="py-2 px-2 xl:px-2.5">
                        <div className="flex items-center gap-1 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                            mInfo.id === 'bank_transfer' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                            mInfo.id === 'cash' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                            mInfo.id === 'instapay' ? 'bg-indigo-50 text-indigo-800 border border-indigo-200' :
                            mInfo.id === 'vodafone_cash' ? 'bg-rose-50 text-rose-800 border border-rose-200' :
                            'bg-slate-100 text-slate-700 border border-slate-200'
                          }`}>
                            <Icon className="w-2.5 h-2.5 shrink-0" />
                            <span>{mInfo.name}</span>
                          </span>
                          {hasPermission('finance:edit') && (
                            <button
                              type="button"
                              onClick={() => {
                                setExpenseToCorrect(exp);
                                const norm = normalizePaymentMethod(exp.payment_method);
                                setCorrectMethod(norm !== 'unclassified' ? norm : 'bank_transfer');
                                setCorrectReason('');
                                setCorrectError('');
                              }}
                              className="text-slate-400 hover:text-bct-navy transition p-0.5 rounded cursor-pointer"
                              title={isRtl ? 'تصحيح طريقة الصرف' : 'Correct Payment Method'}
                            >
                              <Edit3 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-500 font-medium mt-0.5 truncate max-w-[130px] whitespace-nowrap">
                          {exp.bank_name || exp.financial_account_name || mInfo.defaultAccount}
                        </div>
                      </td>
                      <td className="py-2 px-2 xl:px-2.5 text-slate-700 font-mono whitespace-nowrap text-[11px]">
                        {exp.department_id.toUpperCase()}
                      </td>
                      <td className="py-2 px-2 xl:px-2.5 whitespace-nowrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap ${
                          exp.status === 'paid'
                            ? 'bg-sky-50 text-sky-700 border border-sky-200'
                            : exp.status === 'approved'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : exp.status === 'rejected'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : exp.status === 'cancelled'
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}>
                          {exp.status === 'paid'
                            ? (language === 'ar' ? 'مصروف ومسدد' : 'Paid')
                            : exp.status === 'approved'
                            ? (language === 'ar' ? 'معتمد' : 'Approved')
                            : exp.status === 'rejected'
                            ? (language === 'ar' ? 'مرفوض' : 'Rejected')
                            : exp.status === 'cancelled'
                            ? (language === 'ar' ? 'ملغي' : 'Cancelled')
                            : (language === 'ar' ? 'قيد الاعتماد' : 'Pending')}
                        </span>
                      </td>
                      <td className="py-2 px-2 xl:px-2.5 text-end whitespace-nowrap">
                        {exp.status === 'pending_approval' && hasPermission('finance:approve') && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleApproveExpense(exp.id)}
                              className="px-2 py-0.5 rounded bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] cursor-pointer shadow-xs whitespace-nowrap"
                            >
                              {language === 'ar' ? 'اعتماد' : 'Approve'}
                            </button>
                            <button
                              onClick={() => handleRejectExpense(exp.id)}
                              className="px-2 py-0.5 rounded bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold text-[10px] cursor-pointer whitespace-nowrap"
                            >
                              {language === 'ar' ? 'رفض' : 'Reject'}
                            </button>
                          </div>
                        )}
                        {exp.status === 'approved' && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setVoucherToPrint(exp)}
                              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-bct-navy font-bold text-[10px] transition cursor-pointer whitespace-nowrap"
                              title={isRtl ? 'معاينة إذن الصرف المعتمد (قبل الصرف)' : 'Preview Payment Authorization'}
                            >
                              <Printer className="w-3 h-3" />
                              <span>{isRtl ? 'إذن' : 'Auth'}</span>
                            </button>
                            {hasPermission('finance:approve') && (
                              <>
                                <button
                                  onClick={() => handleMarkExpensePaid(exp)}
                                  className="px-2 py-0.5 rounded bg-sky-600 hover:bg-sky-700 text-white font-bold text-[10px] cursor-pointer shadow-xs flex items-center gap-1 whitespace-nowrap"
                                  title={language === 'ar' ? 'تسجيل الصرف والسداد الفعلي من الخزينة' : 'Mark as paid'}
                                >
                                  <Check className="w-3 h-3" />
                                  <span>{language === 'ar' ? 'صرف' : 'Paid'}</span>
                                </button>
                                <button
                                  onClick={() => handleCancelExpense(exp.id)}
                                  className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-[10px] cursor-pointer whitespace-nowrap"
                                  title={language === 'ar' ? 'إلغاء الاعتماد' : 'Cancel'}
                                >
                                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                                </button>
                              </>
                            )}
                          </div>
                        )}
                        {exp.status === 'paid' && (
                          <div className="flex items-center justify-end gap-1.5 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => setVoucherToPrint(exp)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded bg-bct-navy/10 hover:bg-bct-navy/20 text-bct-navy font-bold text-[10px] transition cursor-pointer border border-bct-navy/20 shadow-xs whitespace-nowrap"
                              title={isRtl ? 'طباعة سند الصرف المالي الفعلي' : 'Print Official Disbursement Voucher'}
                            >
                              <Printer className="w-3 h-3" />
                              <span>{isRtl ? 'سند الصرف' : 'Voucher'}</span>
                            </button>
                            <span className="text-[10px] text-sky-700 font-bold flex items-center gap-0.5">
                              <CheckCircle className="w-3 h-3" />
                              <span>{exp.paid_at?.split('T')[0] || exp.approved_at?.split('T')[0] || '-'}</span>
                            </span>
                          </div>
                        )}
                        {(exp.status === 'rejected' || exp.status === 'cancelled') && (
                          <span className="text-[10px] text-slate-400 whitespace-nowrap">
                            {exp.status === 'rejected' ? (language === 'ar' ? 'مرفوض' : 'Rejected') : (language === 'ar' ? 'ملغي' : 'Cancelled')}
                          </span>
                        )}
                        {exp.status === 'pending_approval' && !hasPermission('finance:approve') && (
                          <span className="text-slate-400 text-[10px] italic whitespace-nowrap">
                            {language === 'ar' ? 'قيد المراجعة' : 'Pending'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: BUDGETS & APPROVALS (Fix 15) */}
      {activeTab === 'budgets' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">
                {language === 'ar' ? 'الموازنات التقديرية للإدارات ومتابعة الاستهلاك' : 'Departmental Budgets & Spending Utilization'}
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'ar'
                  ? 'مقارنة الإنفاق الفعلي للمصروفات مع الموازنات التقديرية المعتمدة لكل إدارة.'
                  : 'Track actual operational burn against approved fiscal allocations.'}
              </p>
            </div>

            {hasPermission('finance:approve') && (
              <button
                onClick={() => setIsBudgetModalOpen(true)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-sm self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>{language === 'ar' ? 'تخصيص موازنة لإدارة' : 'Allocate Budget'}</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {budgets.map((b) => {
              const dept = departments.find(d => d.id === b.department_id || d.code === b.department_id);
              
              // Calculate spent amount from approved expenses
              const deptExpenses = expenses.filter(
                e => (e.department_id === b.department_id) && e.status === 'approved'
              );
              const spent = deptExpenses.reduce((sum, e) => sum + e.amount, 0);
              const utilization = b.allocated_amount > 0 ? Math.round((spent / b.allocated_amount) * 100) : 0;
              const isOverBudget = utilization >= 100;
              const isWarning = utilization >= 80 && !isOverBudget;

              return (
                <div key={b.id} className="bg-slate-50 rounded-2xl p-5 border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs">
                      {isRtl ? dept?.name_ar : dept?.name_en || b.department_id.toUpperCase()}
                    </span>
                    <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-500 font-bold">
                      {b.fiscal_period}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline justify-between">
                      <span className="text-xs text-slate-500">{isRtl ? 'المصروف الفعلي:' : 'Actual Spent:'}</span>
                      <span className="text-base font-black text-slate-900">{spent.toLocaleString()} {b.currency}</span>
                    </div>
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-slate-500">{isRtl ? 'الموازنة المعتمدة:' : 'Approved Allocation:'}</span>
                      <span className="font-bold text-bct-navy">{b.allocated_amount.toLocaleString()} {b.currency}</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex items-center justify-between text-[11px] mb-1">
                      <span className="text-slate-500">{isRtl ? 'نسبة الاستهلاك:' : 'Utilization:'}</span>
                      <span className={`font-black ${isOverBudget ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {utilization}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isOverBudget ? 'bg-rose-600' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, utilization)}%` }}
                      />
                    </div>
                  </div>

                  {isOverBudget && (
                    <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-[11px] font-bold flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{isRtl ? 'تنبيه: تم تجاوز سقف الموازنة المعتمد!' : 'Budget ceiling exceeded!'}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: EMPLOYEE INCENTIVES */}
      {activeTab === 'incentives' && (
        <EmployeeIncentiveSection onOpenPaymentVoucher={(exp) => setVoucherToPrint(exp)} />
      )}

      {/* TAB 5: ACCOUNT MOVEMENT LEDGER */}
      {activeTab === 'ledger' && (
        <AccountMovementLedger 
          onOpenReceipt={(rec) => setReceiptToPrint(rec)}
          onOpenPaymentVoucher={(exp) => setVoucherToPrint(exp)}
        />
      )}

      {/* Modal: New Payment Receipt (Fix 13) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">
                {language === 'ar' ? 'تسجيل إيصال سداد جديد للعمليات' : 'Record Student Payment'}
              </h3>
              <button onClick={() => setIsPaymentModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreatePayment} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اختر الطالب المعني *</label>
                <select
                  required
                  value={paymentFormData.student_id}
                  onChange={(e) => {
                    const stuId = e.target.value;
                    const studentFile = studentFiles.find(f => f.student_id === stuId);
                    setPaymentFormData({
                      ...paymentFormData,
                      student_id: stuId,
                      student_file_id: studentFile?.id || ''
                    });
                  }}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                >
                  <option value="">-- اختر الطالب --</option>
                  {students.map(s => (
                    <option key={s.id} value={s.id}>{s.full_name_ar} ({s.student_code})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ *</label>
                  <input
                    type="number"
                    required
                    value={paymentFormData.amount}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold text-slate-900"
                    placeholder="15000"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العملة *</label>
                  <select
                    value={paymentFormData.currency}
                    onChange={(e) => setPaymentFormData({ ...paymentFormData, currency: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">طريقة الدفع *</label>
                <select
                  value={paymentFormData.payment_method}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_method: e.target.value as any })}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                >
                  <option value="bank_transfer">تحويل بنكي رسمي (Bank Transfer)</option>
                  <option value="cash">نقداً بالخزينة (Cash)</option>
                  <option value="instapay">إنستاباي (InstaPay)</option>
                  <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الشخص المودع / ولي الأمر *</label>
                <input
                  type="text"
                  required
                  value={paymentFormData.payer_name}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payer_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  placeholder="محمد الصادق البشير"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم مرجع التحويل / الحساب</label>
                <input
                  type="text"
                  value={paymentFormData.payment_reference}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_reference: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-mono"
                  placeholder="TXN-984729"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'وذلك مقابل (Payment Description) *' : 'In Payment of / Description *'}
                </label>
                <input
                  type="text"
                  required
                  value={paymentFormData.payment_description}
                  onChange={(e) => setPaymentFormData({ ...paymentFormData, payment_description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs font-medium text-slate-800"
                  placeholder={language === 'ar' ? 'اكتب سبب أو وصف المبلغ المستلم...' : 'Enter reason or description of received amount...'}
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    'رسوم فتح الملف والتقديم الأكاديمي للجامعات المصرية (2026/2027)',
                    'رسوم التسجيل في البرنامج التدريبي',
                    'سداد رسوم الاستشارات والتدريب',
                    'دفعة مقدمة مقابل الخدمات المتفق عليها'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setPaymentFormData({ ...paymentFormData, payment_description: preset })}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark shadow"
                >
                  {language === 'ar' ? 'حفظ وإصدار الإيصال' : 'Issue Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Edit Pending Payment Receipt (Strictly Before Confirmation) */}
      {paymentToEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/55 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2 flex-wrap">
                <div className="w-8 h-8 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
                  <Edit3 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {language === 'ar' ? 'تعديل سند تحصيل قبل التأكيد' : 'Edit Pending Payment Receipt'}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono font-bold text-[11px] text-bct-navy">{paymentToEdit.receipt_code}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      {language === 'ar' ? 'بانتظار التأكيد' : 'Pending Confirmation'}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPaymentToEdit(null);
                  setEditPaymentError('');
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editPaymentError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{editPaymentError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEditedPayment} className="space-y-3">
              {/* Student & Linked Student File */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'الطالب المعني *' : 'Associated Student *'}
                  </label>
                  <select
                    required
                    value={editPaymentFormData.student_id}
                    onChange={(e) => {
                      const stuId = e.target.value;
                      const matchingFiles = studentFiles.filter(f => f.student_id === stuId);
                      const keepCurrentFile = matchingFiles.some(f => f.id === editPaymentFormData.student_file_id);
                      setEditPaymentFormData({
                        ...editPaymentFormData,
                        student_id: stuId,
                        student_file_id: keepCurrentFile ? editPaymentFormData.student_file_id : (matchingFiles[0]?.id || '')
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:border-bct-navy focus:outline-none"
                  >
                    <option value="">{language === 'ar' ? '-- اختر الطالب --' : '-- Select Student --'}</option>
                    {students.map(s => (
                      <option key={s.id} value={s.id}>{s.full_name_ar} ({s.student_code})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'ملف الطالب المرتبط' : 'Linked Student File'}
                  </label>
                  <select
                    value={editPaymentFormData.student_file_id}
                    onChange={(e) => setEditPaymentFormData({ ...editPaymentFormData, student_file_id: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:border-bct-navy focus:outline-none"
                  >
                    <option value="">{language === 'ar' ? '-- بدون ربط بملف محدد --' : '-- No specific file --'}</option>
                    {studentFiles
                      .filter(f => !editPaymentFormData.student_id || f.student_id === editPaymentFormData.student_id)
                      .map(f => (
                        <option key={f.id} value={f.id}>
                          {f.file_code} — {f.academic_year || ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              {/* Amount & Currency */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'المبلغ *' : 'Amount *'}
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    value={editPaymentFormData.amount}
                    onChange={(e) => setEditPaymentFormData({ ...editPaymentFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:border-bct-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'العملة *' : 'Currency *'}
                  </label>
                  <select
                    value={editPaymentFormData.currency}
                    onChange={(e) => setEditPaymentFormData({ ...editPaymentFormData, currency: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white font-bold focus:border-bct-navy focus:outline-none"
                  >
                    <option value="EGP">{language === 'ar' ? 'جنيه مصري (EGP)' : 'Egyptian Pound (EGP)'}</option>
                    <option value="USD">{language === 'ar' ? 'دولار أمريكي (USD)' : 'US Dollar (USD)'}</option>
                  </select>
                </div>
              </div>

              {/* Payment Date & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'تاريخ السداد *' : 'Payment Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={editPaymentFormData.payment_date}
                    onChange={(e) => setEditPaymentFormData({ ...editPaymentFormData, payment_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono bg-white focus:border-bct-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'طريقة الدفع *' : 'Payment Method *'}
                  </label>
                  <select
                    value={editPaymentFormData.payment_method}
                    onChange={(e) => setEditPaymentFormData({ ...editPaymentFormData, payment_method: e.target.value as PaymentRecord['payment_method'] })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:border-bct-navy focus:outline-none"
                  >
                    <option value="bank_transfer">{language === 'ar' ? 'تحويل بنكي رسمي (Bank Transfer)' : 'Bank Transfer'}</option>
                    <option value="cash">{language === 'ar' ? 'نقداً بالخزينة (Cash)' : 'Cash'}</option>
                    <option value="instapay">{language === 'ar' ? 'إنستاباي (InstaPay)' : 'InstaPay'}</option>
                    <option value="vodafone_cash">{language === 'ar' ? 'فودافون كاش (Vodafone Cash)' : 'Vodafone Cash'}</option>
                  </select>
                </div>
              </div>

              {/* Receiving Account / Bank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'الحساب المستلم' : 'Receiving Account'}
                  </label>
                  <select
                    value={editPaymentFormData.financial_account_id}
                    onChange={(e) => {
                      const accId = e.target.value;
                      const acc = financialAccounts.find(a => a.id === accId);
                      setEditPaymentFormData({
                        ...editPaymentFormData,
                        financial_account_id: accId,
                        bank_name: acc ? (acc.institution_name_ar || acc.account_name_ar) : editPaymentFormData.bank_name
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-white focus:border-bct-navy focus:outline-none"
                  >
                    <option value="">{language === 'ar' ? '-- تحديد يدوي / افتراضي --' : '-- Manual / Default --'}</option>
                    {financialAccounts.filter(a => a.is_active).map(acc => (
                      <option key={acc.id} value={acc.id}>
                        {language === 'ar' ? acc.account_name_ar : acc.account_name_en} ({acc.currency})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'اسم البنك / الخزينة' : 'Bank / Vault Name'}
                  </label>
                  <input
                    type="text"
                    value={editPaymentFormData.bank_name}
                    onChange={(e) => setEditPaymentFormData({ ...editPaymentFormData, bank_name: e.target.value })}
                    placeholder={language === 'ar' ? 'مثال: البنك الأهلي المصري' : 'e.g. National Bank of Egypt'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-bct-navy focus:outline-none"
                  />
                </div>
              </div>

              {/* Payer Name & Reference Number */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'اسم المودع / ولي الأمر *' : 'Payer Name *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={editPaymentFormData.payer_name}
                    onChange={(e) => setEditPaymentFormData({ ...editPaymentFormData, payer_name: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-bct-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'رقم مرجع التحويل / المعاملة' : 'Transaction / Reference Number'}
                  </label>
                  <input
                    type="text"
                    value={editPaymentFormData.payment_reference}
                    onChange={(e) => setEditPaymentFormData({ ...editPaymentFormData, payment_reference: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-mono focus:border-bct-navy focus:outline-none"
                  />
                </div>
              </div>

              {/* Payment Description */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'وذلك مقابل (بيان السداد) *' : 'Payment Description *'}
                </label>
                <input
                  type="text"
                  required
                  value={editPaymentFormData.payment_description}
                  onChange={(e) => setEditPaymentFormData({ ...editPaymentFormData, payment_description: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 focus:border-bct-navy focus:outline-none"
                />
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {[
                    'رسوم فتح الملف والتقديم الأكاديمي للجامعات المصرية (2026/2027)',
                    'رسوم التسجيل في البرنامج التدريبي',
                    'سداد رسوم الاستشارات والتدريب',
                    'دفعة مقدمة مقابل الخدمات المتفق عليها'
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditPaymentFormData({ ...editPaymentFormData, payment_description: preset })}
                      className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Internal Notes & Modification Reason */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'ملاحظات داخلية' : 'Internal Notes'}
                  </label>
                  <input
                    type="text"
                    value={editPaymentFormData.notes}
                    onChange={(e) => setEditPaymentFormData({ ...editPaymentFormData, notes: e.target.value })}
                    placeholder={language === 'ar' ? 'ملاحظات إضافية على السند...' : 'Additional internal notes...'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-bct-navy focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {language === 'ar' ? 'سبب التعديل (لسجل التدقيق)' : 'Modification Reason (Audit Log)'}
                  </label>
                  <input
                    type="text"
                    value={editPaymentFormData.reason}
                    onChange={(e) => setEditPaymentFormData({ ...editPaymentFormData, reason: e.target.value })}
                    placeholder={language === 'ar' ? 'مثال: تصحيح المبلغ أو طريقة الدفع قبل الاعتماد' : 'e.g. Correct amount or method before confirmation'}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:border-bct-navy focus:outline-none"
                  />
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-bct-navy shrink-0" />
                <span>
                  {language === 'ar'
                    ? 'سيتم حفظ التعديلات على نفس السند مع تسجيلها في سجل العمليات والتدقيق، ويُغلق التعديل نهائياً فور تأكيد السداد.'
                    : 'Changes are saved in-place on this receipt and logged in the Audit Trail. Editing locks permanently once confirmed.'}
                </span>
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentToEdit(null);
                    setEditPaymentError('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>{language === 'ar' ? 'حفظ التعديلات' : 'Save Changes'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Confirm Cancel Payment Receipt (Strictly Before Confirmation) */}
      {paymentToCancel && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                  <XCircle className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800">
                    {language === 'ar' ? 'تأكيد إلغاء السند' : 'Confirm Receipt Cancellation'}
                  </h3>
                  <span className="font-mono font-bold text-[11px] text-bct-navy">{paymentToCancel.receipt_code}</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setPaymentToCancel(null);
                  setCancelPaymentError('');
                  setCancellationReason('');
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Warning Message Box */}
            <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl text-rose-900 text-xs leading-relaxed">
              <p className="font-medium">
                {language === 'ar'
                  ? 'هل أنت متأكد من رغبتك في إلغاء سند التحصيل المحدد؟ سيتم الاحتفاظ بالسند في السجلات المالية لأغراض المراجعة والتدقيق، ولن يتم احتسابه ضمن التحصيلات المؤكدة.'
                  : 'Are you sure you want to cancel the selected collection receipt? The receipt will be retained in financial records for audit and review purposes, and will not be counted in confirmed collections.'}
              </p>
            </div>

            {/* Receipt Summary Details */}
            <div className="p-3 bg-slate-50 rounded-xl space-y-2 border border-slate-100 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'رقم السند:' : 'Receipt Number:'}</span>
                <span className="font-mono font-bold text-bct-navy">{paymentToCancel.receipt_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'اسم الطالب:' : 'Student Name:'}</span>
                <span className="font-bold text-slate-800">{paymentToCancel.student_name || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'المبلغ والعملة:' : 'Amount & Currency:'}</span>
                <span className="font-bold text-slate-900">
                  {paymentToCancel.amount.toLocaleString()} {paymentToCancel.currency}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'طريقة الدفع:' : 'Payment Method:'}</span>
                <span className="font-semibold text-slate-700">
                  {getPaymentMethodDetails(paymentToCancel.payment_method, language as any).name}
                </span>
              </div>
            </div>

            {/* Cancellation Reason Input Form */}
            <form onSubmit={handleExecuteCancelPayment} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'سبب إلغاء السند (إلزامي للتدقيق المالي) *' : 'Cancellation Reason (Required) *'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder={language === 'ar'
                    ? 'مثال: خطأ في إدخال بيانات السند، تكرار الإيصال، إلغاء المعاملة من قبل الطالب...'
                    : 'e.g. Data entry error, duplicate receipt, client requested cancellation...'}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:border-rose-400 focus:outline-none resize-none"
                />
              </div>

              {cancelPaymentError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{cancelPaymentError}</span>
                </div>
              )}

              <div className="pt-2 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPaymentToCancel(null);
                    setCancelPaymentError('');
                    setCancellationReason('');
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  {language === 'ar' ? 'تراجع' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow flex items-center gap-1.5"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تأكيد إلغاء السند' : 'Confirm Cancel Receipt'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: New Expense (Fix 14) */}
      {isExpenseModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">
                {language === 'ar' ? 'تسجيل مصروف تشغيلي جديد' : 'Register Operating Expense'}
              </h3>
              <button onClick={() => setIsExpenseModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateExpense} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">بيان المصروف *</label>
                <input
                  type="text"
                  required
                  value={expenseFormData.title}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  placeholder="إيجار مقر الشركة - شهر نوفمبر"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">التصنيف *</label>
                  <select
                    value={expenseFormData.category}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="operational">مصروفات تشغيلية وإدارية</option>
                    <option value="employee_incentives">حوافز الموظفين التشغيلية (Incentives)</option>
                    <option value="salaries">رواتب وأجور</option>
                    <option value="marketing">تسويق وحملات</option>
                    <option value="rent">إيجار ومرافق</option>
                    <option value="government_fees">رسوم حكومية ومنصات</option>
                    <option value="miscellaneous">نثريات</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الإدارة المعنية *</label>
                  <select
                    value={expenseFormData.department_id}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, department_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name_ar}</option>
                    ))}
                  </select>
                </div>
              </div>

              {expenseFormData.category === 'employee_incentives' && (
                <div className="p-3 bg-amber-50/70 rounded-xl border border-amber-200 space-y-3">
                  <div className="flex items-center gap-1.5 text-amber-900 font-bold text-xs border-b border-amber-200/60 pb-1.5">
                    <Award className="w-3.5 h-3.5 text-amber-600" />
                    <span>{isRtl ? 'بيانات استحقاق حافز الموظف والمعاملة المرتبطة' : 'Employee Incentive & Linked Transaction'}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-amber-900 mb-1">الموظف المستفيد *</label>
                      <select
                        required
                        value={expenseFormData.beneficiary_employee_id}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, beneficiary_employee_id: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-semibold"
                      >
                        <option value="">{isRtl ? '-- اختر الموظف --' : '-- Select Employee --'}</option>
                        {bctStore.getEmployees().map(emp => (
                          <option key={emp.id} value={emp.id}>{emp.full_name_ar} ({emp.job_title_ar || emp.department_id.toUpperCase()})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-amber-900 mb-1">نوع الحافز *</label>
                      <select
                        value={expenseFormData.incentive_type}
                        onChange={(e) => setExpenseFormData({ ...expenseFormData, incentive_type: e.target.value })}
                        className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-semibold"
                      >
                        <option value="file_completion">{isRtl ? 'حافز إنجاز المعاملة (مرحلة 10)' : 'File Completion (Stage 10)'}</option>
                        <option value="performance_bonus">{isRtl ? 'مكافأة تميز وتقييم ربع سنوي' : 'Performance Bonus'}</option>
                        <option value="marketing_lead">{isRtl ? 'حافز استقطاب وتسجيل طالب جديد' : 'Student Recruitment'}</option>
                        <option value="special_project">{isRtl ? 'حافز مشروع وإنجاز استثنائي' : 'Special Project'}</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-amber-900 mb-1">
                      {isRtl ? 'رقم المعاملة المرتبطة إجبارياً (BCT-FILE-...) *' : 'Mandatory Linked Transaction *'}
                    </label>
                    <select
                      required
                      value={expenseFormData.transaction_number}
                      onChange={(e) => {
                        const fileCode = e.target.value;
                        const file = studentFiles.find(f => f.file_code === fileCode);
                        setExpenseFormData({
                          ...expenseFormData,
                          transaction_number: fileCode,
                          title: file ? `حافز إنجاز المعاملة ${fileCode} - ${file.student?.full_name_ar || ''}` : expenseFormData.title
                        });
                      }}
                      className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-mono"
                    >
                      <option value="">{isRtl ? '-- حدد معاملة ملف الطالب المرتبطة --' : '-- Select Linked Transaction --'}</option>
                      {studentFiles.map(file => {
                        const isStage10 = file.current_status === 'closed';
                        return (
                          <option key={file.id} value={file.file_code}>
                            {file.file_code} - {file.student?.full_name_ar || ''} ({isStage10 ? '✓ مرحلة 10: مغلق وتقييم' : `المرحلة: ${file.current_status}`})
                          </option>
                        );
                      })}
                    </select>

                    {expenseFormData.transaction_number && (
                      <div className="mt-1.5 p-2 rounded-lg bg-white border border-amber-200 text-[11px]">
                        {(() => {
                          const f = studentFiles.find(x => x.file_code === expenseFormData.transaction_number);
                          if (!f) return null;
                          const isEligible = f.current_status === 'closed';
                          return (
                            <div className="space-y-0.5">
                              <div className="flex items-center justify-between font-bold">
                                <span className="text-slate-600">{isRtl ? 'حالة ملف الطالب:' : 'Status:'}</span>
                                <span className={isEligible ? 'text-emerald-700' : 'text-amber-700'}>
                                  {isEligible
                                    ? (isRtl ? '✓ مرحلة 10 (مغلق + تقييم) — مؤهلة للصرف الفوري' : '✓ Stage 10 (Closed & Evaluated) — Eligible')
                                    : (isRtl ? `⏳ مرحلة قيد المعالجة (${f.current_status})` : `⏳ In Progress (${f.current_status})`)}
                                </span>
                              </div>
                              {!isEligible && (
                                <p className="text-[10px] text-amber-700">
                                  {isRtl
                                    ? 'ملاحظة تدقيق: يمكن قيد الحافز واعتماده دفترياً، لكن نظام الرقابة سيحظر إصدار سند الصرف النقدي حتى بلوغ المرحلة 10.'
                                    : 'Audit note: Claim can be recorded & approved, but voucher payout is blocked until Stage 10.'}
                                </p>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ *</label>
                  <input
                    type="number"
                    required
                    value={expenseFormData.amount}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">العملة</label>
                  <select
                    value={expenseFormData.currency}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, currency: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="EGP">جنيه مصري (EGP)</option>
                    <option value="USD">دولار أمريكي (USD)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">طريقة الصرف / الحساب *</label>
                  <select
                    value={expenseFormData.payment_method}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, payment_method: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="bank_transfer">{isRtl ? 'تحويل بنكي رسمي (Bank Transfer)' : 'Bank Transfer'}</option>
                    <option value="cash">{isRtl ? 'نقداً بالخزينة (Cash)' : 'Cash'}</option>
                    <option value="instapay">{isRtl ? 'إنستاباي (InstaPay)' : 'InstaPay'}</option>
                    <option value="vodafone_cash">{isRtl ? 'فودافون كاش (Vodafone Cash)' : 'Vodafone Cash'}</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الحساب / جهة الصرف</label>
                  <input
                    type="text"
                    value={expenseFormData.bank_name}
                    onChange={(e) => setExpenseFormData({ ...expenseFormData, bank_name: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs"
                    placeholder="البنك الأهلي / الخزينة الرئيسية"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">المورد / الجهة المستلمة</label>
                <input
                  type="text"
                  value={expenseFormData.vendor_name}
                  onChange={(e) => setExpenseFormData({ ...expenseFormData, vendor_name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  placeholder="شركة الاتصالات المصرية"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-rose-600 text-white font-bold hover:bg-rose-700 shadow"
                >
                  {language === 'ar' ? 'حفظ المصروف' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Allocate Budget (Fix 15) */}
      {isBudgetModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">
                {language === 'ar' ? 'تخصيص موازنة تقديرية لإدارة' : 'Allocate Department Budget'}
              </h3>
              <button onClick={() => setIsBudgetModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateBudget} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">الإدارة المستهدفة *</label>
                <select
                  value={budgetFormData.department_id}
                  onChange={(e) => setBudgetFormData({ ...budgetFormData, department_id: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                >
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name_ar}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">الفترة المالية *</label>
                  <select
                    value={budgetFormData.period}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, period: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  >
                    <option value="Q4-2026">الربع الرابع (Q4)</option>
                    <option value="Q1-2027">الربع الأول (Q1)</option>
                    <option value="annual">سنوية (Annual)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المبلغ المخصص *</label>
                  <input
                    type="number"
                    required
                    value={budgetFormData.allocated_amount}
                    onChange={(e) => setBudgetFormData({ ...budgetFormData, allocated_amount: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs font-bold"
                    placeholder="100000"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsBudgetModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark shadow"
                >
                  {language === 'ar' ? 'اعتماد الموازنة' : 'Authorize Budget'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Exchange Rate Management (Fix 12) */}
      {isRateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">
                {language === 'ar' ? 'تعديل سعر الصرف الرسمي' : 'Update Exchange Rate'}
              </h3>
              <button onClick={() => setIsRateModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleUpdateRate} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {language === 'ar' ? 'سعر صرف الدولار مقابل الجنيه المصري (USD/EGP) *' : 'USD to EGP Rate *'}
                </label>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-500">1 USD =</span>
                  <input
                    type="number"
                    step="0.1"
                    min="1"
                    required
                    value={newRateValue}
                    onChange={(e) => setNewRateValue(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg text-sm font-black text-bct-navy"
                  />
                  <span className="font-bold text-slate-500">EGP</span>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRateModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200"
                >
                  {t('actions.cancel')}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark shadow"
                >
                  {language === 'ar' ? 'حفظ السعر' : 'Save Rate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Payment Reversal (Requirement 4 & 5) */}
      {paymentToReverse && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-rose-600">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-sm font-black text-slate-800">
                  {language === 'ar' ? 'عكس سداد مالي واسترداد' : 'Reverse Payment Transaction'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setPaymentToReverse(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1">
                <span>{language === 'ar' ? 'تنبيه تدقيق مالي:' : 'Audit Warning:'}</span>
              </div>
              <p>
                {language === 'ar'
                  ? 'سيؤدي عكس السداد إلى خصم المبلغ من إجمالي التحصيلات وصافي التدفق المالي فوراً، وتغيير حالة الإيصال إلى معكوس، وإلغاء حالة سداد رسوم ملف الطالب إن لم تكن هناك إيصالات مؤكدة أخرى.'
                  : 'Reversing this payment will immediately deduct the amount from collections and net balances, and revert student file fee status if no other confirmed receipts exist.'}
              </p>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'رقم الإيصال:' : 'Receipt Code:'}</span>
                <span className="font-mono font-bold text-bct-navy">{paymentToReverse.receipt_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'الطالب:' : 'Student:'}</span>
                <span className="font-bold text-slate-800">{paymentToReverse.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'المبلغ المسترد:' : 'Amount:'}</span>
                <span className="font-black text-rose-600">
                  {paymentToReverse.amount.toLocaleString()} {paymentToReverse.currency}
                </span>
              </div>
            </div>

            <form onSubmit={handleExecuteReversePayment} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'ar' ? 'سبب العكس والاسترداد (إلزامي للتدقيق):' : 'Reversal Reason (Mandatory):'}
                </label>
                <textarea
                  required
                  rows={3}
                  value={reversalReason}
                  onChange={(e) => setReversalReason(e.target.value)}
                  placeholder={language === 'ar' ? 'اكتب مبرر عكس العملية، رقم الشكوى، أو موافقة الإدارة...' : 'Reason for reversal...'}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white focus:border-rose-500 text-xs"
                />
              </div>

              {reversalError && (
                <div className="text-rose-600 font-bold text-xs bg-rose-50 p-2 rounded-lg border border-rose-200">
                  {reversalError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setPaymentToReverse(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold cursor-pointer shadow flex items-center gap-1.5"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تأكيد عكس السداد' : 'Confirm Reversal'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Mark Expense as Paid (Requirement 8) */}
      {expenseToPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-sky-700">
                <Wallet className="w-5 h-5" />
                <h3 className="text-sm font-black text-slate-800">
                  {language === 'ar' ? 'تسجيل صرف وسداد المصروف التشغيلي' : 'Record Expense Payout'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setExpenseToPay(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-sky-50 rounded-xl border border-sky-200 text-sky-950 text-xs space-y-1">
              <div className="font-bold flex items-center gap-1">
                <span>{language === 'ar' ? 'تأكيد السداد الفعلي من الخزينة / الحساب:' : 'Confirm Cash/Bank Outflow:'}</span>
              </div>
              <p>
                {language === 'ar'
                  ? 'سيتم تسجيل هذا المصروف كمدفوع فعلياً وخصمه من الرصيد النقدي وتوثيق الحساب وطريقة الدفع المعتمدة.'
                  : 'This expense will be recorded as paid out, deducted from cash movement, and documented under the selected payment channel.'}
              </p>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-xl border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'رقم السند:' : 'Voucher:'}</span>
                <span className="font-mono font-bold text-bct-navy">{expenseToPay.voucher_code}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'بيان المصروف:' : 'Title:'}</span>
                <span className="font-bold text-slate-800">{isRtl ? expenseToPay.title_ar : expenseToPay.title_en}</span>
              </div>
              {expenseToPay.category === 'employee_incentives' && (
                <div className="flex justify-between">
                  <span className="text-slate-500">{language === 'ar' ? 'المعاملة المرتبطة:' : 'Linked Tx:'}</span>
                  <span className="font-mono font-bold text-amber-900">{expenseToPay.transaction_number || '-'}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{language === 'ar' ? 'المبلغ المستحق:' : 'Amount:'}</span>
                <span className="font-black text-rose-700">
                  {expenseToPay.amount.toLocaleString()} {expenseToPay.currency}
                </span>
              </div>
            </div>

            {expenseToPay.category === 'employee_incentives' && (() => {
              const check = bctStore.canPayExpense(expenseToPay.id);
              if (!check.allowed) {
                return (
                  <div className="p-3 bg-rose-50 rounded-xl border border-rose-200 text-rose-900 text-xs space-y-1">
                    <div className="font-bold flex items-center gap-1.5 text-rose-700">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{isRtl ? 'حظر صرف إداري ومحاسبي:' : 'Disbursement Blocked:'}</span>
                    </div>
                    <p className="font-extrabold text-rose-800">
                      {isRtl
                        ? 'لا يمكن إصدار سند صرف الحافز لأن المعاملة لم تصل إلى مرحلة مغلق + تقييم.'
                        : 'The incentive payment voucher cannot be issued because the transaction has not reached Closed & Evaluated.'}
                    </p>
                    <p className="text-[11px] text-rose-600">
                      {check.reason}
                    </p>
                  </div>
                );
              }
              return (
                <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-emerald-900 text-xs space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-emerald-700">
                    <CheckCircle className="w-4 h-4 shrink-0" />
                    <span>{isRtl ? 'المعاملة مستوفية الشروط:' : 'Transaction Eligible:'}</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 font-semibold">
                    {isRtl
                      ? `تم التحقق من اكتمال المعاملة ${expenseToPay.transaction_number || ''} وبلوغها المرحلة 10 (مغلق + تقييم). يمكن إصدار سند الصرف الرسمي.`
                      : `Verified transaction ${expenseToPay.transaction_number || ''} has reached Stage 10 (Closed & Evaluated). Ready for official voucher.`}
                  </p>
                </div>
              );
            })()}

            <form onSubmit={handleConfirmPayout} className="space-y-3">
              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'ar' ? 'طريقة السداد / قناة الصرف *' : 'Payment Method / Channel *'}
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as any)}
                  className="w-full p-2.5 border rounded-xl bg-white text-xs font-bold"
                >
                  <option value="bank_transfer">{language === 'ar' ? 'تحويل بنكي رسمي (Bank Transfer)' : 'Bank Transfer'}</option>
                  <option value="cash">{language === 'ar' ? 'نقداً بالخزينة (Cash)' : 'Cash'}</option>
                  <option value="instapay">{language === 'ar' ? 'إنستاباي (InstaPay)' : 'InstaPay'}</option>
                  <option value="vodafone_cash">{language === 'ar' ? 'فودافون كاش (Vodafone Cash)' : 'Vodafone Cash'}</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-bold mb-1">
                  {language === 'ar' ? 'رقم الإشعار / المرجع أو الحساب' : 'Reference / Notes'}
                </label>
                <input
                  type="text"
                  value={payoutNotes}
                  onChange={(e) => setPayoutNotes(e.target.value)}
                  placeholder={language === 'ar' ? 'رقم إشعار البنك، شيك، أو رقم إيصال الاستلام...' : 'Bank reference, check number, or receipt note...'}
                  className="w-full p-2.5 border rounded-xl bg-slate-50 focus:bg-white text-xs font-mono"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setExpenseToPay(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  {language === 'ar' ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={expenseToPay.category === 'employee_incentives' && !bctStore.canPayExpense(expenseToPay.id).allowed}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold cursor-pointer shadow flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'ar' ? 'تأكيد الصرف والسداد' : 'Confirm Payout'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Correct Payment Method (Requirement 8 & Store Audit) */}
      {(paymentToCorrect || expenseToCorrect) && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-bct-navy" />
                <span>
                  {paymentToCorrect
                    ? (isRtl ? 'تصحيح وسيلة الدفع للإيصال' : 'Correct Receipt Payment Method')
                    : (isRtl ? 'تصحيح وسيلة الصرف للمصروف' : 'Correct Expense Payment Method')}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setPaymentToCorrect(null);
                  setExpenseToCorrect(null);
                  setCorrectError('');
                }}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">{isRtl ? 'المرجع / الكود:' : 'Reference:'}</span>
                <span className="font-mono font-bold text-bct-navy">
                  {paymentToCorrect ? paymentToCorrect.receipt_code : expenseToCorrect?.voucher_code}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isRtl ? 'المبلغ:' : 'Amount:'}</span>
                <span className="font-bold text-slate-900">
                  {paymentToCorrect
                    ? `${paymentToCorrect.amount.toLocaleString()} ${paymentToCorrect.currency}`
                    : `${expenseToCorrect?.amount.toLocaleString()} ${expenseToCorrect?.currency}`}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'طريقة الدفع / الصرف المصححة *' : 'Corrected Payment Method *'}
                </label>
                <select
                  value={correctMethod}
                  onChange={(e) => setCorrectMethod(e.target.value as any)}
                  className="w-full px-3 py-2 border rounded-xl text-xs bg-white font-bold cursor-pointer"
                >
                  <option value="bank_transfer">{isRtl ? 'تحويل بنكي رسمي (Bank Transfer)' : 'Bank Transfer'}</option>
                  <option value="cash">{isRtl ? 'نقداً بالخزينة (Cash)' : 'Cash'}</option>
                  <option value="instapay">{isRtl ? 'إنستاباي (InstaPay)' : 'InstaPay'}</option>
                  <option value="vodafone_cash">{isRtl ? 'فودافون كاش (Vodafone Cash)' : 'Vodafone Cash'}</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'سبب التصحيح (إلزامي للتدقيق المالي) *' : 'Correction Reason *'}
                </label>
                <input
                  type="text"
                  required
                  value={correctReason}
                  onChange={(e) => setCorrectReason(e.target.value)}
                  placeholder={isRtl ? 'مثال: خطأ في إدخال طريقة الدفع عند تسجيل الإيصال' : 'e.g. Data entry error correction'}
                  className="w-full px-3 py-2 border rounded-xl text-xs"
                />
              </div>

              {correctError && (
                <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold">
                  {correctError}
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setPaymentToCorrect(null);
                  setExpenseToCorrect(null);
                  setCorrectError('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={handleExecuteCorrection}
                disabled={!correctReason.trim()}
                className="px-4 py-2 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark disabled:opacity-50 transition shadow-xs cursor-pointer"
              >
                {isRtl ? 'حفظ وتثبيت التصحيح' : 'Save Correction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Printable Official Receipt (Fix 13) */}
      {receiptToPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
          {/* Print Stylesheet for exact A4 receipt rendering */}
          <style>{`
            @media print {
              body * {
                visibility: hidden;
              }
              #official-receipt-document, #official-receipt-document * {
                visibility: visible;
              }
              #official-receipt-document {
                position: absolute;
                left: 0;
                top: 0;
                width: 100%;
                margin: 0;
                padding: 0;
              }
              @page {
                size: A4 portrait;
                margin: 15mm;
              }
            }
          `}</style>

          <div id="official-receipt-document" className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-8 space-y-6 text-xs animate-in fade-in zoom-in-95 duration-150 print:p-6 print:shadow-none print:max-w-none print:w-full print:rounded-none">
            {/* Header with Logo */}
            <div className="flex items-center justify-between border-b pb-4">
              <div className="flex items-center gap-4">
                <img
                  src="/assets/brand/BCT_Vertical_Mono_Navy.png"
                  alt="BCT Logo"
                  className="h-16 w-auto object-contain"
                />
                <div>
                  <h2 className="text-base font-black text-bct-navy">
                    {t('brand.name')}
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    {isRtl ? 'BCT Educational Consulting & Training' : 'بي سي تي للاستشارات التعليمية والتدريب'}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    القاهرة، جمهورية مصر العربية • هاتف: 0100000000
                  </p>
                </div>
              </div>
              <div className="text-end">
                <span className="inline-block px-3 py-1 bg-slate-100 font-mono font-black text-sm text-bct-navy rounded-lg border">
                  {receiptToPrint.receipt_code}
                </span>
                <p className="text-[10px] text-slate-400 mt-1 tabular-nums">
                  {receiptToPrint.created_at.split('T')[0]}
                </p>
              </div>
            </div>

            {/* Receipt Title */}
            <div className="text-center bg-slate-50 py-2.5 rounded-xl border border-slate-200">
              <h3 className="text-sm font-extrabold text-slate-800">
                إيصال استلام نقدية وتحصيل رسمي • OFFICIAL RECEIPT VOUCHER
              </h3>
            </div>

            {/* Receipt Body */}
            <div className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50/50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-slate-400 block text-[11px]">استلمنا من السيد / ولي الأمر:</span>
                  <span className="font-extrabold text-slate-800 text-sm">{receiptToPrint.payer_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">عن الطالب / المعاملة:</span>
                  <span className="font-extrabold text-bct-navy text-sm">{receiptToPrint.student_name}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <div>
                  <span className="text-slate-500 block text-[11px]">المبلغ المستلم رقماً:</span>
                  <span className="font-black text-emerald-800 text-lg">
                    {receiptToPrint.amount.toLocaleString()} {receiptToPrint.currency}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">طريقة السداد والمرجع:</span>
                  <span className="font-bold text-slate-800">{receiptToPrint.payment_method}</span>
                  <span className="text-[10px] font-mono text-slate-500 block">{receiptToPrint.payment_reference}</span>
                </div>
              </div>

              {/* Dynamic Payment Description Field (وذلك مقابل:) */}
              {!isEditingReceiptDesc ? (
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200/80 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-bold block text-[11px]">
                      {language === 'ar' ? 'وذلك مقابل:' : 'In Payment of / Description:'}
                    </span>
                    {hasPermission('finance:edit') && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditedReceiptDesc(receiptToPrint.payment_description || receiptToPrint.notes || '');
                          setIsEditingReceiptDesc(true);
                          setEditDescError('');
                        }}
                        className="print:hidden text-slate-400 hover:text-bct-navy transition text-[10px] flex items-center gap-1 font-bold px-2 py-0.5 rounded hover:bg-slate-200/60 cursor-pointer"
                        title={language === 'ar' ? 'تعديل وصف السداد' : 'Edit Description'}
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{language === 'ar' ? 'تعديل الوصف' : 'Edit Description'}</span>
                      </button>
                    )}
                  </div>
                  <p className="font-bold text-slate-800 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
                    {receiptToPrint.payment_description || receiptToPrint.notes || (language === 'ar' ? 'رسوم فتح الملف والتقديم الأكاديمي للجامعات المصرية (2026/2027)' : 'File opening & academic application fees')}
                  </p>
                </div>
              ) : (
                <div className="p-3.5 bg-amber-50/50 rounded-xl border border-amber-200 print:hidden space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-bct-navy font-bold text-xs flex items-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>{language === 'ar' ? 'تعديل وصف السداد (وذلك مقابل):' : 'Edit Payment Description:'}</span>
                    </label>
                    <span className="text-[10px] text-slate-400">
                      {language === 'ar' ? 'لن يتأثر المبلغ أو طريقة الدفع' : 'Amount & payment method remain unchanged'}
                    </span>
                  </div>
                  <textarea
                    rows={2}
                    value={editedReceiptDesc}
                    onChange={(e) => setEditedReceiptDesc(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs font-bold text-slate-800 bg-white focus:ring-1 focus:ring-bct-navy"
                    placeholder={language === 'ar' ? 'اكتب سبب أو وصف المبلغ المستلم...' : 'Enter reason or description of received amount...'}
                  />
                  {editDescError && (
                    <p className="text-[10px] text-rose-600 font-bold">{editDescError}</p>
                  )}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditingReceiptDesc(false);
                        setEditDescError('');
                      }}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold cursor-pointer"
                    >
                      {language === 'ar' ? 'إلغاء' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={handleSaveReceiptDescription}
                      className="px-3.5 py-1 rounded-lg bg-bct-navy hover:bg-bct-dark text-white text-xs font-bold shadow-xs cursor-pointer"
                    >
                      {language === 'ar' ? 'حفظ التعديل' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Signatures & Seal */}
            <div className="pt-6 border-t grid grid-cols-2 gap-8 text-center text-xs">
              <div>
                <span className="font-bold text-slate-600 block mb-6">أمين الخزينة / المحاسب المسؤول</span>
                <span className="font-bold text-slate-800">م. أحمد الصادق</span>
                <div className="border-t border-dashed w-32 mx-auto mt-1" />
              </div>
              <div>
                <span className="font-bold text-slate-600 block mb-6">اعتماد الإدارة المالية / الختم</span>
                <span className="font-bold text-emerald-700 text-[11px]">معتمد رسمياً (BCT Verified)</span>
                <div className="border-t border-dashed w-32 mx-auto mt-1" />
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="pt-4 flex justify-end gap-3 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setReceiptToPrint(null);
                  setIsEditingReceiptDesc(false);
                  setEditDescError('');
                }}
                className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
              >
                {language === 'ar' ? 'إغلاق' : 'Close'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold flex items-center gap-1.5 transition cursor-pointer"
                title={language === 'ar' ? 'تحميل كملف PDF' : 'Download PDF'}
              >
                <Download className="w-4 h-4" />
                <span>{language === 'ar' ? 'تحميل PDF' : 'Download PDF'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark flex items-center gap-1.5 shadow transition cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>{language === 'ar' ? 'طباعة الإيصال الرسمي' : 'Print Official Receipt'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Printable Official Expense Payment Voucher */}
      {voucherToPrint && (
        <PrintablePaymentVoucher
          expense={voucherToPrint}
          onClose={() => setVoucherToPrint(null)}
        />
      )}

    </div>
  );
};
