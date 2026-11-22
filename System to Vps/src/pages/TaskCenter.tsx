import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { bctStore } from '../services/store';
import { Task } from '../types/database.types';
import { 
  CheckSquare, 
  Plus, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  User, 
  Calendar, 
  Search, 
  X,
  Building2,
  Tag
} from 'lucide-react';

export const TaskCenter: React.FC = () => {
  const { t, language } = useLanguage();
  const { currentUser } = useAuth();

  const [tasks, setTasks] = useState(bctStore.getTasks());
  const employees = bctStore.getEmployees();
  const studentFiles = bctStore.getStudentFiles();

  const [searchParams] = useSearchParams();
  const [filterStatus, setFilterStatus] = useState<string>(() => {
    return searchParams.get('filter') || searchParams.get('status') || 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const f = searchParams.get('filter') || searchParams.get('status');
    if (f) {
      setFilterStatus(f);
    }
  }, [searchParams]);

  // New Task Form
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignee_id: 'emp-006',
    student_file_id: '',
    priority: 'medium' as Task['priority'],
    deadline_at: '',
  });

  useEffect(() => {
    return bctStore.subscribe(() => {
      setTasks(bctStore.getTasks());
    });
  }, []);

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.task_code.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = 
      filterStatus === 'all' ? true :
      filterStatus === 'my' ? task.assignee_id === currentUser?.id :
      filterStatus === 'pending' || filterStatus === 'open' ? (task.status !== 'completed' && task.status !== 'cancelled') :
      filterStatus === 'overdue' ? (task.status !== 'completed' && task.status !== 'cancelled' && Boolean(task.deadline_at && new Date(task.deadline_at) < new Date())) :
      task.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    bctStore.createTask({
      title: formData.title,
      description: formData.description,
      creator_id: currentUser?.id || 'emp-001',
      assignee_id: formData.assignee_id,
      student_file_id: formData.student_file_id || undefined,
      priority: formData.priority,
      status: 'assigned',
      deadline_at: formData.deadline_at ? new Date(formData.deadline_at).toISOString() : undefined
    }, currentUser?.username || 'admin');

    setIsModalOpen(false);
    setFormData({
      title: '',
      description: '',
      assignee_id: 'emp-006',
      student_file_id: '',
      priority: 'medium',
      deadline_at: '',
    });
  };

  const handleStatusChange = (taskId: string, newStatus: Task['status']) => {
    bctStore.updateTaskStatus(taskId, newStatus, currentUser?.username || 'admin');
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-bct-navy">
            {t('nav.tasks')}
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            {language === 'ar'
              ? 'مركز إدارة ومتابعة المهام التشغيلية: الإسناد، الأولويات، المهل الزمنية، وتتبع الإنجاز.'
              : 'Task Center: Assignment, Priorities, Deadlines & Completion Tracking.'}
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{language === 'ar' ? 'إنشاء مهمة جديدة' : 'New Task'}</span>
        </button>
      </div>

      {/* Filter Tabs & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute inset-y-0 start-3 my-auto pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('actions.search')}
            className="w-full ps-9 pe-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:border-bct-navy"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto">
          {[
            { id: 'all', label_ar: 'الكل', label_en: 'All' },
            { id: 'pending', label_ar: 'المهام المعلقة', label_en: 'Pending Tasks' },
            { id: 'my', label_ar: 'مهامي المسندة لي', label_en: 'Assigned to Me' },
            { id: 'in_progress', label_ar: 'قيد التنفيذ', label_en: 'In Progress' },
            { id: 'completed', label_ar: 'المكتملة', label_en: 'Completed' },
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
              {language === 'ar' ? f.label_ar : f.label_en}
            </button>
          ))}
        </div>
      </div>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 hover:shadow-md transition flex flex-col justify-between"
          >
            <div>
              {/* Header: Priority & Status */}
              <div className="flex items-center justify-between text-[10px] mb-2">
                <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                  task.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                  task.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {task.priority}
                </span>

                <span className="font-mono font-bold text-slate-400">
                  {task.task_code}
                </span>
              </div>

              <h4 className="text-xs font-extrabold text-slate-900 leading-snug">
                {task.title}
              </h4>

              {task.description && (
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2">
                  {task.description}
                </p>
              )}

              {/* Assignee & Deadline Info */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-500">
                <div className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-700">{task.assignee?.full_name_ar}</span>
                  <span className="text-[10px] text-slate-400">({task.assignee?.position_id})</span>
                </div>
                {task.deadline_at && (
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>المهلة: {task.deadline_at.split('T')[0]}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Status Selector */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-400">الحالة:</span>
              <select
                value={task.status}
                onChange={(e) => handleStatusChange(task.id, e.target.value as any)}
                className="px-2.5 py-1 rounded-lg border border-slate-200 text-xs font-bold bg-slate-50 text-slate-700"
              >
                <option value="new">جديدة (New)</option>
                <option value="assigned">مسندة (Assigned)</option>
                <option value="in_progress">قيد التنفيذ (In Progress)</option>
                <option value="completed">مكتملة (Completed)</option>
              </select>
            </div>
          </div>
        ))}
      </div>

      {/* Modal: New Task */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-sm text-slate-800">إنشاء مهمة عمل جديدة</h3>
              <button onClick={() => setIsModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateTask} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">عنوان المهمة *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                  placeholder="مثال: متابعة توثيق شهادة الطالب يوسف عبد الله"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">تفاصيل المهمة</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">المسؤول عن التنفيذ *</label>
                  <select
                    value={formData.assignee_id}
                    onChange={(e) => setFormData({ ...formData, assignee_id: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.full_name_ar}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">الأولوية</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 border rounded-lg text-xs bg-white"
                  >
                    <option value="low">منخفضة (Low)</option>
                    <option value="medium">متوسطة (Medium)</option>
                    <option value="high">مرتفعة (High)</option>
                    <option value="urgent">عاجلة جداً (Urgent)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">الموعد النهائي (Deadline)</label>
                <input
                  type="date"
                  value={formData.deadline_at}
                  onChange={(e) => setFormData({ ...formData, deadline_at: e.target.value })}
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
                  إنشاء المهمة
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
