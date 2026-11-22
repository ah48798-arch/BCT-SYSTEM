import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { TableProperties, Filter, Info, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const RaciMatrix: React.FC = () => {
  const { t, language } = useLanguage();
  const [roleFocus, setRoleFocus] = useState<number | ''>('');

  const RACI_COLS = [
    { key: 'gm', title_ar: 'المدير العام', title_en: 'General Manager' },
    { key: 'ops_mgr', title_ar: 'مدير العمليات', title_en: 'Operations Manager' },
    { key: 'cs_lead', title_ar: 'رئيس المستشارين', title_en: 'Head of Consultants' },
    { key: 'mkt_mgr', title_ar: 'مسؤول التسويق', title_en: 'Marketing Manager' },
    { key: 'fin_mgr', title_ar: 'المدير المالي والإداري', title_en: 'Finance Manager' },
    { key: 'qa_mgr', title_ar: 'مسؤول الجودة والأنظمة', title_en: 'Quality Officer' },
    { key: 'liaison', title_ar: 'المعقب الميداني', title_en: 'Field Liaison' },
  ];

  const RACI_ROWS = [
    {
      process_ar: '1. استقبال الاستفسار والرد الأول',
      process_en: '1. Inquiry Reception & First Response',
      values: ['I', 'I', 'A', 'C', '-', 'C', '-'],
      notes_ar: 'R: مسؤول المراسلات + البوت الموحد',
    },
    {
      process_ar: '2. تأهيل الطالب وشرح الرسوم',
      process_en: '2. Lead Qualification & Fee Presentation',
      values: ['-', 'C', 'A', '-', '-', '-', '-'],
      notes_ar: 'R: المستشار التعليمي',
    },
    {
      process_ar: '3. التسجيل واستلام السداد',
      process_en: '3. Registration & Payment Intake',
      values: ['I', 'I', 'A', '-', 'R', '-', '-'],
      notes_ar: 'R: المستشار + المحاسب',
    },
    {
      process_ar: '4. تسليم الملف للعمليات (Handoff)',
      process_en: '4. File Handover to Operations',
      values: ['-', 'A', 'R', '-', '-', 'I', '-'],
      notes_ar: 'الملف لا يتحرك قبل اكتمال قائمة الفحص',
    },
    {
      process_ar: '5. مراجعة الأوراق ورفع التقديم',
      process_en: '5. Document Review & Platform Upload',
      values: ['I', 'A', 'C', '-', 'I', 'I', '-'],
      notes_ar: 'R: أخصائي التقديمات',
    },
    {
      process_ar: '6. التوثيق والتعقيب الميداني',
      process_en: '6. Attestation & Field Legalization',
      values: ['-', 'A', 'I', '-', 'C', '-', 'R'],
      notes_ar: 'R: أخصائي التوثيق + المعقب',
    },
    {
      process_ar: '7. استخراج الشهادة الثانوية',
      process_en: '7. Secondary Certificate Extraction',
      values: ['-', 'A', 'C', '-', 'C', 'I', 'R'],
      notes_ar: 'R: أخصائي الاستخراج',
    },
    {
      process_ar: '8. متابعة القبول وإعادة الترشيح',
      process_en: '8. Follow-up & Re-nomination',
      values: ['I', 'A', 'C', '-', 'C', 'I', 'R'],
      notes_ar: 'R: أخصائي المتابعة',
    },
    {
      process_ar: '9. التحصيل والمطابقة اليومية',
      process_en: '9. Daily Collections & Bank Reconciliation',
      values: ['I', 'I', 'I', '-', 'A', 'I', '-'],
      notes_ar: 'R: المحاسب وأمين التحصيل',
    },
    {
      process_ar: '10. تحديث الطالب بالمستجدات',
      process_en: '10. Student Progress Notification',
      values: ['-', 'A', 'C', '-', '-', 'I', '-'],
      notes_ar: 'R: صاحب الملف الحالي؛ يُسجّل في النظام',
    },
    {
      process_ar: '11. الحملات التسويقية وبوابة الطاقة',
      process_en: '11. Marketing Campaigns & Capacity Gate',
      values: ['A', 'C', 'I', 'R', 'C', 'I', '-'],
      notes_ar: 'بوابة الطاقة: موافقة العمليات إلزامية قبل الإطلاق',
    },
    {
      process_ar: '12. الشكاوى والتصعيد',
      process_en: '12. Grievances & Escalations',
      values: ['I', 'C', 'C', '-', '-', 'A', '-'],
      notes_ar: 'R: مسؤول الجودة وسمعة العملاء',
    },
    {
      process_ar: '13. التوظيف والتدريب والتقييم',
      process_en: '13. Recruitment, Training & Appraisal',
      values: ['A', 'C', 'C', 'C', 'R', '-', '-'],
      notes_ar: 'R: مسؤول الموارد البشرية والتدريب',
    },
    {
      process_ar: '14. لوحة المؤشرات والتقرير الأسبوعي',
      process_en: '14. KPI Dashboards & Weekly Reports',
      values: ['A', 'R', 'C', 'C', 'C', 'R', '-'],
      notes_ar: 'R: مسؤول الأنظمة بالأرقام + مدير العمليات بالتحليل',
    },
  ];

  const getBadgeStyle = (val: string) => {
    switch (val) {
      case 'A':
        return 'bg-bct-navy text-white font-black shadow-xs';
      case 'R':
        return 'bg-bct-teal text-white font-black shadow-xs';
      case 'C':
        return 'bg-amber-100 text-amber-800 font-bold border border-amber-200';
      case 'I':
        return 'bg-slate-100 text-slate-600 font-semibold';
      default:
        return 'text-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-bct-navy">
            {t('nav.raci')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'مصفوفة المسؤوليات المعتمدة للعمليات الـ 14: تحدد المسؤول النهائي (A) والمنفذ (R) والمستشار (C) والمبلّغ (I).'
              : 'Approved RACI Responsibility Matrix across all 14 Core Business Processes.'}
          </p>
        </div>

        {/* Role Focus Filter */}
        <div className="flex items-center gap-2">
          <label className="text-xs font-bold text-slate-500">
            {language === 'ar' ? 'التركيز على دور:' : 'Focus Role:'}
          </label>
          <select
            value={roleFocus}
            onChange={(e) => setRoleFocus(e.target.value === '' ? '' : Number(e.target.value))}
            className="px-3 py-1.5 rounded-xl border border-slate-300 text-xs bg-white font-bold text-slate-800"
          >
            <option value="">{language === 'ar' ? 'جميع الأدوار (7 أدوار)' : 'All Roles (7 Roles)'}</option>
            {RACI_COLS.map((c, i) => (
              <option key={c.key} value={i}>
                {language === 'ar' ? c.title_ar : c.title_en}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* RACI Legend Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-bct-navy text-white font-black flex items-center justify-center shrink-0">
            A
          </span>
          <div>
            <span className="font-extrabold text-slate-900 block">Accountable</span>
            <span className="text-[11px] text-slate-400">المسؤول النهائي (يُحاسَب)</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-bct-teal text-white font-black flex items-center justify-center shrink-0">
            R
          </span>
          <div>
            <span className="font-extrabold text-slate-900 block">Responsible</span>
            <span className="text-[11px] text-slate-400">المنفّذ للعملية</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 font-black border border-amber-300 flex items-center justify-center shrink-0">
            C
          </span>
          <div>
            <span className="font-extrabold text-slate-900 block">Consulted</span>
            <span className="text-[11px] text-slate-400">يُستشار قبل القرار</span>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center gap-2.5">
          <span className="w-7 h-7 rounded-lg bg-slate-100 text-slate-600 font-bold flex items-center justify-center shrink-0">
            I
          </span>
          <div>
            <span className="font-extrabold text-slate-900 block">Informed</span>
            <span className="text-[11px] text-slate-400">يُبلَّغ بالنتيجة</span>
          </div>
        </div>
      </div>

      {/* Main RACI Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-start">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                <th className="py-3 px-4 text-start min-w-[220px]">
                  {language === 'ar' ? 'العملية الإدارية' : 'Business Process'}
                </th>
                {RACI_COLS.map((col, idx) => (
                  <th
                    key={col.key}
                    className={`py-3 px-3 text-center transition ${
                      roleFocus === idx ? 'bg-slate-100 text-bct-navy font-extrabold' : ''
                    }`}
                  >
                    {language === 'ar' ? col.title_ar : col.title_en}
                  </th>
                ))}
                <th className="py-3 px-4 text-start min-w-[220px]">
                  {language === 'ar' ? 'المنفّذ / ملاحظات التسليم' : 'Executor / Delivery Notes'}
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {RACI_ROWS.map((row, rIdx) => {
                const isDimmed = roleFocus !== '' && row.values[roleFocus] === '-';

                return (
                  <tr 
                    key={rIdx} 
                    className={`hover:bg-slate-50 transition ${isDimmed ? 'opacity-30' : ''}`}
                  >
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {language === 'ar' ? row.process_ar : row.process_en}
                    </td>

                    {row.values.map((val, cIdx) => (
                      <td
                        key={cIdx}
                        className={`py-3.5 px-3 text-center ${
                          roleFocus === cIdx ? 'bg-slate-50/80 font-black' : ''
                        }`}
                      >
                        {val === '-' ? (
                          <span className="text-slate-300">–</span>
                        ) : (
                          <span className={`inline-flex items-center justify-center w-6 h-6 rounded-md text-xs ${getBadgeStyle(val)}`}>
                            {val}
                          </span>
                        )}
                      </td>
                    ))}

                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      {row.notes_ar}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
