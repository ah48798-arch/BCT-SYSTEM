import React, { useState, useMemo } from 'react';
import { EmployeeIncentiveRecord, IncentivePolicy, StudentFile, Employee, ExpenseRecord, StandardPaymentMethod } from '../../types/database.types';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { bctStore } from '../../services/store';
import { 
  Award, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Wallet, 
  Printer, 
  Plus, 
  Search, 
  Filter, 
  User, 
  FileText, 
  ShieldCheck, 
  X, 
  AlertTriangle,
  RotateCcw,
  Building,
  Zap,
  Smartphone,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { PrintablePaymentVoucher } from './PrintablePaymentVoucher';

export interface EmployeeIncentiveSectionProps {
  onOpenPaymentVoucher?: (expense: ExpenseRecord) => void;
}

export const EmployeeIncentiveSection: React.FC<EmployeeIncentiveSectionProps> = ({ onOpenPaymentVoucher }) => {
  const { language, isRtl } = useLanguage();
  const { currentUser, hasPermission } = useAuth();

  const [incentives, setIncentives] = useState<EmployeeIncentiveRecord[]>(bctStore.getEmployeeIncentives());
  const [policies, setPolicies] = useState<IncentivePolicy[]>(bctStore.getIncentivePolicies());
  const [studentFiles, setStudentFiles] = useState<StudentFile[]>(bctStore.getStudentFiles());
  const [employees] = useState<Employee[]>(bctStore.getEmployees());

  // Sub-tabs: 'claims' (كشف الحوافز) | 'summary' (أرصدة الموظفين) | 'policies' (سياسات الحوافز)
  const [subTab, setSubTab] = useState<'summary' | 'claims' | 'policies'>('summary');

  // Filters
  const [filterEmployeeId, setFilterEmployeeId] = useState<string>('all');
  const [filterEligibility, setFilterEligibility] = useState<string>('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals
  const [isNewClaimModalOpen, setIsNewClaimModalOpen] = useState(false);
  const [isNewPolicyModalOpen, setIsNewPolicyModalOpen] = useState(false);
  const [incentiveToPay, setIncentiveToPay] = useState<EmployeeIncentiveRecord | null>(null);
  const [voucherToPrint, setVoucherToPrint] = useState<ExpenseRecord | null>(null);

  // Payout form state
  const [payoutMethod, setPayoutMethod] = useState<StandardPaymentMethod>('instapay');
  const [payoutAccount, setPayoutAccount] = useState<string>('acc-ipn-01');
  const [payoutError, setPayoutError] = useState<string>('');

  // New Claim Form state
  const [claimEmployeeId, setClaimEmployeeId] = useState<string>('');
  const [claimTransactionNumber, setClaimTransactionNumber] = useState<string>('');
  const [claimPolicyId, setClaimPolicyId] = useState<string>('pol-01');
  const [claimAmount, setClaimAmount] = useState<string>('1000');
  const [claimNotes, setClaimNotes] = useState<string>('');
  const [claimError, setClaimError] = useState<string>('');

  // Refresh helper
  const reloadData = () => {
    setIncentives(bctStore.getEmployeeIncentives());
    setPolicies(bctStore.getIncentivePolicies());
    setStudentFiles(bctStore.getStudentFiles());
  };

  // Inspect selected file in claim modal
  const selectedStudentFile = useMemo(() => {
    if (!claimTransactionNumber) return null;
    return studentFiles.find(f => f.file_code === claimTransactionNumber);
  }, [claimTransactionNumber, studentFiles]);

  // Overall Incentive Metrics
  const metrics = useMemo(() => {
    let totalCalculated = 0;
    let eligibleAmount = 0;
    let pendingCompletionAmount = 0;
    let approvedUnpaidAmount = 0;
    let paidAmount = 0;

    incentives.forEach(inc => {
      totalCalculated += inc.amount;
      if (inc.payment_status === 'paid') {
        paidAmount += inc.amount;
      } else {
        if (inc.eligibility_status === 'eligible') {
          eligibleAmount += inc.amount;
          if (inc.approval_status === 'approved') {
            approvedUnpaidAmount += inc.amount;
          }
        } else {
          pendingCompletionAmount += inc.amount;
        }
      }
    });

    const remainingPayable = approvedUnpaidAmount;

    return {
      totalCalculated,
      eligibleAmount,
      pendingCompletionAmount,
      approvedUnpaidAmount,
      paidAmount,
      remainingPayable
    };
  }, [incentives]);

  // Employee breakdown accounts
  const employeeAccounts = useMemo(() => {
    const map: Record<string, {
      employee: Employee;
      total: number;
      eligible: number;
      pendingCompletion: number;
      approvedUnpaid: number;
      paid: number;
      count: number;
    }> = {};

    employees.filter(e => e.employment_status === 'active').forEach(emp => {
      map[emp.id] = {
        employee: emp,
        total: 0,
        eligible: 0,
        pendingCompletion: 0,
        approvedUnpaid: 0,
        paid: 0,
        count: 0
      };
    });

    incentives.forEach(inc => {
      if (!map[inc.employee_id]) {
        const emp = employees.find(e => e.id === inc.employee_id);
        if (emp) {
          map[inc.employee_id] = {
            employee: emp,
            total: 0,
            eligible: 0,
            pendingCompletion: 0,
            approvedUnpaid: 0,
            paid: 0,
            count: 0
          };
        }
      }

      if (map[inc.employee_id]) {
        map[inc.employee_id].count += 1;
        map[inc.employee_id].total += inc.amount;
        if (inc.payment_status === 'paid') {
          map[inc.employee_id].paid += inc.amount;
        } else if (inc.eligibility_status === 'eligible') {
          map[inc.employee_id].eligible += inc.amount;
          if (inc.approval_status === 'approved') {
            map[inc.employee_id].approvedUnpaid += inc.amount;
          }
        } else {
          map[inc.employee_id].pendingCompletion += inc.amount;
        }
      }
    });

    return Object.values(map).filter(acc => acc.count > 0 || acc.employee.department_id === 'ops' || acc.employee.department_id === 'cs');
  }, [employees, incentives]);

  // Filtered Claims
  const filteredIncentives = useMemo(() => {
    return incentives.filter(inc => {
      if (filterEmployeeId !== 'all' && inc.employee_id !== filterEmployeeId) return false;
      if (filterEligibility !== 'all' && inc.eligibility_status !== filterEligibility) return false;
      if (filterPaymentStatus !== 'all' && inc.payment_status !== filterPaymentStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesCode = inc.incentive_code.toLowerCase().includes(q);
        const matchesTx = inc.transaction_number.toLowerCase().includes(q);
        const matchesStu = inc.student_name.toLowerCase().includes(q);
        const matchesEmp = (inc.employee_name || '').toLowerCase().includes(q);
        if (!matchesCode && !matchesTx && !matchesStu && !matchesEmp) return false;
      }
      return true;
    });
  }, [incentives, filterEmployeeId, filterEligibility, filterPaymentStatus, searchQuery]);

  // Execute payout
  const handleExecutePayout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!incentiveToPay || !currentUser) return;

    const res = bctStore.payEmployeeIncentive(
      incentiveToPay.id,
      payoutMethod,
      payoutAccount,
      currentUser.username
    );

    if (res.success && res.expense) {
      setIncentiveToPay(null);
      setPayoutError('');
      reloadData();
      if (onOpenPaymentVoucher) {
        onOpenPaymentVoucher(res.expense);
      } else {
        setVoucherToPrint(res.expense);
      }
    } else {
      setPayoutError(res.message || (isRtl ? 'تعذر صرف الحافز' : 'Payout blocked'));
    }
  };

  // Create claim
  const handleCreateClaim = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimEmployeeId || !claimTransactionNumber || !currentUser) {
      setClaimError(isRtl ? 'يرجى اختيار الموظف ورقم المعاملة' : 'Please select employee and transaction');
      return;
    }

    const file = studentFiles.find(f => f.file_code === claimTransactionNumber);
    if (!file) {
      setClaimError(isRtl ? 'المعاملة المحددة غير موجودة' : 'Transaction not found');
      return;
    }

    const emp = employees.find(e => e.id === claimEmployeeId);
    const pol = policies.find(p => p.id === claimPolicyId) || policies[0];

    const isEligible = file.current_status === 'closed';

    const res = bctStore.createEmployeeIncentive({
      employee_id: claimEmployeeId,
      employee_name: emp?.full_name_ar || 'موظف',
      employee_name_ar: emp?.full_name_ar,
      department_id: emp?.department_id || 'ops',
      student_file_id: file.id,
      transaction_number: file.file_code,
      student_name: file.student?.full_name_ar || 'طالب',
      service_type: file.service_type,
      policy_id: pol.id,
      policy_version: pol.version,
      policy_name: pol.title_ar,
      incentive_type: pol.incentive_type,
      amount: parseFloat(claimAmount) || pol.amount_or_percentage,
      currency: pol.currency,
      calculation_note: claimNotes || pol.title_ar,
      eligibility_status: isEligible ? 'eligible' : 'pending_completion',
      eligibility_note: isEligible ? undefined : (isRtl ? `المعاملة في مرحلة (${file.current_status}) ولم تصل بعد إلى مغلق + تقييم` : `Stage: ${file.current_status}`),
      approval_status: isEligible ? 'approved' : 'pending_approval'
    }, currentUser.username);

    if (res.success) {
      setIsNewClaimModalOpen(false);
      setClaimError('');
      setClaimTransactionNumber('');
      setClaimNotes('');
      reloadData();
    } else {
      setClaimError(res.message || 'فشل تسجيل المطالبة');
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-extrabold text-bct-navy">
              {isRtl ? 'حساب حوافز الموظفين' : 'Employee Incentive Account'}
            </h2>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
              {isRtl ? 'ربط الحوافز بإنجاز المعاملات' : 'Transaction-Linked Incentives'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isRtl
              ? 'متابعة استحقاقات حوافز الموظفين المشروطة ببلوغ المعاملة مرحلة (10. مغلق + تقييم) والرقابة على الصرف المالي.'
              : 'Track employee incentive payables tied to Stage 10 Closed & Evaluated student transactions.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {hasPermission('finance:create') && (
            <button
              onClick={() => {
                setClaimEmployeeId(employees[0]?.id || '');
                setClaimTransactionNumber(studentFiles[0]?.file_code || '');
                setIsNewClaimModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition cursor-pointer shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>{isRtl ? 'تسجيل مطالبة حافز' : 'New Incentive Claim'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Executive KPI Ribbon */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        
        {/* KPI 1: Total Calculated */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-slate-500 text-xs">
            <span className="font-bold">{isRtl ? 'إجمالي الحوافز المسجلة' : 'Total Calculated'}</span>
            <Award className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-black text-slate-900">
            {metrics.totalCalculated.toLocaleString()} <span className="text-xs font-semibold text-slate-500">ج.م</span>
          </div>
          <div className="text-[10px] text-slate-400">
            {isRtl ? 'كافة مطالبات الحوافز المقيدة' : 'All recorded incentive claims'}
          </div>
        </div>

        {/* KPI 2: Eligible (Closed & Evaluated) */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200 bg-emerald-50/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-emerald-800 text-xs">
            <span className="font-bold">{isRtl ? 'حوافز مؤهلة للصرف' : 'Eligible Incentives'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-black text-emerald-700">
            {metrics.eligibleAmount.toLocaleString()} <span className="text-xs font-semibold text-emerald-800">ج.م</span>
          </div>
          <div className="text-[10px] text-emerald-700 font-semibold">
            {isRtl ? 'معاملات بلغت مرحلة 10 مغلق + تقييم' : 'Linked to Closed & Evaluated files'}
          </div>
        </div>

        {/* KPI 3: Pending Completion */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200 bg-amber-50/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-amber-800 text-xs">
            <span className="font-bold">{isRtl ? 'حوافز قيد الإنجاز' : 'Pending Completion'}</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-xl font-black text-amber-700">
            {metrics.pendingCompletionAmount.toLocaleString()} <span className="text-xs font-semibold text-amber-800">ج.م</span>
          </div>
          <div className="text-[10px] text-amber-700 font-semibold">
            {isRtl ? 'محجوبة: المعاملة لم تغلق بعد' : 'Blocked: files not closed yet'}
          </div>
        </div>

        {/* KPI 4: Paid Out */}
        <div className="bg-white p-4 rounded-2xl border border-sky-200 bg-sky-50/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-sky-800 text-xs">
            <span className="font-bold">{isRtl ? 'حوافز منصرفة ومسددة' : 'Paid Out'}</span>
            <Wallet className="w-4 h-4 text-sky-600" />
          </div>
          <div className="text-xl font-black text-sky-700">
            {metrics.paidAmount.toLocaleString()} <span className="text-xs font-semibold text-sky-800">ج.م</span>
          </div>
          <div className="text-[10px] text-sky-700 font-semibold">
            {isRtl ? 'تم سدادها وقيدها بحسابات الخزينة' : 'Disbursed via payment voucher'}
          </div>
        </div>

        {/* KPI 5: Remaining Payable */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200 bg-indigo-50/20 shadow-xs space-y-1">
          <div className="flex items-center justify-between text-indigo-800 text-xs">
            <span className="font-bold">{isRtl ? 'المتبقي المستحق للصرف' : 'Remaining Payable'}</span>
            <TrendingUp className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-xl font-black text-indigo-700">
            {metrics.remainingPayable.toLocaleString()} <span className="text-xs font-semibold text-indigo-800">ج.م</span>
          </div>
          <div className="text-[10px] text-indigo-700 font-semibold">
            {isRtl ? 'معتمدة وجاهزة لإصدار سند الصرف' : 'Ready for payment voucher'}
          </div>
        </div>

      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setSubTab('summary')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'summary'
              ? 'bg-bct-navy text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <User className="w-3.5 h-3.5" />
          <span>{isRtl ? 'أرصدة الموظفين المستقلة' : 'Employee Accounts'}</span>
        </button>

        <button
          onClick={() => setSubTab('claims')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'claims'
              ? 'bg-bct-navy text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>{isRtl ? 'سجل مطالبات الحوافز والمعاملات' : 'Claims & Transactions Ledger'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {incentives.length}
          </span>
        </button>

        <button
          onClick={() => setSubTab('policies')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
            subTab === 'policies'
              ? 'bg-bct-navy text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>{isRtl ? 'سياسات الحوافز المعتمدة' : 'Incentive Policies'}</span>
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-200 text-slate-800">
            {policies.length}
          </span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* SUB-TAB 1: INDEPENDENT EMPLOYEE ACCOUNTS (Modification 3)       */}
      {/* ============================================================== */}
      {subTab === 'summary' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">
                {isRtl ? 'كشف أرصدة حوافز الموظفين المستقلة' : 'Employee Incentive Accounts Summary'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isRtl ? 'متابعة استحقاق كل موظف على حدة وفصل الرصيد المستحق عن المصروف الفعلي' : 'Per-employee tracking distinguishing eligible, pending, and paid balances.'}
              </p>
            </div>
          </div>

          {/* A. RESPONSIVE CARDS VIEW FOR SMALL & MEDIUM SCREENS (< lg) - ZERO HORIZONTAL SCROLLING */}
          <div className="lg:hidden space-y-3 p-3">
            {employeeAccounts.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {isRtl ? 'لا توجد بيانات موظفين مسجلة' : 'No employee accounts found'}
              </div>
            ) : (
              employeeAccounts.map(acc => (
                <div key={acc.employee.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2.5">
                  {/* Card Header: Employee Name & Code + Department */}
                  <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                    <div>
                      <div className="font-bold text-slate-900 text-xs">{acc.employee.full_name_ar}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{acc.employee.employee_code}</div>
                    </div>
                    <span className="font-mono text-slate-700 font-bold text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                      {acc.employee.department_id.toUpperCase()}
                    </span>
                  </div>

                  {/* Financial Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/70 p-2 rounded-lg">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{isRtl ? 'المؤهل للصرف:' : 'Eligible:'}</span>
                      <span className="font-bold text-emerald-700 tabular-nums">{acc.eligible.toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{isRtl ? 'قيد الإنجاز:' : 'Pending:'}</span>
                      <span className="font-medium text-amber-700 tabular-nums">{acc.pendingCompletion.toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{isRtl ? 'معتمد غير مسدد:' : 'Approved Unpaid:'}</span>
                      <span className="font-bold text-indigo-700 tabular-nums">{acc.approvedUnpaid.toLocaleString()} ج.م</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{isRtl ? 'المنصرف فعلياً:' : 'Paid:'}</span>
                      <span className="font-bold text-sky-700 tabular-nums">{acc.paid.toLocaleString()} ج.م</span>
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold block">{isRtl ? 'المتبقي المستحق:' : 'Remaining:'}</span>
                      <span className="font-black text-rose-700 tabular-nums">{acc.approvedUnpaid.toLocaleString()} ج.م</span>
                    </div>
                    <button
                      onClick={() => {
                        setFilterEmployeeId(acc.employee.id);
                        setSubTab('claims');
                      }}
                      className="px-3 py-1 rounded-lg bg-bct-navy text-white font-bold text-[11px] hover:bg-bct-dark transition cursor-pointer"
                    >
                      {isRtl ? 'عرض المعاملات' : 'View Files'}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* B. FULL VISIBILITY TABLE FOR DESKTOPS & LAPTOPS (lg+) - NO HORIZONTAL SCROLLBAR */}
          <div className="hidden lg:block w-full overflow-hidden">
            <table className="w-full text-xs text-start border-collapse table-auto xl:table-fixed">
              <thead className="bg-slate-50/80 text-slate-700 font-bold border-b border-slate-200 text-[11px] xl:text-xs">
                <tr>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[18%]">{isRtl ? 'الموظف المعني' : 'Employee'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[8%]">{isRtl ? 'الإدارة' : 'Department'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[11%]">{isRtl ? 'إجمالي المحسوب' : 'Total'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[11%]">{isRtl ? 'المؤهل للصرف' : 'Eligible'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[11%]">{isRtl ? 'قيد الإنجاز' : 'Pending'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[11%]">{isRtl ? 'معتمد غير مسدد' : 'Approved'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[10%]">{isRtl ? 'المنصرف فعلياً' : 'Paid'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-end whitespace-nowrap w-[10%]">{isRtl ? 'المتبقي' : 'Remaining'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-end whitespace-nowrap w-[10%]">{isRtl ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {employeeAccounts.map(acc => (
                  <tr key={acc.employee.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-2 px-2 xl:px-2.5 font-bold text-slate-900">
                      <div className="leading-tight">{acc.employee.full_name_ar}</div>
                      <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{acc.employee.employee_code}</div>
                    </td>
                    <td className="py-2 px-2 xl:px-2.5 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {acc.employee.department_id.toUpperCase()}
                    </td>
                    <td className="py-2 px-2 xl:px-2.5 font-bold text-slate-800 whitespace-nowrap tabular-nums">
                      {acc.total.toLocaleString()} ج.م
                    </td>
                    <td className="py-2 px-2 xl:px-2.5 font-bold text-emerald-700 whitespace-nowrap tabular-nums">
                      {acc.eligible.toLocaleString()} ج.م
                    </td>
                    <td className="py-2 px-2 xl:px-2.5 font-medium text-amber-700 whitespace-nowrap tabular-nums">
                      {acc.pendingCompletion.toLocaleString()} ج.م
                    </td>
                    <td className="py-2 px-2 xl:px-2.5 font-bold text-indigo-700 whitespace-nowrap tabular-nums">
                      {acc.approvedUnpaid.toLocaleString()} ج.م
                    </td>
                    <td className="py-2 px-2 xl:px-2.5 font-bold text-sky-700 whitespace-nowrap tabular-nums">
                      {acc.paid.toLocaleString()} ج.م
                    </td>
                    <td className="py-2 px-2 xl:px-2.5 text-end font-black text-rose-700 text-xs whitespace-nowrap tabular-nums">
                      {acc.approvedUnpaid.toLocaleString()} ج.م
                    </td>
                    <td className="py-2 px-2 xl:px-2.5 text-end whitespace-nowrap">
                      <button
                        onClick={() => {
                          setFilterEmployeeId(acc.employee.id);
                          setSubTab('claims');
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[10px] transition cursor-pointer whitespace-nowrap"
                      >
                        {isRtl ? 'عرض المعاملات' : 'View'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-TAB 2: CLAIMS & TRANSACTIONS LEDGER (Modifications 2 & 4)   */}
      {/* ============================================================== */}
      {subTab === 'claims' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden space-y-4">
          
          {/* Filters Bar */}
          <div className="p-4 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50">
            <div className="flex flex-wrap items-center gap-3">
              {/* Employee Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600">{isRtl ? 'الموظف:' : 'Employee:'}</span>
                <select
                  value={filterEmployeeId}
                  onChange={(e) => setFilterEmployeeId(e.target.value)}
                  className="px-2.5 py-1.5 border rounded-xl text-xs bg-white font-bold"
                >
                  <option value="all">{isRtl ? 'كل الموظفين' : 'All Employees'}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.full_name_ar}</option>
                  ))}
                </select>
              </div>

              {/* Eligibility Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600">{isRtl ? 'أهلية المعاملة:' : 'Eligibility:'}</span>
                <select
                  value={filterEligibility}
                  onChange={(e) => setFilterEligibility(e.target.value)}
                  className="px-2.5 py-1.5 border rounded-xl text-xs bg-white font-bold"
                >
                  <option value="all">{isRtl ? 'كل الحالات' : 'All'}</option>
                  <option value="eligible">{isRtl ? 'مؤهل (مغلق + تقييم)' : 'Eligible (Closed & NPS)'}</option>
                  <option value="pending_completion">{isRtl ? 'قيد الإنجاز (بانتظار المرحلة 10)' : 'Pending Stage 10'}</option>
                </select>
              </div>

              {/* Payment Status Filter */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-slate-600">{isRtl ? 'حالة الصرف:' : 'Payment:'}</span>
                <select
                  value={filterPaymentStatus}
                  onChange={(e) => setFilterPaymentStatus(e.target.value)}
                  className="px-2.5 py-1.5 border rounded-xl text-xs bg-white font-bold"
                >
                  <option value="all">{isRtl ? 'كل الحالات' : 'All'}</option>
                  <option value="unpaid">{isRtl ? 'غير منصرف (قيد الاستحقاق)' : 'Unpaid'}</option>
                  <option value="paid">{isRtl ? 'منصرف ومسدد' : 'Paid Out'}</option>
                </select>
              </div>
            </div>

            {/* Search */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 absolute top-2.5 start-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder={isRtl ? 'بحث بكود الحافز أو المعاملة...' : 'Search code or transaction...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="ps-8 pe-3 py-1.5 border rounded-xl text-xs bg-white w-48 sm:w-64"
                />
              </div>

              {(filterEmployeeId !== 'all' || filterEligibility !== 'all' || filterPaymentStatus !== 'all' || searchQuery) && (
                <button
                  onClick={() => {
                    setFilterEmployeeId('all');
                    setFilterEligibility('all');
                    setFilterPaymentStatus('all');
                    setSearchQuery('');
                  }}
                  className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-200 cursor-pointer"
                  title={isRtl ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* A. RESPONSIVE CARDS VIEW FOR SMALL & MEDIUM SCREENS (< lg) - ZERO HORIZONTAL SCROLLING */}
          <div className="lg:hidden space-y-3 p-3">
            {filteredIncentives.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs">
                {isRtl ? 'لا توجد مطالبات حوافز مطابقة للفلاتر المحددة' : 'No matching incentive claims found'}
              </div>
            ) : (
              filteredIncentives.map(inc => {
                const isClosed = inc.eligibility_status === 'eligible';
                const isPaid = inc.payment_status === 'paid';

                return (
                  <div key={inc.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2.5">
                    {/* Header: Code + Amount + Status */}
                    <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="font-mono font-bold text-bct-navy text-xs">
                        {inc.incentive_code}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-black text-rose-700 text-xs">
                          {inc.amount.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{inc.currency}</span>
                        </span>
                        {isPaid ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
                            {isRtl ? 'مصروف ومسدد' : 'Paid Out'}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                            {isRtl ? 'بانتظار الصرف' : 'Pending'}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Employee & Transaction */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50/70 p-2 rounded-lg">
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">{isRtl ? 'الموظف:' : 'Employee:'}</span>
                        <div className="font-bold text-slate-900">{inc.employee_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inc.department_id.toUpperCase()}</div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 font-semibold block">{isRtl ? 'المعاملة والطالب:' : 'Transaction:'}</span>
                        <div className="font-mono font-bold text-bct-navy text-[10px]">{inc.transaction_number}</div>
                        <div className="text-slate-700 font-medium truncate max-w-[120px]">{inc.student_name}</div>
                      </div>
                    </div>

                    {/* Stage & Policy */}
                    <div className="flex items-center justify-between text-xs">
                      <div>
                        {isClosed ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                            <span>{isRtl ? '10. مغلق (مؤهل للصرف)' : 'Eligible'}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            <Clock className="w-2.5 h-2.5 shrink-0" />
                            <span>{isRtl ? 'قيد الإنجاز' : 'In Progress'}</span>
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-500 font-medium">{inc.policy_name}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                      {!isPaid ? (
                        <button
                          onClick={() => {
                            if (!isClosed) {
                              alert(isRtl
                                ? 'لا يمكن إصدار سند صرف الحافز لأن المعاملة لم تصل إلى مرحلة مغلق + تقييم.'
                                : 'The incentive payment voucher cannot be issued because the transaction has not reached Closed & Evaluated.'
                              );
                              return;
                            }
                            setIncentiveToPay(inc);
                            setPayoutError('');
                          }}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-xs ${
                            isClosed
                              ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                              : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                          }`}
                        >
                          <Wallet className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'صرف وسداد الحافز' : 'Disburse'}</span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            const exp = bctStore.getExpenses().find(e => e.id === inc.expense_id || e.voucher_code === inc.voucher_code);
                            if (exp) {
                              if (onOpenPaymentVoucher) {
                                onOpenPaymentVoucher(exp);
                              } else {
                                setVoucherToPrint(exp);
                              }
                            } else {
                              alert(isRtl ? 'سند الصرف المرتبط غير متوفر' : 'Voucher record not found');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>{isRtl ? 'طباعة السند' : 'Print Voucher'}</span>
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
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[12%]">{isRtl ? 'رقم المطالبة' : 'Code'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[14%]">{isRtl ? 'الموظف المستفيد' : 'Beneficiary'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[16%]">{isRtl ? 'رقم المعاملة والطالب' : 'Transaction & Student'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[15%]">{isRtl ? 'مرحلة المعاملة والأهلية' : 'Stage & Eligibility'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[14%]">{isRtl ? 'نوع الحافز والسياسة' : 'Incentive Type'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[10%]">{isRtl ? 'المبلغ والعملة' : 'Amount'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[9%]">{isRtl ? 'حالة الصرف' : 'Status'}</th>
                  <th className="py-2.5 px-2 xl:px-2.5 text-end whitespace-nowrap w-[10%]">{isRtl ? 'الإجراء' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredIncentives.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-8 text-center text-slate-400">
                      {isRtl ? 'لا توجد مطالبات حوافز مطابقة للفلاتر المحددة' : 'No matching incentive claims found'}
                    </td>
                  </tr>
                ) : (
                  filteredIncentives.map(inc => {
                    const isClosed = inc.eligibility_status === 'eligible';
                    const isPaid = inc.payment_status === 'paid';

                    return (
                      <tr key={inc.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2 px-2 xl:px-2.5 font-mono font-bold text-bct-navy whitespace-nowrap">
                          {inc.incentive_code}
                        </td>
                        <td className="py-2 px-2 xl:px-2.5 font-bold text-slate-900">
                          <div className="leading-tight">{inc.employee_name}</div>
                          <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{inc.department_id.toUpperCase()}</div>
                        </td>
                        <td className="py-2 px-2 xl:px-2.5">
                          <div className="font-mono font-bold text-bct-navy bg-slate-100 px-1.5 py-0.2 rounded text-[10px] inline-block whitespace-nowrap">
                            {inc.transaction_number}
                          </div>
                          <div className="text-slate-700 font-semibold mt-0.5 text-[11px] truncate max-w-[140px]">{inc.student_name}</div>
                        </td>
                        <td className="py-2 px-2 xl:px-2.5 whitespace-nowrap">
                          {isClosed ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 whitespace-nowrap">
                              <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
                              <span>{isRtl ? '10. مغلق (مؤهل)' : 'Eligible'}</span>
                            </span>
                          ) : (
                            <div>
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200 whitespace-nowrap">
                                <Clock className="w-2.5 h-2.5 shrink-0" />
                                <span>{isRtl ? 'قيد الإنجاز' : 'In Progress'}</span>
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 xl:px-2.5 text-slate-700">
                          <div className="font-medium text-[11px] truncate max-w-[130px]">{inc.policy_name}</div>
                          <div className="text-[10px] text-slate-400 truncate max-w-[130px]">{inc.calculation_note}</div>
                        </td>
                        <td className="py-2 px-2 xl:px-2.5 font-black text-rose-700 text-xs whitespace-nowrap tabular-nums">
                          {inc.amount.toLocaleString()} <span className="text-[10px] font-normal text-slate-500">{inc.currency}</span>
                        </td>
                        <td className="py-2 px-2 xl:px-2.5 whitespace-nowrap">
                          {isPaid ? (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 whitespace-nowrap">
                              {isRtl ? 'مصروف' : 'Paid'}
                            </span>
                          ) : (
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200 whitespace-nowrap">
                              {isRtl ? 'معلق' : 'Pending'}
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-2 xl:px-2.5 text-end whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1">
                            {!isPaid ? (
                              <button
                                onClick={() => {
                                  if (!isClosed) {
                                    alert(isRtl
                                      ? 'لا يمكن إصدار سند صرف الحافز لأن المعاملة لم تصل إلى مرحلة مغلق + تقييم.'
                                      : 'The incentive payment voucher cannot be issued because the transaction has not reached Closed & Evaluated.'
                                    );
                                    return;
                                  }
                                  setIncentiveToPay(inc);
                                  setPayoutError('');
                                }}
                                className={`px-2 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 cursor-pointer shadow-xs whitespace-nowrap ${
                                  isClosed
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-slate-200 text-slate-400 hover:bg-slate-300'
                                }`}
                                title={!isClosed ? (isRtl ? 'محجوب: المعاملة لم تصل إلى مغلق + تقييم' : 'Blocked: file not closed') : undefined}
                              >
                                <Wallet className="w-3 h-3" />
                                <span>{isRtl ? 'صرف' : 'Disburse'}</span>
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const exp = bctStore.getExpenses().find(e => e.id === inc.expense_id || e.voucher_code === inc.voucher_code);
                                  if (exp) {
                                    if (onOpenPaymentVoucher) {
                                      onOpenPaymentVoucher(exp);
                                    } else {
                                      setVoucherToPrint(exp);
                                    }
                                  } else {
                                    alert(isRtl ? 'سند الصرف المرتبط غير متوفر' : 'Voucher record not found');
                                  }
                                }}
                                className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer whitespace-nowrap"
                              >
                                <Printer className="w-3 h-3" />
                                <span>{isRtl ? 'السند' : 'Print'}</span>
                              </button>
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

      {/* ============================================================== */}
      {/* SUB-TAB 3: INCENTIVE POLICIES (Modification 3)                 */}
      {/* ============================================================== */}
      {subTab === 'policies' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {policies.map(pol => (
            <div key={pol.id} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono text-slate-400 font-bold block">{pol.code} ({pol.version})</span>
                  <h4 className="font-extrabold text-sm text-bct-navy mt-0.5">{pol.title_ar}</h4>
                  <p className="text-[11px] text-slate-500 italic">{pol.title_en}</p>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {isRtl ? 'نشطة ومعتمدة' : 'Active'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">{isRtl ? 'قيمة الحافز المعتمدة:' : 'Incentive Amount:'}</span>
                  <span className="font-black text-rose-700 text-sm">
                    {pol.amount_or_percentage.toLocaleString()} {pol.currency}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">{isRtl ? 'الشرط الإلزامي للصرف:' : 'Mandatory Condition:'}</span>
                  <span className="font-bold text-emerald-700">
                    {isRtl ? '10. مغلق + تقييم' : 'Stage 10 (Closed)'}
                  </span>
                </div>
                {pol.required_min_score && (
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isRtl ? 'الحد الأدنى لدرجة التقييم:' : 'Min NPS Score:'}</span>
                    <span className="font-bold text-slate-800">{pol.required_min_score}%</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-slate-600">
                {pol.description_ar}
              </p>

              <div className="pt-2 border-t text-[10px] text-slate-400 flex justify-between">
                <span>{isRtl ? 'تاريخ السريان:' : 'Effective From:'} {pol.effective_from}</span>
                <span>{pol.eligible_roles.join(' • ')}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 1: PAY EMPLOYEE INCENTIVE (Modification 4)               */}
      {/* ============================================================== */}
      {incentiveToPay && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-emerald-700">
                <Wallet className="w-5 h-5" />
                <h3 className="text-sm font-black text-slate-900">
                  {isRtl ? 'صرف وسداد حافز الموظف وإصدار السند' : 'Disburse Employee Incentive'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIncentiveToPay(null)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl space-y-2 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">{isRtl ? 'الموظف المستفيد:' : 'Employee:'}</span>
                <span className="font-bold text-slate-900">{incentiveToPay.employee_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isRtl ? 'رقم المعاملة المؤهلة:' : 'Transaction:'}</span>
                <span className="font-mono font-bold text-bct-navy">{incentiveToPay.transaction_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isRtl ? 'اسم الطالب:' : 'Student:'}</span>
                <span className="font-semibold text-slate-800">{incentiveToPay.student_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">{isRtl ? 'المبلغ المستحق:' : 'Payable Amount:'}</span>
                <span className="font-black text-rose-700 text-base">
                  {incentiveToPay.amount.toLocaleString()} {incentiveToPay.currency}
                </span>
              </div>
            </div>

            <form onSubmit={handleExecutePayout} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'قناة الصرف / طريقة السداد *' : 'Payment Method *'}
                </label>
                <select
                  value={payoutMethod}
                  onChange={(e) => setPayoutMethod(e.target.value as any)}
                  className="w-full p-2.5 border rounded-xl bg-white text-xs font-bold"
                >
                  <option value="instapay">{isRtl ? 'إنستاباي (InstaPay - شبكة المدفوعات اللحظية)' : 'InstaPay'}</option>
                  <option value="bank_transfer">{isRtl ? 'تحويل بنكي رسمي (Bank Transfer)' : 'Bank Transfer'}</option>
                  <option value="cash">{isRtl ? 'نقداً بالخزينة (Cash)' : 'Cash'}</option>
                  <option value="vodafone_cash">{isRtl ? 'فودافون كاش (Vodafone Cash)' : 'Vodafone Cash'}</option>
                </select>
              </div>

              {payoutError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{payoutError}</span>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIncentiveToPay(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تأكيد الصرف وإصدار السند' : 'Confirm Payout'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL 2: NEW INCENTIVE CLAIM (Modification 2 & 4)              */}
      {/* ============================================================== */}
      {isNewClaimModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <div className="flex items-center gap-2 text-bct-navy">
                <Award className="w-5 h-5" />
                <h3 className="text-sm font-black text-slate-900">
                  {isRtl ? 'تسجيل استحقاق حافز موظف جديد' : 'New Employee Incentive Claim'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNewClaimModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg cursor-pointer"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateClaim} className="space-y-3.5">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'الموظف المستحق *' : 'Eligible Employee *'}
                </label>
                <select
                  value={claimEmployeeId}
                  onChange={(e) => setClaimEmployeeId(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white text-xs font-bold"
                  required
                >
                  {employees.filter(e => e.employment_status === 'active').map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {emp.full_name_ar} — {emp.job_title_ar || emp.department_id.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'رقم المعاملة (ملف الطالب) *' : 'Transaction Number (Student File) *'}
                </label>
                <select
                  value={claimTransactionNumber}
                  onChange={(e) => setClaimTransactionNumber(e.target.value)}
                  className="w-full p-2.5 border rounded-xl bg-white text-xs font-mono font-bold"
                  required
                >
                  <option value="">{isRtl ? '-- اختر رقم المعاملة --' : '-- Select Transaction --'}</option>
                  {studentFiles.map(file => (
                    <option key={file.id} value={file.file_code}>
                      {file.file_code} — {file.student?.full_name_ar || 'طالب'} ({file.current_status})
                    </option>
                  ))}
                </select>
              </div>

              {/* Transaction Inspection Panel (Modification 4) */}
              {selectedStudentFile && (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-1.5 text-xs animate-in fade-in">
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isRtl ? 'اسم الطالب:' : 'Student:'}</span>
                    <span className="font-bold text-slate-900">{selectedStudentFile.student?.full_name_ar || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">{isRtl ? 'المسؤول الأصيل:' : 'File Owner:'}</span>
                    <span className="font-semibold text-slate-800">{selectedStudentFile.current_owner?.full_name_ar || '—'}</span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="text-slate-500">{isRtl ? 'مرحلة المعاملة الحالية:' : 'Current Stage:'}</span>
                    {selectedStudentFile.current_status === 'closed' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {isRtl ? '10. مغلق وتقييم (مؤهل للصرف)' : '10. Closed & NPS (Eligible)'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                        {isRtl ? `المرحلة: ${selectedStudentFile.current_status} (غير مكتمل)` : `Stage: ${selectedStudentFile.current_status}`}
                      </span>
                    )}
                  </div>
                  {selectedStudentFile.current_status !== 'closed' && (
                    <p className="text-[10px] text-amber-700 font-semibold pt-1">
                      {isRtl
                        ? 'تنبيه: يمكنك تسجيل المطالبة الآن، ولكن لن يتم إصدار سند الصرف حتى تصل المعاملة إلى مرحلة مغلق + تقييم.'
                        : 'Notice: Claim can be drafted, but payment voucher is strictly blocked until Stage 10.'}
                    </p>
                  )}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'سياسة الحافز المعتمدة *' : 'Policy *'}
                  </label>
                  <select
                    value={claimPolicyId}
                    onChange={(e) => {
                      setClaimPolicyId(e.target.value);
                      const pol = policies.find(p => p.id === e.target.value);
                      if (pol) setClaimAmount(String(pol.amount_or_percentage));
                    }}
                    className="w-full p-2.5 border rounded-xl bg-white text-xs"
                  >
                    {policies.map(p => (
                      <option key={p.id} value={p.id}>{p.title_ar}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    {isRtl ? 'المبلغ المستحق (ج.م) *' : 'Amount (EGP) *'}
                  </label>
                  <input
                    type="number"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    required
                    className="w-full p-2.5 border rounded-xl text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  {isRtl ? 'ملاحظات وتفاصيل الاستحقاق' : 'Notes'}
                </label>
                <input
                  type="text"
                  value={claimNotes}
                  onChange={(e) => setClaimNotes(e.target.value)}
                  placeholder={isRtl ? 'مثال: إنجاز متطلبات القبول والتسجيل بنجاح' : 'Notes...'}
                  className="w-full p-2.5 border rounded-xl text-xs"
                />
              </div>

              {claimError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-bold">
                  {claimError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsNewClaimModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 font-bold text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-bct-navy hover:bg-bct-dark text-white font-bold cursor-pointer shadow-xs"
                >
                  {isRtl ? 'حفظ وتثبيت الاستحقاق' : 'Save Claim'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Payment Voucher Modal */}
      {voucherToPrint && (
        <PrintablePaymentVoucher
          expense={voucherToPrint}
          onClose={() => setVoucherToPrint(null)}
        />
      )}

    </div>
  );
};
