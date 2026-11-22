import React from 'react';
import { ExpenseRecord } from '../../types/database.types';
import { useLanguage } from '../../context/LanguageContext';
import { numberToArabicWords, numberToEnglishWords } from '../../utils/numberToWords';
import { Printer, Download, X, ShieldCheck, AlertTriangle, CheckCircle2, Building, Wallet, Zap, Smartphone, CreditCard } from 'lucide-react';
import { getPaymentMethodDetails } from '../../services/financialAggregator';

interface PrintablePaymentVoucherProps {
  expense: ExpenseRecord | null;
  onClose: () => void;
}

export const PrintablePaymentVoucher: React.FC<PrintablePaymentVoucherProps> = ({ expense, onClose }) => {
  const { language, isRtl, t } = useLanguage();

  if (!expense) return null;

  const isPaid = expense.status === 'paid';
  const isApproved = expense.status === 'approved' || isPaid;

  const mInfo = getPaymentMethodDetails(expense.payment_method, language as any);
  const ChannelIcon =
    mInfo.id === 'bank_transfer' ? Building :
    mInfo.id === 'cash' ? Wallet :
    mInfo.id === 'instapay' ? Zap :
    mInfo.id === 'vodafone_cash' ? Smartphone : CreditCard;

  const arabicWords = numberToArabicWords(expense.amount, expense.currency);
  const englishWords = numberToEnglishWords(expense.amount, expense.currency);

  const beneficiary =
    expense.beneficiary_employee_name ||
    expense.vendor_name ||
    expense.responsible_employee?.full_name_ar ||
    (isRtl ? 'الجهة المستفيدة / المستلم' : 'Beneficiary / Recipient');

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    // Standard cross-platform PDF export via print preview
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:static print:inset-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 space-y-6 text-xs text-slate-800 animate-in fade-in zoom-in-95 duration-150 print:p-6 print:shadow-none print:max-w-none print:w-full print:rounded-none">
        
        {/* Print Stylesheet for exact A4 rendering */}
        <style>{`
          @media print {
            body * {
              visibility: hidden;
            }
            #payment-voucher-document, #payment-voucher-document * {
              visibility: visible;
            }
            #payment-voucher-document {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
          }
        `}</style>

        {/* Action Header (Hidden on Print) */}
        <div className="flex items-center justify-between border-b pb-3 print:hidden">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
              isPaid
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200'
            }`}>
              {isPaid ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
              <span>{isPaid ? (isRtl ? 'سند صرف رسمي مسدد' : 'Official Paid Voucher') : (isRtl ? 'إذن صرف معتمد (غير مسدد)' : 'Approved Payment Authorization')}</span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              type="button"
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-bct-navy text-white font-bold hover:bg-bct-dark transition cursor-pointer shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>{isRtl ? 'طباعة السند' : 'Print Voucher'}</span>
            </button>
            <button
              onClick={handleDownloadPDF}
              type="button"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تحميل PDF' : 'Download PDF'}</span>
            </button>
            <button
              onClick={onClose}
              type="button"
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ============================================================== */}
        {/* PRINTABLE VOUCHER DOCUMENT CONTENT                             */}
        {/* ============================================================== */}
        <div id="payment-voucher-document" className="space-y-5 print:space-y-4">
          
          {/* Header with Original BCT Logo & Company Details */}
          <div className="flex items-start justify-between border-b-2 border-bct-navy/20 pb-4">
            <div className="flex items-center gap-4">
              <img
                src="/assets/brand/BCT_Vertical_Mono_Navy.png"
                alt="BCT Logo"
                className="h-16 w-auto object-contain shrink-0"
              />
              <div>
                <h1 className="text-base font-black text-bct-navy">
                  {t('brand.name')}
                </h1>
                <p className="text-[11px] font-semibold text-slate-600">
                  {isRtl ? 'BCT Educational Consulting & Training System' : 'نظام بي سي تي للاستشارات التعليمية والتدريب'}
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  القاهرة، جمهورية مصر العربية • الإدارة المالية ورقابة الخزينة
                </p>
              </div>
            </div>

            <div className="text-end space-y-1">
              <div className="font-mono font-black text-base text-bct-navy bg-slate-50 px-3 py-1 rounded-xl border border-slate-200 inline-block">
                {expense.voucher_code}
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {isRtl ? 'تاريخ المصروف:' : 'Expense Date:'} <span className="tabular-nums font-bold text-slate-700">{expense.created_at?.split('T')[0] || '-'}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {isRtl ? 'تاريخ إصدار السند:' : 'Issue Date:'} <span className="tabular-nums font-bold text-slate-700">{(expense.voucher_issue_date || expense.paid_at || expense.approved_at || expense.created_at)?.split('T')[0] || '-'}</span>
              </div>
            </div>
          </div>

          {/* Voucher Title & Status Banner */}
          <div className={`p-3 rounded-2xl border text-center space-y-1 ${
            isPaid
              ? 'bg-slate-50 border-bct-navy/20 text-bct-navy'
              : 'bg-amber-50/70 border-amber-200 text-amber-900'
          }`}>
            <h2 className="text-sm font-black">
              {isPaid
                ? (isRtl ? 'سند صرف مالي رسمي • OFFICIAL PAYMENT VOUCHER' : 'OFFICIAL PAYMENT VOUCHER • سند صرف مالي رسمي')
                : (isRtl ? 'إذن صرف نفقات معتمد (قيد السحب والتنفيذ) • APPROVED PAYMENT AUTHORIZATION' : 'APPROVED PAYMENT AUTHORIZATION • إذن صرف نفقات معتمد')}
            </h2>
            <p className="text-[10px] font-semibold">
              {isPaid
                ? (isRtl ? 'مستند مالي مؤكد – تم صرف المبلغ وقيده بالخزينة/الحساب المالي رسمياً' : 'Confirmed financial document – payment posted to financial account ledger.')
                : (isRtl ? 'تنبيه رقابي: هذا إذن صرف معتمد فقط (إذن صرف قيد السحب والتنفيذ النقدي)، ولا يثبت سداداً فعلياً حتى يتم تأكيد الصرف وقيده بالحساب' : 'Notice: Authorized expense (Pending Cash Execution). Does not represent actual cash disbursement until paid.')}
            </p>
          </div>

          {/* Amount Showcase Banner */}
          <div className="bg-gradient-to-r from-slate-50 via-white to-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] text-slate-500 font-bold block">
                {isRtl ? 'المبلغ المستحق للصرف:' : 'Total Payable Amount:'}
              </span>
              <div className="text-2xl font-black text-rose-700 flex items-baseline gap-1 mt-0.5">
                <span>{expense.amount.toLocaleString()}</span>
                <span className="text-sm font-bold text-slate-600">{expense.currency}</span>
              </div>
            </div>

            <div className="sm:text-end border-t sm:border-t-0 sm:border-s border-slate-200 pt-2 sm:pt-0 sm:ps-4">
              <span className="text-[10px] text-slate-400 font-bold block mb-0.5">
                {isRtl ? 'المبلغ بالحروف (تفقيط رسمي):' : 'Amount in words:'}
              </span>
              <div className="font-bold text-slate-800 text-xs">{arabicWords}</div>
              <div className="text-[10px] text-slate-500 font-medium italic mt-0.5">{englishWords}</div>
            </div>
          </div>

          {/* Detailed Voucher Ledger Attributes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] text-slate-400 font-bold block">
                {isRtl ? 'يصرف للسيد / المستفيد:' : 'Pay to Beneficiary:'}
              </span>
              <span className="text-xs font-black text-slate-900 block mt-0.5">{beneficiary}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 font-bold block">
                {isRtl ? 'التصنيف والإدارة المعنية:' : 'Category & Department:'}
              </span>
              <span className="text-xs font-bold text-bct-navy block mt-0.5">
                {expense.category === 'employee_incentives' ? (isRtl ? 'حوافز الموظفين (Employee Incentives)' : 'Employee Incentives') :
                 expense.category === 'government_fees' ? (isRtl ? 'رسوم حكومية ومنصات' : 'Government Fees') :
                 expense.category === 'marketing' ? (isRtl ? 'تسويق وحملات' : 'Marketing') :
                 expense.category === 'salaries' ? (isRtl ? 'رواتب وأجور' : 'Salaries') : (isRtl ? 'مصروفات تشغيلية' : 'Operational')}
                {' • '}
                {expense.department_id.toUpperCase()}
              </span>
            </div>

            <div className="sm:col-span-2 border-t border-slate-100 pt-2">
              <span className="text-[10px] text-slate-400 font-bold block">
                {isRtl ? 'بيان المصروف وسببه:' : 'Description & Justification:'}
              </span>
              <p className="text-xs font-semibold text-slate-800 mt-0.5">
                {isRtl ? expense.title_ar : (expense.title_en || expense.title_ar)}
              </p>
              {expense.notes && (
                <p className="text-[11px] text-slate-500 mt-0.5 italic">
                  {expense.notes}
                </p>
              )}
            </div>

            {/* Payment Method & Bank Channel Details */}
            <div className="border-t border-slate-100 pt-2">
              <span className="text-[10px] text-slate-400 font-bold block">
                {isRtl ? 'طريقة السداد / قناة الصرف:' : 'Payment Method & Channel:'}
              </span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <ChannelIcon className="w-3.5 h-3.5 text-bct-navy" />
                <span className="font-bold text-slate-900">{mInfo.name}</span>
              </div>
              <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                {expense.bank_name || expense.financial_account_name || mInfo.defaultAccount}
              </div>
            </div>

            {/* Linked Transaction Reference (Modifications 2 & 4) */}
            <div className="border-t border-slate-100 pt-2">
              <span className="text-[10px] text-slate-400 font-bold block">
                {isRtl ? 'رقم المعاملة المرتبطة (إن وجدت):' : 'Linked Transaction Reference:'}
              </span>
              {expense.transaction_number ? (
                <div className="mt-0.5">
                  <span className="font-mono font-bold text-bct-navy bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                    {expense.transaction_number}
                  </span>
                  {expense.student_name && (
                    <span className="text-[11px] text-slate-700 font-semibold ms-1.5">
                      ({expense.student_name})
                    </span>
                  )}
                  {expense.incentive_calculation_reference && (
                    <div className="text-[10px] text-slate-500 mt-0.5 font-medium">
                      {isRtl ? 'مرجع السياسة:' : 'Policy Ref:'} {expense.incentive_calculation_reference}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-[11px] text-slate-400 italic mt-0.5 block">
                  {isRtl ? 'لا توجد معاملة طلابية مباشرة مرتبطة' : 'Direct operational overhead'}
                </span>
              )}
            </div>
          </div>

          {/* Audit Verification Log Strip */}
          <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-3 text-[11px]">
            <div>
              <span className="text-slate-400 block text-[10px]">{isRtl ? 'حالة الاعتماد:' : 'Approval:'}</span>
              <span className="font-bold text-emerald-700">
                {isApproved ? (isRtl ? 'معتمد رسمياً' : 'Approved') : (isRtl ? 'قيد المراجعة' : 'Pending')}
              </span>
              {expense.approved_at && (
                <span className="block text-[9px] text-slate-400 font-mono">{expense.approved_at.split('T')[0]}</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">{isRtl ? 'حالة الصرف الفعلي:' : 'Disbursement:'}</span>
              <span className={`font-bold ${isPaid ? 'text-sky-700' : 'text-amber-700'}`}>
                {isPaid ? (isRtl ? 'تم الصرف الفعلي' : 'Paid Out') : (isRtl ? 'قيد السحب والسداد' : 'Unpaid')}
              </span>
              {expense.paid_at && (
                <span className="block text-[9px] text-slate-400 font-mono">{expense.paid_at.split('T')[0]}</span>
              )}
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">{isRtl ? 'المعتمد مالياً:' : 'Approved By:'}</span>
              <span className="font-semibold text-slate-800">{expense.approved_by || 'المدير المالي'}</span>
            </div>

            <div>
              <span className="text-slate-400 block text-[10px]">{isRtl ? 'القائم بالصرف:' : 'Disbursed By:'}</span>
              <span className="font-semibold text-slate-800">
                {isPaid ? (expense.disbursed_by || expense.paid_by || 'أمين الخزينة') : '—'}
              </span>
            </div>
          </div>

          {/* Official Signature Blocks */}
          <div className="pt-6 border-t-2 border-slate-200 grid grid-cols-3 gap-6 text-center text-xs">
            <div className="space-y-8">
              <span className="font-bold text-slate-700 block text-[11px]">
                {isRtl ? 'إعداد المحاسب المسؤول' : 'Prepared By (Accountant)'}
              </span>
              <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto pb-1 text-[10px] text-slate-500">
                {expense.responsible_employee?.full_name_ar || 'قسم الحسابات'}
              </div>
            </div>

            <div className="space-y-8">
              <span className="font-bold text-slate-700 block text-[11px]">
                {isRtl ? 'اعتماد الإدارة المالية' : 'Approved By (Controller)'}
              </span>
              <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto pb-1 text-[10px] text-slate-500">
                {expense.approved_by || 'الإدارة المالية'}
              </div>
            </div>

            <div className="space-y-8">
              <span className="font-bold text-slate-700 block text-[11px]">
                {isRtl ? 'توقيع المستلم / المستفيد' : 'Received By (Beneficiary)'}
              </span>
              <div className="border-b border-dashed border-slate-300 w-3/4 mx-auto pb-1 text-[10px] text-slate-400 italic">
                {isPaid ? (isRtl ? 'تم التحويل / الاستلام' : 'Confirmed Outflow') : (isRtl ? 'التوقيع عند الصرف' : 'Signature upon receipt')}
              </div>
            </div>
          </div>

          {/* Footer Security Watermark */}
          <div className="text-center text-[9px] text-slate-400 pt-2 border-t">
            <span>
              {isRtl
                ? `بي سي تي للاستشارات التعليمية والتدريب • BCT Enterprise System • وثيقة مالية تخضع للتدقيق والرقابة المحاسبية • رمز السند: ${expense.voucher_code}`
                : `BCT Educational Consulting & Training • BCT Enterprise System • Audited Financial Document • Voucher Code: ${expense.voucher_code}`}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
