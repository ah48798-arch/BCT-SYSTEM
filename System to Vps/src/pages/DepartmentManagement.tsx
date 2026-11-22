import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { Department, Employee } from '../types/database.types';
import {
  Building2,
  Users,
  UserCheck,
  Plus,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  ChevronRight,
  Shield,
  Layers,
  Trash2,
  AlertTriangle,
  X
} from 'lucide-react';

export const DepartmentManagement: React.FC = () => {
  const { isRtl, t } = useLanguage();
  const { currentEmployee, isSuperAdmin } = useAuth();

  const [departments, setDepartments] = useState<Department[]>(bctStore.getDepartments());
  const [employees, setEmployees] = useState<Employee[]>(bctStore.getEmployees());

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Delete modal state
  const [deleteCandidate, setDeleteCandidate] = useState<Department | null>(null);
  const [deleteBlockedError, setDeleteBlockedError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name_ar: '',
    name_en: '',
    code: '',
    head_employee_id: '',
    description: '',
    color: '#154568'
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    return bctStore.subscribe(() => {
      setDepartments(bctStore.getDepartments());
      setEmployees(bctStore.getEmployees());
    });
  }, []);

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormData({
      name_ar: '',
      name_en: '',
      code: '',
      head_employee_id: '',
      description: '',
      color: '#154568'
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setFormData({
      name_ar: dept.name_ar,
      name_en: dept.name_en,
      code: dept.code || String(dept.id),
      head_employee_id: dept.head_employee_id || '',
      description: dept.description || '',
      color: dept.color || '#154568'
    });
    setIsModalOpen(true);
  };

  const handleDeleteClick = (dept: Department) => {
    if (dept.id === 'gm' || dept.code === 'gm') {
      setMessage({
        type: 'error',
        text: isRtl ? 'لا يمكن حذف الإدارة العامة (GM) لأنها الكيان القيادي الأعلى للشركة' : 'General Management (GM) cannot be deleted'
      });
      setTimeout(() => setMessage(null), 4000);
      return;
    }

    const assignedActiveEmps = employees.filter(
      e => (e.department_id === dept.code || e.department_id === dept.id) && e.employment_status === 'active'
    );

    if (assignedActiveEmps.length > 0) {
      setDeleteCandidate(dept);
      setDeleteBlockedError(
        isRtl
          ? `لا يمكن حذف هذا القسم لوجود ${assignedActiveEmps.length} موظفين مرتبطين به حالياً. يرجى نقل الموظفين أولاً.`
          : `Cannot delete department with ${assignedActiveEmps.length} assigned employees. Reassign employees first.`
      );
      return;
    }

    setDeleteCandidate(dept);
    setDeleteBlockedError(null);
  };

  const confirmDelete = () => {
    if (!deleteCandidate) return;
    const res = bctStore.deleteDepartment(deleteCandidate.id, currentEmployee?.username || 'admin');
    if (!res.success) {
      setDeleteBlockedError(res.message || 'Failed to delete department');
      return;
    }

    setMessage({
      type: 'success',
      text: isRtl ? 'تم حذف القسم بنجاح' : 'Department deleted successfully'
    });
    setDeleteCandidate(null);
    setDeleteBlockedError(null);
    setTimeout(() => setMessage(null), 3000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name_ar || !formData.code) {
      setMessage({ type: 'error', text: isRtl ? 'يرجى ملء جميع الحقول الإلزامية' : 'Please fill all required fields' });
      return;
    }

    if (editingDept) {
      bctStore.updateDepartment(
        editingDept.id,
        {
          name_ar: formData.name_ar,
          name_en: formData.name_en,
          code: formData.code,
          head_employee_id: formData.head_employee_id || undefined,
          description: formData.description,
          color: formData.color
        },
        currentEmployee?.username || 'admin'
      );
      setMessage({ type: 'success', text: isRtl ? 'تم تحديث بيانات القسم بنجاح' : 'Department updated successfully' });
    } else {
      bctStore.createDepartment(
        {
          name_ar: formData.name_ar,
          name_en: formData.name_en,
          code: formData.code,
          head_employee_id: formData.head_employee_id || undefined,
          description: formData.description,
          color: formData.color,
          order_index: departments.length + 1
        },
        currentEmployee?.username || 'admin'
      );
      setMessage({ type: 'success', text: isRtl ? 'تم إنشاء القسم الجديد بنجاح' : 'New department created successfully' });
    }

    setIsModalOpen(false);
    setTimeout(() => setMessage(null), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-bct-navy text-white rounded-lg">
              <Building2 className="w-5 h-5" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">
              {isRtl ? 'إدارة الأقسام والوحدات التنظيمية' : 'Department & Unit Management'}
            </h1>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            {isRtl
              ? `تكوين الأقسام الستة الأساسية لـ ${t('brand.name')}، تعيين مديري الإدارات، ومتابعة القوى العاملة`
              : `Configure the core organizational departments of ${t('brand.name')}, assign department heads, and monitor staffing`}
          </p>
        </div>

        {isSuperAdmin && (
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2.5 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-sm font-bold shadow flex items-center gap-2 transition-colors self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isRtl ? 'إضافة قسم جديد' : 'Add New Department'}</span>
          </button>
        )}
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm font-semibold ${message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'}`}>
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      {/* Department Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map(dept => {
          const deptEmployees = employees.filter(e => e.department_id === dept.code || e.department_id === dept.id);
          const deptHead = employees.find(e => e.id === dept.head_employee_id);
          const isGM = dept.id === 'gm' || dept.code === 'gm';

          return (
            <div key={dept.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col justify-between">
              <div className="p-6">
                <div className="flex items-center justify-between mb-3">
                  <span
                    className="w-3.5 h-3.5 rounded-full inline-block"
                    style={{ backgroundColor: dept.color || '#154568' }}
                  />
                  <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded">
                    {dept.code}
                  </span>
                </div>

                <h3 className="text-lg font-bold text-slate-900 mb-1">
                  {isRtl ? dept.name_ar : dept.name_en}
                </h3>
                <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                  {dept.description || (isRtl ? 'وحدة تنظيمية معتمدة في الهيكل الإداري' : 'Authorized organizational unit')}
                </p>

                {/* Head of Department */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3 mb-4">
                  <div className="w-9 h-9 rounded-full bg-bct-navy/10 text-bct-navy flex items-center justify-center font-bold text-xs flex-shrink-0">
                    <UserCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      {isRtl ? 'مدير الإدارة / المشرف' : 'Department Head'}
                    </span>
                    <span className="text-xs font-bold text-slate-800">
                      {deptHead ? (isRtl ? deptHead.full_name_ar : deptHead.full_name_en) : (isRtl ? 'غير معين' : 'Unassigned')}
                    </span>
                  </div>
                </div>

                {/* Staff Count */}
                <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                  <span className="flex items-center gap-1.5 font-medium">
                    <Users className="w-4 h-4 text-slate-400" />
                    <span>{deptEmployees.length} {isRtl ? 'موظفين بالقسم' : 'staff members'}</span>
                  </span>
                  <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                    {isRtl ? 'نشط' : 'Active'}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
                <button
                  onClick={() => handleOpenEdit(dept)}
                  className="text-xs font-bold text-bct-navy hover:underline flex items-center gap-1"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تعديل وتعيين المدير' : 'Edit & Assign'}</span>
                </button>

                {isSuperAdmin && (
                  isGM ? (
                    <span 
                      className="text-xs text-slate-400 flex items-center gap-1 cursor-not-allowed"
                      title={isRtl ? 'لا يمكن حذف الإدارة العامة' : 'General Management cannot be deleted'}
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'محمي (الإدارة)' : 'Protected'}</span>
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeleteClick(dept)}
                      className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:bg-rose-50 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'حذف القسم' : 'Delete'}</span>
                    </button>
                  )
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Delete / Validation Dialog */}
      {deleteCandidate && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 text-center animate-in fade-in zoom-in-95">
            <div className={`w-12 h-12 rounded-full mx-auto flex items-center justify-center mb-4 ${
              deleteBlockedError ? 'bg-amber-100 text-amber-600' : 'bg-rose-100 text-rose-600'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-800">
              {deleteBlockedError 
                ? (isRtl ? 'لا يمكن إتمام عملية الحذف' : 'Deletion Blocked') 
                : (isRtl ? 'تأكيد حذف القسم' : 'Confirm Department Deletion')}
            </h3>

            {deleteBlockedError ? (
              <div className="mt-3 p-3 bg-amber-50 text-amber-800 text-xs font-medium rounded-xl border border-amber-200 text-start">
                {deleteBlockedError}
              </div>
            ) : (
              <p className="text-xs text-slate-500 mt-2">
                {isRtl
                  ? `هل أنت متأكد من حذف قسم (${deleteCandidate.name_ar}) نهائياً؟ هذا الإجراء لا يمكن التراجع عنه.`
                  : `Are you sure you want to delete department (${deleteCandidate.name_en})? This cannot be undone.`}
              </p>
            )}

            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => { setDeleteCandidate(null); setDeleteBlockedError(null); }}
                className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-semibold"
              >
                {deleteBlockedError ? (isRtl ? 'فهمت' : 'Close') : (isRtl ? 'إلغاء' : 'Cancel')}
              </button>

              {!deleteBlockedError && (
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'تأكيد الحذف' : 'Confirm Delete'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit/Create Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 bg-bct-navy text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">
                  {editingDept
                    ? (isRtl ? 'تعديل بيانات القسم' : 'Edit Department')
                    : (isRtl ? 'إضافة قسم جديد' : 'Create Department')}
                </h3>
                <p className="text-xs text-blue-100/80 mt-1">
                  {isRtl ? 'تحديد المسمى، الرمز الكودي، ومدير الإدارة المسؤول' : 'Define department title, code, and responsible head'}
                </p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  {isRtl ? 'اسم القسم (بالعربية) *' : 'Department Name (Arabic) *'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.name_ar}
                  onChange={e => setFormData({ ...formData, name_ar: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-bct-navy focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  {isRtl ? 'اسم القسم (بالإنجليزية)' : 'Department Name (English)'}
                </label>
                <input
                  type="text"
                  value={formData.name_en}
                  onChange={e => setFormData({ ...formData, name_en: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-bct-navy focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                    {isRtl ? 'الرمز الكودي *' : 'Code *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={e => setFormData({ ...formData, code: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono focus:ring-2 focus:ring-bct-navy focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                    {isRtl ? 'لون التمييز' : 'Color Tag'}
                  </label>
                  <input
                    type="color"
                    value={formData.color}
                    onChange={e => setFormData({ ...formData, color: e.target.value })}
                    className="w-full h-10 p-1 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  {isRtl ? 'مدير الإدارة المسؤول' : 'Department Head'}
                </label>
                <select
                  value={formData.head_employee_id}
                  onChange={e => setFormData({ ...formData, head_employee_id: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-bct-navy focus:outline-none"
                >
                  <option value="">{isRtl ? '-- غير محدد --' : '-- Unassigned --'}</option>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>
                      {isRtl ? emp.full_name_ar : emp.full_name_en}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-600 uppercase block mb-1">
                  {isRtl ? 'الوصف والمهام الرئيسية' : 'Description'}
                </label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:ring-2 focus:ring-bct-navy focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-sm font-semibold transition-colors"
                >
                  {isRtl ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-sm font-bold shadow transition-colors"
                >
                  {isRtl ? 'حفظ التغييرات' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
