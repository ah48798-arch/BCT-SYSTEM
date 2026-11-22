import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { bctStore } from '../services/store';
import { JobPosition, RoleId } from '../types/database.types';
import { 
  Building2, 
  Users, 
  ShieldCheck, 
  Award, 
  Target, 
  CheckCircle, 
  X, 
  ChevronDown, 
  Info,
  Layers
} from 'lucide-react';

export const OrgChart: React.FC = () => {
  const { t, language } = useLanguage();
  const [, setStoreVersion] = useState(0);

  useEffect(() => {
    return bctStore.subscribe(() => {
      setStoreVersion(v => v + 1);
    });
  }, []);

  const departments = bctStore.getDepartments();
  const positions = bctStore.getJobPositions();
  const employees = bctStore.getEmployees();

  const [selectedRole, setSelectedRole] = useState<JobPosition | null>(null);
  const [showSmallTeamView, setShowSmallTeamView] = useState(false);

  const gmRole = positions['gm'];
  const gmEmployee = employees.find(e => e.position_id === 'gm');

  const smallTeamMapping = [
    {
      title_ar: 'المدير العام (يتولى أيضاً التسويق الاستراتيجي والجودة)',
      title_en: 'General Manager (+ Strategic Marketing & Quality)',
      roles_ar: 'المدير العام + مسؤول التسويق + مسؤول الجودة',
    },
    {
      title_ar: 'مدير العمليات (يتولى المتابعة والتقديمات)',
      title_en: 'Operations Manager (+ Follow-up & Applications)',
      roles_ar: 'مدير العمليات + أخصائي التقديمات + أخصائي المتابعة',
    },
    {
      title_ar: 'مستشار أول (يتولى المراسلات والاستقبال)',
      title_en: 'Senior Consultant (+ Communications & Reception)',
      roles_ar: 'رئيس المستشارين + المستشار + مسؤول المراسلات + الاستقبال',
    },
    {
      title_ar: 'محاسب / إداري (يتولى الموارد البشرية)',
      title_en: 'Accountant / Admin (+ HR & Training)',
      roles_ar: 'المدير المالي + المحاسب + الموارد البشرية',
    },
    {
      title_ar: 'معقب ميداني',
      title_en: 'Field Liaison Representative',
      roles_ar: 'المعقب + أخصائي التوثيق (الجانب الميداني)',
    },
    {
      title_ar: 'متعاون خارجي للأنظمة والمحتوى (بدوام جزئي)',
      title_en: 'External Contractor (Systems & Content)',
      roles_ar: 'مسؤول الأنظمة + صانع المحتوى + مدير الحملات',
    }
  ];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-bct-navy">
            {t('nav.orgChart')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'الهيكل الإداري الرسمي لشركة BCT: المدير العام وخمس إدارات تشغيلية (18 وظيفة تخصصية).'
              : 'Official BCT Organizational Hierarchy: General Manager and 5 Operational Departments (18 Positions).'}
          </p>
        </div>

        <button
          onClick={() => setShowSmallTeamView(!showSmallTeamView)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition border ${
            showSmallTeamView
              ? 'bg-bct-navy text-white border-bct-navy'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{language === 'ar' ? 'صيغة الفريق الصغير (<8 موظفين)' : 'Small Team Model (<8 staff)'}</span>
        </button>
      </div>

      {showSmallTeamView ? (
        /* Small Team Consolidated View */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center gap-3 p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
            <Info className="w-5 h-5 shrink-0 text-amber-600" />
            <span>
              {language === 'ar'
                ? 'إذا كان حجم الفريق أقل من 8 موظفين، تُدمج الأدوار وفق الجدول التالي دون المساس بجوهر المسؤوليات أو إلغاء أي مرحلة تدقيق.'
                : 'If the team size is under 8 staff, roles are merged according to this structure without diluting accountability.'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-start">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold">
                  <th className="py-3 px-4 text-start">#</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الوظيفة المدمجة' : 'Consolidated Position'}</th>
                  <th className="py-3 px-4 text-start">{language === 'ar' ? 'الأدوار التي تشملها من الهيكل الكامل' : 'Included Full Structure Roles'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {smallTeamMapping.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 transition">
                    <td className="py-3 px-4 font-bold text-slate-400">{idx + 1}</td>
                    <td className="py-3 px-4 font-bold text-bct-navy">
                      {language === 'ar' ? item.title_ar : item.title_en}
                    </td>
                    <td className="py-3 px-4 text-slate-600 font-medium">{item.roles_ar}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Full Visual Interactive Hierarchy */
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8 overflow-x-auto">
          
          {/* Top Level: General Manager */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setSelectedRole(gmRole)}
              className="bg-bct-navy hover:bg-bct-dark text-white rounded-2xl p-5 shadow-xl border-2 border-white max-w-sm w-full text-center transition transform hover:-translate-y-0.5"
            >
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-white/20 text-[10px] font-bold uppercase mb-1">
                {language === 'ar' ? 'القيادة الاستراتيجية' : 'Executive Leadership'}
              </div>
              <h3 className="text-base font-extrabold">
                {language === 'ar' ? gmRole.title_ar : gmRole.title_en}
              </h3>
              <p className="text-xs text-slate-300 mt-1 font-semibold">
                {gmEmployee?.full_name_ar}
              </p>
              <div className="mt-2 text-[10px] text-slate-400 border-t border-white/10 pt-1.5">
                {language === 'ar' ? 'القرار النهائي واعتماد الأسعار والميزانية' : 'Final Decisions, Pricing & Budgets'}
              </div>
            </button>
          </div>

          {/* Central Stem connecting to Departments */}
          <div className="hidden lg:flex justify-center">
            <div className="w-0.5 h-6 bg-slate-300" />
          </div>

          {/* Department Branches Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 pt-2 relative">
            {departments.map((dept) => {
              const deptRoles = (dept.roles || []).map(rId => positions[rId]).filter(Boolean);

              return (
                <div 
                  key={dept.id} 
                  className="rounded-2xl border border-slate-200 bg-slate-50/50 flex flex-col justify-between overflow-hidden shadow-sm hover:shadow-md transition"
                >
                  {/* Department Header */}
                  <div 
                    className="p-3.5 text-white text-center"
                    style={{ backgroundColor: dept.color_hex }}
                  >
                    <h4 className="text-xs font-extrabold leading-tight">
                      {language === 'ar' ? dept.name_ar : dept.name_en}
                    </h4>
                    <p className="text-[10px] text-white/80 font-medium mt-0.5">
                      {language === 'ar' ? dept.head_title_ar : dept.head_title_en}
                    </p>
                  </div>

                  {/* Department Description */}
                  <div className="p-3 text-[11px] text-slate-500 text-center leading-relaxed border-b border-slate-100">
                    {language === 'ar' ? dept.description_ar : dept.description_en}
                  </div>

                  {/* Department Roles List */}
                  <div className="p-2.5 space-y-1.5 flex-1">
                    {deptRoles.map((role) => {
                      const emp = employees.find(e => e.position_id === role.id);
                      return (
                        <button
                          key={role.id}
                          onClick={() => setSelectedRole(role)}
                          className="w-full text-start p-2.5 rounded-xl bg-white border border-slate-200 hover:border-bct-navy hover:bg-slate-50 transition flex items-center justify-between group shadow-2xs"
                        >
                          <div>
                            <div className="text-xs font-bold text-slate-800 group-hover:text-bct-navy">
                              {language === 'ar' ? role.title_ar : role.title_en}
                            </div>
                            <div className="text-[10px] text-slate-400">
                              {emp ? (language === 'ar' ? emp.full_name_ar : emp.full_name_en) : (language === 'ar' ? 'شاغر / مكلّف' : 'Vacant')}
                            </div>
                          </div>
                          <ChevronDown className="w-3.5 h-3.5 text-slate-300 group-hover:text-bct-navy -rotate-90" />
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-6 text-center text-xs text-slate-400 font-medium">
            {language === 'ar' ? '💡 اضغط على أي وظيفة لاستعراض بطاقة الوصف الوظيفي الكاملة والصلاحيات والمهارات ومؤشرات الأداء.' : '💡 Click any position card to inspect its full job description, duties, authorities, KPIs and skills.'}
          </div>

        </div>
      )}

      {/* Role Details Modal Drawer */}
      {selectedRole && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            
            {/* Modal Header */}
            <div className="p-5 bg-bct-navy text-white flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-bct-teal bg-white/10 px-2.5 py-0.5 rounded-full inline-block mb-1">
                  {selectedRole.id}
                </span>
                <h3 className="text-base font-extrabold">
                  {language === 'ar' ? selectedRole.title_ar : selectedRole.title_en}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedRole(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              
              {/* Core Purpose */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                <span className="font-bold text-bct-navy block mb-1">
                  {language === 'ar' ? 'الهدف الوظيفي الأساسي:' : 'Core Purpose:'}
                </span>
                <p className="leading-relaxed">
                  {language === 'ar' ? selectedRole.purpose_ar : selectedRole.purpose_en}
                </p>
              </div>

              {/* Key Duties */}
              <div>
                <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>{language === 'ar' ? 'المهام والمسؤوليات الرئيسية:' : 'Key Duties & Responsibilities:'}</span>
                </h4>
                <ul className="space-y-1.5 ps-5 list-disc text-slate-600 leading-relaxed">
                  {((language === 'ar' ? selectedRole.duties_ar : selectedRole.duties_en) || []).map((duty, i) => (
                    <li key={i}>{duty}</li>
                  ))}
                </ul>
              </div>

              {/* Authorities */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-bct-navy" />
                  <span>{language === 'ar' ? 'حدود الصلاحيات والقرارات:' : 'Authorities & Decision Scope:'}</span>
                </h4>
                <p className="text-slate-600 leading-relaxed ps-5">
                  {language === 'ar' ? selectedRole.authority_ar : selectedRole.authority_en}
                </p>
              </div>

              {/* KPIs & Skills Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                
                {/* KPIs */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Target className="w-4 h-4 text-rose-600" />
                    <span>{language === 'ar' ? 'مؤشرات الأداء (KPIs):' : 'Key Performance Indicators:'}</span>
                  </h5>
                  <ul className="space-y-1 text-slate-600">
                    {((language === 'ar' ? selectedRole.kpis_ar : selectedRole.kpis_en) || []).map((kpi, i) => (
                      <li key={i} className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                        <span>{kpi}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skills */}
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <h5 className="font-bold text-slate-900 mb-2 flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-amber-600" />
                    <span>{language === 'ar' ? 'بطاقة المهارات المطلوبة:' : 'Competencies & Skills:'}</span>
                  </h5>
                  <div className="flex flex-wrap gap-1.5">
                    {((language === 'ar' ? selectedRole.skills_ar : selectedRole.skills_en) || []).map((skill, i) => (
                      <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 font-semibold text-slate-700">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedRole(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-800 transition"
              >
                {t('actions.back')}
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
