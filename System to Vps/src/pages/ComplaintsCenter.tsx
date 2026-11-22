import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { Complaint, calculateSLADeadline } from '../types/database.types';
import { 
  AlertCircle, 
  Plus, 
  CheckCircle, 
  Clock, 
  ShieldAlert, 
  FileText, 
  User, 
  Phone, 
  X,
  Search,
  Filter
} from 'lucide-react';

export const ComplaintsCenter: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser, isSuperAdmin, hasPermission } = useAuth();

  const [complaints, setComplaints] = useState(bctStore.getComplaints());
  const employees = bctStore.getEmployees();
  const complaintSLA = bctStore.getSLAConfigByCode('SLA-TASK-COMPLAINT') || bctStore.getSLAConfigs('complaint')[0];
  const complaintSlaLabel = complaintSLA?.label_ar || '3 أيام';
  const complaintSlaLabelEn = complaintSLA?.label_en || '3 days';
  const students = bctStore.getStudents();

  const [searchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState<string>(() => {
    return searchParams.get('status') || searchParams.get('filter') || 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [resolvingTicket, setResolvingTicket] = useState<Complaint | null>(null);

  useEffect(() => {
    const s = searchParams.get('status') || searchParams.get('filter');
    if (s) {
      setFilterStatus(s);
    }
  }, [searchParams]);

  // New Complaint Form
  const [formData, setFormData] = useState({
    complainant_name: '',
    complainant_phone: '',
    category: 'delay' as Complaint['category'],
    priority: 'high' as Complaint['priority'],
    description: '',
    responsible_department_id: 'ops' as const,
    assigned_resolver_id: 'emp-005',
    student_id: '',
  });

  // Resolution Form
  const [resolutionData, setResolutionData] = useState({
    root_cause_analysis: '',
    corrective_action: '',
    preventative_action: '',
  });

  useEffect(() => {
    return bctStore.subscribe(() => {
      setComplaints(bctStore.getComplaints());
    });
  }, []);

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = 
      c.ticket_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.complainant_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.description.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'open' ? (c.status !== 'resolved' && c.status !== 'closed') :
      filterStatus === 'overdue' ? (c.status !== 'resolved' && c.status !== 'closed' && Boolean(c.sla_resolution_deadline_at && new Date(c.sla_resolution_deadline_at) < new Date())) :
      c.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.complainant_name || !formData.description) return;

    // Dynamic SLA from central settings
    const complaintSLA = bctStore.getSLAConfigByCode('SLA-TASK-COMPLAINT') || bctStore.getSLAConfigs('complaint')[0];
    const deadline = complaintSLA
      ? calculateSLADeadline(new Date(), complaintSLA.duration_value, complaintSLA.duration_unit, complaintSLA.business_days_only)
      : (() => { const d = new Date(); d.setDate(d.getDate() + 3); return d; })();

    bctStore.createComplaint({
      complainant_name: formData.complainant_name,
      complainant_phone: formData.complainant_phone,
      category: formData.category,
      priority: formData.priority,
      description: formData.description,
      responsible_department_id: formData.responsible_department_id,
      assigned_resolver_id: formData.assigned_resolver_id,
      student_id: formData.student_id || undefined,
      first_response_at: new Date().toISOString(),
      sla_resolution_deadline_at: deadline.toISOString(),
      status: 'new'
    }, currentUser?.username || 'admin');

    setIsModalOpen(false);
  };

  const handleResolveComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTicket) return;

    bctStore.resolveComplaint(
      resolvingTicket.id,
      resolutionData.root_cause_analysis,
      resolutionData.corrective_action,
      resolutionData.preventative_action,
      currentUser?.username || 'qa'
    );

    setResolvingTicket(null);
    setResolutionData({ root_cause_analysis: '', corrective_action: '', preventative_action: '' });
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-bct-navy">
            {t('nav.complaints')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? `إدارة شكاوى الطلاب والسمعة: رقم تسلسلي، مالك محدد، مهلة إغلاق ${complaintSlaLabel}، وتحليل السبب الجذري.`
              : `Quality Grievance Center: Serialized tickets, assigned owners, ${complaintSlaLabelEn} SLA, and root-cause analysis.`}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'تسجيل شكوى جديدة' : 'New Complaint Ticket'}</span>
        </button>
      </div>

      {/* Overview Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">إجمالي التذاكر المسجلة</span>
            <p className="text-xl font-black text-slate-800 mt-0.5">{complaints.length}</p>
          </div>
          <AlertCircle className="w-8 h-8 text-slate-400" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">
              {language === 'ar' ? `تذاكر قيد المعالجة (مهلة ${complaintSlaLabel})` : `Active Tickets (${complaintSlaLabelEn} SLA)`}
            </span>
            <p className="text-xl font-black text-amber-600 mt-0.5">
              {complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').length}
            </p>
          </div>
          <Clock className="w-8 h-8 text-amber-500" />
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-500 font-semibold">شكاوى تم حلها وتوثيق أسبابها</span>
            <p className="text-xl font-black text-emerald-600 mt-0.5">
              {complaints.filter(c => c.status === 'resolved' || c.status === 'closed').length}
            </p>
          </div>
          <CheckCircle className="w-8 h-8 text-emerald-500" />
        </div>
      </div>

      {/* Complaints List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Search Toolbar */}
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row gap-3 items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="بحث برقم التذكرة أو اسم الشاكي..."
              className="w-full ps-9 pe-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
            {[
              { id: 'all', label_ar: 'الكل' },
              { id: 'open', label_ar: 'مفتوحة (قيد المعالجة)' },
              { id: 'new', label_ar: 'جديدة' },
              { id: 'resolved', label_ar: 'تم حلها' },
            ].map(f => (
              <button
                key={f.id}
                onClick={() => setFilterStatus(f.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                  filterStatus === f.id
                    ? 'bg-bct-navy text-white'
                    : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {f.label_ar}
              </button>
            ))}
          </div>
        </div>

        {/* A. RESPONSIVE CARDS VIEW FOR SMALL & MEDIUM SCREENS (< lg) - ZERO HORIZONTAL SCROLLING */}
        <div className="lg:hidden space-y-3 p-3">
          {filteredComplaints.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              لا توجد شكاوى مسجلة تطابق الفلاتر المحددة
            </div>
          ) : (
            filteredComplaints.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2.5">
                {/* Header: Ticket Code + Priority + Status */}
                <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 font-mono font-bold text-bct-navy text-xs">
                    <span>{c.ticket_code}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase whitespace-nowrap ${
                      c.priority === 'critical' || c.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.priority}
                    </span>
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                      c.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {c.status === 'resolved' ? 'تم الحل' : 'قيد المعالجة'}
                    </span>
                  </div>
                </div>

                {/* Complainant & Category */}
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900">{c.complainant_name}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{c.complainant_phone}</span>
                  </div>
                  <span className="text-slate-600 font-semibold text-[11px] bg-slate-100 px-2 py-0.5 rounded">
                    {c.category}
                  </span>
                </div>

                {/* Description */}
                <div className="text-[11px] text-slate-600 bg-slate-50/70 p-2 rounded-lg space-y-1">
                  <p className="line-clamp-2">{c.description}</p>
                  {c.root_cause_analysis && (
                    <p className="text-[10px] text-emerald-700 font-semibold">
                      السبب: {c.root_cause_analysis}
                    </p>
                  )}
                </div>

                {/* Footer: Resolver & Action */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px] text-slate-500">
                  <span>المسؤول: <strong className="text-slate-700">{c.assigned_resolver?.full_name_ar || '—'}</strong> ({c.responsible_department_id?.toUpperCase()})</span>
                  {c.status !== 'resolved' ? (
                    <button
                      onClick={() => {
                        setResolvingTicket(c);
                        setResolutionData({
                          root_cause_analysis: c.root_cause_analysis || '',
                          corrective_action: c.corrective_action || '',
                          preventative_action: c.preventative_action || '',
                        });
                      }}
                      className="px-2.5 py-1 rounded bg-bct-navy text-white text-[11px] font-bold hover:bg-bct-dark transition cursor-pointer"
                    >
                      تسجيل الحل
                    </button>
                  ) : (
                    <span className="text-emerald-700 font-bold">✓ مكتمل وموثق</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* B. FULL VISIBILITY TABLE FOR DESKTOPS & LAPTOPS (lg+) - NO HORIZONTAL SCROLLBAR */}
        <div className="hidden lg:block w-full overflow-hidden">
          <table className="w-full text-xs text-start border-collapse table-auto xl:table-fixed">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-700 font-bold text-[11px] xl:text-xs">
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[12%]">رقم التذكرة</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[16%]">الشاكي والاتصال</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[14%]">التصنيف والأولوية</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[24%]">تفاصيل الشكوى</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[12%]">المسؤول عن الحل</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-start whitespace-nowrap w-[12%]">الحالة والمهلة</th>
                <th className="py-2.5 px-2 xl:px-2.5 text-end whitespace-nowrap w-[10%]">الإجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredComplaints.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-2 px-2 xl:px-2.5 font-mono font-bold text-bct-navy whitespace-nowrap">
                    {c.ticket_code}
                  </td>

                  <td className="py-2 px-2 xl:px-2.5">
                    <div className="font-bold text-slate-900 leading-tight">{c.complainant_name}</div>
                    <div className="text-[10px] text-slate-400 font-mono whitespace-nowrap">{c.complainant_phone}</div>
                  </td>

                  <td className="py-2 px-2 xl:px-2.5">
                    <span className="font-semibold text-slate-700 block whitespace-nowrap">{c.category}</span>
                    <span className={`inline-block px-1.5 py-0.2 rounded text-[9px] font-bold uppercase whitespace-nowrap ${
                      c.priority === 'critical' || c.priority === 'high' ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {c.priority}
                    </span>
                  </td>

                  <td className="py-2 px-2 xl:px-2.5">
                    <p className="line-clamp-2 text-slate-600 leading-snug">
                      {c.description}
                    </p>
                    {c.root_cause_analysis && (
                      <p className="text-[10px] text-emerald-700 mt-0.5 line-clamp-1 font-semibold">
                        السبب: {c.root_cause_analysis}
                      </p>
                    )}
                  </td>

                  <td className="py-2 px-2 xl:px-2.5 whitespace-nowrap">
                    <span className="font-semibold text-slate-800 text-[11px] block">{c.assigned_resolver?.full_name_ar}</span>
                    <span className="text-[10px] text-slate-400 font-mono block">{c.responsible_department_id?.toUpperCase()}</span>
                  </td>

                  <td className="py-2 px-2 xl:px-2.5 whitespace-nowrap">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                      c.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                    }`}>
                      {c.status === 'resolved' ? 'تم الحل والتوثيق' : 'قيد المعالجة (3 أيام)'}
                    </span>
                  </td>

                  <td className="py-2 px-2 xl:px-2.5 text-end whitespace-nowrap">
                    {c.status !== 'resolved' ? (
                      <button
                        onClick={() => {
                          setResolvingTicket(c);
                          setResolutionData({
                            root_cause_analysis: c.root_cause_analysis || '',
                            corrective_action: c.corrective_action || '',
                            preventative_action: c.preventative_action || '',
                          });
                        }}
                        className="px-2.5 py-1 rounded-lg bg-bct-navy text-white text-[11px] font-bold hover:bg-bct-dark transition cursor-pointer whitespace-nowrap"
                      >
                        تسجيل الحل
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">مكتمل وموثق</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      </div>

      {/* Modal: New Complaint */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">تسجيل شكوى عميل جديدة</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateComplaint} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">اسم الشاكي *</label>
                <input
                  type="text"
                  required
                  value={formData.complainant_name}
                  onChange={(e) => setFormData({ ...formData, complainant_name: e.target.value })}
                  placeholder="اسم الطالب أو ولي الأمر"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">رقم الهاتف للتواصل *</label>
                <input
                  type="text"
                  required
                  value={formData.complainant_phone}
                  onChange={(e) => setFormData({ ...formData, complainant_phone: e.target.value })}
                  placeholder="+249XXXXXXXX أو +201XXXXXXXX"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">تصنيف الشكوى</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  >
                    <option value="delay">تأخر في الإجراء أو المتابعة</option>
                    <option value="wrong_choice">خطأ في الرغبات أو المنصة</option>
                    <option value="financial">استفسار أو نزاع مالي</option>
                    <option value="documentation">أوراق أو توثيق سفارات</option>
                    <option value="attitude">سلوك أو خدمة عملاء</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الأولوية</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white font-bold"
                  >
                    <option value="high">مرتفعة (High)</option>
                    <option value="critical">حرجة جداً (Critical)</option>
                    <option value="medium">متوسطة (Medium)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">نص الشكوى وملاحظات العميل *</label>
                <textarea
                  required
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="اشرح المشكلة بدقة وفق رواية العميل..."
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-bct-navy text-white font-bold hover:bg-bct-dark"
                >
                  تسجيل وفتح تذكرة الشكوى
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Resolve Complaint */}
      {resolvingTicket && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <div>
                <h3 className="font-bold text-sm text-slate-800">توثيق حل الشكوى وتحليل السبب الجذري</h3>
                <span className="text-[11px] text-slate-400 font-mono">{resolvingTicket.ticket_code}</span>
              </div>
              <button onClick={() => setResolvingTicket(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleResolveComplaint} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">السبب الجذري للمشكلة (Root Cause Analysis) *</label>
                <textarea
                  required
                  rows={2}
                  value={resolutionData.root_cause_analysis}
                  onChange={(e) => setResolutionData({ ...resolutionData, root_cause_analysis: e.target.value })}
                  placeholder="ما هو السبب الأساسي الذي أدى لظهور هذه الشكوى؟"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الإجراء التصحيحي المتخذ مع العميل *</label>
                <textarea
                  required
                  rows={2}
                  value={resolutionData.corrective_action}
                  onChange={(e) => setResolutionData({ ...resolutionData, corrective_action: e.target.value })}
                  placeholder="كيف تم حل المشكلة مع الطالب ورأب الصدع؟"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الإجراء الوقائي لمنع التكرار (Preventative Action) *</label>
                <textarea
                  required
                  rows={2}
                  value={resolutionData.preventative_action}
                  onChange={(e) => setResolutionData({ ...resolutionData, preventative_action: e.target.value })}
                  placeholder="ما الإجراء الإداري أو البرمجي لضمان عدم تكرار هذا الخطأ؟"
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingTicket(null)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 font-bold"
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white font-bold hover:bg-emerald-700"
                >
                  اعتماد الحل وإغلاق التذكرة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
