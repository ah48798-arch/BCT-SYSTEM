import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import {
  MessageSquare,
  Phone,
  Send,
  User,
  Clock,
  CheckCircle2,
  AlertCircle,
  Tag,
  ArrowRight,
  Filter,
  Search,
  ExternalLink,
  UserCheck,
  FilePlus,
  Zap
} from 'lucide-react';

interface MockMessage {
  id: string;
  sender: 'client' | 'agent';
  text: string;
  timestamp: string;
}

interface Conversation {
  id: string;
  clientName: string;
  phone: string;
  channel: 'whatsapp' | 'imo' | 'phone' | 'walkin';
  country: string;
  interest: string;
  lastMessage: string;
  unreadCount: number;
  slaMinutesLeft: number;
  status: 'active' | 'handed_over' | 'resolved';
  assignedConsultantId?: string;
  messages: MockMessage[];
}

const CANNED_RESPONSES = [
  {
    titleAr: 'رسالة الترحيب والتعريف بـ بي سي تي للاستشارات التعليمية والتدريب',
    titleEn: 'BCT Educational Consulting & Training Welcome & Intro',
    text: 'أهلاً بك في بي سي تي للاستشارات التعليمية والتدريب في مصر. يسعدنا مساعدتك في تأمين قبولك الجامعي وتوثيق شهاداتك بأعلى معايير الدقة والسرعة. ما هي الكلية أو التخصص والجامعة التي ترغب بالدراسة فيها؟'
  },
  {
    titleAr: 'قائمة الأوراق والمستندات المطلوبة',
    titleEn: 'Document Requirements',
    text: 'الأوراق الأساسية المطلوبة للتقديم: 1) أصل الشهادة الثانوية موثقة من الخارجية. 2) صورة جواز السفر ساري المفعول. 3) صورة شخصية حديثة. 4) شهادة الميلاد. هل المستندات متوفرة لديك حالياً؟'
  },
  {
    titleAr: 'رسوم التقديم وبوابات السداد المعتمدة',
    titleEn: 'Payment Options & Verification',
    text: 'رسوم فتح الملف والتسجيل المعتمد تُسدد رسمياً عبر الحسابات البنكية المعتمدة لـ بي سي تي للاستشارات التعليمية والتدريب أو إيداع فوري بإيصال رسمي مختوم. سيتم تزويدك بإيصال رسمي مسجل فور استلام السداد.'
  },
  {
    titleAr: 'تحويل الملف إلى المستشار التعليمي المتخصص',
    titleEn: 'Consultant Handover Note',
    text: 'بناءً على طلبكم، تم تحويل ملفكم إلى المستشار التعليمي المتخصص للتواصل معكم وتحديد أفضل الجامعات المناسبة لمجموعكم وميزانيتكم خلال 30 دقيقة.'
  }
];

