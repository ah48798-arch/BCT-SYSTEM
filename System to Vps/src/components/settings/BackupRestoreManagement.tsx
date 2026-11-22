import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { bctStore } from '../../services/store';
import { backupService } from '../../services/backupService';
import { localAgentService } from '../../services/localAgentService';
import { browserDirectoryService, BrowserDirectoryInfo } from '../../services/browserDirectoryService';
import { rbacService } from '../../services/rbacService';
import {
  BackupRecord,
  BackupScheduleConfig,
  BackupRetentionPolicy,
  GoogleDriveConfig,
  BackupFilter,
  BackupType,
  BackupDestination,
  BackupVerificationResult,
  GoogleDriveFolderItem,
  ApprovedDirectoryItem,
  DirectoryValidationResult,
  LocalAgentStatus,
  BackupDestinationsConfig
} from '../../types/backup.types';
import {
  Database,
  Cloud,
  HardDrive,
  Clock,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Download,
  RotateCcw,
  Trash2,
  Play,
  Save,
  Search,
  Filter,
  RefreshCw,
  FolderSync,
  FileCheck,
  Check,
  X,
  ExternalLink,
  Layers,
  Sparkles,
  Info,
  Server,
  Lock,
  Calendar,
  FileText,
  Folder,
  FolderPlus,
  FolderCheck,
  Globe,
  Monitor,
  Terminal,
  CheckSquare,
  Square
} from 'lucide-react';

// Approved standard IANA timezones with human-readable Arabic & English labels
const SUPPORTED_TIMEZONES = [
  { id: 'Africa/Cairo', labelAr: 'القاهرة - مصر (توقيت رسمي UTC+2) — الافتراضي', labelEn: 'Cairo - Egypt (Official UTC+2) — Default' },
  { id: 'Asia/Riyadh', labelAr: 'الرياض - المملكة العربية السعودية (UTC+3)', labelEn: 'Riyadh - Saudi Arabia (UTC+3)' },
  { id: 'Europe/Istanbul', labelAr: 'إسطنبول - تركيا (UTC+3)', labelEn: 'Istanbul - Turkey (UTC+3)' },
  { id: 'UTC', labelAr: 'التوقيت العالمي المنسق (UTC+0)', labelEn: 'Coordinated Universal Time (UTC+0)' },
  { id: 'Asia/Dubai', labelAr: 'دبي - الإمارات العربية المتحدة (UTC+4)', labelEn: 'Dubai - UAE (UTC+4)' },
  { id: 'Africa/Khartoum', labelAr: 'الخرطوم - السودان (UTC+2)', labelEn: 'Khartoum - Sudan (UTC+2)' },
  { id: 'Africa/Tripoli', labelAr: 'طرابلس - ليبيا (UTC+2)', labelEn: 'Tripoli - Libya (UTC+2)' },
  { id: 'Asia/Kuwait', labelAr: 'الكويت (UTC+3)', labelEn: 'Kuwait City - Kuwait (UTC+3)' },
  { id: 'Asia/Qatar', labelAr: 'الدوحة - قطر (UTC+3)', labelEn: 'Doha - Qatar (UTC+3)' },
  { id: 'Asia/Amman', labelAr: 'عمّان - الأردن (UTC+3)', labelEn: 'Amman - Jordan (UTC+3)' },
  { id: 'Europe/London', labelAr: 'لندن - بريطانيا (UTC+0/+1)', labelEn: 'London - UK (UTC+0/+1)' },
  { id: 'America/New_York', labelAr: 'نيويورك - أمريكا (UTC-5/-4)', labelEn: 'New York - USA (UTC-5/-4)' }
];

