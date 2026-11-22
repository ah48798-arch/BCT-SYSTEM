import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { 
  Globe, 
  Bell, 
  LogOut, 
  ChevronDown, 
  Menu, 
  X,
  CheckCheck,
  CheckSquare,
  AlertCircle,
  FileText,
  Clock,
  Receipt,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { bctStore } from '../../services/store';
import { AppNotification } from '../../types/database.types';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { language, setLanguage, t, isRtl } = useLanguage();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'tasks' | 'approvals' | 'requests' | 'files'>('all');
  const [notifications, setNotifications] = useState<AppNotification[]>(() => 
    bctStore.getNotificationsForUser(currentUser)
  );

  const userMenuRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time notification changes scoped to currentUser
  useEffect(() => {
    setNotifications(bctStore.getNotificationsForUser(currentUser));
    return bctStore.subscribe(() => {
      setNotifications(bctStore.getNotificationsForUser(currentUser));
    });
  }, [currentUser]);

  // FIX 04: Handle outside clicks and Escape key
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setShowUserMenu(false);
        setShowNotifications(false);
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const toggleLanguage = () => {
    setLanguage(language === 'ar' ? 'en' : 'ar');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  type NotificationTab = 'all' | 'unread' | 'tasks' | 'approvals' | 'requests' | 'files';

  const filterTabs: { id: NotificationTab; labelAr: string; labelEn: string }[] = [
    { id: 'all', labelAr: 'الكل', labelEn: 'All' },
    { id: 'unread', labelAr: 'غير مقروءة', labelEn: 'Unread' },
    { id: 'tasks', labelAr: 'المهام', labelEn: 'Tasks' },
    { id: 'approvals', labelAr: 'الاعتمادات', labelEn: 'Approvals' },
    { id: 'requests', labelAr: 'الطلبات', labelEn: 'Requests' },
    { id: 'files', labelAr: 'الملفات والمعاملات', labelEn: 'Files & Txns' }
  ];

  const getTabCount = (tabId: NotificationTab) => {
    switch (tabId) {
      case 'unread':
        return notifications.filter(n => !n.read).length;
      case 'tasks':
        return notifications.filter(n => n.category === 'task' || n.module === 'tasks').length;
      case 'approvals':
        return notifications.filter(n => n.category === 'approval' || n.module === 'approvals' || n.category === 'handoff').length;
      case 'requests':
        return notifications.filter(n => n.category === 'request' || n.title_ar?.includes('طلب') || n.title_en?.toLowerCase().includes('request')).length;
      case 'files':
        return notifications.filter(n => n.category === 'file' || n.category === 'file_update' || n.category === 'payment' || n.module === 'crm' || n.module === 'finance').length;
      case 'all':
      default:
        return notifications.length;
    }
  };

  const filteredNotifications = notifications.filter(notif => {
    switch (activeTab) {
      case 'unread':
        return !notif.read;
      case 'tasks':
        return notif.category === 'task' || notif.module === 'tasks';
      case 'approvals':
        return notif.category === 'approval' || notif.module === 'approvals' || notif.category === 'handoff';
      case 'requests':
        return notif.category === 'request' || notif.title_ar?.includes('طلب') || notif.title_en?.toLowerCase().includes('request');
      case 'files':
        return notif.category === 'file' || notif.category === 'file_update' || notif.category === 'payment' || notif.module === 'crm' || notif.module === 'finance';
      case 'all':
      default:
        return true;
    }
  });

  // Resolve current user job title dynamically from linked Employee record and selected language
  const userJobTitle = bctStore.getEmployeeJobTitle(currentUser, language);
  const userFullName = language === 'ar' 
    ? (currentUser?.full_name_ar || currentUser?.full_name_en || '') 
    : (currentUser?.full_name_en || currentUser?.full_name_ar || '');

  const handleNotificationClick = (notif: AppNotification) => {
    bctStore.markNotificationRead(notif.id, currentUser);
    setShowNotifications(false);
    if (notif.related_link) {
      navigate(notif.related_link);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    bctStore.markAllNotificationsReadForUser(currentUser);
  };

  const formatNotificationTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return isRtl ? 'الآن' : 'Just now';
      if (diffMins < 60) return isRtl ? `منذ ${diffMins} دقيقة` : `${diffMins}m ago`;
      if (diffHours < 24) return isRtl ? `منذ ${diffHours} س` : `${diffHours}h ago`;
      if (diffDays === 1) return isRtl ? 'أمس' : 'Yesterday';
      return date.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', { month: 'short', day: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const getCategoryIcon = (category: AppNotification['category']) => {
    switch (category) {
      case 'task':
        return <CheckSquare className="w-4 h-4 text-blue-600" />;
      case 'payment':
        return <Receipt className="w-4 h-4 text-emerald-600" />;
      case 'approval':
        return <ShieldCheck className="w-4 h-4 text-amber-600" />;
      case 'complaint':
        return <AlertCircle className="w-4 h-4 text-rose-600" />;
      case 'overdue':
        return <Clock className="w-4 h-4 text-rose-600" />;
      default:
        return <FileText className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="px-4 lg:px-6 h-16 flex items-center justify-between">
        
        {/* Left / Start: Brand & Mobile Toggle */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 lg:hidden focus:outline-none"
            title="Toggle Menu"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="flex items-center gap-3">
            <img 
              src="/assets/brand/BCT_Vertical_Mono_Navy.png" 
              alt="BCT Logo" 
              className="h-10 w-auto object-contain"
            />
            <div className="hidden sm:block border-s border-slate-300 ps-3">
              <h1 className="text-sm font-bold text-bct-navy leading-tight">
                {t('brand.name')}
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                {t('brand.tagline')}
              </p>
            </div>
          </div>
        </div>

        {/* Right / End: Language Switcher, Notifications, Profile (Role Switcher Removed per FIX 01) */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Language Switcher */}
          <button
            onClick={toggleLanguage}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
            title={language === 'ar' ? 'التحويل إلى اللغة الإنجليزية' : 'Switch to Arabic language'}
          >
            <Globe className="w-4 h-4 text-bct-navy" />
            <span>{language === 'ar' ? 'English' : 'العربية'}</span>
          </button>

          {/* FIX 02: Repaired Notification Center */}
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition relative focus:outline-none"
              title={isRtl ? 'الإشعارات والتنبيهات' : 'Notifications'}
              aria-label="Notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div 
                className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-80 sm:w-[420px] max-w-[95vw] bg-white rounded-2xl shadow-xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150`}
              >
                {/* Notification Header */}
                <div className="px-4 py-3 bg-bct-navy text-white flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4" />
                    <span className="font-bold text-xs">
                      {isRtl ? 'مركز التنبيهات والإشعارات' : 'Notification Center'}
                    </span>
                    {unreadCount > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
                        {unreadCount} {isRtl ? 'جديد' : 'new'}
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-blue-200 hover:text-white flex items-center gap-1 font-semibold transition"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>{isRtl ? 'تعيين الكل كمقروء' : 'Mark all read'}</span>
                    </button>
                  )}
                </div>

                {/* Filter Tabs Bar */}
                <div className="flex items-center gap-1 p-2 bg-slate-50 border-b border-slate-200 overflow-x-auto">
                  {filterTabs.map(tab => {
                    const count = getTabCount(tab.id);
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition flex items-center gap-1.5 ${
                          isActive
                            ? 'bg-bct-navy text-white shadow-sm'
                            : 'text-slate-600 hover:bg-slate-200/70'
                        }`}
                      >
                        <span>{isRtl ? tab.labelAr : tab.labelEn}</span>
                        {count > 0 && (
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                          }`}>
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {/* Notifications List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {filteredNotifications.length === 0 ? (
                    <div className="p-8 text-center text-xs text-slate-400">
                      {isRtl ? 'لا توجد إشعارات في هذا التصنيف' : 'No notifications in this category'}
                    </div>
                  ) : (
                    filteredNotifications.map(notif => (
                      <div
                        key={notif.id}
                        onClick={() => handleNotificationClick(notif)}
                        className={`p-3.5 flex items-start gap-3 cursor-pointer transition ${
                          notif.read ? 'bg-white hover:bg-slate-50' : 'bg-blue-50/50 hover:bg-blue-50/80 font-medium'
                        }`}
                      >
                        <div className="p-2 bg-slate-100 rounded-xl flex-shrink-0 mt-0.5">
                          {getCategoryIcon(notif.category)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className="text-xs font-bold text-slate-800 truncate">
                              {isRtl ? notif.title_ar : notif.title_en}
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {notif.priority === 'urgent' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-rose-100 text-rose-700 border border-rose-200">
                                  {isRtl ? 'عاجل' : 'Urgent'}
                                </span>
                              )}
                              {notif.priority === 'high' && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-100 text-amber-700 border border-amber-200">
                                  {isRtl ? 'هام' : 'High'}
                                </span>
                              )}
                              {!notif.read && (
                                <span className="w-2 h-2 rounded-full bg-bct-navy shrink-0" />
                              )}
                            </div>
                          </div>
                          <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                            {isRtl ? notif.description_ar : notif.description_en}
                          </p>
                          <div className="flex items-center justify-between mt-1 text-[10px] text-slate-400 font-medium">
                            {notif.sender_name ? (
                              <span className="truncate text-slate-500">
                                {isRtl ? `من: ${notif.sender_name}` : `From: ${notif.sender_name}`}
                              </span>
                            ) : <span />}
                            <span className="tabular-nums text-slate-400">
                              {formatNotificationTime(notif.created_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* FIX 04: Current User Badge & Dropdown with Outside-Click & Escape Dismissal */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-50 border border-transparent hover:border-slate-200 transition focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-bct-navy text-white flex items-center justify-center font-bold text-xs shadow-sm">
                {(userFullName || 'BC').slice(0, 2)}
              </div>
              <div className="hidden sm:block text-start leading-tight">
                <div className="text-xs font-bold text-slate-800 line-clamp-1">
                  {userFullName}
                </div>
                <div className="text-[10px] text-slate-500 font-medium line-clamp-1 mt-0.5">
                  {userJobTitle}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
            </button>

            {showUserMenu && (
              <div 
                className={`absolute ${isRtl ? 'left-0' : 'right-0'} mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150`}
              >
                <div className="px-4 py-3 border-b border-slate-100">
                  <p className="text-xs font-bold text-slate-800">
                    {userFullName}
                  </p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                    {userJobTitle}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{currentUser?.email}</p>
                  <span className="inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-bct-surface text-bct-navy border border-slate-200">
                    {String(currentUser?.department_id).toUpperCase()} • {currentUser?.employee_code}
                  </span>
                </div>

                <div className="pt-1">
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="w-full text-start px-4 py-2.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2 transition font-medium"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </header>
  );
};