export const CustomerServiceInbox: React.FC = () => {
  const { isRtl } = useLanguage();
  const { currentEmployee } = useAuth();
  const [, setStoreVersion] = useState(0);

  useEffect(() => {
    return bctStore.subscribe(() => {
      setStoreVersion(v => v + 1);
    });
  }, []);

  const consultants = bctStore.getEmployees().filter(e => e.job_title_code === 'educational_consultant' || e.job_title_code === 'head_of_consultants');

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-01',
      clientName: 'طارق عبد المحمود',
      phone: '+249 91 234 5678',
      channel: 'whatsapp',
      country: 'السودان',
      interest: 'طب بشري - جامعة القاهرة / عين شمس',
      lastMessage: 'السلام عليكم، كم معدل القبول المطلوب لطلاب الشهادة السودانية في طب قصر العيني؟',
      unreadCount: 1,
      slaMinutesLeft: 8,
      status: 'active',
      messages: [
        { id: 'm1', sender: 'client', text: 'السلام عليكم، كم معدل القبول المطلوب لطلاب الشهادة السودانية في طب قصر العيني؟ وما هي مواعيد التقديم؟', timestamp: '14:22' }
      ]
    },
    {
      id: 'conv-02',
      clientName: 'خالد عبد الله العتيبي',
      phone: '+966 50 889 1234',
      channel: 'whatsapp',
      country: 'السعودية',
      interest: 'هندسة حاسوب وذكاء اصطناعي',
      lastMessage: 'أرسلت صور شهادة الثانوية والقدرات، هل تكفي لبدء الإجراءات؟',
      unreadCount: 0,
      slaMinutesLeft: 12,
      status: 'active',
      messages: [
        { id: 'm2', sender: 'client', text: 'مرحباً، أود الاستفسار عن برامج الهندسة في الجامعات الخاصة والأهلية بمصر.', timestamp: '13:50' },
        { id: 'm3', sender: 'agent', text: 'أهلاً بك أخي الكريم خالد. برامج الهندسة متاحة في عدة جامعات مرموقة. أرسل لنا الشهادات لنفحصها ونزودك بالخيارات المتاحة.', timestamp: '13:53' },
        { id: 'm4', sender: 'client', text: 'أرسلت صور شهادة الثانوية والقدرات، هل تكفي لبدء الإجراءات؟', timestamp: '14:05' }
      ]
    },
    {
      id: 'conv-03',
      clientName: 'منال عيسى',
      phone: '+249 92 444 8877',
      channel: 'imo',
      country: 'السودان',
      interest: 'توثيق شهادة الماجستير من التعليم العالي والخارجية',
      lastMessage: 'هل يمكنكم استلام الشهادة من أخي بالقاهرة وتسليمها موثقة؟',
      unreadCount: 0,
      slaMinutesLeft: 0,
      status: 'handed_over',
      assignedConsultantId: 'emp-003',
      messages: [
        { id: 'm5', sender: 'client', text: 'هل يمكنكم استلام الشهادة من أخي بالقاهرة وتسليمها موثقة؟', timestamp: '11:15' },
        { id: 'm6', sender: 'agent', text: 'نعم بالتأكيد يا فندم، مندوب العلاقات الخارجية لدينا يتعامل مع كافة السفارات والوزارات. تم تحويلكم للمستشار عمر لاستكمال الإجراءات.', timestamp: '11:25' }
      ]
    }
  ]);

  const [selectedConvId, setSelectedConvId] = useState<string>('conv-01');
  const [inputText, setInputText] = useState('');
  const [isHandoverModalOpen, setIsHandoverModalOpen] = useState(false);
  const [selectedConsultant, setSelectedConsultant] = useState(consultants[0]?.id || '');
  const [handoverNotes, setHandoverNotes] = useState('');

  const activeConv = conversations.find(c => c.id === selectedConvId);

  const handleSendMessage = () => {
    if (!inputText.trim() || !activeConv) return;
    const newMsg: MockMessage = {
      id: `m-${Date.now()}`,
      sender: 'agent',
      text: inputText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setConversations(prev =>
      prev.map(c => {
        if (c.id === selectedConvId) {
          return {
            ...c,
            lastMessage: inputText,
            messages: [...c.messages, newMsg],
            unreadCount: 0
          };
        }
        return c;
      })
    );
    setInputText('');
  };

  const handleApplyCanned = (text: string) => {
    setInputText(text);
  };

  const handleConfirmHandover = () => {
    if (!activeConv) return;
    const consultant = consultants.find(e => e.id === selectedConsultant);

    setConversations(prev =>
      prev.map(c => {
        if (c.id === selectedConvId) {
          return {
            ...c,
            status: 'handed_over',
            assignedConsultantId: selectedConsultant,
            messages: [
              ...c.messages,
              {
                id: `m-ho-${Date.now()}`,
                sender: 'agent',
                text: `[بي سي تي للاستشارات التعليمية والتدريب]: تم تسليم المحادثة رسمياً للمستشار ${consultant?.full_name_ar || ''}. الملاحظات: ${handoverNotes || 'تم استيفاء البيانات الأولية جاهز للتسجيل'}`,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              }
            ]
          };
        }
        return c;
      })
    );

    bctStore.addAuditLog(
      currentEmployee?.username || 'officer',
      'CUSTOMER_HANDOVER_TO_CONSULTANT',
      'conversation',
      activeConv.id,
      { consultant: consultant?.full_name_ar, notes: handoverNotes }
    );

    setIsHandoverModalOpen(false);
    setHandoverNotes('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-bct-navy text-white rounded-lg">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isRtl ? 'صندوق الوارد الموحد وخدمة العملاء' : 'Omni-Channel Customer Inbox'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isRtl
              ? 'متابعة استفسارات واتساب، إيمو والهاتف، تطبيق معيار الرد السريع (≤ 15 دقيقة)، والتحويل الآلي للمستشارين'
              : 'Unified WhatsApp, IMO & Phone queries with 15-minute SLA tracking and consultant handoffs'}
          </p>
        </div>

        {/* SLA Status Widget */}
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl self-start sm:self-auto">
          <Clock className="w-5 h-5 text-emerald-600 animate-pulse" />
          <div>
            <span className="text-xs font-bold text-emerald-800 block">
              {isRtl ? 'اتفاقية مستوى الرد (SLA): 15 دقيقة' : 'Response SLA: 15 Mins'}
            </span>
            <span className="text-[11px] text-emerald-600">
              {isRtl ? 'متوسط سرعة الرد اليوم: 6.4 دقائق' : 'Today Avg Speed: 6.4m'}
            </span>
          </div>
        </div>
      </div>

      {/* Main Inbox Grid */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
        {/* Left/Right Column: Conversations List (4 spans) */}
        <div className="lg:col-span-4 border-b lg:border-b-0 rtl:border-l ltr:border-r border-slate-100 flex flex-col">
          {/* Search Bar */}
          <div className="p-3 border-b border-slate-100 bg-slate-50/50">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 rtl:right-3 ltr:left-3 top-2.5" />
              <input
                type="text"
                placeholder={isRtl ? 'بحث بالاسم أو الهاتف...' : 'Search name or phone...'}
                className="w-full bg-white border border-slate-200 rounded-xl py-1.5 rtl:pr-9 rtl:pl-3 ltr:pl-9 ltr:pr-3 text-xs focus:ring-2 focus:ring-bct-navy focus:outline-none"
              />
            </div>
          </div>

          {/* Conversations Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {conversations.map(conv => {
              const isSelected = conv.id === selectedConvId;
              return (
                <div
                  key={conv.id}
                  onClick={() => setSelectedConvId(conv.id)}
                  className={`p-4 cursor-pointer transition-colors ${isSelected ? 'bg-blue-50/70 border-r-4 rtl:border-r-4 ltr:border-l-4 border-bct-navy' : 'hover:bg-slate-50/60'}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-slate-800 text-sm truncate max-w-[160px]">
                      {conv.clientName}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {conv.channel.toUpperCase()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-500 truncate mb-2">
                    {conv.lastMessage}
                  </p>

                  <div className="flex items-center justify-between text-[11px]">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 font-medium">
                      {conv.country}
                    </span>

                    {conv.status === 'active' && conv.slaMinutesLeft > 0 && (
                      <span className="flex items-center gap-1 text-emerald-600 font-bold">
                        <Clock className="w-3 h-3" />
                        <span>{conv.slaMinutesLeft} د متبقية</span>
                      </span>
                    )}

                    {conv.status === 'handed_over' && (
                      <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-700 font-bold">
                        {isRtl ? 'تم التحويل للمستشار' : 'Handed Over'}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Conversation Thread (8 spans) */}
        {activeConv ? (
          <div className="lg:col-span-8 flex flex-col justify-between h-[600px]">
            {/* Conversation Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-bct-navy text-white flex items-center justify-center font-bold text-sm">
                  {activeConv.clientName.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{activeConv.clientName}</h3>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-mono">{activeConv.phone}</span>
                    <span>•</span>
                    <span>{activeConv.interest}</span>
                  </div>
                </div>
              </div>

              {/* Handover & Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsHandoverModalOpen(true)}
                  className="px-3 py-1.5 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-lg text-xs font-bold shadow flex items-center gap-1.5 transition-colors"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تحويل لمستشار تعليمي' : 'Handover to Consultant'}</span>
                </button>
              </div>
            </div>

            {/* Messages Scroll Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
              {activeConv.messages.map(msg => {
                const isAgent = msg.sender === 'agent';
                return (
                  <div key={msg.id} className={`flex flex-col ${isAgent ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${isAgent ? 'bg-bct-navy text-white rounded-br-none rtl:rounded-bl-none rtl:rounded-br-2xl shadow-sm' : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none rtl:rounded-br-none rtl:rounded-bl-2xl shadow-sm'}`}
                    >
                      {msg.text}
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
                      {msg.timestamp}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Canned Quick Responses Bar */}
            <div className="p-2 bg-slate-100/70 border-t border-slate-200 flex gap-2 overflow-x-auto text-[11px]">
              <span className="text-slate-500 font-bold self-center px-2 flex-shrink-0 flex items-center gap-1">
                <Zap className="w-3 h-3 text-amber-500" />
                {isRtl ? 'ردود جاهزة:' : 'Quick templates:'}
              </span>
              {CANNED_RESPONSES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyCanned(tmpl.text)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-md text-slate-700 whitespace-nowrap transition-colors"
                >
                  {isRtl ? tmpl.titleAr : tmpl.titleEn}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 border-t border-slate-200 bg-white flex items-center gap-2">
              <input
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                placeholder={isRtl ? 'اكتب ردك هنا ثم اضغط إرسال...' : 'Type response and hit send...'}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-bct-navy focus:outline-none"
              />
              <button
                onClick={handleSendMessage}
                className="p-2.5 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl shadow transition-colors flex items-center justify-center"
              >
                <Send className="w-4 h-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
        ) : (
          <div className="lg:col-span-8 flex items-center justify-center p-8 text-slate-400 text-sm">
            {isRtl ? 'اختر محادثة من القائمة للبدء' : 'Select a conversation to view'}
          </div>
        )}
      </div>

      {/* Handover Modal */}
      {isHandoverModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 bg-bct-navy text-white">
              <h3 className="text-lg font-bold">
                {isRtl ? 'تسليم الملف إلى المستشار التعليمي' : 'Consultant Handover'}
              </h3>
              <p className="text-xs text-blue-100/80 mt-1">
                {isRtl ? 'وفقاً لقواعد التداخل: لا يترك الطالب بدون مستشار مسؤول' : 'Overlap Rule: File must be explicitly handed over with notes'}
              </p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  {isRtl ? 'اختر المستشار التعليمي المستلم *' : 'Assigned Consultant *'}
                </label>
                <select
                  value={selectedConsultant}
                  onChange={e => setSelectedConsultant(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:ring-2 focus:ring-bct-navy focus:outline-none font-semibold"
                >
                  {consultants.map(c => (
                    <option key={c.id} value={c.id}>
                      {isRtl ? c.full_name_ar : c.full_name_en} - ({c.job_title_ar})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  {isRtl ? 'ملخص الاستفسار ورغبات الطالب *' : 'Handover Brief & Student Desires *'}
                </label>
                <textarea
                  rows={3}
                  value={handoverNotes}
                  onChange={e => setHandoverNotes(e.target.value)}
                  placeholder={isRtl ? 'مثال: الطالب يرغب بطب عين شمس، حاصل على 88% شهادة سودانية، الميزانية 7000$ سنوي...' : 'Summary of student preferences and budget...'}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:ring-2 focus:ring-bct-navy focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsHandoverModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleConfirmHandover}
                  className="px-5 py-2 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-xs font-bold shadow"
                >
                  {isRtl ? 'تأكيد التسليم الرسمي' : 'Confirm Handover'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
