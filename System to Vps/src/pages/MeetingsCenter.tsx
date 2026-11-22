import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import {
  Calendar,
  Clock,
  Users,
  CheckCircle2,
  Plus,
  FileText,
  UserCheck,
  ChevronRight,
  Filter,
  Layers,
  Award
} from 'lucide-react';

const STANDARD_MEETINGS = [
  {
    type: 'daily_standup',
    titleAr: 'اللقاء اليومي الصباحي السريع (Daily Standup)',
    titleEn: 'Daily Ops Standup',
    frequencyAr: 'يومياً (15 دقيقة) - 9:00 صباحاً',
    chairAr: 'أحمد إبراهيم (مدير العمليات)',
    agendaAr: 'حصر الملفات الحرجة والمتأخرة، توزيع مهام المعقب على السفارات، والتسليمات المجدولة بين الأقسام.',
    duration: '15 د'
  },
  {
    type: 'weekly_ops',
    titleAr: 'الاجتماع التشغيلي الأسبوعي (Weekly Ops Review)',
    titleEn: 'Weekly Operational Review',
    frequencyAr: 'أسبوعياً (كل أحد) - 10:00 صباحاً',
    chairAr: 'أحمد إبراهيم (مدير العمليات)',
    agendaAr: 'مراجعة أداء خط الأنابيب (Pipeline)، تقييم سرعة الإنجاز، معالجة الاختناقات التشغيلية مع المعقب ومسؤولي التوثيق.',
    duration: '45 د'
  },
  {
    type: 'weekly_mgmt',
    titleAr: 'اجتماع الإدارة العامة الأسبوعي (Weekly Management)',
    titleEn: 'Weekly Executive Management',
    frequencyAr: 'أسبوعياً (كل اثنين) - 11:00 صباحاً',
    chairAr: 'خليل محمد (المدير العام)',
    agendaAr: 'مراجعة الموقف المالي والتحصيل، تدقيق تقارير الطاقة الاستيعابية لحملات التسويق، والبت في القرارات السيادية.',
    duration: '60 د'
  },
  {
    type: 'chat_audit',
    titleAr: 'جلسة تدقيق المحادثات وخدمة العملاء (Chat Audit)',
    titleEn: 'Bi-Weekly Chat & CX Audit',
    frequencyAr: 'كل أسبوعين (كل ثلاثاء)',
    chairAr: 'محمود عبد السلام (مسؤول الجودة والسمعة)',
    agendaAr: 'فحص عينات عشوائية من محادثات واتساب وإيمو، قياس زمن الاستجابة، وتقييم جودة الردود والالتزام بالنصوص الرسمية.',
    duration: '45 د'
  },
  {
    type: 'monthly_budget',
    titleAr: 'اجتماع الميزانية والتحصيل الشهري (Monthly Financials)',
    titleEn: 'Monthly Budget & Collections',
    frequencyAr: 'شهرياً (نهاية كل شهر)',
    chairAr: 'طارق عبد العزيز (المدير المالي والإداري)',
    agendaAr: 'مطابقة الإيرادات، مراجعة رصيد صندوق الطوارئ، فحص متأخرات الطلاب، واعتماد المصروفات التشغيلية.',
    duration: '60 د'
  },
  {
    type: 'improvement_review',
    titleAr: 'جلسة التحسين المستمر وضبط الجودة (Kaizen Review)',
    titleEn: 'Monthly Quality Improvement',
    frequencyAr: 'شهرياً (الأسبوع الأول من الشهر)',
    chairAr: 'محمود عبد السلام (مسؤول الجودة والسمعة)',
    agendaAr: 'تحليل الشكاوى المتكررة، مراجعة الأخطاء في التوثيق أو التقديم، واعتماد خطط العمل التصحيحية والوقائية.',
    duration: '45 د'
  },
  {
    type: 'quarterly_appraisal',
    titleAr: 'التقييم المؤسسي ربع السنوي (Quarterly Strategy)',
    titleEn: 'Quarterly Strategic Appraisal',
    frequencyAr: 'ربع سنوي (كل 3 أشهر)',
    chairAr: 'خليل محمد (المدير العام)',
    agendaAr: 'مراجعة مؤشرات الأداء الاستراتيجية، تقدم خطة الـ 90 يوماً، مراجعة مصفوفة RACI، ومكافآت التميز الوظيفي.',
    duration: '90 د'
  }
];

