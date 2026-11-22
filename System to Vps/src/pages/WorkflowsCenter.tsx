import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  Workflow, 
  CheckCircle, 
  Clock, 
  User, 
  ArrowRight, 
  Layers, 
  Target, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';

export const WorkflowsCenter: React.FC = () => {
  const { t, language } = useLanguage();
  const [activeWorkflowId, setActiveWorkflowId] = useState<'wf1' | 'wf2' | 'wf3' | 'wf4' | 'wf5'>('wf1');

  const WORKFLOWS = [
    {
      id: 'wf1' as const,
      title_ar: '1. من الاستفسار إلى التسجيل',
      title_en: '1. Inquiry to Registration',
      owner_ar: 'رئيس المستشارين',
      owner_en: 'Head of Consultants',
      goal_ar: 'تحويل الاستفسار المؤهل إلى تسجيل خلال 72 ساعة في المتوسط مع الالتزام بقواعد المتابعة 24/72.',
      goal_en: 'Converting qualified prospects to registration within 72 hours average turnaround.',
      steps: [
        {
          no: 1,
          title_ar: 'وصول الاستفسار عبر القنوات الموحدة',
          title_en: 'Inquiry Reception via Unified Channels',
          desc_ar: 'يُسجَّل تلقائياً في النظام مع مصدره وحملته، ويرد البوت بالترحيب المناسب خلال ثوانٍ.',
          desc_en: 'Automatically logged in CRM with UTM source; bot sends initial welcome instantly.',
          role_ar: 'مسؤول المراسلات والبوت',
          sla_ar: 'فوري'
        },
        {
          no: 2,
          title_ar: 'التأهيل الأكاديمي الأولي',
          title_en: 'Initial Academic Qualification',
          desc_ar: 'تأهيل الشهادة: نوعها، سنة الجلوس، النسبة، الرغبة. تحديد المسار (حكومي / أزهر / استخراج شهادة).',
          desc_en: 'Verify certificate type, year, percentage, faculty interest. Route to proper track.',
          role_ar: 'المستشار التعليمي',
          sla_ar: 'خلال 15 دقيقة'
        },
        {
          no: 3,
          title_ar: 'عرض المسار والرسوم الرسمية',
          title_en: 'Presentation of Pathways & Fees',
          desc_ar: 'شرح الرسوم والمراحل والمتطلبات بشفافية كاملة دون إعطاء وعود قبول زائفة نهائياً.',
          desc_en: 'Transparent breakdown of tuition, fees, and requirements with zero false guarantees.',
          role_ar: 'المستشار التعليمي',
          sla_ar: 'نفس اليوم'
        },
        {
          no: 4,
          title_ar: 'المتابعة المجدولة (قاعدة 24 / 72 ساعة)',
          title_en: 'Scheduled Timed Follow-ups',
          desc_ar: 'إن لم يرد العميل: تذكير بعد 24 ساعة، ثم بعد 72 ساعة، ثم وسم المحادثة وإغلاق مؤقت بعد 7 أيام.',
          desc_en: 'Follow-up reminders at 24h, 72h, then dormant tag and temporary close after 7 days.',
          role_ar: 'المستشار / نظام الأتمتة',
          sla_ar: '24 / 72 ساعة'
        },
        {
          no: 5,
          title_ar: 'التسجيل وتأكيد السداد المالي',
          title_en: 'Registration & Remittance Confirmation',
          desc_ar: 'استلام الأوراق وتأكيد المحاسب في النظام استلام الحوالة باسم الطالب لإصدار إيصال رسمي.',
          desc_en: 'Receipt of documents and accountant payment confirmation bearing student name.',
          role_ar: 'المستشار + المحاسب',
          sla_ar: 'ساعتان للتأكيد'
        },
        {
          no: 6,
          title_ar: 'تسليم الملف إلى إدارة العمليات',
          title_en: 'File Handover to Operations',
          desc_ar: 'مراجعة قائمة الفحص كاملة ونقل الملف رسمياً للعمليات. يُقبل أو يُرفض خلال 4 ساعات.',
          desc_en: 'Full checklist verification and formal transfer to Operations. Accepted/rejected in 4h.',
          role_ar: 'المستشار ← العمليات',
          sla_ar: '4 ساعات عمل'
        }
      ]
    },
    {
      id: 'wf2' as const,
      title_ar: '2. دورة ملف التقديم الجامعي',
      title_en: '2. University Application Lifecycle',
      owner_ar: 'مدير العمليات',
      owner_en: 'Operations Manager',
      goal_ar: 'ملف مقبول فنياً من أول مرة على منصة ادرس في مصر، وطالب مطّلع على كل مرحلة.',
      goal_en: 'Flawless first-pass platform acceptance and transparent milestone progress.',
      steps: [
        {
          no: 1,
          title_ar: 'فحص قائمة الأوراق (Checklist)',
          title_en: 'Document Checklist Audit',
          desc_ar: 'التأكد من صلاحية الجواز لأكثر من 6 أشهر، وختم الحداثة لدفعتي 2023 و2024، ووضوح الأوراق.',
          desc_en: 'Ensure passport validity (>6 mos), recent graduation stamp, and certificate legibility.',
          role_ar: 'أخصائي التقديمات',
          sla_ar: '4 ساعات عمل'
        },
        {
          no: 2,
          title_ar: 'تجهيز الرغبات وتأكيدها مع الطالب',
          title_en: 'Faculty Choices Assembly (10 Choices)',
          desc_ar: 'ترتيب 10 رغبات جامعية متوافقة مع الحدود الدنيا ونسبة الطالب، وتأكيد الترتيب خطياً معه.',
          desc_en: 'Organize 10 faculty preferences compliant with cutoff thresholds and confirm with student.',
          role_ar: 'أخصائي التقديمات + المستشار',
          sla_ar: '24 ساعة'
        },
        {
          no: 3,
          title_ar: 'الرفع على المنصة وسداد رسوم التقديم',
          title_en: 'Platform Submission & Fee Payment',
          desc_ar: 'رفع البيانات إلكترونياً وسداد رسوم المنصة الرسمية (172 دولاراً) بعد تأكيد استلامها.',
          desc_en: 'Upload student profile and pay platform fee ($172 standard) upon finance clearance.',
          role_ar: 'أخصائي التقديمات',
          sla_ar: '24 ساعة'
        },
        {
          no: 4,
          title_ar: 'متابعة الفحص الفني اليومي',
          title_en: 'Technical Review Monitoring',
          desc_ar: 'مراقبة حالة الفحص الفني يومياً في النظام وتحديث سجل الطالب.',
          desc_en: 'Daily inspection of platform technical screening and database record sync.',
          role_ar: 'أخصائي التقديمات',
          sla_ar: 'يومياً'
        },
        {
          no: 5,
          title_ar: 'إبلاغ الطالب بالقبول المبدئي',
          title_en: 'Preliminary Admission Notification',
          desc_ar: 'تحميل وثيقة الترشيح وإرسالها للطالب مع بيان رسوم المرحلة الثانية والتوثيقات المطلوبة.',
          desc_en: 'Download nomination document, dispatch to student with stage 2 fee requirements.',
          role_ar: 'أخصائي المتابعة',
          sla_ar: 'يومان'
        },
        {
          no: 6,
          title_ar: 'التوثيق وتسليم الأصول لإدارة الوافدين',
          title_en: 'Attestation & Physical Dossier Submission',
          desc_ar: 'المعقب ينجز توثيقات الشهادة ويسلم الملف الورقي الأصلي للجامعة ويستلم إيصال الإيداع.',
          desc_en: 'Field liaison finishes attestations and deposits physical dossier with admissions deans.',
          role_ar: 'المعقب الميداني',
          sla_ar: 'حسب مسار الجامعة'
        },
        {
          no: 7,
          title_ar: 'صدور القبول النهائي وتحذير ولي الأمر',
          title_en: 'Final Admission & Attendance Warning',
          desc_ar: 'تأكيد القيد رسمياً وتنبيه ولي الأمر لعواقب سداد المصروفات دون الحضور الفعلي.',
          desc_en: 'Confirm formal enrollment, issue card, and warn parent regarding mandatory attendance.',
          role_ar: 'أخصائي المتابعة',
          sla_ar: 'إبلاغ فوري'
        }
      ]
    },
    {
      id: 'wf3' as const,
      title_ar: '3. استخراج الشهادة الثانوية',
      title_en: '3. Secondary Certificate Extraction',
      owner_ar: 'أخصائي استخراج الشهادات والتوثيق',
      owner_en: 'Certificate Extraction Specialist',
      goal_ar: 'استخراج الشهادة وتوثيقها بمدة معلنة واضحة وصفر مستندات مفقودة.',
      goal_en: 'Predictable extraction and attestation cycle with zero lost documents.',
      steps: [
        {
          no: 1,
          title_ar: 'عرض متطلبات الاستخراج والرسوم',
          title_en: 'Requirements & Fee Presentation',
          desc_ar: 'إرسال قائمة المتطلبات ورسوم الخدمة (2,200 أو 3,000 جنيه حسب المسار).',
          desc_en: 'Present 8-item information checklist and official fee schedule (2,200 or 3,000 EGP).',
          role_ar: 'المستشار التعليمي',
          sla_ar: 'نفس اليوم'
        },
        {
          no: 2,
          title_ar: 'استلام بنود البيانات الثمانية',
          title_en: 'Intake of 8 Information Items',
          desc_ar: 'جمع البيانات بنداً بنداً والتحقق من وضوح صورة الجواز أو الرقم الوطني ورقم الجلوس.',
          desc_en: 'Collect seating number, school, session, national ID, and inspect scan clarity.',
          role_ar: 'أخصائي الاستخراج',
          sla_ar: '24 ساعة'
        },
        {
          no: 3,
          title_ar: 'تأكيد السداد الكامل مقدماً',
          title_en: 'Upfront Payment Confirmation',
          desc_ar: 'تحويل المبلغ كاملاً مقدماً وتأكيد المحاسب في النظام مع التنبيه بأن الرسوم غير مستردة.',
          desc_en: '100% prepayment confirmed by finance; non-refundable policy acknowledged.',
          role_ar: 'المحاسب',
          sla_ar: 'ساعتان'
        },
        {
          no: 4,
          title_ar: 'فتح المعاملة وإسنادها للمعقب',
          title_en: 'Work Order Issuance to Liaison',
          desc_ar: 'فتح سجل المعاملة وتحديد تاريخ متوقع لكل مرحلة توثيق وتسليمه للمعقب.',
          desc_en: 'Issue work order in CRM with milestone target dates for each attestation stage.',
          role_ar: 'أخصائي الاستخراج',
          sla_ar: '24 ساعة'
        },
        {
          no: 5,
          title_ar: 'التوثيق المرحلي وتصوير الأختام',
          title_en: 'Phased Stamping & Photographic Evidence',
          desc_ar: 'كل ختم (تربية، خارجية، سفارة، قنصلية) يُصوَّر ويُرفع للنظام فوراً قبل مغادرة المقر.',
          desc_en: 'Every stamp photographed on-site before leaving the official body and archived.',
          role_ar: 'المعقب الميداني',
          sla_ar: 'في نفس اليوم'
        },
        {
          no: 6,
          title_ar: 'تسليم الشهادة وإغلاق المعاملة',
          title_en: 'Handover to Student & Closure',
          desc_ar: 'تسليم أصل الشهادة الموثقة بإيصال رسمي موقع، وإغلاق المعاملة وإرسال استبيان رضا.',
          desc_en: 'Deliver stamped certificate against signed receipt; close file and send CSAT survey.',
          role_ar: 'أخصائي الاستخراج',
          sla_ar: 'فوري'
        }
      ]
    },
    {
      id: 'wf4' as const,
      title_ar: '4. معالجة الشكوى',
      title_en: '4. Complaints Management',
      owner_ar: 'مسؤول الجودة وسمعة العملاء',
      owner_en: 'Quality & Reputation Officer',
      goal_ar: 'كل شكوى لها صاحب ومهلة ونتيجة موثقة وتحليل للسبب الجذري خلال 3 أيام عمل.',
      goal_en: 'Every client grievance assigned, root-caused, and resolved within 3 business days.',
      steps: [
        {
          no: 1,
          title_ar: 'استلام الشكوى وتوليد التذكرة',
          title_en: 'Grievance Intake & Ticket Generation',
          desc_ar: 'تصل الشكوى من أي قناة، وتُفتح تذكرة فورية برقم تسلسلي BCT-CMP وتصنيف دقيق.',
          desc_en: 'Received from WhatsApp, phone, or office. Serialized ticket generated in 1h.',
          role_ar: 'مسؤول الجودة',
          sla_ar: 'خلال ساعة'
        },
        {
          no: 2,
          title_ar: 'الرد الأول والاعتراف بالمشكلة',
          title_en: 'First Acknowledgment Response',
          desc_ar: 'التواصل مع العميل والاعتراف بالمشكلة وتوضيح الخطوات المتوقعة دون إعطاء وعود غير مضمونة.',
          desc_en: 'Engage client, acknowledge issue, outline resolution milestones with realistic expectations.',
          role_ar: 'مسؤول الجودة',
          sla_ar: 'خلال 4 ساعات'
        },
        {
          no: 3,
          title_ar: 'تحديد صاحب الحل بناءً على السجل',
          title_en: 'Assign Solution Owner via Audit Log',
          desc_ar: 'فحص سجل الملف والتدقيق لتحديد الإدارة التي خرجت عن الإجراء وإسناد التذكرة لرئيسها.',
          desc_en: 'Audit file history to pinpoint execution failure and assign ticket to department head.',
          role_ar: 'مسؤول الجودة',
          sla_ar: 'خلال 24 ساعة'
        },
        {
          no: 4,
          title_ar: 'تنفيذ الحل وإرفاق الدليل',
          title_en: 'Resolution Implementation with Evidence',
          desc_ar: 'صاحب الحل ينفذ الإجراء التصحيحي (تعديل رغبات، أولوية توثيق) ويضيف إثباته في التذكرة.',
          desc_en: 'Assigned resolver executes corrective action and attaches supporting evidence.',
          role_ar: 'الإدارة المعنية بالحل',
          sla_ar: '3 أيام عمل'
        },
        {
          no: 5,
          title_ar: 'إغلاق التذكرة وتوثيق الدرس المستفاد',
          title_en: 'Ticket Closure & Root Cause Learning',
          desc_ar: 'رسالة إغلاق للعميل، وتسجيل السبب الجذري، وتعديل الإجراء الإداري إن كان الخطأ نظامياً.',
          desc_en: 'Closure message to client; root cause codified; SOP updated if error is systemic.',
          role_ar: 'مسؤول الجودة',
          sla_ar: 'فوري'
        }
      ]
    },
    {
      id: 'wf5' as const,
      title_ar: '5. إطلاق حملة تسويقية (بوابة الطاقة)',
      title_en: '5. Campaign Launch (Capacity Gate)',
      owner_ar: 'مسؤول التسويق',
      owner_en: 'Marketing Manager',
      goal_ar: 'عدم إطلاق أي حملة تسويقية تفوق الطاقة الاستيعابية لفريق العمليات.',
      goal_en: 'Never committing ad budget beyond verified operational throughput.',
      steps: [
        {
          no: 1,
          title_ar: 'اقتراح خطة الحملة والميزانية',
          title_en: 'Campaign Proposal & Projected Intake',
          desc_ar: 'تحديد الهدف والجمهور والميزانية وعدد الاستفسارات المتوقعة قبل موعد الإطلاق بـ 7 أيام.',
          desc_en: 'Define target audience, budget, and projected inquiry load 7 days before launch.',
          role_ar: 'مسؤول التسويق',
          sla_ar: 'قبل 7 أيام'
        },
        {
          no: 2,
          title_ar: 'مراجعة دقة المحتوى والوعود',
          title_en: 'Ad Copy & Cutoff Accuracy Audit',
          desc_ar: 'رئيس المستشارين يراجع النص الإعلاني: لا ضمان للقبول، والأسعار مطابقة للائحة المعتمدة.',
          desc_en: 'Head of Consultants reviews copy: zero admission guarantees; exact prices.',
          role_ar: 'رئيس المستشارين',
          sla_ar: 'خلال 48 ساعة'
        },
        {
          no: 3,
          title_ar: 'اعتماد بوابة الطاقة التشغيلية',
          title_en: 'Operational Capacity Gate Sign-off',
          desc_ar: 'مدير العمليات يحدد الحد الأقصى للملفات الجديدة أسبوعياً ويوقع على إطلاق الحملة.',
          desc_en: 'Operations Manager defines max weekly new file capacity and signs clearance.',
          role_ar: 'مدير العمليات',
          sla_ar: 'خلال 24 ساعة'
        },
        {
          no: 4,
          title_ar: 'الإطلاق وربط كود التتبع (UTM)',
          title_en: 'Launch & UTM Attribution Integration',
          desc_ar: 'تشغيل الحملة مع ربط كل استفسار بكود التتبع تلقائياً في النظام الموحد.',
          desc_en: 'Launch campaign with automated UTM parameters linking leads to spend.',
          role_ar: 'مسؤول التسويق + الأنظمة',
          sla_ar: 'يوم الإطلاق'
        },
        {
          no: 5,
          title_ar: 'المراجعة الأسبوعية المشتركة',
          title_en: 'Weekly Joint Performance Review',
          desc_ar: 'مراجعة عدد الاستفسارات، التسجيلات، تكلفة التسجيل، وسرعة الرد. تعديل الميزانية أو الإيقاف.',
          desc_en: 'Joint review of inquiries, registrations, CAC, and response times; adjust or halt.',
          role_ar: 'التسويق + العمليات',
          sla_ar: 'أسبوعياً'
        }
      ]
    }
  ];

  const currentWorkflow = WORKFLOWS.find(w => w.id === activeWorkflowId) || WORKFLOWS[0];

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div>
        <h2 className="text-xl font-extrabold text-bct-navy">
          {t('nav.workflows')}
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          {language === 'ar'
            ? 'مسارات العمل الخمسة المعتمدة في الدليل التنظيمي: ملاك العمليات، الأهداف، والخطوات التفصيلية مع المهل الزمنية.'
            : 'The 5 Core Business Workflows: Executive Owners, Objectives, Step-by-Step Execution & SLAs.'}
        </p>
      </div>

      {/* Workflow Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {WORKFLOWS.map((wf) => (
          <button
            key={wf.id}
            onClick={() => setActiveWorkflowId(wf.id)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap border ${
              activeWorkflowId === wf.id
                ? 'bg-bct-navy text-white border-bct-navy shadow-sm'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            {language === 'ar' ? wf.title_ar : wf.title_en}
          </button>
        ))}
      </div>

      {/* Active Workflow Container */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
        
        {/* Workflow Title & Objective Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-black text-slate-900">
              {language === 'ar' ? currentWorkflow.title_ar : currentWorkflow.title_en}
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              <span className="font-bold text-bct-navy">الهدف: </span>
              {language === 'ar' ? currentWorkflow.goal_ar : currentWorkflow.goal_en}
            </p>
          </div>

          <div className="shrink-0 text-start md:text-end">
            <span className="text-[10px] text-slate-400 block font-medium">المالك التنفيذي</span>
            <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-bct-navy text-white mt-0.5">
              {language === 'ar' ? currentWorkflow.owner_ar : currentWorkflow.owner_en}
            </span>
          </div>
        </div>

        {/* Step-by-step Timeline sequence */}
        <div className="space-y-4">
          <h4 className="text-xs font-bold text-slate-400">
            {language === 'ar' ? 'خطوات تنفيذ المسار التسلسلية' : 'Sequential Workflow Execution Steps'}
          </h4>

          <div className="relative ps-6 space-y-4 before:content-[''] before:absolute before:top-3 before:bottom-3 before:start-2.5 before:w-0.5 before:bg-slate-200">
            {currentWorkflow.steps.map((step) => (
              <div key={step.no} className="relative group">
                
                {/* Node Dot */}
                <div className="absolute -start-6 top-1.5 w-5 h-5 rounded-full bg-bct-navy text-white text-[10px] font-bold flex items-center justify-center ring-4 ring-white shadow-xs">
                  {step.no}
                </div>

                {/* Step Card */}
                <div className="p-4 rounded-xl border border-slate-200 bg-white hover:border-slate-300 transition shadow-2xs">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-1.5">
                    <h5 className="font-extrabold text-xs text-slate-900">
                      {language === 'ar' ? step.title_ar : step.title_en}
                    </h5>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {step.role_ar}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>{step.sla_ar}</span>
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {language === 'ar' ? step.desc_ar : step.desc_en}
                  </p>
                </div>

              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
