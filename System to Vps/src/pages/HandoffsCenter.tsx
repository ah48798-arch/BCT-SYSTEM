import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { DepartmentalHandoff } from '../types/database.types';
import { 
  ArrowRightLeft, 
  AlertTriangle, 
  ShieldCheck, 
  Clock, 
  CheckCircle, 
  XCircle, 
  ChevronDown, 
  CheckSquare, 
  Building2,
  X
} from 'lucide-react';

export const HandoffsCenter: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();

  const [handoffs, setHandoffs] = useState(bctStore.getHandoffs());
  const [openOverlapIndex, setOpenOverlapIndex] = useState<number | null>(0);
  const [rejectingHandoffId, setRejectingHandoffId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    return bctStore.subscribe(() => {
      setHandoffs(bctStore.getHandoffs());
    });
  }, []);

  const OVERLAPS = [
    {
      id: 'ov1',
      departments: ['التسويق', 'المستشارون'],
      title_ar: '1. تسليم العميل المحتمل (Lead Handoff)',
      risk_ar: 'حملة تجلب استفسارات والمستشارون لا يعرفون مصدرها أو جودتها، فيضيع بعضها.',
      rule_ar: 'كل استفسار يُسجَّل تلقائياً في النظام مع اسم الحملة، ويُسند لمستشار خلال 15 دقيقة.',
      owner_ar: 'رئيس المستشارين يملك الاستفسار بعد وصوله؛ التسويق يملك الحملة قبل ذلك.',
      sla_ar: 'رد أول خلال 15 دقيقة في الدوام',
      escalation_ar: 'عند ركود استفسار أكثر من ساعتين: تنبيه فوري لرئيس المستشارين.'
    },
    {
      id: 'ov2',
      departments: ['التسويق', 'العمليات'],
      title_ar: '2. الحملات مقابل الطاقة التشغيلية (بوابة الطاقة)',
      risk_ar: 'حملة كبيرة تجلب استفسارات تفوق قدرة الفريق فتتأخر الإجراءات وتتضرر سمعة BCT.',
      rule_ar: 'بوابة الطاقة: لا تُطلق حملة قبل توقيع مدير العمليات خطياً على الحد الأقصى للملفات الجديدة أسبوعياً.',
      owner_ar: 'مدير العمليات يملك القرار على الطاقة؛ التسويق ينفذ ضمنها فقط.',
      sla_ar: 'رد على طلب إطلاق الحملة خلال 24 ساعة',
      escalation_ar: 'الخلاف يُحسم من المدير العام في الاجتماع الإداري الأسبوعي.'
    },
    {
      id: 'ov3',
      departments: ['المستشارون', 'العمليات'],
      title_ar: '3. تسليم الملف بعد التسجيل (File Handover)',
      risk_ar: 'ملف ينتقل ناقصاً فيتأخر ويُلقى اللوم بين المستشار والعمليات بشكل متبادل.',
      rule_ar: 'قائمة فحص رقمية إلزامية (نوع الشهادة، النسبة، الأوراق، إيصال السداد، الرغبات). العمليات تقبل أو ترفض الملف خلال 4 ساعات عمل.',
      owner_ar: 'المستشار مسؤول عن اكتمال بيانات الملف؛ العمليات مسؤولة منذ قبول الملف.',
      sla_ar: 'قبول أو رفض الملف خلال 4 ساعات عمل',
      escalation_ar: 'رفض متكرر لنفس المستشار يُرفع لرئيس المستشارين لجلسة تدريب وتأهيل.'
    },
    {
      id: 'ov4',
      departments: ['العمليات', 'المالية'],
      title_ar: '4. تأكيد السداد قبل التنفيذ (Payment Confirmation Gate)',
      risk_ar: 'بدء إجراء مدفوع بدون تأكيد السداد، أو استلام إيصال بلا اسم الطالب فيضيع المبلغ.',
      rule_ar: 'لا يبدأ أي إجراء مدفوع قبل تأكيد المحاسب في النظام. أي إيصال بلا اسم الطالب يُرفض فوراً.',
      owner_ar: 'المالية تملك قرار قبول الدفع وتأكيده؛ العمليات تملك البدء بعد التأكيد.',
      sla_ar: 'تأكيد السداد خلال ساعتين كحد أقصى',
      escalation_ar: 'نزاع على دفعة يُرفع للمدير المالي ثم للمدير العام.'
    },
    {
      id: 'ov5',
      departments: ['العمليات', 'المعقبون'],
      title_ar: '5. قائمة اليوم والتقرير اليومي للمعاملات',
      risk_ar: 'المعقب يتحرك بدون خطة، ويضيع مستند أو تتأخر معاملة بالسفارة دون علم أحد.',
      rule_ar: 'قائمة يومية مكتوبة قبل خروج المعقب، وتصوير كل مستند بعد الختم فوراً قبل مغادرة الجهة، وتقرير مغرب.',
      owner_ar: 'مدير العمليات يخطط ويشرف، والمعقب ينفذ ويوثق بصور فورية.',
      sla_ar: 'رفع صور المستندات الموثقة في نفس اليوم',
      escalation_ar: 'أي مستند غير موثق بصورة يُعتبر مفقوداً ويُفتح له تحقيق فوري.'
    },
    {
      id: 'ov6',
      departments: ['البوت', 'الموظفون'],
      title_ar: '6. تحويل المحادثة من البوت للإنسان (Bot Handover)',
      risk_ar: 'العميل يُحبس مع البوت في حالة خاصة، أو يتكرر السؤال على الموظف البشري.',
      rule_ar: 'قواعد تحويل واضحة (الحالات الخاصة، سداد الرسوم، الشكاوى، عدم الفهم). عند التحويل يصل الموظف ملخص المحادثة السابقة.',
      owner_ar: 'مسؤول الأنظمة يملك البوت وبرمجته؛ رئيس المستشارين يملك نصوصه ورسائله.',
      sla_ar: 'استلام الموظف البشري خلال 15 دقيقة في أوقات الدوام',
      escalation_ar: 'محادثة محوّلة بلا رد أكثر من ساعة: تنبيه تلقائي لرئيس المستشارين.'
    },
    {
      id: 'ov7',
      departments: ['الجودة', 'جميع الإدارات'],
      title_ar: '7. الشكوى وتوزيع المسؤولية (Complaint Ownership)',
      risk_ar: 'كل إدارة ترى أن الخطأ من غيرها، فتتأخر معالجة الشكوى وتتكرر الأخطاء ذاتها.',
      rule_ar: 'مسؤول الجودة يفتح التذكرة ويحدد صاحب الحل بناءً على سجل الملف والتدقيق، وصاحب الحل ينفذ ضمن المهلة.',
      owner_ar: 'مسؤول الجودة يملك التذكرة ويتابعها حتى الإغلاق النهائي.',
      sla_ar: 'رد أول على الشكوى خلال 4 ساعات، وإغلاق كامل خلال 3 أيام عمل',
      escalation_ar: 'تجاوز مهلة الـ 3 أيام يرفع التذكرة تلقائياً للمدير العام.'
    },
    {
      id: 'ov8',
      departments: ['المستشارون', 'المتابعة'],
      title_ar: '8. من يتواصل مع الطالب بعد التقديم (Single File Owner)',
      risk_ar: 'طالب يتلقى رسائل متضاربة من أكثر من موظف، أو يتعرض للصمت التام بعد الدفع.',
      rule_ar: 'قاعدة المالك الواحد: لكل ملف مالك واحد ظاهر في النظام. غيره يضيف ملاحظة داخلية ولا يراسل الطالب مباشرة.',
      owner_ar: 'المستشار يملك التواصل قبل التسليم؛ أخصائي العمليات يملكه بعد قبول الملف.',
      sla_ar: 'تحديث استباقي للطالب كل 7 أيام كحد أقصى',
      escalation_ar: 'أي ملف بلا تحديث أكثر من 7 أيام يظهر باللون الأحمر في لوحة العمليات.'
    }
  ];

  const handleAccept = (handoffId: string) => {
    bctStore.resolveHandoff(handoffId, 'accepted', '', currentUser?.username || 'admin');
  };

  const handleReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingHandoffId) return;
    bctStore.resolveHandoff(rejectingHandoffId, 'rejected', rejectionReason, currentUser?.username || 'admin');
    setRejectingHandoffId(null);
    setRejectionReason('');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-extrabold text-bct-navy">
          {t('nav.handoffs')}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'ar'
            ? 'قواعد التقاطع الثمانية وإدارة تسليم الملفات والمهام بين الإدارات: الخطر، القاعدة الإلزامية، المالك، والمهلة.'
            : 'The 8 Departmental Overlap Rules & File Handover Management: Risks, Rules, Owners & Escalations.'}
        </p>
      </div>

      {/* Live Handover Queue Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
        <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-bct-navy" />
          <span>{language === 'ar' ? 'سجل تسليم الملفات والتحويلات النشطة' : 'Active File Handoff Queue'}</span>
        </h3>

        <div className="divide-y divide-slate-100 border rounded-xl overflow-hidden text-xs">
          {handoffs.map((h) => (
            <div key={h.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50 transition">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">
                    {h.handoff_type.replace(/_/g, ' ')}
                  </span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    h.status === 'accepted' ? 'bg-emerald-50 text-emerald-700' :
                    h.status === 'rejected' ? 'bg-rose-50 text-rose-700' :
                    'bg-amber-50 text-amber-700 animate-pulse'
                  }`}>
                    {h.status === 'accepted' ? 'مقبول ومستلم' : h.status === 'rejected' ? 'مرفوض' : 'قيد الفحص (4 ساعات)'}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  من: <span className="font-semibold text-slate-700">{h.sending_department_id.toUpperCase()}</span> ➔ إلى: <span className="font-semibold text-slate-700">{h.receiving_department_id.toUpperCase()}</span>
                </p>
              </div>

              {h.status === 'pending' && (
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleAccept(h.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition"
                  >
                    قبول واستلام
                  </button>
                  <button
                    onClick={() => setRejectingHandoffId(h.id)}
                    className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs transition"
                  >
                    رفض لمستندات ناقصة
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* The 8 Overlap Rules Catalog */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-800">
          {language === 'ar' ? 'القواعد الثمانية الحاكمة لمناطق التقاطع بين الإدارات' : 'The 8 Canonical Departmental Overlap Rules'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {OVERLAPS.map((ov, idx) => {
            const isOpen = openOverlapIndex === idx;

            return (
              <div 
                key={ov.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition"
              >
                {/* Accordion Header */}
                <button
                  onClick={() => setOpenOverlapIndex(isOpen ? null : idx)}
                  className="w-full text-start p-4 flex items-start justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div>
                    <div className="flex items-center gap-1.5 mb-1.5">
                      {ov.departments.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-bct-navy">
                          {d}
                        </span>
                      ))}
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900">
                      {ov.title_ar}
                    </h4>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Accordion Body */}
                {isOpen && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                    
                    {/* Risk */}
                    <div>
                      <span className="font-bold text-rose-700 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>الخطر التشغيلي:</span>
                      </span>
                      <p className="text-slate-600 mt-0.5 leading-relaxed ps-4">
                        {ov.risk_ar}
                      </p>
                    </div>

                    {/* Rule */}
                    <div>
                      <span className="font-bold text-bct-navy flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>القاعدة الإلزامية:</span>
                      </span>
                      <p className="text-slate-800 font-semibold mt-0.5 leading-relaxed ps-4">
                        {ov.rule_ar}
                      </p>
                    </div>

                    {/* Scope & SLA Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 border-t border-slate-200/60 text-[11px]">
                      <div>
                        <span className="text-slate-400 block font-medium">صاحب القرار:</span>
                        <span className="font-bold text-slate-800">{ov.owner_ar}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block font-medium">المهلة الزمنية (SLA):</span>
                        <span className="font-bold text-emerald-700">{ov.sla_ar}</span>
                      </div>
                    </div>

                    {/* Escalation */}
                    <div className="text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
                      <span className="font-bold text-slate-700 block">إجراء التصعيد:</span>
                      <span className="text-slate-500">{ov.escalation_ar}</span>
                    </div>

                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectingHandoffId && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">سبب رفض استلام الملف</h3>
              <button onClick={() => setRejectingHandoffId(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleReject} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  حدد النواقص في قائمة الفحص (Checklist) بدقة: *
                </label>
                <textarea
                  required
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="مثال: صورة الجواز منتهية الصلاحية / لم يتم تأكيد ترتيب رغبات الجامعات العشر مع الطالب..."
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setRejectingHandoffId(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold hover:bg-rose-700"
                >
                  تأكيد الرفض وإعادة الملف للمستشار
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