export const MeetingsCenter: React.FC = () => {
  const { isRtl } = useLanguage();
  const { currentEmployee } = useAuth();

  const [meetings, setMeetings] = useState<any[]>(bctStore.getMeetings());
  const [selectedMeetingType, setSelectedMeetingType] = useState<string>('all');
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  const [recordForm, setRecordForm] = useState({
    meeting_type: 'daily_standup',
    meeting_date: new Date().toISOString().split('T')[0],
    chairperson_ar: 'أحمد إبراهيم (مدير العمليات)',
    agenda: '',
    decisions: '',
    attendees_count: 5
  });

  useEffect(() => {
    const unsub = bctStore.subscribe(() => {
      setMeetings([...bctStore.getMeetings()]);
    });
    return unsub;
  }, []);

  const handleRecordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForm.decisions) return;

    bctStore.createMeeting(
      {
        ...recordForm,
        attendees_count: Number(recordForm.attendees_count)
      },
      currentEmployee?.username || 'admin'
    );

    setIsRecordModalOpen(false);
  };

  const filteredMeetings = selectedMeetingType === 'all'
    ? meetings
    : meetings.filter(m => m.meeting_type === selectedMeetingType);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-bct-navy text-white rounded-lg">
              <Calendar className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isRtl ? 'إيقاع الاجتماعات الإدارية والقرارات المؤسسية' : 'Administrative Cadence Meetings'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isRtl
              ? 'الاجتماعات الدورية السبعة المعتمدة في دليل بي سي تي للاستشارات التعليمية والتدريب: توثيق المحاضر، القرارات، والتكليفات'
              : 'The 7 mandatory operational cadence meetings in BCT Educational Consulting & Training manual'}
          </p>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="px-4 py-2.5 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-sm font-bold shadow flex items-center gap-2 transition-colors self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{isRtl ? 'توثيق محضر اجتماع' : 'Record Meeting Minutes'}</span>
        </button>
      </div>

      {/* The 7 Standard Cadence Meetings Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {STANDARD_MEETINGS.map(sm => (
          <div key={sm.type} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-bct-navy px-2.5 py-0.5 bg-bct-navy/10 rounded-full">
                  {sm.frequencyAr}
                </span>
                <span className="text-xs text-slate-400 font-mono">{sm.duration}</span>
              </div>

              <h3 className="font-bold text-slate-800 text-sm mb-1">{sm.titleAr}</h3>
              <span className="text-xs text-slate-500 block mb-3">{sm.chairAr}</span>

              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                {sm.agendaAr}
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  setRecordForm({
                    ...recordForm,
                    meeting_type: sm.type,
                    chairperson_ar: sm.chairAr,
                    agenda: sm.agendaAr
                  });
                  setIsRecordModalOpen(true);
                }}
                className="text-xs font-bold text-bct-navy hover:underline flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تسجيل محضر لهذه الجلسة' : 'Record Minutes'}</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Recorded Meetings Minutes History */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 space-y-4">
        <h3 className="font-bold text-slate-800 text-base">
          {isRtl ? 'سجل محاضر الاجتماعات والقرارات المعتمدة' : 'Official Meeting Records & Decisions'}
        </h3>

        <div className="space-y-3">
          {filteredMeetings.map(mtg => (
            <div key={mtg.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">{mtg.chairperson_ar}</span>
                  <span className="text-slate-400 font-mono">• {mtg.meeting_date}</span>
                </div>
                <span className="px-2 py-0.5 bg-blue-50 text-bct-navy rounded font-semibold text-[11px]">
                  {mtg.attendees_count} {isRtl ? 'حضور' : 'attendees'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="font-bold text-slate-500 block mb-0.5">{isRtl ? 'جدول الأعمال والمحاور:' : 'Agenda:'}</span>
                  <p className="text-slate-700">{mtg.agenda}</p>
                </div>
                <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-100">
                  <span className="font-bold text-emerald-800 block mb-0.5">{isRtl ? 'القرارات المتخذة والتكليفات:' : 'Decisions & Actions:'}</span>
                  <p className="text-emerald-950 font-medium">{mtg.decisions}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Record Minutes Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 bg-bct-navy text-white">
              <h3 className="text-lg font-bold">
                {isRtl ? 'توثيق محضر اجتماع إداري' : 'Record Meeting Minutes'}
              </h3>
              <p className="text-xs text-blue-100/80 mt-1">
                {isRtl ? 'حفظ القرارات الملزمة والمخرجات التنفيذية للجلسة' : 'Document binding decisions and operational action items'}
              </p>
            </div>

            <form onSubmit={handleRecordSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-600 uppercase block mb-1">
                    {isRtl ? 'نوع الاجتماع *' : 'Meeting Type *'}
                  </label>
                  <select
                    value={recordForm.meeting_type}
                    onChange={e => setRecordForm({ ...recordForm, meeting_type: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-bct-navy focus:outline-none"
                  >
                    {STANDARD_MEETINGS.map(sm => (
                      <option key={sm.type} value={sm.type}>{sm.titleAr}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-600 uppercase block mb-1">
                    {isRtl ? 'تاريخ الانعقاد *' : 'Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={recordForm.meeting_date}
                    onChange={e => setRecordForm({ ...recordForm, meeting_date: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-bct-navy focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="font-bold text-slate-600 uppercase block mb-1">
                    {isRtl ? 'رئيس الجلسة *' : 'Chairperson *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={recordForm.chairperson_ar}
                    onChange={e => setRecordForm({ ...recordForm, chairperson_ar: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-bct-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="font-bold text-slate-600 uppercase block mb-1">
                    {isRtl ? 'عدد الحضور *' : 'Attendees Count *'}
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={recordForm.attendees_count}
                    onChange={e => setRecordForm({ ...recordForm, attendees_count: Number(e.target.value) })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs focus:ring-2 focus:ring-bct-navy focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-600 uppercase block mb-1">
                  {isRtl ? 'أبرز محاور النقاش *' : 'Agenda Topics *'}
                </label>
                <textarea
                  rows={2}
                  required
                  value={recordForm.agenda}
                  onChange={e => setRecordForm({ ...recordForm, agenda: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-bct-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="font-bold text-slate-600 uppercase block mb-1">
                  {isRtl ? 'القرارات المتخذة والتكليفات الملزمة *' : 'Binding Decisions & Actions *'}
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder={isRtl ? 'سجل القرارات المعتمدة ومن كلف بمتابعتها...' : 'Document binding decisions and assignees...'}
                  value={recordForm.decisions}
                  onChange={e => setRecordForm({ ...recordForm, decisions: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-bct-navy focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl font-bold shadow"
                >
                  {isRtl ? 'اعتماد وحفظ المحضر' : 'Save Minutes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