export const BackupRestoreManagement: React.FC = () => {
  const { isRtl } = useLanguage();
  const { currentEmployee, isSuperAdmin } = useAuth();

  // Active Tab within Backup Management
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'destination' | 'restore'>('overview');

  // Stats & Backups List
  const [stats, setStats] = useState(backupService.getOverviewStats());
  const [backups, setBackups] = useState<BackupRecord[]>(backupService.getBackups());
  const [schedule, setSchedule] = useState<BackupScheduleConfig>(backupService.getSchedule());
  const [retention, setRetention] = useState<BackupRetentionPolicy>(backupService.getRetentionPolicy());
  const [driveConfig, setDriveConfig] = useState<GoogleDriveConfig>(backupService.getGoogleDriveConfig());

  // Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedDest, setSelectedDest] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // UI state & Modals
  const [isLoading, setIsLoading] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  // Manual Backup Modal
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualDestination, setManualDestination] = useState<BackupDestination>('local');
  const [manualNote, setManualNote] = useState('');

  // Native Browser File System Access API Folder Selection
  const [browserDirInfo, setBrowserDirInfo] = useState<BrowserDirectoryInfo>({
    isSupported: browserDirectoryService.isSupported(),
    isSecureContext: browserDirectoryService.isSecureContext(),
    hasDirectory: false,
    folderName: '',
    hasPermission: false,
    lastBackupFile: null,
    lastBackupTime: null,
    lastError: null
  });
  const [isPickingFolder, setIsPickingFolder] = useState<boolean>(false);

  // Local Backup Agent & Windows Folder Selection
  const [agentStatus, setAgentStatus] = useState<LocalAgentStatus>(localAgentService.getCachedStatus());
  const [isCheckingAgent, setIsCheckingAgent] = useState(false);
  const [windowsPath, setWindowsPath] = useState<string>(
    schedule.windows_backup_path || schedule.destinations?.local_computer?.path || 'C:\\Users\\AHMED\\Downloads\\BCT Backups'
  );
  type PickerState = 'idle' | 'checking_helper' | 'opening_dialog' | 'waiting_for_selection' | 'saving_path' | 'success' | 'cancelled' | 'error';
  const [pickerState, setPickerState] = useState<PickerState>('idle');
  const isPickingRef = useRef<boolean>(false);
  const lastPickClickTime = useRef<number>(0);
  const [isPickingWindowsFolder, setIsPickingWindowsFolder] = useState(false);
  const [isValidatingWindowsFolder, setIsValidatingWindowsFolder] = useState(false);
  const [windowsValidationResult, setWindowsValidationResult] = useState<(DirectoryValidationResult & { freeSpace?: string }) | null>(null);

  // Controlled Destinations State with Optimistic UI & Concurrency Locking
  const [destinationsConfig, setDestinationsConfig] = useState<BackupDestinationsConfig>(() => {
    if (schedule.destinations) {
      return schedule.destinations;
    }
    return {
      local_computer: { enabled: true, path: schedule.windows_backup_path || 'C:\\Users\\AHMED\\Downloads\\BCT Backups' },
      server_storage: { enabled: true, path: schedule.local_backup_path || './backups' },
      google_drive: {
        enabled: Boolean(driveConfig.connected),
        folder_id: driveConfig.folder_id || 'gdrive_folder_bct_root',
        folder_name: driveConfig.folder_name || 'BCT_Enterprise_Backups'
      }
    };
  });
  const [togglingDestinations, setTogglingDestinations] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (schedule.destinations) {
      setDestinationsConfig(schedule.destinations);
    }
  }, [schedule.destinations]);

  // Local Directory Configuration & Browsing
  const [showDirectoryModal, setShowDirectoryModal] = useState(false);
  const [approvedDirectories, setApprovedDirectories] = useState<ApprovedDirectoryItem[]>([]);
  const [customPathInput, setCustomPathInput] = useState(schedule.local_backup_path || './backups');
  const [directoryValidation, setDirectoryValidation] = useState<DirectoryValidationResult | null>(null);
  const [isValidatingPath, setIsValidatingPath] = useState(false);
  const [newSubdirName, setNewSubdirName] = useState('');
  const [isCreatingDir, setIsCreatingDir] = useState(false);

  // Google Drive Folder Selection Modals
  const [showDriveModal, setShowDriveModal] = useState(false);
  const [showFolderSelectModal, setShowFolderSelectModal] = useState(false);
  const [driveEmailInput, setDriveEmailInput] = useState('');
  const [isConnectingDrive, setIsConnectingDrive] = useState(false);
  const [driveFolders, setDriveFolders] = useState<GoogleDriveFolderItem[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [newFolderNameInput, setNewFolderNameInput] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [driveTestMessage, setDriveTestMessage] = useState<string | null>(null);

  // Restore Modal & File verification
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreSource, setRestoreSource] = useState<'upload' | 'history'>('upload');
  const [restoreRawContent, setRestoreRawContent] = useState<string>('');
  const [verificationResult, setVerificationResult] = useState<BackupVerificationResult | null>(null);
  const [restoreConfirmationText, setRestoreConfirmationText] = useState('');
  const [isVerifyingFile, setIsVerifyingFile] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Delete Confirmation Modal
  const [backupToDelete, setBackupToDelete] = useState<BackupRecord | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const restoreSectionRef = useRef<HTMLDivElement>(null);
  const shouldScrollToRestoreRef = useRef(false);

  // Smooth scroll helper accounting for application's fixed header
  const scrollToRestoreSection = () => {
    if (restoreSectionRef.current) {
      restoreSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Ensure window scroll accounting for fixed header height
      const fixedHeaderHeight = 90;
      const rect = restoreSectionRef.current.getBoundingClientRect();
      const absoluteTop = rect.top + window.pageYOffset;
      const targetPosition = Math.max(0, absoluteTop - fixedHeaderHeight);

      if (Math.abs(window.pageYOffset - targetPosition) > 10) {
        window.scrollTo({
          top: targetPosition,
          behavior: 'smooth'
        });
      }
    }
  };

  useEffect(() => {
    if (activeTab === 'restore' && shouldScrollToRestoreRef.current) {
      shouldScrollToRestoreRef.current = false;
      const timer = setTimeout(() => {
        scrollToRestoreSection();
      }, 60);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const handleNavigateToRestoreTab = () => {
    if (activeTab === 'restore') {
      scrollToRestoreSection();
    } else {
      shouldScrollToRestoreRef.current = true;
      setActiveTab('restore');
    }
  };

  // Refresh data from store in real time
  const refreshData = () => {
    setStats(backupService.getOverviewStats());
    setBackups(backupService.getBackups());
    const sched = backupService.getSchedule();
    setSchedule(sched);
    if (sched.windows_backup_path) {
      setWindowsPath(sched.windows_backup_path);
    }
    setRetention(backupService.getRetentionPolicy());
    setDriveConfig(backupService.getGoogleDriveConfig());
  };

  useEffect(() => {
    const unsubscribe = bctStore.subscribe(() => {
      refreshData();
    });
    return unsubscribe;
  }, []);

  // Restore Browser Directory Handle and check write permission on mount
  useEffect(() => {
    browserDirectoryService.getDirectoryInfo().then(info => {
      setBrowserDirInfo(info);
      if (info.folderName) {
        setWindowsPath(info.folderName);
      }
    });
  }, []);

  // Poll Local Agent status on mount and periodically (5s heartbeat)
  useEffect(() => {
    backupService.getLocalAgentStatus(true).then(st => setAgentStatus(st));
    const interval = setInterval(() => {
      backupService.getLocalAgentStatus(true).then(st => setAgentStatus(st));
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Helper to determine the button label according to state machine
  const getPickerButtonLabel = () => {
    switch (pickerState) {
      case 'checking_helper':
        return isRtl ? 'جارٍ التحقق من اتصال الوكيل...' : 'Checking Agent Connection...';
      case 'opening_dialog':
        return isRtl ? 'جارٍ فتح نافذة ويندوز...' : 'Opening Windows Dialog...';
      case 'waiting_for_selection':
        return isRtl ? 'نافذة ويندوز مفتوحة على سطح المكتب...' : 'Windows Dialog Active on Desktop...';
      case 'saving_path':
        return isRtl ? 'جارٍ اعتماد وتثبيت المسار...' : 'Saving Selected Path...';
      case 'success':
        return isRtl ? 'تم اختيار المجلد بنجاح' : 'Folder Selected Successfully';
      case 'cancelled':
        return isRtl ? 'تم إلغاء الاختيار' : 'Selection Cancelled';
      case 'error':
        return isRtl ? 'فشل الاختيار' : 'Selection Failed';
      case 'idle':
      default:
        return isRtl ? 'اختيار مجلد الحفظ (نافذة ويندوز)' : 'Select Folder (Native Dialog)';
    }
  };

  // Pick folder directly via native browser File System Access API
  const handlePickBrowserFolder = async () => {
    if (isPickingFolder) return;
    setIsPickingFolder(true);
    try {
      const res = await browserDirectoryService.pickDirectory();
      if (res.success && res.folderName) {
        const info = await browserDirectoryService.getDirectoryInfo();
        setBrowserDirInfo(info);
        setWindowsPath(res.folderName);
        if (currentEmployee) {
          backupService.updateWindowsBackupPath(res.folderName, currentEmployee);
        }
        showSuccess(
          isRtl ? `تم اختيار وتثبيت مجلد الحفظ بنجاح: ${res.folderName}` : `Folder selected successfully: ${res.folderName}`,
          'Folder Selected'
        );
        refreshData();
      } else if (res.cancelled) {
        // User cancelled dialog - do nothing and preserve existing selection
        console.log('[BackupRestore] Folder selection cancelled by user');
      } else if (res.error) {
        showError(res.message || res.error, res.message || res.error);
      }
    } catch (err: any) {
      console.error('[BackupRestore] Folder picker error:', err);
      showError(err.message || 'حدث خطأ أثناء اختيار المجلد', 'Picker Error');
    } finally {
      setIsPickingFolder(false);
    }
  };

  // Pick folder on user's Windows computer via native Windows dialog
  const handlePickWindowsFolder = async () => {
    if (isPickingRef.current || pickerState !== 'idle') {
      const elapsed = Date.now() - lastPickClickTime.current;
      if (elapsed > 4000) {
        console.warn(`[BackupRestore] Stuck picker state detected (${elapsed}ms). Auto-recovering...`);
        try { backupService.pickWindowsFolder({ cancel: true }); } catch {}
        isPickingRef.current = false;
        setIsPickingWindowsFolder(false);
        setPickerState('idle');
      } else {
        console.warn('[BackupRestore] Folder picker request already in progress, ignoring duplicate click.');
        return;
      }
    }
    lastPickClickTime.current = Date.now();

    const reqId = `pick_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    console.log(`[BackupRestore] [DIAGNOSTIC] [${reqId}] Button click received: "اختيار مجلد الحفظ (نافذة ويندوز)"`);
    console.log(`[BackupRestore] [DIAGNOSTIC] [${reqId}] Current path in state:`, windowsPath);

    isPickingRef.current = true;
    setIsPickingWindowsFolder(true);
    setPickerState('opening_dialog');

    // Failsafe watchdog: guarantee reset after 65s even if OS/network freezes
    const watchdogTimer = setTimeout(() => {
      if (isPickingRef.current) {
        console.warn(`[BackupRestore] Watchdog timeout triggered on [${reqId}]. Forcing state reset.`);
        isPickingRef.current = false;
        setIsPickingWindowsFolder(false);
        setPickerState('idle');
      }
    }, 65000);

    try {
      console.log(`[BackupRestore] [DIAGNOSTIC] [${reqId}] Dispatching folder picker request to Local Agent...`);

      const pickPromise = backupService.pickWindowsFolder({ initialPath: windowsPath });
      setTimeout(() => {
        if (isPickingRef.current) {
          setPickerState('waiting_for_selection');
        }
      }, 500);

      const result = await pickPromise;
      console.log(`[BackupRestore] [DIAGNOSTIC] [${reqId}] Windows folder picker response received:`, result);

      if (result.success && result.path) {
        const cleanPath = result.path.trim();
        console.log(`[BackupRestore] [DIAGNOSTIC] [${reqId}] Valid path confirmed:`, cleanPath);
        setPickerState('saving_path');
        setWindowsPath(cleanPath);
        if (currentEmployee) {
          backupService.updateWindowsBackupPath(cleanPath, currentEmployee);
          console.log(`[BackupRestore] [DIAGNOSTIC] [${reqId}] Path persisted to system settings and database store.`);
        }
        setPickerState('success');
        showSuccess(
          `تم اختيار وتثبيت مجلد حفظ النسخ في ويندوز بنجاح: ${cleanPath}`,
          `Windows backup directory set successfully: ${cleanPath}`
        );
        refreshData();
        setTimeout(() => setPickerState('idle'), 2000);
      } else if (result.cancelled) {
        console.log(`[BackupRestore] [DIAGNOSTIC] [${reqId}] User cancelled dialog. Preserving existing path:`, windowsPath);
        setPickerState('cancelled');
        setTimeout(() => setPickerState('idle'), 1500);
      } else if (result.isBusy || (result as any).error === 'Dialog already open') {
        console.warn(`[BackupRestore] [DIAGNOSTIC] [${reqId}] Dialog is already open on desktop.`);
        setPickerState('idle');
        showError(
          isRtl
            ? 'نافذة اختيار المجلدات مفتوحة بالفعل على سطح المكتب. يرجى إتمام الاختيار أو إلغاؤه أولاً.'
            : 'Folder picker dialog is already open on desktop. Please complete or cancel it first.',
          'Dialog Already Open'
        );
      } else {
        const errDetail = result.message || (result as any).error || 'لم يتم استلام مسار صالح من نافذة الاختيار';
        console.warn(`[BackupRestore] [DIAGNOSTIC] [${reqId}] Picker failed or returned error:`, errDetail);
        setPickerState('error');
        showError(errDetail, errDetail);
        setTimeout(() => setPickerState('idle'), 2500);
      }
    } catch (err: any) {
      console.error(`[BackupRestore] [DIAGNOSTIC] [${reqId}] Exception in handlePickWindowsFolder:`, err);
      setPickerState('error');
      const msg = err.message || '';
      const isFetchErr = msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('تعذر الاتصال');
      if (isFetchErr) {
        showError(
          'تعذر الاتصال بمساعد ويندوز التفاعلي. يرجى التأكد من تشغيل: scripts\\start-interactive-helper.bat على جهازك.',
          'Cannot reach the Windows Interactive Helper. Please run scripts\\start-interactive-helper.bat on your computer.'
        );
      } else {
        showError(`خطأ: ${msg}`, `Error: ${msg}`);
      }
      setTimeout(() => setPickerState('idle'), 2500);
    } finally {
      clearTimeout(watchdogTimer);
      isPickingRef.current = false;
      setIsPickingWindowsFolder(false);
      setTimeout(() => {
        setPickerState((prev) => (prev === 'opening_dialog' || prev === 'checking_helper' || prev === 'waiting_for_selection' ? 'idle' : prev));
      }, 500);
    }
  };

  // Validate Windows folder permissions and disk space
  const handleValidateWindowsFolder = async (pathToTest?: string) => {
    const target = pathToTest || windowsPath;
    setIsValidatingWindowsFolder(true);
    try {
      const res = await backupService.validateWindowsFolder(target);
      setWindowsValidationResult(res);
      if (res.valid) {
        showSuccess(
          `المجلد صالح وموثوق ولديه صلاحيات كتابة كاملة (${target}) ${res.freeSpace ? '• ' + res.freeSpace : ''}`,
          `Folder validated with full write access (${target}) ${res.freeSpace ? '• ' + res.freeSpace : ''}`
        );
      } else {
        showError(res.message, res.message_en);
      }
    } catch (err: any) {
      showError(`فشل الفحص: ${err.message}`, `Validation failed: ${err.message}`);
    } finally {
      setIsValidatingWindowsFolder(false);
    }
  };

  // Toggle independent destinations with optimistic UI, concurrency locking and rollback
  const handleToggleDestination = async (destKey: 'local_computer' | 'server_storage' | 'google_drive') => {
    if (!currentEmployee || togglingDestinations[destKey]) return;

    // Guard 1: Google Drive cannot be enabled if not connected
    if (destKey === 'google_drive') {
      const isCurrentlyEnabled = Boolean(destinationsConfig.google_drive?.enabled && driveConfig.connected);
      if (!isCurrentlyEnabled && !driveConfig.connected) {
        showError(
          isRtl
            ? 'لا يمكن تفعيل وجهة Google Drive لأن الحساب غير مرتبط. يرجى ربط حسابك أولاً.'
            : 'Cannot enable Google Drive because no account is connected. Please connect your account first.',
          'Google Drive Not Connected'
        );
        setShowDriveModal(true);
        return;
      }
    }

    // Guard 2: Local Computer toggle
    if (destKey === 'local_computer') {
      const isCurrentlyEnabled = destinationsConfig.local_computer?.enabled !== false;
      if (!isCurrentlyEnabled && !browserDirInfo.hasDirectory && !windowsPath && !destinationsConfig.local_computer?.path) {
        showSuccess(
          isRtl ? 'تم تفعيل وجهة الكمبيوتر المحلي. يرجى اختيار مجلد الحفظ المطلوب.' : 'Local computer destination enabled. Please select a save folder.',
          'Destination Enabled'
        );
      }
    }

    setTogglingDestinations(prev => ({ ...prev, [destKey]: true }));

    const previousConfig: BackupDestinationsConfig = { ...destinationsConfig };
    const currentItem = previousConfig[destKey] || { enabled: destKey !== 'google_drive' };
    const isCurrentlyEnabled = destKey === 'google_drive'
      ? Boolean(currentItem.enabled && driveConfig.connected)
      : currentItem.enabled !== false;

    const newEnabled = !isCurrentlyEnabled;

    const updatedConfig: BackupDestinationsConfig = {
      ...previousConfig,
      [destKey]: {
        ...currentItem,
        enabled: newEnabled
      }
    };

    // 1. Optimistic UI update
    setDestinationsConfig(updatedConfig);

    try {
      // 2. Persist to store & backend
      const saved = backupService.updateDestinationsConfig(updatedConfig, currentEmployee);
      setSchedule(prev => ({ ...prev, destinations: saved.destinations }));
      showSuccess(
        isRtl
          ? `تم ${newEnabled ? 'تفعيل' : 'تعطيل'} وجهة: ${
              destKey === 'local_computer'
                ? 'الكمبيوتر المحلي (جهاز ويندوز)'
                : destKey === 'server_storage'
                ? 'تخزين الخادم الداخلي'
                : 'سحابة Google Drive'
            }`
          : `Destination ${newEnabled ? 'enabled' : 'disabled'}: ${
              destKey === 'local_computer'
                ? 'Local Computer'
                : destKey === 'server_storage'
                ? 'Internal Server'
                : 'Google Drive'
            }`,
        `Destination ${newEnabled ? 'enabled' : 'disabled'}: ${destKey}`
      );
      refreshData();
    } catch (err: any) {
      // Rollback on failure
      setDestinationsConfig(previousConfig);
      showError(
        isRtl ? `تعذر تعديل حالة الوجهة: ${err.message}` : `Failed to update destination: ${err.message}`,
        'Error'
      );
    } finally {
      setTogglingDestinations(prev => ({ ...prev, [destKey]: false }));
    }
  };

  // Re-check agent status manually
  const handleRecheckAgent = async () => {
    setIsCheckingAgent(true);
    try {
      const st = await backupService.getLocalAgentStatus(true);
      setAgentStatus(st);
      if (st.connected) {
        showSuccess(
          `وكيل النسخ الاحتياطي متصل بنجاح على المنفذ ${st.port || 45456}`,
          `Local backup agent connected successfully on port ${st.port || 45456}`
        );
      } else if (st.status === 'connecting') {
        showSuccess(
          isRtl ? 'جارٍ بدء تشغيل وكيل النسخ الاحتياطي في الخلفية...' : 'Starting local agent daemon...',
          'Connecting'
        );
      } else {
        showError(
          isRtl ? 'الوكيل غير متصل حالياً (يمكنك تشغيل scripts\\start-interactive-helper.bat).' : 'Local backup agent is currently disconnected.',
          'Offline'
        );
      }
    } finally {
      setIsCheckingAgent(false);
    }
  };

  // Filtered backups
  const filteredBackups = useMemo(() => {
    const filter: BackupFilter = {
      searchQuery,
      type: selectedType as any,
      destination: selectedDest as any,
      status: selectedStatus as any,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    };
    return backupService.getBackups(filter);
  }, [backups, searchQuery, selectedType, selectedDest, selectedStatus, startDate, endDate]);

  // Flash messages
  const showSuccess = (msgAr: string, msgEn: string) => {
    setActionSuccessMsg(isRtl ? msgAr : msgEn);
    setActionErrorMsg(null);
    setTimeout(() => setActionSuccessMsg(null), 5000);
  };

  const showError = (msgAr: string, msgEn: string) => {
    setActionErrorMsg(isRtl ? msgAr : msgEn);
    setActionSuccessMsg(null);
    setTimeout(() => setActionErrorMsg(null), 6000);
  };

  // Create Immediate / Manual Backup
  const handleCreateManualBackup = async () => {
    if (!currentEmployee) return;

    if (manualDestination === 'local_computer' && destinationsConfig.local_computer?.enabled === false) {
      showError(
        isRtl ? 'وجهة الكمبيوتر المحلي (ويندوز) معطلة حالياً. يرجى تفعيلها أولاً.' : 'Local Computer destination is currently disabled.',
        'Destination Disabled'
      );
      return;
    }
    if ((manualDestination === 'local' || manualDestination === 'server' || manualDestination === 'server_storage') && destinationsConfig.server_storage?.enabled === false) {
      showError(
        isRtl ? 'وجهة التخزين الداخلي على الخادم معطلة حالياً. يرجى تفعيلها أولاً.' : 'Server Storage destination is currently disabled.',
        'Destination Disabled'
      );
      return;
    }
    if (manualDestination === 'google_drive' && (!driveConfig.connected || !destinationsConfig.google_drive?.enabled)) {
      showError(
        isRtl ? 'وجهة Google Drive معطلة أو الحساب غير مرتبط حالياً.' : 'Google Drive destination is disabled or disconnected.',
        'Destination Disabled'
      );
      return;
    }
    if (manualDestination === 'multi') {
      const isWin = destinationsConfig.local_computer?.enabled !== false;
      const isSrv = destinationsConfig.server_storage?.enabled !== false;
      const isDrv = Boolean(destinationsConfig.google_drive?.enabled && driveConfig.connected);
      if (!isWin && !isSrv && !isDrv) {
        showError(
          isRtl ? 'جميع وجهات النسخ الاحتياطي معطلة حالياً. يرجى تفعيل وجهة واحدة على الأقل.' : 'All backup destinations are currently disabled.',
          'All Destinations Disabled'
        );
        return;
      }
    }

    setIsLoading(true);
    try {
      const res = await backupService.createBackup({
        type: 'manual',
        destination: manualDestination,
        actor: currentEmployee,
        note: manualNote.trim() || undefined
      });
      if (res.success) {
        // Direct browser folder saving if local computer destination is selected
        if ((manualDestination === 'local_computer' || manualDestination === 'multi') && res.encryptedArchive) {
          if (browserDirectoryService.isSupported() && browserDirInfo.hasDirectory) {
            try {
              const saveRes = await browserDirectoryService.saveBackupFile(res.record.filename, res.encryptedArchive);
              res.record.full_path = `${saveRes.folderName}/${saveRes.filename}`;
              bctStore.updateBackupRecord(res.record);
              const updatedInfo = await browserDirectoryService.getDirectoryInfo();
              setBrowserDirInfo(updatedInfo);
              showSuccess(
                isRtl
                  ? `تم إنشاء النسخة الاحتياطية وحفظها بنجاح داخل المجلد: ${saveRes.folderName} (${res.record.filename})`
                  : `Backup created and saved to folder: ${saveRes.folderName}`,
                'Backup Saved'
              );
            } catch (writeErr: any) {
              console.warn('[Backup] Folder write failed, downloading via browser:', writeErr);
              browserDirectoryService.downloadBackupManually(res.record.filename, res.encryptedArchive);
              showSuccess(
                isRtl
                  ? `تم إنشاء النسخة الاحتياطية وتحميلها عبر المتصفح: (${res.record.filename})`
                  : `Backup created and downloaded via browser.`,
                'Backup Downloaded'
              );
            }
          } else {
            // No folder chosen yet or API not supported: download file via browser download
            browserDirectoryService.downloadBackupManually(res.record.filename, res.encryptedArchive);
            showSuccess(
              isRtl
                ? `تم إنشاء النسخة الاحتياطية وتحميلها عبر المتصفح: (${res.record.filename})`
                : `Backup created and downloaded via browser.`,
              'Backup Downloaded'
            );
          }
        } else {
          showSuccess(res.message, res.message_en);
        }
        setShowManualModal(false);
        setManualNote('');
        refreshData();
      } else {
        showError(res.message, res.message_en);
      }
    } catch (err: any) {
      showError(err.message, err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Save Schedule Config
  const handleSaveSchedule = () => {
    if (!currentEmployee) return;
    try {
      backupService.saveSchedule(schedule, currentEmployee);
      showSuccess('تم حفظ إعدادات جدولة النسخ الاحتياطي والمنطقة الزمنية بنجاح', 'Backup schedule and timezone saved successfully');
      refreshData();
    } catch (err: any) {
      showError(err.message, err.message);
    }
  };

  // Save Retention Policy
  const handleSaveRetention = () => {
    if (!currentEmployee) return;
    try {
      backupService.saveRetentionPolicy(retention, currentEmployee);
      showSuccess('تم حفظ سياسة الاحتفاظ بالنسخ بنجاح', 'Backup retention policy saved successfully');
      refreshData();
    } catch (err: any) {
      showError(err.message, err.message);
    }
  };

  // Open Directory Browser Modal
  const handleOpenDirectoryModal = async () => {
    setShowDirectoryModal(true);
    setDirectoryValidation(null);
    setCustomPathInput(schedule.local_backup_path || './backups');
    const dirs = await backupService.getApprovedDirectories();
    setApprovedDirectories(dirs);
  };

  // Validate directory path & write access
  const handleValidateDirectory = async (pathToCheck: string) => {
    setIsValidatingPath(true);
    setDirectoryValidation(null);
    try {
      const result = await backupService.validateLocalDirectory(pathToCheck);
      setDirectoryValidation(result);
    } catch (err: any) {
      setDirectoryValidation({
        valid: false,
        path: pathToCheck,
        exists: false,
        writable: false,
        message: err.message,
        message_en: err.message
      });
    } finally {
      setIsValidatingPath(false);
    }
  };

  // Apply selected local directory path
  const handleApplyDirectory = async () => {
    if (!currentEmployee) return;
    const cleanPath = customPathInput.trim();
    if (!cleanPath) {
      showError('يرجى إدخال مسار صحيح للمجلد', 'Please enter a valid directory path');
      return;
    }

    // Validate path first
    const val = await backupService.validateLocalDirectory(cleanPath);
    if (!val.valid) {
      showError(val.message, val.message_en);
      return;
    }

    try {
      const updated = backupService.updateLocalBackupPath(cleanPath, currentEmployee);
      setSchedule(updated);
      showSuccess(`تم اعتماد مسار التخزين بنجاح: (${cleanPath})`, `Backup directory saved successfully: (${cleanPath})`);
      setShowDirectoryModal(false);
      refreshData();
    } catch (err: any) {
      showError(err.message, err.message);
    }
  };

  // Create new server subdirectory
  const handleCreateSubdirectory = async () => {
    const sub = newSubdirName.trim();
    if (!sub) return;
    setIsCreatingDir(true);
    try {
      const targetPath = `./backups/${sub.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
      const val = await backupService.validateLocalDirectory(targetPath);
      if (val.valid) {
        setCustomPathInput(targetPath);
        setDirectoryValidation(val);
        setNewSubdirName('');
        const dirs = await backupService.getApprovedDirectories();
        setApprovedDirectories(dirs);
        showSuccess(`تم إنشاء المجلد بنجاح: ${targetPath}`, `Directory created successfully: ${targetPath}`);
      } else {
        showError(val.message, val.message_en);
      }
    } catch (err: any) {
      showError(err.message, err.message);
    } finally {
      setIsCreatingDir(false);
    }
  };

  // Connect Google Drive
  const handleConnectDrive = async () => {
    setIsConnectingDrive(true);
    try {
      const email = driveEmailInput.trim() || 'admin@bct-educational.com';
      const res = await backupService.connectGoogleDrive({ email });
      if (res.success) {
        showSuccess(res.message, res.message_en);
        setShowDriveModal(false);
        setDriveEmailInput('');

        // Automatically enable Google Drive destination upon connection
        const updatedConfig: BackupDestinationsConfig = {
          ...destinationsConfig,
          google_drive: {
            ...destinationsConfig.google_drive,
            enabled: true
          }
        };
        setDestinationsConfig(updatedConfig);
        refreshData();
      } else {
        showError(res.message, res.message_en);
      }
    } catch (err: any) {
      showError(err.message, err.message);
    } finally {
      setIsConnectingDrive(false);
    }
  };

  // Disconnect Google Drive
  const handleDisconnectDrive = async () => {
    try {
      const res = await backupService.disconnectGoogleDrive();
      if (res.success) {
        // Automatically disable Google Drive destination upon disconnect
        const updatedConfig: BackupDestinationsConfig = {
          ...destinationsConfig,
          google_drive: {
            ...destinationsConfig.google_drive,
            enabled: false
          }
        };
        setDestinationsConfig(updatedConfig);
        showSuccess(res.message, res.message_en);
        refreshData();
      } else {
        showError(res.message, res.message_en);
      }
    } catch (err: any) {
      showError(err.message, err.message);
    }
  };

  // Test Google Drive Connection
  const handleTestDriveConnection = async () => {
    setDriveTestMessage(null);
    const res = await backupService.testGoogleDriveConnection();
    setDriveTestMessage(isRtl ? res.message : res.message_en);
    refreshData();
    setTimeout(() => setDriveTestMessage(null), 6000);
  };

  // Open Google Drive Folder Selector Modal
  const handleOpenFolderSelectModal = async () => {
    setShowFolderSelectModal(true);
    setIsLoadingFolders(true);
    try {
      const res = await backupService.listGoogleDriveFolders();
      if (res.success) {
        setDriveFolders(res.folders);
      } else {
        showError(res.message, res.message_en);
      }
    } catch (err: any) {
      showError(err.message, err.message);
    } finally {
      setIsLoadingFolders(false);
    }
  };

  // Select Drive Folder
  const handleSelectDriveFolder = async (folder: GoogleDriveFolderItem) => {
    try {
      const res = await backupService.selectGoogleDriveFolder(folder.id, folder.name);
      if (res.success) {
        showSuccess(res.message, res.message_en);
        setShowFolderSelectModal(false);
        refreshData();
      } else {
        showError(res.message, res.message_en);
      }
    } catch (err: any) {
      showError(err.message, err.message);
    }
  };

  // Create New Drive Folder
  const handleCreateDriveFolder = async () => {
    const name = newFolderNameInput.trim();
    if (!name) return;
    setIsCreatingFolder(true);
    try {
      const res = await backupService.createGoogleDriveFolder(name);
      if (res.success) {
        showSuccess(res.message, res.message_en);
        setNewFolderNameInput('');
        setShowFolderSelectModal(false);
        refreshData();
      } else {
        showError(res.message, res.message_en);
      }
    } catch (err: any) {
      showError(err.message, err.message);
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Handle Local File Selection for Restore
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsVerifyingFile(true);
    try {
      const text = await file.text();
      setRestoreRawContent(text);
      const verification = await backupService.verifyBackupFile(text);
      setVerificationResult(verification);
    } catch (err: any) {
      showError(`فشل قراءة الملف: ${err.message}`, `Failed to read file: ${err.message}`);
    } finally {
      setIsVerifyingFile(false);
    }
  };

  // Select a backup from history to restore
  const handleSelectHistoryForRestore = (backup: BackupRecord) => {
    setRestoreSource('history');
    setRestoreConfirmationText('');
    const snapshot = bctStore.exportFullDatabaseSnapshot(backup.created_by, backup.type, backup.destination, backup.name);
    setRestoreRawContent(snapshot.rawEncrypted);
    const verification = bctStore.verifyBackupArchive(snapshot.rawEncrypted);
    setVerificationResult(verification);
    handleNavigateToRestoreTab();
  };

  // Execute System Restore
  const handleExecuteRestore = async () => {
    if (!currentEmployee) return;

    const trimmed = restoreConfirmationText.trim();
    if (trimmed !== 'استعادة' && trimmed.toUpperCase() !== 'RESTORE') {
      showError('يرجى كتابة كلمة "استعادة" أو "RESTORE" للتأكيد على العملية.', 'Please type "استعادة" or "RESTORE" to confirm.');
      return;
    }

    if (!verificationResult || !verificationResult.valid || !restoreRawContent) {
      showError('لا يمكن استعادة النظام: ملف النسخة الاحتياطية غير صالح.', 'Cannot restore system: backup file is invalid.');
      return;
    }

    setIsRestoring(true);
    try {
      const res = await backupService.restoreBackup(restoreRawContent, currentEmployee);
      if (res.success) {
        showSuccess(res.message, res.message_en);
        setShowRestoreModal(false);
        setRestoreConfirmationText('');
        setRestoreRawContent('');
        setVerificationResult(null);
        refreshData();
      } else {
        showError(res.message, res.message_en);
      }
    } catch (err: any) {
      showError(err.message, err.message);
    } finally {
      setIsRestoring(false);
    }
  };

  // Delete Backup
  const handleConfirmDelete = async () => {
    if (!currentEmployee || !backupToDelete) return;
    try {
      const res = await backupService.deleteBackup(backupToDelete.id, currentEmployee);
      if (res.success) {
        showSuccess(res.message, res.message_en);
        setBackupToDelete(null);
        refreshData();
      } else {
        showError(res.message, res.message_en);
      }
    } catch (err: any) {
      showError(err.message, err.message);
    }
  };

  // Format date display
  const formatDateDisplay = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Flash Messages */}
      {actionSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="text-sm font-bold">{actionSuccessMsg}</span>
          </div>
          <button onClick={() => setActionSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionErrorMsg && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-center justify-between shadow-sm animate-in fade-in">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <span className="text-sm font-bold">{actionErrorMsg}</span>
          </div>
          <button onClick={() => setActionErrorMsg(null)} className="text-rose-700 hover:text-rose-900 cursor-pointer">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header with Title and Primary Actions (High Contrast Light Header) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-bct-navy text-white rounded-xl shadow-sm">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-slate-900">
                {isRtl ? 'النسخ الاحتياطي والاستعادة' : 'Backup & Restore Management'}
              </h2>
              <p className="text-xs font-semibold text-slate-600 mt-0.5">
                {isRtl
                  ? 'حماية شاملة لكافة بيانات النظام مع جدولة آلية، ربط Google Drive، ومسارات تخزين مخصصة ومؤمنة'
                  : 'Enterprise data vault with scheduled snapshots, Google Drive integration, and verified atomic restore'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handlePickBrowserFolder}
            disabled={isPickingFolder}
            className="flex items-center gap-2 px-4 py-2.5 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95 disabled:opacity-80"
          >
            <Folder className="w-4 h-4" />
            <span>{isRtl ? 'اختيار مجلد الحفظ' : 'Select Save Folder'}</span>
          </button>

          <button
            onClick={() => setShowManualModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>{isRtl ? 'إنشاء نسخة احتياطية الآن' : 'Create Backup Now'}</span>
          </button>

          {isSuperAdmin && (
            <button
              onClick={handleNavigateToRestoreTab}
              className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <RotateCcw className="w-4 h-4 text-amber-700" />
              <span>{isRtl ? 'استعادة نسخة احتياطية' : 'Restore Backup'}</span>
            </button>
          )}

          <button
            onClick={refreshData}
            title={isRtl ? 'تحديث البيانات لحظياً' : 'Refresh Data'}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-300 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Overview Cards (High Contrast White Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Backups */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'إجمالي النسخ المحفوظة' : 'Total Backups'}</span>
            <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total_backups}</div>
          <div className="text-xs font-semibold text-slate-600 mt-1 flex items-center gap-2">
            <span className="flex items-center gap-1 text-slate-700">
              <HardDrive className="w-3.5 h-3.5 text-slate-600" />
              {stats.local_backups_count} {isRtl ? 'محلي' : 'Local'}
            </span>
            <span className="text-slate-400">•</span>
            <span className="flex items-center gap-1 text-emerald-700">
              <Cloud className="w-3.5 h-3.5 text-emerald-600" />
              {stats.google_drive_backups_count} {isRtl ? 'درايف' : 'Drive'}
            </span>
          </div>
        </div>

        {/* Last Successful Backup */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'آخر نسخة ناجحة' : 'Last Successful Backup'}</span>
            <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-emerald-700 truncate">
            {stats.last_successful_backup ? stats.last_successful_backup.id : '—'}
          </div>
          <div className="text-xs font-semibold text-slate-600 truncate">
            {stats.last_successful_backup ? formatDateDisplay(stats.last_successful_backup.created_at) : (isRtl ? 'لا يوجد نسخ بعد' : 'No backups yet')}
          </div>
        </div>

        {/* Next Scheduled Backup */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'النسخة القادمة المجدولة' : 'Next Scheduled Backup'}</span>
            <div className="p-2 bg-purple-50 text-purple-700 rounded-lg border border-purple-200">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg font-black text-purple-900 truncate">
            {schedule.enabled ? `${schedule.execution_time} (${schedule.timezone || 'Africa/Cairo'})` : (isRtl ? 'معطلة' : 'Disabled')}
          </div>
          <div className="text-xs font-semibold text-slate-600">
            {schedule.enabled
              ? `${isRtl ? 'التكرار:' : 'Freq:'} ${
                  schedule.frequency === 'daily'
                    ? (isRtl ? 'يومياً' : 'Daily')
                    : schedule.frequency === 'weekly'
                    ? (isRtl ? 'أسبوعياً' : 'Weekly')
                    : (isRtl ? 'شهرياً' : 'Monthly')
                }`
              : (isRtl ? 'الجدولة التلقائية غير مفعلة' : 'Automatic schedule off')}
          </div>
        </div>

        {/* Total Storage Used & Local Agent Disk */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
          <div className="flex items-center justify-between text-slate-700 mb-2">
            <span className="text-xs font-bold">{isRtl ? 'المساحة المستخدمة والمتاحة' : 'Storage Used & Free'}</span>
            <div className={`p-2 rounded-lg border ${
              agentStatus.connected
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}>
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{stats.total_storage_used_formatted}</div>
          <div className="text-xs font-semibold text-slate-600 flex items-center justify-between pt-1">
            <span className="flex items-center gap-1.5 truncate">
              <span className={`w-2 h-2 rounded-full ${agentStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
              <span className="truncate">{agentStatus.freeSpace ? `${agentStatus.freeSpace} ${isRtl ? 'متاح' : 'free'}` : (isRtl ? 'الوكيل غير متصل' : 'Agent offline')}</span>
            </span>
          </div>
        </div>
      </div>

      {/* High Contrast Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-bct-navy text-bct-navy bg-slate-50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>{isRtl ? 'سجل النسخ الاحتياطية' : 'Backup History'}</span>
          <span className="px-2 py-0.5 text-[10px] font-bold bg-slate-200 text-slate-800 rounded-full">{backups.length}</span>
        </button>

        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'schedule'
              ? 'border-bct-navy text-bct-navy bg-slate-50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>{isRtl ? 'الجدولة التلقائية والمنطقة الزمنية' : 'Scheduling & Time Zone'}</span>
        </button>

        <button
          onClick={() => setActiveTab('destination')}
          className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'destination'
              ? 'border-bct-navy text-bct-navy bg-slate-50'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>{isRtl ? 'مسارات التخزين و Google Drive' : 'Destinations & Google Drive'}</span>
          {driveConfig.connected && (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          )}
        </button>

        {isSuperAdmin && (
          <button
            onClick={handleNavigateToRestoreTab}
            className={`flex items-center gap-2 py-3 px-4 font-bold text-xs border-b-2 transition-all cursor-pointer whitespace-nowrap ${
              activeTab === 'restore'
                ? 'border-amber-600 text-amber-800 bg-amber-50/50'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-4 h-4 text-amber-700" />
            <span>{isRtl ? 'استعادة النظام (فحص واسترجاع)' : 'Restore Center'}</span>
          </button>
        )}
      </div>

      {/* TAB 1: BACKUP HISTORY TABLE */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3 shadow-sm">
            <div className="flex flex-1 items-center gap-2 min-w-[240px]">
              <Search className="w-4 h-4 text-slate-500 flex-shrink-0" />
              <input
                type="text"
                placeholder={isRtl ? 'البحث بمعرف النسخة، الاسم، أو المنشئ...' : 'Search by ID, name, or creator...'}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded-lg px-3 py-1.5 text-xs text-slate-900 font-medium placeholder-slate-400 focus:outline-none focus:border-bct-navy focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Type Filter */}
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-bct-navy cursor-pointer"
              >
                <option value="all">{isRtl ? 'كافة الأنواع' : 'All Types'}</option>
                <option value="automatic">{isRtl ? 'تلقائية (مجدولة)' : 'Automatic'}</option>
                <option value="manual">{isRtl ? 'يدوية' : 'Manual'}</option>
                <option value="safety_pre_restore">{isRtl ? 'أمان قبل الاستعادة' : 'Safety Pre-Restore'}</option>
              </select>

              {/* Destination Filter */}
              <select
                value={selectedDest}
                onChange={e => setSelectedDest(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-bct-navy cursor-pointer"
              >
                <option value="all">{isRtl ? 'كافة الوجهات' : 'All Destinations'}</option>
                <option value="local">{isRtl ? 'التخزين المحلي' : 'Local Storage'}</option>
                <option value="google_drive">{isRtl ? 'جوجل درايف' : 'Google Drive'}</option>
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 font-semibold focus:outline-none focus:border-bct-navy cursor-pointer"
              >
                <option value="all">{isRtl ? 'كافة الحالات' : 'All Statuses'}</option>
                <option value="completed">{isRtl ? 'مكتملة ومؤكدة' : 'Completed'}</option>
                <option value="failed">{isRtl ? 'فاشلة' : 'Failed'}</option>
              </select>
            </div>
          </div>

          {/* History Table (High Contrast Light Background) */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-xs">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-200 text-slate-800 font-extrabold">
                    <th className="py-3.5 px-4">{isRtl ? 'معرف النسخة' : 'Backup ID'}</th>
                    <th className="py-3.5 px-4">{isRtl ? 'اسم النسخة والنوع' : 'Backup Details'}</th>
                    <th className="py-3.5 px-4">{isRtl ? 'الوجهة' : 'Destination'}</th>
                    <th className="py-3.5 px-4">{isRtl ? 'تاريخ الإنشاء' : 'Created At'}</th>
                    <th className="py-3.5 px-4">{isRtl ? 'الحجم والبيانات' : 'Size & Records'}</th>
                    <th className="py-3.5 px-4">{isRtl ? 'الحالة والتحقق' : 'Status & Verification'}</th>
                    <th className="py-3.5 px-4 text-center">{isRtl ? 'إجراءات' : 'Actions'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredBackups.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-500">
                        <Database className="w-10 h-10 mx-auto text-slate-400 mb-2 opacity-60" />
                        <p className="font-semibold">{isRtl ? 'لا توجد نسخ احتياطية تطابق معايير البحث' : 'No backups match the selected criteria'}</p>
                      </td>
                    </tr>
                  ) : (
                    filteredBackups.map(b => (
                      <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                        {/* ID */}
                        <td className="py-3.5 px-4 font-mono font-bold text-bct-navy">
                          {b.id}
                        </td>

                        {/* Name & Type */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 truncate max-w-[280px]">{b.name}</div>
                          <div className="flex items-center gap-1.5 mt-1">
                            {b.type === 'automatic' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-800 border border-blue-200">
                                <Clock className="w-2.5 h-2.5" />
                                {isRtl ? 'تلقائية' : 'Automatic'}
                              </span>
                            )}
                            {b.type === 'manual' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Play className="w-2.5 h-2.5 fill-current" />
                                {isRtl ? 'يدوية' : 'Manual'}
                              </span>
                            )}
                            {b.type === 'safety_pre_restore' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Shield className="w-2.5 h-2.5" />
                                {isRtl ? 'أمان قبل الاستعادة' : 'Safety Snapshot'}
                              </span>
                            )}
                            <span className="text-[10px] font-medium text-slate-500">
                              {b.created_by_name}
                            </span>
                          </div>
                        </td>

                        {/* Destination */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-1.5">
                            {(b.destination === 'local' || b.destination === 'both') && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                                <HardDrive className="w-3 h-3 text-slate-600" />
                                {isRtl ? 'محلي' : 'Local'}
                              </span>
                            )}
                            {(b.destination === 'google_drive' || b.destination === 'both') && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <Cloud className="w-3 h-3 text-emerald-600" />
                                Google Drive
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Date */}
                        <td className="py-3.5 px-4 text-slate-700 font-semibold whitespace-nowrap">
                          {formatDateDisplay(b.created_at)}
                        </td>

                        {/* Size & Records */}
                        <td className="py-3.5 px-4">
                          <div className="font-extrabold text-slate-900">{b.size_formatted}</div>
                          <div className="text-[10px] text-slate-500 font-medium mt-0.5">
                            {b.total_records} {isRtl ? 'سجل' : 'records'} • {b.tables_included?.length || 28} {isRtl ? 'جدول' : 'tables'}
                          </div>
                        </td>

                        {/* Status & Verification */}
                        <td className="py-3.5 px-4">
                          {b.status === 'completed' ? (
                            <div className="flex items-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                {isRtl ? 'مكتملة ومؤكدة' : 'Completed'}
                              </span>
                              {b.is_verified && (
                                <span title={b.checksum_sha256} className="text-[10px] font-mono text-slate-600 font-bold flex items-center gap-1">
                                  <Lock className="w-3 h-3 text-slate-500" />
                                  SHA-256
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-800 border border-rose-200">
                              <AlertCircle className="w-3 h-3 text-rose-600" />
                              {isRtl ? 'فاشلة' : 'Failed'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            {/* Download */}
                            <button
                              onClick={() => backupService.downloadBackupFile(b)}
                              title={isRtl ? 'تنزيل أرشيف النسخة (.bctbak)' : 'Download Archive (.bctbak)'}
                              className="p-1.5 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Download className="w-4 h-4" />
                            </button>

                            {/* Restore (Super Admin only) */}
                            {isSuperAdmin && b.status === 'completed' && (
                              <button
                                onClick={() => handleSelectHistoryForRestore(b)}
                                title={isRtl ? 'استعادة النظام من هذه النسخة' : 'Restore from this backup'}
                                className="p-1.5 text-slate-600 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>
                            )}

                            {/* Delete (Super Admin only) */}
                            {isSuperAdmin && (
                              <button
                                onClick={() => setBackupToDelete(b)}
                                title={isRtl ? 'حذف النسخة الاحتياطية' : 'Delete Backup'}
                                className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE & TIME ZONE (WITH FUNCTIONAL TIME ZONE DROPDOWN) */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Automatic Scheduling Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {isRtl ? 'إعدادات الجدولة التلقائية والمنطقة الزمنية' : 'Automated Scheduling & Time Zone'}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {isRtl
                    ? 'يعمل مجدول الخادم الخلفي بشكل موثوق ومستقل بحسب المنطقة الزمنية المحددة أدناه'
                    : 'Server background scheduler runs reliably based on the selected timezone below'}
                </p>
              </div>
            </div>

            {/* Enable Schedule Toggle */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <div className="text-sm font-extrabold text-slate-900">
                  {isRtl ? 'تفعيل النسخ الاحتياطي التلقائي' : 'Enable Automated Backups'}
                </div>
                <div className="text-xs font-semibold text-slate-600 mt-0.5">
                  {isRtl ? 'تنفيذ النسخ دورياً وفقاً للموعد المحدد أدناه' : 'Execute snapshots periodically per schedule'}
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={schedule.enabled}
                  onChange={e => setSchedule(prev => ({ ...prev, enabled: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
            </div>

            {/* Frequency Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {isRtl ? 'دورية وتكرار النسخ الاحتياطي' : 'Backup Frequency'}
              </label>
              <select
                disabled={!schedule.enabled}
                value={schedule.frequency}
                onChange={e => setSchedule(prev => ({ ...prev, frequency: e.target.value as any }))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy disabled:bg-slate-100 disabled:opacity-60 cursor-pointer"
              >
                <option value="daily">{isRtl ? 'يومياً (Daily) — مستحسن' : 'Daily (Recommended)'}</option>
                <option value="weekly">{isRtl ? 'أسبوعياً (Weekly)' : 'Weekly'}</option>
                <option value="monthly">{isRtl ? 'شهرياً (Monthly)' : 'Monthly'}</option>
                <option value="manual">{isRtl ? 'يدوي فقط (Manual Only)' : 'Manual Only'}</option>
              </select>
            </div>

            {/* FUNCTIONAL EDITABLE TIME ZONE DROPDOWN (Requirement 2) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-blue-600" />
                  {isRtl ? 'المنطقة الزمنية لمجدول النسخ (Time Zone)' : 'Scheduler Time Zone'}
                </span>
                <span className="text-[10px] text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {schedule.timezone || 'Africa/Cairo'}
                </span>
              </label>
              <select
                disabled={!schedule.enabled}
                value={schedule.timezone || 'Africa/Cairo'}
                onChange={e => setSchedule(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy disabled:bg-slate-100 disabled:opacity-60 cursor-pointer"
              >
                {SUPPORTED_TIMEZONES.map(tz => (
                  <option key={tz.id} value={tz.id}>
                    {isRtl ? tz.labelAr : tz.labelEn}
                  </option>
                ))}
              </select>
              <span className="text-[11px] font-medium text-slate-500 mt-1 block">
                {isRtl
                  ? 'يتم تطبيق هذه المنطقة الزمنية في جدولة الخادم واحتساب مواعيد النسخ الدورية بدقة.'
                  : 'Backend cron scheduler executes snapshots at 03:00 AM in the selected timezone.'}
              </span>
            </div>

            {/* Execution Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  {isRtl ? 'وقت التنفيذ (تنسيق 24 ساعة)' : 'Execution Time (24h)'}
                </label>
                <input
                  type="time"
                  disabled={!schedule.enabled}
                  value={schedule.execution_time}
                  onChange={e => setSchedule(prev => ({ ...prev, execution_time: e.target.value }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy disabled:bg-slate-100 disabled:opacity-60"
                />
              </div>

              {schedule.frequency === 'weekly' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    {isRtl ? 'يوم التنفيذ الأسبوعي' : 'Execution Day'}
                  </label>
                  <select
                    disabled={!schedule.enabled}
                    value={schedule.day_of_week}
                    onChange={e => setSchedule(prev => ({ ...prev, day_of_week: parseInt(e.target.value, 10) }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy cursor-pointer"
                  >
                    <option value={5}>{isRtl ? 'الجمعة (Friday) — مستحسن' : 'Friday'}</option>
                    <option value={6}>{isRtl ? 'السبت (Saturday)' : 'Saturday'}</option>
                    <option value={0}>{isRtl ? 'الأحد (Sunday)' : 'Sunday'}</option>
                    <option value={1}>{isRtl ? 'الاثنين (Monday)' : 'Monday'}</option>
                    <option value={2}>{isRtl ? 'الثلاثاء (Tuesday)' : 'Tuesday'}</option>
                    <option value={3}>{isRtl ? 'الأربعاء (Wednesday)' : 'Wednesday'}</option>
                    <option value={4}>{isRtl ? 'الخميس (Thursday)' : 'Thursday'}</option>
                  </select>
                </div>
              )}

              {schedule.frequency === 'monthly' && (
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    {isRtl ? 'يوم الشهر (1-31)' : 'Day of Month (1-31)'}
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={31}
                    disabled={!schedule.enabled}
                    value={schedule.day_of_month}
                    onChange={e => setSchedule(prev => ({ ...prev, day_of_month: parseInt(e.target.value, 10) || 1 }))}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy"
                  />
                </div>
              )}
            </div>

            {/* Destination Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {isRtl ? 'وجهة النسخ المجدول' : 'Scheduled Backup Destination'}
              </label>
              <select
                disabled={!schedule.enabled}
                value={schedule.destination}
                onChange={e => setSchedule(prev => ({ ...prev, destination: e.target.value as any }))}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy disabled:bg-slate-100 disabled:opacity-60 cursor-pointer"
              >
                <option value="local">{isRtl ? 'التخزين المحلي على الخادم فقط' : 'Local Server Storage Only'}</option>
                <option value="google_drive">{isRtl ? 'Google Drive فقط (سحابي)' : 'Google Drive Only (Cloud)'}</option>
                <option value="both">{isRtl ? 'كلاهما معاً (محلي وسحابي) — الأفضل أماناً' : 'Both Local & Google Drive (Most Secure)'}</option>
              </select>
            </div>

            <button
              onClick={handleSaveSchedule}
              className="w-full flex items-center justify-center gap-2 py-3 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isRtl ? 'حفظ إعدادات الجدولة والمنطقة الزمنية' : 'Save Schedule & Time Zone'}</span>
            </button>
          </div>

          {/* Retention Policy Form */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-5">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="p-2.5 bg-purple-50 text-purple-700 rounded-xl border border-purple-200">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {isRtl ? 'سياسة الاحتفاظ والتنظيف التلقائي' : 'Retention Policy & Auto-Purge'}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {isRtl ? 'إدارة استهلاك التخزين وحماية النسخ الذهبية من الحذف' : 'Storage lifecycle management and golden snapshot protection'}
                </p>
              </div>
            </div>

            {/* Retention Counts */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {isRtl ? 'الاحتفاظ بنسخ الأيام الأخيرة (Daily to keep)' : 'Daily backups to keep'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={retention.daily_backups_to_keep}
                  onChange={e => setRetention(prev => ({ ...prev, daily_backups_to_keep: parseInt(e.target.value, 10) || 7 }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {isRtl ? 'الاحتفاظ بنسخ الأسابيع الأخيرة (Weekly to keep)' : 'Weekly backups to keep'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={retention.weekly_backups_to_keep}
                  onChange={e => setRetention(prev => ({ ...prev, weekly_backups_to_keep: parseInt(e.target.value, 10) || 4 }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {isRtl ? 'الاحتفاظ بالنسخ الشهرية (Monthly to keep)' : 'Monthly backups to keep'}
                </label>
                <input
                  type="number"
                  min={1}
                  max={24}
                  value={retention.monthly_backups_to_keep}
                  onChange={e => setRetention(prev => ({ ...prev, monthly_backups_to_keep: parseInt(e.target.value, 10) || 12 }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  {isRtl ? 'الحد الأقصى للتخزين المسموح (بالـ ميجابايت MB)' : 'Max Storage Allocation (MB)'}
                </label>
                <input
                  type="number"
                  min={500}
                  max={10000}
                  step={256}
                  value={retention.max_storage_allocation_mb}
                  onChange={e => setRetention(prev => ({ ...prev, max_storage_allocation_mb: parseInt(e.target.value, 10) || 2048 }))}
                  className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy"
                />
              </div>
            </div>

            {/* Safeguards Warning Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-xs space-y-1.5 text-slate-800">
              <div className="font-extrabold text-emerald-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 flex-shrink-0 text-emerald-700" />
                <span>{isRtl ? 'ضمانات الأمان الصارمة للنظام:' : 'Strict Enterprise Safeguards:'}</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-700 text-[11px] font-medium">
                <li>{isRtl ? 'لن يتم إطلاقاً حذف آخر نسخة احتياطية سليمة ومؤكدة تحت أي ظرف.' : 'The last verified successful backup is permanently protected from deletion.'}</li>
                <li>{isRtl ? 'يتم تسجيل كل عملية تنظيف أو حذف تلقائي في سجل التدقيق والمراقبة.' : 'Every automatic purge is recorded in the permanent audit logs.'}</li>
                <li>{isRtl ? 'النسخ الاحتياطية المنشأة كنقاط أمان قبل الاستعادة تحظى بحماية تامة.' : 'Safety snapshots created prior to restore operations are preserved.'}</li>
              </ul>
            </div>

            <button
              onClick={handleSaveRetention}
              className="w-full flex items-center justify-center gap-2 py-3 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isRtl ? 'حفظ سياسة الاحتفاظ' : 'Save Retention Policy'}</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 3: THREE INDEPENDENT DESTINATIONS (LOCAL COMPUTER, SERVER, GOOGLE DRIVE) */}
      {activeTab === 'destination' && (
        <div className="space-y-6">
          {/* Multi-destination Info Banner */}
          <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-600 text-white rounded-xl">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs font-black text-blue-950">
                  {isRtl ? 'تعدد وجهات النسخ الاحتياطي المستقلة' : 'Independent Multi-Destination Storage'}
                </h4>
                <p className="text-[11px] font-semibold text-blue-800 mt-0.5">
                  {isRtl
                    ? 'يمكن تفعيل وجهة واحدة أو أكثر في آنٍ واحد. يتم حفظ النسخ الاحتياطية في كافة الوجهات المفعلة بالتوازي.'
                    : 'Enable one or more destinations simultaneously. Backups will be automatically mirrored to all active destinations.'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* DESTINATION 1: LOCAL WINDOWS COMPUTER (Native Windows Folder Picker & Local Agent) */}
            <div className={`p-6 rounded-2xl border transition-all space-y-5 bg-white ${
              destinationsConfig.local_computer?.enabled !== false
                ? 'border-emerald-500/40 shadow-md ring-1 ring-emerald-500/20'
                : 'border-slate-200 shadow-sm opacity-90'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-bct-navy text-white rounded-xl shadow-xs">
                    <Monitor className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {isRtl ? 'الكمبيوتر المحلي (جهاز ويندوز)' : 'Local Computer (Windows PC)'}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-600">
                      {isRtl ? 'تحديد مجلد فعلي على جهازك عبر ويندوز' : 'Real Windows folder on your computer'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {destinationsConfig.local_computer?.enabled !== false ? (
                    <span className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>{isRtl ? 'مفعل' : 'Enabled'}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{isRtl ? 'معطل' : 'Disabled'}</span>
                    </span>
                  )}

                  <button
                    type="button"
                    role="switch"
                    dir="ltr"
                    aria-checked={destinationsConfig.local_computer?.enabled !== false}
                    disabled={togglingDestinations['local_computer']}
                    onClick={() => handleToggleDestination('local_computer')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      destinationsConfig.local_computer?.enabled !== false ? 'bg-emerald-600' : 'bg-slate-300'
                    } ${togglingDestinations['local_computer'] ? 'opacity-50 cursor-wait' : ''}`}
                    title={isRtl ? 'تفعيل أو تعطيل هذه الوجهة' : 'Enable or disable destination'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        destinationsConfig.local_computer?.enabled !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Folder Status and Metadata */}
              <div className="space-y-3">
                {/* Status and Diagnostics */}
                <div className="flex items-center justify-between text-xs pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${agentStatus.connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
                    <span className="font-bold text-slate-800">
                      {isRtl
                        ? `الوكيل ${agentStatus.connected ? 'متصل' : 'غير متصل'} (v${agentStatus.agentVersion || '1.2.0'})`
                        : `Agent ${agentStatus.connected ? 'Connected' : 'Disconnected'} (v${agentStatus.agentVersion || '1.2.0'})`}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const st = await backupService.getLocalAgentStatus(true);
                      setAgentStatus(st);
                    }}
                    className="text-xs text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>{isRtl ? 'فحص الاتصال' : 'Check Connection'}</span>
                  </button>
                </div>

                {/* Windows Path Input */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700">
                    {isRtl ? 'مسار مجلد الحفظ المختار في ويندوز:' : 'Selected Windows Save Path:'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={windowsPath || 'C:\\Users\\AHMED\\Downloads\\BCT Backups'}
                      className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden"
                    />
                    <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={handlePickWindowsFolder}
                    disabled={isPickingWindowsFolder || isPickingRef.current || pickerState !== 'idle'}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all shadow-sm cursor-pointer active:scale-95 bg-bct-navy hover:bg-bct-navy-dark text-white disabled:opacity-75"
                  >
                    <Folder className="w-4 h-4" />
                    <span>{getPickerButtonLabel()}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleValidateWindowsFolder()}
                    disabled={isValidatingWindowsFolder}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <CheckCircle2 className="w-4 h-4 text-slate-500" />
                    <span>{isRtl ? 'اختيار صلاحية المجلد' : 'Validate Folder Permissions'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* DESTINATION 2: LOCAL SERVER STORAGE (Internal Storage) */}
            <div className={`p-6 rounded-2xl border transition-all space-y-5 bg-white ${
              destinationsConfig.server_storage?.enabled !== false
                ? 'border-emerald-500/40 shadow-md ring-1 ring-emerald-500/20'
                : 'border-slate-200 shadow-sm opacity-90'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-blue-50 text-blue-700 rounded-xl border border-blue-200">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {isRtl ? 'تخزين الخادم الداخلي' : 'Internal Server Storage'}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-600">
                      {isRtl ? 'مجلد الخادم المعزول والمحمي' : 'Sandboxed server directory'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {destinationsConfig.server_storage?.enabled !== false ? (
                    <span className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>{isRtl ? 'مفعل' : 'Enabled'}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{isRtl ? 'معطل' : 'Disabled'}</span>
                    </span>
                  )}

                  <button
                    type="button"
                    role="switch"
                    dir="ltr"
                    aria-checked={destinationsConfig.server_storage?.enabled !== false}
                    disabled={togglingDestinations['server_storage']}
                    onClick={() => handleToggleDestination('server_storage')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      destinationsConfig.server_storage?.enabled !== false ? 'bg-emerald-600' : 'bg-slate-300'
                    } ${togglingDestinations['server_storage'] ? 'opacity-50 cursor-wait' : ''}`}
                    title={isRtl ? 'تفعيل أو تعطيل هذه الوجهة' : 'Enable or disable destination'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        destinationsConfig.server_storage?.enabled !== false ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                    <span>{isRtl ? 'مسار مجلد الخادم:' : 'Server Directory Path:'}</span>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {schedule.local_backup_path || './backups'}
                    </span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={schedule.local_backup_path || './backups'}
                      readOnly
                      className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold"
                    />
                    <button
                      type="button"
                      onClick={handleOpenDirectoryModal}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition-all cursor-pointer whitespace-nowrap"
                    >
                      <span>{isRtl ? 'تغيير' : 'Change'}</span>
                    </button>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{isRtl ? 'النسخ المحفوظة بالخادم:' : 'Server Backups:'}</span>
                  <span className="font-extrabold text-slate-900">{stats.local_backups_count} {isRtl ? 'ملف' : 'files'}</span>
                </div>

                <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-200 text-[11px] text-blue-900 flex items-center gap-2 font-medium">
                  <ShieldCheck className="w-4 h-4 text-blue-700 flex-shrink-0" />
                  <span>{isRtl ? 'مؤمن ضد ثغرات اجتياز المسارات (Path Traversal)' : 'Enforces strict directory boundary safeguards'}</span>
                </div>
              </div>
            </div>

            {/* DESTINATION 3: GOOGLE DRIVE CLOUD VAULT */}
            <div className={`p-6 rounded-2xl border transition-all space-y-5 bg-white ${
              Boolean(destinationsConfig.google_drive?.enabled && driveConfig.connected)
                ? 'border-emerald-500/40 shadow-md ring-1 ring-emerald-500/20'
                : 'border-slate-200 shadow-sm opacity-90'
            }`}>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-200">
                    <Cloud className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900">
                      {isRtl ? 'سحابة Google Drive' : 'Google Drive Cloud'}
                    </h3>
                    <p className="text-[11px] font-semibold text-slate-600">
                      {isRtl ? 'الخزينة السحابية الرسمية (OAuth 2.0)' : 'Official Cloud Vault (API v3)'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {Boolean(destinationsConfig.google_drive?.enabled && driveConfig.connected) ? (
                    <span className="px-2.5 py-1 text-[11px] font-black rounded-lg bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1.5 shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                      <span>{isRtl ? 'مفعل' : 'Enabled'}</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-600 border border-slate-300 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                      <span>{isRtl ? 'معطل' : 'Disabled'}</span>
                    </span>
                  )}

                  <button
                    type="button"
                    role="switch"
                    dir="ltr"
                    aria-checked={Boolean(destinationsConfig.google_drive?.enabled && driveConfig.connected)}
                    disabled={togglingDestinations['google_drive']}
                    onClick={() => handleToggleDestination('google_drive')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                      Boolean(destinationsConfig.google_drive?.enabled && driveConfig.connected) ? 'bg-emerald-600' : 'bg-slate-300'
                    } ${togglingDestinations['google_drive'] ? 'opacity-50 cursor-wait' : ''}`}
                    title={isRtl ? 'تفعيل أو تعطيل هذه الوجهة' : 'Enable or disable destination'}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        Boolean(destinationsConfig.google_drive?.enabled && driveConfig.connected) ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <span className="font-semibold text-slate-700">{isRtl ? 'الحساب المرتبط:' : 'Account:'}</span>
                  <span className="font-extrabold text-slate-900 truncate max-w-[140px]">
                    {driveConfig.account_email || (isRtl ? 'غير متصل' : 'Not Connected')}
                  </span>
                </div>

                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-700 block text-[11px]">{isRtl ? 'مجلد النسخ السحابي:' : 'Drive Folder:'}</span>
                    <span className="font-extrabold text-emerald-800 font-mono text-xs">{driveConfig.folder_name}</span>
                  </div>

                  {driveConfig.connected && (
                    <button
                      type="button"
                      onClick={handleOpenFolderSelectModal}
                      className="px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-800 font-bold rounded-lg border border-slate-300 text-xs transition-colors cursor-pointer shadow-xs"
                    >
                      <span>{isRtl ? 'تغيير' : 'Change'}</span>
                    </button>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {driveConfig.connected ? (
                    <>
                      <button
                        onClick={handleTestDriveConnection}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold border border-slate-300 transition-colors cursor-pointer"
                      >
                        <FolderSync className="w-3.5 h-3.5 text-slate-600" />
                        <span>{isRtl ? 'اختبار الوصول' : 'Test'}</span>
                      </button>

                      <button
                        onClick={handleDisconnectDrive}
                        className="flex items-center justify-center py-2 px-3 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-xl text-xs font-bold border border-rose-200 transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                        <span>{isRtl ? 'فصل' : 'Disconnect'}</span>
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setShowDriveModal(true)}
                      className="w-full flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
                    >
                      <Cloud className="w-4 h-4" />
                      <span>{isRtl ? 'ربط حساب Google Drive' : 'Connect Account'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: RESTORE CENTER (SUPER ADMIN ONLY) */}
      {activeTab === 'restore' && isSuperAdmin && (
        <div
          ref={restoreSectionRef}
          id="system-restore-section"
          style={{ scrollMarginTop: '100px' }}
          className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6 scroll-mt-28"
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-200">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  {isRtl ? 'مركز استعادة النظام وقاعدة البيانات' : 'System Restore & Disaster Recovery'}
                </h3>
                <p className="text-xs font-semibold text-slate-600 mt-0.5">
                  {isRtl ? 'استعادة كاملة وموثقة لكافة جداول وسجلات النظام مع فحص السلامة المسبق' : 'Full verified restore of all system entities with pre-restore safety snapshots'}
                </p>
              </div>
            </div>
          </div>

          {/* Critical Warning Alert */}
          <div className="p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-900 space-y-2">
            <div className="font-extrabold flex items-center gap-2 text-sm text-amber-950">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-700" />
              <span>{isRtl ? 'تحذير هام وأمان إلزامي:' : 'Critical Restoration Notice:'}</span>
            </div>
            <p className="leading-relaxed font-medium">
              {isRtl
                ? 'استعادة النظام تقوم باستبدال قاعدة البيانات الحالية بكامل محتويات ملف النسخة الاحتياطية. لحماية بياناتك، يقوم النظام تلقائياً بإنشاء نقطة استعادة أمان فورية (Safety Snapshot) قبل بدء الاسترجاع مباشرة.'
                : 'Restoration replaces current live data with the backup snapshot. For strict protection, the system automatically creates an immediate pre-restore safety snapshot before restoring.'}
            </p>
          </div>

          {/* Restore Source Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Source A: Local Upload */}
            <div
              onClick={() => {
                setRestoreSource('upload');
                fileInputRef.current?.click();
              }}
              className={`p-6 rounded-xl border-2 border-dashed cursor-pointer transition-all flex flex-col items-center justify-center text-center ${
                restoreSource === 'upload' && restoreRawContent
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".bctbak,.json"
                onChange={handleFileChange}
                className="hidden"
              />
              <HardDrive className="w-8 h-8 text-emerald-700 mb-2" />
              <div className="font-extrabold text-sm text-slate-900">
                {isRtl ? 'رفع ملف نسخة احتياطية من جهازك' : 'Upload Backup File (.bctbak)'}
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">
                {isRtl ? 'انقر لاختيار ملف .bctbak أو قم بإسقاطه هنا' : 'Click to browse or drop .bctbak file'}
              </div>
            </div>

            {/* Source B: Restore from Google Drive */}
            <div
              onClick={() => {
                if (!driveConfig.connected) {
                  showError('يرجى ربط حساب Google Drive أولاً', 'Please connect Google Drive account first');
                  return;
                }
                setRestoreSource('history');
              }}
              className={`p-6 rounded-xl border transition-all flex flex-col items-center justify-center text-center ${
                driveConfig.connected
                  ? 'border-slate-300 hover:border-emerald-500 bg-slate-50/50 cursor-pointer'
                  : 'border-slate-200 bg-slate-100 opacity-60 cursor-not-allowed'
              }`}
            >
              <Cloud className="w-8 h-8 text-blue-700 mb-2" />
              <div className="font-extrabold text-sm text-slate-900">
                {isRtl ? 'الاستعادة من سحابة Google Drive' : 'Restore from Google Drive'}
              </div>
              <div className="text-xs font-semibold text-slate-500 mt-1">
                {driveConfig.connected
                  ? (isRtl ? `المجلد المعتمد: ${driveConfig.folder_name}` : `Active folder: ${driveConfig.folder_name}`)
                  : (isRtl ? 'جوجل درايف غير متصل حالياً' : 'Google Drive is disconnected')}
              </div>
            </div>
          </div>

          {/* Verification Results Panel */}
          {isVerifyingFile && (
            <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 text-center space-y-2">
              <RefreshCw className="w-6 h-6 mx-auto text-emerald-600 animate-spin" />
              <p className="text-xs font-bold text-slate-700">{isRtl ? 'جارٍ التحقق من البصمة الرقمية وسلامة الأرشيف...' : 'Verifying archive integrity and SHA-256 checksum...'}</p>
            </div>
          )}

          {verificationResult && (
            <div className="space-y-4">
              <div className={`p-4 rounded-xl border ${
                !verificationResult.valid
                  ? 'bg-rose-50 border-rose-300'
                  : verificationResult.isLegacyJson
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-emerald-50 border-emerald-300'
              }`}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    {!verificationResult.valid ? (
                      <>
                        <AlertCircle className="w-5 h-5 text-rose-700" />
                        <span className="text-rose-950 font-extrabold">{isRtl ? 'فشل فحص الأرشيف: الملف غير صالح أو تالف' : 'Verification failed: Archive is invalid'}</span>
                      </>
                    ) : verificationResult.isLegacyJson ? (
                      <>
                        <AlertTriangle className="w-5 h-5 text-amber-700" />
                        <span className="text-amber-950 font-extrabold">{isRtl ? 'لقطة بيانات JSON سابقة (Legacy Snapshot) — تم التحقق والاعتماد' : 'Legacy Database JSON Snapshot — Verified'}</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                        <span className="text-emerald-950 font-extrabold">{isRtl ? 'أرشيف رسمي معتمد (BCTBAK v2.0) — سليم وموثوق 100%' : 'Official Verified Archive (BCTBAK v2.0)'}</span>
                      </>
                    )}
                  </div>
                  {verificationResult.formatNameAr && (
                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                      verificationResult.isLegacyJson
                        ? 'bg-amber-200 text-amber-900 border border-amber-300'
                        : verificationResult.valid
                          ? 'bg-emerald-200 text-emerald-900 border border-emerald-300'
                          : 'bg-rose-200 text-rose-900 border border-rose-300'
                    }`}>
                      {isRtl ? verificationResult.formatNameAr : (verificationResult.formatNameEn || verificationResult.format)}
                    </span>
                  )}
                </div>

                {!verificationResult.valid && verificationResult.errors && verificationResult.errors.length > 0 && (
                  <div className="mt-3 p-3 bg-white/80 rounded-lg border border-rose-200 text-xs text-rose-900 space-y-1">
                    {verificationResult.errors.map((err, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 font-semibold">
                        <span className="text-rose-600 font-bold">•</span>
                        <span>{err}</span>
                      </div>
                    ))}
                  </div>
                )}

                {verificationResult.warnings && verificationResult.warnings.length > 0 && (
                  <div className="mt-3 p-3 bg-white/80 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
                    {verificationResult.warnings.map((warn, idx) => (
                      <div key={idx} className="flex items-start gap-1.5 font-semibold">
                        <span className="text-amber-600 font-bold">⚠️</span>
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                )}

                {verificationResult.header && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-3 mt-3 border-t border-slate-200/70 font-semibold">
                    <div>
                      <span className="text-slate-500 block">{isRtl ? 'معرف النسخة:' : 'Backup ID:'}</span>
                      <span className="font-mono text-slate-900 font-bold">{verificationResult.header.backup_id}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isRtl ? 'تاريخ الإنشاء:' : 'Created At:'}</span>
                      <span className="text-slate-900">{formatDateDisplay(verificationResult.header.created_at)}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isRtl ? 'إجمالي السجلات:' : 'Total Records:'}</span>
                      <span className="font-black text-emerald-800">{verificationResult.totalRecords}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isRtl ? 'الجداول المتضمنة:' : 'Tables:'}</span>
                      <span className="text-slate-900">{(verificationResult.header.tables_count || verificationResult.tablesCount)} {isRtl ? 'جدول' : 'tables'}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Strict Confirmation Box */}
              {verificationResult.valid && (
                <div className="p-5 bg-amber-50/50 border border-amber-300 rounded-xl space-y-3">
                  <div className="text-xs font-extrabold text-slate-900">
                    {isRtl
                      ? 'للتأكيد النهائي، يرجى كتابة "استعادة" أو "RESTORE" في الحقل أدناه للبدء:'
                      : 'To confirm, please type "استعادة" or "RESTORE" below to proceed:'}
                  </div>
                  <input
                    type="text"
                    placeholder={isRtl ? 'اكتب "استعادة" هنا...' : 'Type "RESTORE" here...'}
                    value={restoreConfirmationText}
                    onChange={e => setRestoreConfirmationText(e.target.value)}
                    className="w-full bg-white border border-amber-400 rounded-xl px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-600 font-bold"
                  />
                  <button
                    disabled={
                      isRestoring ||
                      (restoreConfirmationText.trim() !== 'استعادة' &&
                        restoreConfirmationText.trim().toUpperCase() !== 'RESTORE')
                    }
                    onClick={handleExecuteRestore}
                    className="w-full flex items-center justify-center gap-2 py-3 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
                  >
                    {isRestoring ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>{isRtl ? 'جارٍ إنشاء نقطة الأمان واسترجاع النظام...' : 'Creating safety snapshot and restoring...'}</span>
                      </>
                    ) : (
                      <>
                        <RotateCcw className="w-4 h-4" />
                        <span>{isRtl ? 'تأكيد واستعادة قاعدة البيانات بالكامل' : 'Confirm & Restore Full Database'}</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODAL 1: BROWSE & SELECT LOCAL BACKUP DIRECTORY (Requirement 3) */}
      {showDirectoryModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                  <Folder className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {isRtl ? 'تحديد وتخصيص مسار التخزين على الخادم' : 'Select Server Backup Directory'}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isRtl ? 'اختر من المجلدات المعتمدة أو حدد مساراً فرعياً مخصصاً' : 'Choose approved directory or define custom subdirectory'}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowDirectoryModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Approved Folders List */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-800">
                {isRtl ? 'المجلدات المعتمدة على الخادم:' : 'Approved Server Directories:'}
              </label>
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {approvedDirectories.map((dir, idx) => (
                  <div
                    key={idx}
                    onClick={() => {
                      setCustomPathInput(dir.path);
                      handleValidateDirectory(dir.path);
                    }}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                      customPathInput === dir.path
                        ? 'bg-blue-50/70 border-bct-navy text-bct-navy font-bold shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Folder className="w-4 h-4 text-blue-600" />
                      <div>
                        <div>{isRtl ? dir.name : dir.name_en}</div>
                        <code className="text-[10px] text-slate-500 font-mono">{dir.path}</code>
                      </div>
                    </div>
                    {customPathInput === dir.path && (
                      <Check className="w-4 h-4 text-bct-navy" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Manual Path Entry & Validation */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-800">
                {isRtl ? 'مسار المجلد المحدد (يدوياً):' : 'Selected Directory Path (Manual Entry):'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customPathInput}
                  onChange={e => setCustomPathInput(e.target.value)}
                  placeholder="./backups/vault"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-bct-navy"
                />
                <button
                  type="button"
                  disabled={isValidatingPath}
                  onClick={() => handleValidateDirectory(customPathInput)}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs border border-slate-300 transition-colors cursor-pointer whitespace-nowrap"
                >
                  {isValidatingPath ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : (isRtl ? 'فحص الصلاحيات' : 'Validate')}
                </button>
              </div>

              {/* Validation Result Badge */}
              {directoryValidation && (
                <div className={`p-2.5 rounded-xl border text-xs font-bold flex items-center gap-2 ${
                  directoryValidation.valid
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    : 'bg-rose-50 text-rose-900 border-rose-200'
                }`}>
                  {directoryValidation.valid ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <AlertCircle className="w-4 h-4 text-rose-600" />}
                  <span>{isRtl ? directoryValidation.message : directoryValidation.message_en}</span>
                </div>
              )}
            </div>

            {/* Create New Subdirectory */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                {isRtl ? 'أو أنشئ مجلداً فرعياً جديداً:' : 'Or Create New Subdirectory:'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={newSubdirName}
                  onChange={e => setNewSubdirName(e.target.value)}
                  placeholder="e.g. quarterly_vault"
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs text-slate-900 font-medium"
                />
                <button
                  type="button"
                  disabled={isCreatingDir || !newSubdirName.trim()}
                  onClick={handleCreateSubdirectory}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 disabled:opacity-50 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleApplyDirectory}
                className="flex-1 py-2.5 bg-bct-navy hover:bg-bct-navy-dark text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                {isRtl ? 'اعتماد وحفظ المسار' : 'Apply & Save Path'}
              </button>
              <button
                type="button"
                onClick={() => setShowDirectoryModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: GOOGLE DRIVE FOLDER SELECTOR (Requirement 4) */}
      {showFolderSelectModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  <Cloud className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    {isRtl ? 'اختيار مجلد التخزين في Google Drive' : 'Select Google Drive Destination Folder'}
                  </h3>
                  <span className="text-[11px] text-slate-500 font-medium">
                    {isRtl ? 'استعراض المجلدات السحابية المتاحة وتعيين المجلد النشط' : 'Browse available cloud folders and set active destination'}
                  </span>
                </div>
              </div>
              <button onClick={() => setShowFolderSelectModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Folder List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-800">
                  {isRtl ? 'المجلدات المتاحة على درايف:' : 'Available Cloud Folders:'}
                </label>
                <button
                  type="button"
                  disabled={isLoadingFolders}
                  onClick={async () => {
                    setIsLoadingFolders(true);
                    const res = await backupService.listGoogleDriveFolders();
                    if (res.success) setDriveFolders(res.folders);
                    setIsLoadingFolders(false);
                  }}
                  className="text-xs text-blue-700 hover:text-blue-900 font-bold flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingFolders ? 'animate-spin' : ''}`} />
                  <span>{isRtl ? 'تحديث المجلدات' : 'Refresh'}</span>
                </button>
              </div>

              <div className="space-y-1.5 max-h-52 overflow-y-auto pr-1">
                {isLoadingFolders ? (
                  <div className="py-6 text-center text-slate-500">
                    <RefreshCw className="w-5 h-5 mx-auto animate-spin mb-1 text-emerald-600" />
                    <span className="text-xs font-semibold">{isRtl ? 'جارٍ جلب المجلدات...' : 'Loading folders...'}</span>
                  </div>
                ) : driveFolders.length === 0 ? (
                  <div className="py-6 text-center text-slate-500 text-xs font-semibold">
                    {isRtl ? 'لا توجد مجلدات مسجلة' : 'No folders found'}
                  </div>
                ) : (
                  driveFolders.map(folder => {
                    const isSelected = driveConfig.folder_id === folder.id;
                    return (
                      <div
                        key={folder.id}
                        onClick={() => handleSelectDriveFolder(folder)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-center justify-between ${
                          isSelected
                            ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs'
                            : 'bg-slate-50 border-slate-200 hover:border-slate-300 text-slate-800 font-semibold'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FolderCheck className={`w-4 h-4 ${isSelected ? 'text-emerald-700' : 'text-slate-500'}`} />
                          <div>
                            <div>{folder.name}</div>
                            <span className="text-[10px] text-slate-400 font-mono">{folder.id}</span>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-600 text-white">
                            {isRtl ? 'المجلد النشط' : 'Active'}
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Create New Folder Input */}
            <div className="space-y-1.5 pt-2 border-t border-slate-100">
              <label className="block text-xs font-bold text-slate-700">
                {isRtl ? 'إنشاء مجلد جديد في Google Drive:' : 'Create New Drive Folder:'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. BCT_2026_Audit_Vault"
                  value={newFolderNameInput}
                  onChange={e => setNewFolderNameInput(e.target.value)}
                  className="flex-1 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy"
                />
                <button
                  type="button"
                  disabled={isCreatingFolder || !newFolderNameInput.trim()}
                  onClick={handleCreateDriveFolder}
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer whitespace-nowrap active:scale-95"
                >
                  {isCreatingFolder ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FolderPlus className="w-3.5 h-3.5" />}
                  <span>{isRtl ? 'إنشاء واعتماد' : 'Create & Select'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: MANUAL BACKUP PROMPT */}
      {showManualModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200">
                  <Play className="w-4 h-4 fill-current" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isRtl ? 'إنشاء نسخة احتياطية فورية' : 'Create Immediate Backup'}
                </h3>
              </div>
              <button onClick={() => setShowManualModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              {isRtl
                ? 'سيتم أخذ لقطة فورية شاملة لكافة جداول وسجلات النظام وحساب البصمة الرقمية SHA-256 وحفظها بأمان.'
                : 'A full snapshot of all system tables will be generated, SHA-256 hashed, and securely saved.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {isRtl ? 'وجهة الحفظ' : 'Destination'}
              </label>
              <select
                value={manualDestination}
                onChange={e => setManualDestination(e.target.value as any)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy cursor-pointer"
              >
                <option value="multi">{isRtl ? 'كافة الوجهات المفعلة بالتوازي (المجلد المحلي + الخادم + السحابة)' : 'All Active Destinations (Local Folder + Server + Cloud)'}</option>
                <option value="local_computer" disabled={destinationsConfig.local_computer?.enabled === false}>
                  {isRtl
                    ? `الكمبيوتر المحلي [المجلد المختار: ${browserDirInfo.hasDirectory ? browserDirInfo.folderName : (windowsPath || 'لم يُحدد بعد')}]${destinationsConfig.local_computer?.enabled === false ? ' (معطل)' : ''}`
                    : `Local Computer [Selected Folder: ${browserDirInfo.hasDirectory ? browserDirInfo.folderName : (windowsPath || 'Not selected yet')}]${destinationsConfig.local_computer?.enabled === false ? ' (Disabled)' : ''}`}
                </option>
                <option value="local" disabled={destinationsConfig.server_storage?.enabled === false}>
                  {isRtl
                    ? `التخزين الداخلي على الخادم (${schedule.local_backup_path || './backups'})${destinationsConfig.server_storage?.enabled === false ? ' (معطل)' : ''}`
                    : `Local Server Storage (${schedule.local_backup_path || './backups'})${destinationsConfig.server_storage?.enabled === false ? ' (Disabled)' : ''}`}
                </option>
                <option value="google_drive" disabled={!driveConfig.connected || !destinationsConfig.google_drive?.enabled}>
                  {isRtl
                    ? `جوجل درايف [${driveConfig.folder_name}] ${!driveConfig.connected ? '(غير متصل)' : !destinationsConfig.google_drive?.enabled ? '(معطل)' : ''}`
                    : `Google Drive [${driveConfig.folder_name}] ${!driveConfig.connected ? '(Disconnected)' : !destinationsConfig.google_drive?.enabled ? '(Disabled)' : ''}`}
                </option>
                <option value="both" disabled={!driveConfig.connected || !destinationsConfig.google_drive?.enabled || destinationsConfig.server_storage?.enabled === false}>
                  {isRtl
                    ? `كلاهما معاً (محلي وسحابي) ${!driveConfig.connected ? '(يتطلب ربط درايف)' : destinationsConfig.server_storage?.enabled === false ? '(الخادم معطل)' : ''}`
                    : `Both (Local & Drive) ${!driveConfig.connected ? '(Requires Drive)' : destinationsConfig.server_storage?.enabled === false ? '(Server Disabled)' : ''}`}
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {isRtl ? 'ملاحظة أو سبب النسخ (اختياري)' : 'Note or Description (Optional)'}
              </label>
              <input
                type="text"
                placeholder={isRtl ? 'مثال: قبل إقفال الشهر المالي...' : 'e.g., Before monthly closing...'}
                value={manualNote}
                onChange={e => setManualNote(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                disabled={isLoading}
                onClick={handleCreateManualBackup}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                {isLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isRtl ? 'بدء النسخ الآن' : 'Start Backup'}</span>
              </button>
              <button
                onClick={() => setShowManualModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: GOOGLE DRIVE CONNECT */}
      {showDriveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-50 text-blue-700 rounded-lg border border-blue-200">
                  <Cloud className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 text-sm">
                  {isRtl ? 'ربط حساب Google Drive' : 'Connect Google Drive Account'}
                </h3>
              </div>
              <button onClick={() => setShowDriveModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              {isRtl
                ? 'أدخل بريد حساب جوجل الخاص بالمنشأة لربط مجلد النسخ السحابي الاحتياطي (BCT_Enterprise_Backups) عبر OAuth 2.0.'
                : 'Enter enterprise Google account email to initialize cloud vault (BCT_Enterprise_Backups) via OAuth 2.0.'}
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                {isRtl ? 'البريد الإلكتروني لحساب Google' : 'Google Account Email'}
              </label>
              <input
                type="email"
                placeholder="admin@bct-educational.com"
                value={driveEmailInput}
                onChange={e => setDriveEmailInput(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 font-semibold focus:outline-none focus:border-bct-navy"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                disabled={isConnectingDrive}
                onClick={handleConnectDrive}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                {isConnectingDrive ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                <span>{isRtl ? 'تأكيد الربط والتفويض' : 'Authorize & Connect'}</span>
              </button>
              <button
                onClick={() => setShowDriveModal(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: DELETE CONFIRMATION */}
      {backupToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-sm w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-700">
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl">
                <AlertCircle className="w-5 h-5 text-rose-700" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-sm">{isRtl ? 'تأكيد حذف النسخة الاحتياطية' : 'Confirm Backup Deletion'}</h3>
            </div>

            <p className="text-xs font-medium text-slate-600 leading-relaxed">
              {isRtl
                ? `هل أنت متأكد من رغبتك في حذف النسخة (${backupToDelete.id}) نهائياً من النظام؟ لا يمكن التراجع عن هذا الإجراء.`
                : `Are you sure you want to permanently delete backup (${backupToDelete.id})? This action cannot be undone.`}
            </p>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={handleConfirmDelete}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer active:scale-95"
              >
                {isRtl ? 'نعم، حذف نهائي' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => setBackupToDelete(null)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                {isRtl ? 'إلغاء' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
