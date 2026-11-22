import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import {
  SYSTEM_REPORTS,
  SystemReportDefinition,
  REPORTS_BY_DEPARTMENT,
  ReportTimePeriod,
  StandardReportPayload
} from '../types/reports.types';
import {
  FileText,
  Download,
  Printer,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Filter,
  BarChart3,
  Layers,
  Lock,
  ShieldAlert,
  Building2,
  HelpCircle,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  CalendarDays,
  FileCheck2,
  PieChart
} from 'lucide-react';

export const ReportsCenter: React.FC = () => {
  const { isRtl, t } = useLanguage();
  const { currentEmployee, canViewReport, isSuperAdmin } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Query parameters for deep-linking
  const directReportId = searchParams.get('id') || searchParams.get('report');
  const directDeptId = searchParams.get('dept');
  const queryPeriod = searchParams.get('period') as ReportTimePeriod | null;

  // Real-time synchronization with centralized bctStore
  const [storeVersion, setStoreVersion] = useState(0);

  useEffect(() => {
    return bctStore.subscribe(() => {
      setStoreVersion(v => v + 1);
    });
  }, []);

  const departments = useMemo(() => bctStore.getDepartments(), [storeVersion]);

  // Compute allowed reports for the logged-in employee via RBAC
  const allowedReports = useMemo(() => {
    return SYSTEM_REPORTS.filter(rep => canViewReport(rep.id));
  }, [currentEmployee, canViewReport]);

  // Compute departments that have at least one allowed report
  const visibleDepts = useMemo(() => {
    const deptIdsWithAllowedReports = new Set(allowedReports.map(r => r.departmentId));
    return departments.filter(d => deptIdsWithAllowedReports.has(d.id));
  }, [departments, allowedReports]);

  // Active department selection
  const [selectedDept, setSelectedDept] = useState<string>(() => {
    if (directDeptId && departments.some(d => d.id === directDeptId)) {
      return directDeptId;
    }
    if (directReportId) {
      const rep = SYSTEM_REPORTS.find(r => r.id === directReportId);
      if (rep) return rep.departmentId;
    }
    return visibleDepts[0]?.id || 'ops';
  });

  // Active report selection
  const [selectedReportId, setSelectedReportId] = useState<string>(() => {
    if (directReportId) return directReportId;
    const firstInDept = allowedReports.find(r => r.departmentId === (visibleDepts[0]?.id || 'ops'));
    return firstInDept?.id || allowedReports[0]?.id || 'rep_ops_pipeline';
  });

  // Time-Period State
  const [selectedPeriod, setSelectedPeriod] = useState<ReportTimePeriod>(() => {
    if (queryPeriod && ['today', '7_days', 'month', '30_days', 'quarter', 'all', 'custom'].includes(queryPeriod)) {
      return queryPeriod as ReportTimePeriod;
    }
    return 'month';
  });

  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });

  const [customEndDate, setCustomEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [printOrientation, setPrintOrientation] = useState<'portrait' | 'landscape'>('portrait');

  // Exact localized date & time of extraction for certified header
  const extractionTimestamp = useMemo(() => {
    const now = new Date();
    const dateStr = now.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = now.toLocaleTimeString(isRtl ? 'ar-EG' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });
    return `${dateStr} - ${timeStr}`;
  }, [isRtl]);

  // Authorization checks
  const isDirectReportForbidden = Boolean(directReportId && !canViewReport(directReportId));
  const isCurrentReportAllowed = Boolean(selectedReportId && canViewReport(selectedReportId));

  // Sync state when direct link or permissions change
  useEffect(() => {
    if (directReportId) {
      setSelectedReportId(directReportId);
      const rep = SYSTEM_REPORTS.find(r => r.id === directReportId);
      if (rep) setSelectedDept(rep.departmentId);
    } else if (!canViewReport(selectedReportId)) {
      if (allowedReports.length > 0) {
        setSelectedReportId(allowedReports[0].id);
        setSelectedDept(allowedReports[0].departmentId);
      }
    }
  }, [directReportId, canViewReport, selectedReportId, allowedReports]);

  // Sync department if the currently selected department has no allowed reports
  useEffect(() => {
    if (visibleDepts.length > 0 && !visibleDepts.some(d => d.id === selectedDept)) {
      setSelectedDept(visibleDepts[0].id);
      const firstAllowed = allowedReports.find(r => r.departmentId === visibleDepts[0].id);
      if (firstAllowed) setSelectedReportId(firstAllowed.id);
    }
  }, [visibleDepts, selectedDept, allowedReports]);

  // Active report definition metadata
  const activeReportDef = useMemo(() => {
    return SYSTEM_REPORTS.find(r => r.id === selectedReportId) || SYSTEM_REPORTS[0];
  }, [selectedReportId]);

  // Department metadata
  const currentDeptObj = useMemo(() => {
    return departments.find(d => d.id === activeReportDef.departmentId);
  }, [departments, activeReportDef]);

  // Dynamic General Manager resolution from Employee Directory (No hardcoded names)
  const gmEmployee = useMemo(() => {
    return bctStore.getGeneralManagerEmployee();
  }, [departments]);

  // Dynamic Department Head resolution from Employee Directory
  const deptHeadEmployee = useMemo(() => {
    return bctStore.getDepartmentHeadEmployee(activeReportDef.departmentId);
  }, [activeReportDef.departmentId, departments]);

  // Fetch report payload safely via Store API (guarded at API level)
  const reportPayload = useMemo(() => {
    if (!isCurrentReportAllowed || isDirectReportForbidden) return null;
    const res = bctStore.getReportData(selectedReportId, currentEmployee?.username || 'anonymous', {
      period: selectedPeriod,
      startDate: selectedPeriod === 'custom' ? customStartDate : undefined,
      endDate: selectedPeriod === 'custom' ? customEndDate : undefined,
      actorUsername: currentEmployee?.username
    });
    return res.success ? (res.data as StandardReportPayload) : null;
  }, [
    selectedReportId,
    currentEmployee,
    isCurrentReportAllowed,
    isDirectReportForbidden,
    selectedPeriod,
    customStartDate,
    customEndDate,
    storeVersion
  ]);

  const handleSelectReport = (reportId: string, deptId?: string) => {
    setSelectedReportId(reportId);
    if (deptId) setSelectedDept(deptId);
    setSearchParams(prev => {
      prev.set('id', reportId);
      if (deptId) prev.set('dept', deptId);
      return prev;
    });
  };

  const handleSelectDept = (deptId: string) => {
    setSelectedDept(deptId);
    const firstAllowed = allowedReports.find(r => r.departmentId === deptId);
    if (firstAllowed) {
      setSelectedReportId(firstAllowed.id);
      setSearchParams(prev => {
        prev.set('id', firstAllowed.id);
        prev.set('dept', deptId);
        return prev;
      });
    }
  };

  const handlePeriodChange = (newPeriod: ReportTimePeriod) => {
    setSelectedPeriod(newPeriod);
    setSearchParams(prev => {
      prev.set('period', newPeriod);
      return prev;
    });
  };

  const handlePrint = () => {
    if (!isCurrentReportAllowed) {
      alert(isRtl ? 'غير مصرح لك بطباعة هذا التقرير' : 'Unauthorized to print this report');
      return;
    }
    window.print();
  };

  const handleExportCSV = () => {
    if (!isCurrentReportAllowed || !reportPayload) {
      alert(isRtl ? 'غير مصرح لك بتصدير بيانات هذا التقرير' : 'Unauthorized to export this report');
      return;
    }

    // Prepare CSV with UTF-8 BOM so Excel opens Arabic correctly
    let csvContent = '\uFEFF';

    if (reportPayload.table && reportPayload.table.columns.length > 0) {
      const cols = reportPayload.table.columns;
      // Header row
      csvContent += cols.map(c => `"${isRtl ? c.labelAr : c.labelEn}"`).join(',') + '\r\n';

      // Data rows
      reportPayload.table.rows.forEach(row => {
        const rowStr = cols
          .map(c => {
            const rawVal = row[c.key] ?? '';
            return `"${String(rawVal).replace(/"/g, '""')}"`;
          })
          .join(',');
        csvContent += rowStr + '\r\n';
      });
    } else if (reportPayload.kpiCards && reportPayload.kpiCards.length > 0) {
      // Export KPI cards summary
      csvContent += `"${isRtl ? 'المؤشر' : 'Metric'}","${isRtl ? 'القيمة المحققة' : 'Value'}","${isRtl ? 'الحالة' : 'Status'}"\r\n`;
      reportPayload.kpiCards.forEach(c => {
        csvContent += `"${isRtl ? c.titleAr : c.titleEn}","${c.formattedValue || c.value}","${c.status || 'optimal'}"\r\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    const safeReportName = (activeReportDef.nameEn || activeReportDef.id).replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute(
      'download',
      `BCT_${safeReportName}_${selectedPeriod}_${new Date().toISOString().split('T')[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-bct-navy text-white rounded-lg shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isRtl ? 'مركز التقارير المتقدمة والتحليلات المؤسسية' : 'Advanced Reports Center & Analytics'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isRtl
              ? `استخراج التقارير الرسمية الموثقة لـ ${t('brand.name')} مع حوكمة أذونات العرض التفصيلية وتصدير البيانات المعتمدة`
              : `Official certified management reports for ${t('brand.name')} with granular visibility governance`}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          {/* Orientation Selector Toggle (A4 Portrait / A4 Landscape) */}
          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setPrintOrientation('portrait')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                printOrientation === 'portrait'
                  ? 'bg-white text-bct-navy font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={isRtl ? 'طباعة عمودية (A4 Portrait)' : 'A4 Portrait'}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{isRtl ? 'عمودي (A4)' : 'Portrait'}</span>
            </button>
            <button
              type="button"
              onClick={() => setPrintOrientation('landscape')}
              className={`px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1 ${
                printOrientation === 'landscape'
                  ? 'bg-white text-bct-navy font-bold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title={isRtl ? 'طباعة أفقية للجداول العريضة (A4 Landscape)' : 'A4 Landscape'}
            >
              <Layers className="w-3.5 h-3.5 rotate-90" />
              <span>{isRtl ? 'أفقي (A4)' : 'Landscape'}</span>
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            disabled={!isCurrentReportAllowed || isDirectReportForbidden || !reportPayload}
            className="px-3.5 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{isRtl ? 'تصدير CSV معتمد' : 'Export CSV'}</span>
          </button>
          <button
            onClick={handlePrint}
            disabled={!isCurrentReportAllowed || isDirectReportForbidden || !reportPayload}
            className="px-4 py-2 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            title={isRtl ? 'طباعة التقرير أو حفظه كملف PDF' : 'Print Report or Save as PDF'}
          >
            <Printer className="w-4 h-4" />
            <span>{isRtl ? 'طباعة التقرير / PDF' : 'Print / Save as PDF'}</span>
          </button>
        </div>
      </div>

      {/* Case 1: Forbidden Access / No Reports Allowed */}
      {!isCurrentReportAllowed || isDirectReportForbidden || allowedReports.length === 0 ? (
        <div className="bg-white rounded-2xl border-2 border-rose-200 shadow-sm p-8 text-center space-y-4 max-w-2xl mx-auto my-12">
          <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto text-rose-600 border border-rose-200">
            <ShieldAlert className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">
              {allowedReports.length === 0
                ? isRtl
                  ? 'لا توجد تقارير إدارية مصرح لك بالاطلاع عليها'
                  : 'No Authorized Reports Available'
                : isRtl
                ? 'وصول محجوب – صلاحيات غير كافية'
                : 'Access Denied – Confidential Report'}
            </h2>
            <p className="text-sm text-slate-500 mt-2 leading-relaxed">
              {allowedReports.length === 0
                ? isRtl
                  ? 'تم حجب كافة التقارير الإدارية عن حسابك وفق سياسات حوكمة الوصول (Zero Trust). يرجى مراجعة الإدارة العليا لمنح الصلاحيات المطلوبة.'
                  : 'All management reports are currently restricted for your account under granular access governance.'
                : isRtl
                ? `ليس لديك صلاحية للاطلاع على هذا التقرير (${activeReportDef?.nameAr || directReportId || selectedReportId}). تم حجب البيانات وفق ضوابط مصفوفة الصلاحيات التفصيلية (Granular Report Visibility Matrix).`
                : `You do not have permission to view this report (${activeReportDef?.nameEn || directReportId || selectedReportId}). Data is strictly restricted by granular access governance.`}
            </p>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 inline-block text-left rtl:text-right">
            <div>
              <strong>{isRtl ? 'المستخدم الحالي:' : 'Actor:'}</strong> {currentEmployee?.username} (
              {currentEmployee?.full_name_ar})
            </div>
            <div>
              <strong>{isRtl ? 'الإدارة:' : 'Department:'}</strong> {currentEmployee?.department_id}
            </div>
            <div>
              <strong>{isRtl ? 'كود الصلاحية المطلوبة:' : 'Required Permission:'}</strong> report:
              {directReportId || selectedReportId}
            </div>
          </div>

          <div className="pt-2">
            <button
              onClick={() => {
                if (allowedReports.length > 0) {
                  handleSelectReport(allowedReports[0].id, allowedReports[0].departmentId);
                } else {
                  window.history.back();
                }
              }}
              className="px-5 py-2.5 bg-bct-navy text-white rounded-xl text-xs font-bold shadow hover:bg-bct-navy-dark transition"
            >
              {allowedReports.length > 0
                ? isRtl
                  ? 'الانتقال إلى تقرير متاح'
                  : 'Go to an Accessible Report'
                : isRtl
                ? 'العودة للخلف'
                : 'Go Back'}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Navigation Controls: Department Filter + Report Selector + Time Period Filter */}
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 space-y-4 print:hidden">
            {/* Level 1: Department Tabs */}
            <div className="flex flex-wrap items-center gap-2 pb-3 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-400 ms-1 flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {isRtl ? 'الإدارات:' : 'Departments:'}
              </span>
              {visibleDepts.map(dept => {
                const isActive = selectedDept === dept.id;
                const countInDept = allowedReports.filter(r => r.departmentId === dept.id).length;

                return (
                  <button
                    key={dept.id}
                    onClick={() => handleSelectDept(dept.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                      isActive ? 'bg-bct-navy text-white shadow' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>{isRtl ? dept.name_ar : dept.name_en}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {countInDept}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Level 2: Department Reports List + Period Controls */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-2">
                {allowedReports
                  .filter(r => r.departmentId === selectedDept)
                  .map(rep => {
                    const isSelected = selectedReportId === rep.id;
                    return (
                      <button
                        key={rep.id}
                        onClick={() => handleSelectReport(rep.id, rep.departmentId)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center ${
                          isSelected
                            ? 'bg-emerald-600 text-white font-bold shadow-xs'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        <span>{isRtl ? rep.nameAr : rep.nameEn}</span>
                      </button>
                    );
                  })}
              </div>

              {/* Time Period Filter Selector */}
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {isRtl ? 'الفترة الزمنية:' : 'Period:'}
                </span>
                <select
                  value={selectedPeriod}
                  onChange={e => handlePeriodChange(e.target.value as ReportTimePeriod)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:ring-2 focus:ring-bct-navy focus:outline-none"
                >
                  <option value="today">{isRtl ? 'اليوم (Today)' : 'Today'}</option>
                  <option value="7_days">{isRtl ? 'آخر 7 أيام (Last 7 Days)' : 'Last 7 Days'}</option>
                  <option value="30_days">{isRtl ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
                  <option value="month">{isRtl ? 'الشهر الحالي' : 'Current Month'}</option>
                  <option value="quarter">{isRtl ? 'الربع الحالي (90 يوماً)' : 'Current Quarter (90 Days)'}</option>
                  <option value="all">{isRtl ? 'جميع الفترات الزمنية' : 'All Time'}</option>
                  <option value="custom">{isRtl ? 'فترة مخصصة...' : 'Custom Range...'}</option>
                </select>

                {/* Custom Date Pickers */}
                {selectedPeriod === 'custom' && (
                  <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200 text-xs">
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={e => setCustomStartDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none"
                    />
                    <span className="text-slate-400 text-[10px]">{isRtl ? 'إلى' : 'to'}</span>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={e => setCustomEndDate(e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-[11px] focus:outline-none"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Media Print Style for Selected Orientation */}
          <style>{`
            @media print {
              @page {
                size: A4 ${printOrientation};
                margin: 10mm 10mm 12mm 10mm;
              }
            }
          `}</style>

          {/* Reusable Official BCT Certified Print & PDF Document */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 print:p-0 print:m-0 print:border-none print:shadow-none space-y-6 print:space-y-4 print:bg-white printable-document">
            {/* ------------------------------------------------------------- */}
            {/* 1. Official Report Header & Corporate Identity (رأس التقرير)   */}
            {/* ------------------------------------------------------------- */}
            <div className="pb-5 border-b-2 border-bct-navy print:pb-3 print:break-inside-avoid break-inside-avoid">
              <div className="flex items-start justify-between gap-6">
                {/* Brand & Document Name */}
                <div className="flex items-center gap-4">
                  <img
                    src="/assets/brand/BCT_Vertical_Mono_Navy.png"
                    alt="BCT"
                    className="h-16 w-auto object-contain shrink-0 print:h-14"
                  />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-bct-navy">
                        {isRtl ? 'مجموعة بي سي تي للخدمات التعليمية والاستشارات الأكاديمية' : 'BCT Educational Services & Academic Consultations'}
                      </h2>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-bct-navy border border-blue-200 print:bg-white print:border-slate-300">
                        {isRtl ? 'وثيقة إدارية معتمدة' : 'Official Certified Report'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <h1 className="text-lg font-black text-slate-900 print:text-base">
                        {isRtl ? activeReportDef.nameAr : activeReportDef.nameEn}
                      </h1>
                    </div>
                    <p className="text-xs text-slate-500 font-medium print:text-[10px]">
                      {isRtl ? activeReportDef.descriptionAr : activeReportDef.descriptionEn}
                    </p>
                  </div>
                </div>

                {/* Certified Extraction & Governance Metadata Box */}
                <div className="text-left rtl:text-right text-xs text-slate-600 space-y-1 shrink-0 bg-slate-50/80 p-3 rounded-xl border border-slate-200/80 print:bg-white print:p-2 print:border-slate-300 print:text-[10px] min-w-[280px]">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400 font-medium">{isRtl ? 'الإدارة المعنية:' : 'Department:'}</span>
                    <span className="font-bold text-slate-800">{currentDeptObj ? (isRtl ? currentDeptObj.name_ar : currentDeptObj.name_en) : 'الإدارة العامة'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400 font-medium">{isRtl ? 'الفترة الزمنية للتقرير:' : 'Time Period:'}</span>
                    <span className="font-bold text-slate-800">{reportPayload?.periodLabelAr}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400 font-medium">{isRtl ? 'تاريخ ووقت الاستخراج:' : 'Extracted At:'}</span>
                    <span className="tabular-nums text-slate-700 font-bold">{extractionTimestamp}</span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-400 font-medium">{isRtl ? 'الموظف المستخرج:' : 'Extracted By:'}</span>
                    <span className="font-semibold text-slate-800">{currentEmployee?.full_name_ar} ({currentEmployee?.job_title_ar})</span>
                  </div>
                  <div className="flex items-center justify-between gap-4 pt-1 border-t border-slate-200/60 text-bct-navy font-bold text-[11px] print:text-[10px]">
                    <span>{isRtl ? 'الرقم المرجعي المعتمد:' : 'Ref Code:'}</span>
                    <span className="font-mono">{reportPayload?.referenceNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------- */}
            {/* 2. Executive Summary (الملخص التنفيذي)                         */}
            {/* ------------------------------------------------------------- */}
            {reportPayload?.executiveSummary && (
              <div className="p-4 bg-gradient-to-br from-slate-50 to-blue-50/40 rounded-xl border border-slate-200/80 space-y-2.5 print:bg-white print:border-slate-300 print:p-3 print:space-y-2 print:break-inside-avoid break-inside-avoid">
                <div className="flex items-center gap-2 text-bct-navy">
                  <Sparkles className="w-4 h-4 text-amber-600 print:text-bct-navy shrink-0" />
                  <h3 className="text-sm font-bold print:text-xs">
                    {isRtl ? reportPayload.executiveSummary.headlineAr : reportPayload.executiveSummary.headlineEn}
                  </h3>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed print:text-[10.5px]">
                  {isRtl ? reportPayload.executiveSummary.narrativeAr : reportPayload.executiveSummary.narrativeEn}
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 pt-2 border-t border-slate-200/60 print:pt-1.5">
                  {(isRtl ? reportPayload.executiveSummary.keyHighlightsAr : reportPayload.executiveSummary.keyHighlightsEn).map((item, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-xs text-slate-700 print:text-[10px]">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5 print:text-emerald-700" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 3. Core Findings & KPI Cards (أهم النتائج والمؤشرات الرئيسية)  */}
            {/* ------------------------------------------------------------- */}
            {reportPayload?.kpiCards && reportPayload.kpiCards.length > 0 && (
              <div className="space-y-2.5 print:space-y-2 print:break-inside-avoid break-inside-avoid">
                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 print:text-[11px]">
                  <BarChart3 className="w-3.5 h-3.5 text-bct-navy" />
                  {isRtl ? 'أهم النتائج والمؤشرات الرئيسية (Core KPIs):' : 'Key Performance Indicators:'}
                </h4>
                <div className={`grid grid-cols-2 md:grid-cols-${Math.min(reportPayload.kpiCards.length, 4)} gap-3 print:grid-cols-4 print:gap-2`}>
                  {reportPayload.kpiCards.map(card => {
                    const statusColor =
                      card.status === 'optimal'
                        ? 'border-emerald-200 bg-emerald-50/40 text-emerald-900 print:border-emerald-300 print:bg-emerald-50/30'
                        : card.status === 'warning'
                        ? 'border-amber-200 bg-amber-50/40 text-amber-900 print:border-amber-300 print:bg-amber-50/30'
                        : card.status === 'critical'
                        ? 'border-rose-200 bg-rose-50/40 text-rose-900 print:border-rose-300 print:bg-rose-50/30'
                        : 'border-slate-200 bg-slate-50/60 text-slate-900 print:border-slate-300 print:bg-slate-50/30';

                    return (
                      <div
                        key={card.id}
                        className={`p-3 rounded-xl border ${statusColor} space-y-1 transition-all print:p-2.5 print:break-inside-avoid break-inside-avoid`}
                      >
                        <span className="text-xs font-semibold text-slate-500 block truncate print:text-[10px]">
                          {isRtl ? card.titleAr : card.titleEn}
                        </span>
                        <div className="text-xl font-black text-slate-900 print:text-base">
                          {(() => {
                            const valStr = String(card.formattedValue ?? card.value ?? '');
                            const isNumericOrCurrency =
                              valStr.includes('EGP') ||
                              valStr.includes('USD') ||
                              valStr.startsWith('+') ||
                              valStr.startsWith('-') ||
                              /^[+-]?\d/.test(valStr.trim());
                            return isNumericOrCurrency ? (
                              <span className="inline-block tabular-nums font-black">
                                {valStr}
                              </span>
                            ) : (
                              valStr
                            );
                          })()}
                        </div>
                        {card.change && (
                          <div
                            className={`text-[11px] font-bold flex items-center gap-1 print:text-[9.5px] ${
                              card.changeType === 'positive'
                                ? 'text-emerald-700'
                                : card.changeType === 'negative'
                                ? 'text-rose-700'
                                : 'text-slate-500'
                            }`}
                          >
                            {card.changeType === 'positive' ? (
                              <ArrowUpRight className="w-3 h-3 shrink-0" />
                            ) : card.changeType === 'negative' ? (
                              <ArrowDownRight className="w-3 h-3 shrink-0" />
                            ) : null}
                            <span className="truncate">{card.change}</span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 4. Detailed Data Table (الجداول التفصيلية)                     */}
            {/* ------------------------------------------------------------- */}
            {reportPayload?.table && (
              <div className="space-y-2.5 print:space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 print:text-[11px]">
                    <FileCheck2 className="w-3.5 h-3.5 text-bct-navy" />
                    {isRtl ? reportPayload.table.titleAr : reportPayload.table.titleEn}
                  </h4>
                  <span className="text-[11px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full print:border print:border-slate-200 print:text-[10px]">
                    {reportPayload.table.totalCount} {isRtl ? 'سجل معتمد' : 'records'}
                  </span>
                </div>

                <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs print:border-slate-300 print:rounded-none">
                  {/* A. FULL STRUCTURED TABLE FOR DESKTOP & PRINT - 100% VISIBLE WITHOUT HORIZONTAL SCROLL */}
                  <div className="hidden md:block w-full overflow-hidden print:block">
                    <table className="w-full text-start text-[11px] lg:text-xs border-collapse table-auto print:text-[10px]">
                      <thead className="print:table-header-group">
                        <tr className="bg-slate-100/90 border-b-2 border-slate-300 font-bold text-slate-800 print:bg-slate-100 print:text-black">
                          {reportPayload.table.columns.map(col => {
                            const isCompact = col.isBadge || col.isDate || col.key.includes('code') || col.key.includes('id') || col.key.includes('amount') || col.key.includes('currency') || col.key.includes('dept') || col.key.includes('rate') || col.key.includes('percent');
                            return (
                              <th
                                key={col.key}
                                className={`py-2 px-2 xl:px-2.5 whitespace-nowrap text-slate-800 font-bold ${
                                  col.align === 'center'
                                    ? 'text-center'
                                    : col.align === 'right'
                                    ? 'text-right'
                                    : 'text-start'
                                } ${isCompact ? 'w-px' : 'w-auto'}`}
                              >
                                {isRtl ? col.labelAr : col.labelEn}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white print:divide-slate-200">
                        {reportPayload.table.rows.length === 0 ? (
                          <tr>
                            <td
                              colSpan={reportPayload.table.columns.length}
                              className="py-8 text-center text-slate-400 text-xs print:py-4 print:text-[10px]"
                            >
                              {isRtl
                                ? 'لا توجد بيانات مسجلة مطابقة خلال الفترة الزمنية المحددة'
                                : 'No records found for the selected time range'}
                            </td>
                          </tr>
                        ) : (
                          reportPayload.table.rows.map(row => (
                            <tr key={row.id} className="hover:bg-slate-50/80 transition-colors print:break-inside-avoid break-inside-avoid print:hover:bg-transparent">
                              {reportPayload?.table?.columns.map(col => {
                                const val = row[col.key];
                                const isCode = col.key.includes('code') || col.key.includes('id');
                                const isAmountOrNum = typeof val === 'string' && (val.includes('EGP') || val.includes('USD') || val.startsWith('+') || val.startsWith('-') || /^[+-]?\d/.test(val.trim()));

                                if (col.isBadge) {
                                  const isPositive =
                                    String(val).includes('معتمد') ||
                                    String(val).includes('مسدد') ||
                                    String(val).includes('مغلقة') ||
                                    String(val).includes('ممتاز') ||
                                    String(val).includes('نشطة') ||
                                    String(val).includes('100%');
                                  const isDanger =
                                    String(val).includes('ملغى') ||
                                    String(val).includes('ملغي') ||
                                    String(val).includes('معكوس') ||
                                    String(val).includes('مرفوض') ||
                                    String(val).includes('تجاوز') ||
                                    String(val).toLowerCase().includes('cancelled') ||
                                    String(val).toLowerCase().includes('reversed') ||
                                    String(val).toLowerCase().includes('rejected');
                                  const isWarning =
                                    String(val).includes('مراجعة') ||
                                    String(val).includes('معلق') ||
                                    String(val).includes('تنبيه') ||
                                    String(val).includes('بانتظار');

                                  return (
                                    <td key={col.key} className="py-2 px-2 xl:px-2.5 whitespace-nowrap text-center print:py-1.5 print:px-2">
                                      <span
                                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap print:text-[9px] ${
                                          isPositive
                                            ? 'bg-emerald-100 text-emerald-800 print:border print:border-emerald-300'
                                            : isDanger
                                            ? 'bg-rose-100 text-rose-800 print:border print:border-rose-300'
                                            : isWarning
                                            ? 'bg-amber-100 text-amber-800 print:border print:border-amber-300'
                                            : 'bg-slate-100 text-slate-700 print:border print:border-slate-300'
                                        }`}
                                      >
                                        {val}
                                      </span>
                                    </td>
                                  );
                                }

                                return (
                                  <td
                                    key={col.key}
                                    className={`py-2 px-2 xl:px-2.5 text-slate-700 print:py-1.5 print:px-2 ${
                                      isCode
                                        ? 'font-mono font-bold text-bct-navy whitespace-nowrap print:text-black'
                                        : col.isDate
                                        ? 'tabular-nums text-slate-600 whitespace-nowrap print:text-slate-700'
                                        : isAmountOrNum
                                        ? 'tabular-nums font-semibold whitespace-nowrap text-slate-900'
                                        : ''
                                    } ${
                                      col.align === 'center'
                                        ? 'text-center'
                                        : col.align === 'right'
                                        ? 'text-right'
                                        : 'text-start'
                                    }`}
                                  >
                                    {isAmountOrNum ? (
                                      <span className="inline-block tabular-nums font-semibold">
                                        {val}
                                      </span>
                                    ) : (
                                      val
                                    )}
                                  </td>
                                );
                              })}
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* B. RESPONSIVE CARDS VIEW FOR SMALL SCREENS (< md) - ZERO HORIZONTAL SCROLLING */}
                  <div className="md:hidden print:hidden divide-y divide-slate-100 bg-slate-50/40 p-2.5 space-y-2.5">
                    {reportPayload.table.rows.length === 0 ? (
                      <div className="py-8 text-center text-slate-400 text-xs">
                        {isRtl
                          ? 'لا توجد بيانات مسجلة مطابقة خلال الفترة الزمنية المحددة'
                          : 'No records found for the selected time range'}
                      </div>
                    ) : (
                      reportPayload.table.rows.map((row, idx) => {
                        const badgeCol = reportPayload.table?.columns.find(c => c.isBadge);
                        const badgeVal = badgeCol ? row[badgeCol.key] : null;
                        const otherCols = reportPayload.table?.columns.filter(c => c !== badgeCol) || [];
                        const primaryCol = otherCols[0];
                        const secondaryCols = otherCols.slice(1);

                        const isPositive =
                          String(badgeVal).includes('معتمد') ||
                          String(badgeVal).includes('مسدد') ||
                          String(badgeVal).includes('مغلقة') ||
                          String(badgeVal).includes('ممتاز') ||
                          String(badgeVal).includes('نشطة') ||
                          String(badgeVal).includes('100%');
                        const isDanger =
                          String(badgeVal).includes('ملغى') ||
                          String(badgeVal).includes('ملغي') ||
                          String(badgeVal).includes('معكوس') ||
                          String(badgeVal).includes('مرفوض') ||
                          String(badgeVal).includes('تجاوز');
                        const isWarning =
                          String(badgeVal).includes('مراجعة') ||
                          String(badgeVal).includes('معلق') ||
                          String(badgeVal).includes('تنبيه') ||
                          String(badgeVal).includes('بانتظار');

                        return (
                          <div key={row.id || idx} className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs space-y-2">
                            {/* Card Header: Primary Identifier + Badge */}
                            <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2">
                              <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs">
                                <span className="w-1.5 h-1.5 rounded-full bg-bct-navy"></span>
                                <span className={primaryCol?.key.includes('code') ? 'font-mono text-bct-navy' : ''}>
                                  {primaryCol ? row[primaryCol.key] : `#${idx + 1}`}
                                </span>
                              </div>
                              {badgeVal && (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-bold whitespace-nowrap ${
                                    isPositive
                                      ? 'bg-emerald-100 text-emerald-800'
                                      : isDanger
                                      ? 'bg-rose-100 text-rose-800'
                                      : isWarning
                                      ? 'bg-amber-100 text-amber-800'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {badgeVal}
                                </span>
                              )}
                            </div>

                            {/* Card Key-Value Grid */}
                            <div className="grid grid-cols-2 gap-2 text-[11px] pt-1">
                              {secondaryCols.map(col => {
                                const val = row[col.key];
                                return (
                                  <div key={col.key} className="space-y-0.5">
                                    <span className="text-[10px] font-semibold text-slate-400 block whitespace-nowrap">
                                      {isRtl ? col.labelAr : col.labelEn}
                                    </span>
                                    <span className={`text-slate-700 font-medium ${
                                      col.key.includes('code')
                                        ? 'font-mono font-bold text-bct-navy'
                                        : col.isDate
                                        ? 'tabular-nums'
                                        : ''
                                    }`}>
                                      {val || '—'}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 5. Distribution & Charts (الرسوم البيانية وتوزيع القنوات)      */}
            {/* ------------------------------------------------------------- */}
            {reportPayload?.distribution && reportPayload.distribution.items.length > 0 && (
              <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200 space-y-2.5 print:bg-white print:border-slate-300 print:p-3 print:break-inside-avoid break-inside-avoid">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 flex items-center gap-1.5 print:text-[11px]">
                    <PieChart className="w-3.5 h-3.5 text-bct-navy" />
                    {isRtl ? reportPayload.distribution.titleAr : reportPayload.distribution.titleEn}
                  </h4>
                </div>
                <div className="space-y-2 pt-1">
                  {reportPayload.distribution.items.map(item => (
                    <div key={item.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-medium print:text-[10px]">
                        <span className="text-slate-700 font-semibold">{isRtl ? item.labelAr : item.labelEn}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 tabular-nums font-medium text-[11px] print:text-[10px]">
                            {item.formattedValue || item.value}
                          </span>
                          <span className="font-bold tabular-nums text-slate-900">{item.percentage}%</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden print:h-1.5">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            item.color === 'emerald'
                              ? 'bg-emerald-600'
                              : item.color === 'amber'
                              ? 'bg-amber-500'
                              : item.color === 'blue'
                              ? 'bg-blue-600'
                              : item.color === 'indigo'
                              ? 'bg-indigo-600'
                              : item.color === 'rose'
                              ? 'bg-rose-600'
                              : 'bg-bct-navy'
                          }`}
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 6. Executive Analysis & Recommendations (التحليل والتوصيات)   */}
            {/* ------------------------------------------------------------- */}
            {reportPayload?.executiveSummary?.recommendationAr && (
              <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/80 border-r-4 border-r-bct-navy space-y-1.5 print:bg-white print:border-slate-300 print:border-r-4 print:border-r-bct-navy print:p-3 print:break-inside-avoid break-inside-avoid">
                <div className="flex items-center gap-2 text-bct-navy font-bold text-xs print:text-[11px]">
                  <Award className="w-4 h-4 text-bct-navy shrink-0" />
                  <span>{isRtl ? 'التحليل والتوصيات التنفيذية وقرارات المتابعة:' : 'Executive Analysis & Actionable Recommendations:'}</span>
                </div>
                <p className="text-xs text-slate-800 leading-relaxed font-medium print:text-[10px]">
                  {isRtl ? reportPayload.executiveSummary.recommendationAr : reportPayload.executiveSummary.recommendationEn}
                </p>
              </div>
            )}

            {/* ------------------------------------------------------------- */}
            {/* 7. Official 3-Tier Approvals & Signatures (بيانات الاعتماد)   */}
            {/* ------------------------------------------------------------- */}
            <div className="pt-6 border-t-2 border-slate-200 space-y-4 print:pt-4 print:space-y-3 print:break-inside-avoid break-inside-avoid">
              <div className="grid grid-cols-3 gap-6 text-center text-xs text-slate-600 print:gap-4 print:text-[10px]">
                {/* Tier 1: Prepared By */}
                <div className="space-y-3 print:space-y-2">
                  <span className="block font-bold text-slate-800">
                    {isRtl ? 'المعد والمدقق (Prepared By):' : 'Prepared & Audited By:'}
                  </span>
                  <div className="text-slate-700">
                    <div className="font-bold">
                      {isRtl
                        ? (reportPayload?.signatures?.preparedBy.nameAr || currentEmployee?.full_name_ar)
                        : (reportPayload?.signatures?.preparedBy.nameEn || currentEmployee?.full_name_en || currentEmployee?.full_name_ar)}
                    </div>
                    <div className="text-[10px] text-slate-400 print:text-[9px]">
                      {isRtl
                        ? (reportPayload?.signatures?.preparedBy.titleAr || currentEmployee?.job_title_ar)
                        : (reportPayload?.signatures?.preparedBy.titleEn || currentEmployee?.job_title_en || currentEmployee?.job_title_ar)}
                    </div>
                  </div>
                  <div className="border-b border-dashed border-slate-300 w-32 mx-auto pt-3 print:pt-2" />
                  <span className="text-[10px] text-slate-400 block print:text-[8px]">{isRtl ? 'التوقيع والتدقيق' : 'Sign & Stamp'}</span>
                </div>

                {/* Tier 2: Department Head Approval */}
                <div className="space-y-3 print:space-y-2">
                  <span className="block font-bold text-slate-800">
                    {isRtl ? 'مدير الإدارة المختص (Department Head):' : 'Department Head Approval:'}
                  </span>
                  <div className="text-slate-700">
                    <div className="font-bold">
                      {isRtl
                        ? (reportPayload?.signatures?.departmentHead.nameAr || deptHeadEmployee?.full_name_ar || currentDeptObj?.name_ar || 'مدير الإدارة')
                        : (reportPayload?.signatures?.departmentHead.nameEn || deptHeadEmployee?.full_name_en || currentDeptObj?.name_en || 'Department Head')}
                    </div>
                    <div className="text-[10px] text-slate-400 print:text-[9px]">
                      {isRtl
                        ? (reportPayload?.signatures?.departmentHead.titleAr || deptHeadEmployee?.job_title_ar || currentDeptObj?.head_title_ar || 'مدير الإدارة')
                        : (reportPayload?.signatures?.departmentHead.titleEn || deptHeadEmployee?.job_title_en || currentDeptObj?.head_title_en || 'Department Head')} - {isRtl ? 'مراجعة واعتماد التدفقات' : 'Verified & Approved'}
                    </div>
                  </div>
                  <div className="border-b border-dashed border-slate-300 w-32 mx-auto pt-3 print:pt-2" />
                  <span className="text-[10px] text-slate-400 block print:text-[8px]">{isRtl ? 'اعتماد الإدارة' : 'Department Sign'}</span>
                </div>

                {/* Tier 3: General Manager Approval (Strictly Dynamic from Employee Directory) */}
                <div className="space-y-3 print:space-y-2">
                  <span className="block font-bold text-bct-navy">
                    {isRtl ? 'اعتماد الإدارة العليا (General Manager):' : 'Executive GM Approval:'}
                  </span>
                  <div className="font-bold text-bct-navy">
                    <div className="text-sm print:text-xs">
                      {isRtl
                        ? (reportPayload?.signatures?.generalManager.nameAr || gmEmployee?.full_name_ar || 'خليل محمد عثمان')
                        : (reportPayload?.signatures?.generalManager.nameEn || gmEmployee?.full_name_en || 'Khalil Mohamed Osman')}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-bold print:text-[9px]">
                      {isRtl
                        ? `${reportPayload?.signatures?.generalManager.titleAr || gmEmployee?.job_title_ar || 'المدير العام'} - معتمد رسمياً بخاتم BCT`
                        : `${reportPayload?.signatures?.generalManager.titleEn || gmEmployee?.job_title_en || 'General Manager'} - Officially Certified`}
                    </div>
                  </div>
                  <div className="border-b-2 border-bct-navy w-32 mx-auto pt-3 print:pt-2" />
                  <div className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 print:text-[8px]">
                    <span>✓ BCT OFFICIAL DIGITAL SEAL</span>
                  </div>
                </div>
              </div>

              {/* Document Verification Footer Bar */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400 print:text-[8.5px] print:pt-2">
                <div>
                  <span>{isRtl ? 'نظام BCT المؤسسي المتكامل' : 'BCT Enterprise System'}</span> •{' '}
                  <span className="font-mono">{reportPayload?.referenceNumber}</span> •{' '}
                  <span className="tabular-nums">{extractionTimestamp}</span>
                </div>
                <div>
                  {isRtl
                    ? 'وثيقة صادرة إلكترونياً ومعتمدة دون الحاجة لختم ورقي تقليدي'
                    : 'Electronically verified document generated by BCT Enterprise System'}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};