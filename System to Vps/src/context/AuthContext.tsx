import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Employee } from '../types/database.types';
import { bctStore } from '../services/store';
import { rbacService } from '../services/rbacService';
import { 
  DEFAULT_INITIAL_PASSWORD_HASH, 
  DEMO_PASSWORD_HASH, 
  verifyPasswordSync 
} from '../utils/cryptoUtils';
import { bctPerformance } from '../services/performanceMonitor';

const INACTIVITY_TIMEOUT_MS = 15 * 60 * 1000; // 15 Minutes
const LAST_ACTIVITY_KEY = 'bct_last_active_timestamp';
const LOGOUT_REASON_KEY = 'bct_logout_reason';
const AUTH_TOKEN_KEY = 'bct_auth_token';

export interface AuthResult {
  success: boolean;
  message?: string;
  code?: string;
  mustChangePassword?: boolean;
  token?: string;
  user?: Employee;
}

interface AuthContextType {
  currentUser: Employee | null;
  currentEmployee: Employee | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authToken: string | null;
  login: (username: string, password?: string) => Promise<AuthResult>;
  logout: () => void;
  hasPermission: (permission: string) => boolean;
  canViewReport: (reportId: string) => boolean;
  canViewDashboardWidget: (widgetId: string) => boolean;
  isSuperAdmin: boolean;
  checkIsSuperAdmin: () => boolean;
  updateActivity: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const inFlightLoginRef = useRef(false);

  const [currentUser, setCurrentUser] = useState<Employee | null>(() => {
    const savedId = localStorage.getItem('bct_current_user_id');
    if (savedId) {
      const emp = bctStore.getEmployee(savedId);
      if (emp && emp.employment_status === 'active') return emp;
    }
    // Default to General Manager (emp-001) for initial enterprise preview
    return bctStore.getEmployee('emp-001') || null;
  });

  const [authToken, setAuthToken] = useState<string | null>(() => {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || null;
  });

  const [isLoading, setIsLoading] = useState(false);

  // Sync session ID to localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('bct_current_user_id', currentUser.id);
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    } else {
      localStorage.removeItem('bct_current_user_id');
      localStorage.removeItem(LAST_ACTIVITY_KEY);
      localStorage.removeItem(AUTH_TOKEN_KEY);
      sessionStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }, [currentUser]);

  const updateActivity = useCallback(() => {
    if (currentUser) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }
  }, [currentUser]);

  // FIX 03: Automatic Logout After 15 Minutes of Inactivity (Cross-Tab Synchronized)
  useEffect(() => {
    if (!currentUser) return;

    let lastRecorded = Date.now();
    const handleUserInteraction = () => {
      const now = Date.now();
      // Throttle localStorage writes to once every 5 seconds
      if (now - lastRecorded > 5000) {
        lastRecorded = now;
        localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
      }
    };

    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    events.forEach(evt => window.addEventListener(evt, handleUserInteraction, { passive: true }));

    // Heartbeat check every 10 seconds for 15-min timeout
    const interval = setInterval(() => {
      const rawLastActive = localStorage.getItem(LAST_ACTIVITY_KEY);
      const lastActive = rawLastActive ? parseInt(rawLastActive, 10) : Date.now();
      const elapsed = Date.now() - lastActive;

      if (elapsed >= INACTIVITY_TIMEOUT_MS) {
        localStorage.setItem(LOGOUT_REASON_KEY, 'inactivity');
        bctStore.addAuditLog(currentUser.username, 'SESSION_TIMEOUT_INACTIVITY', 'auth', currentUser.id);
        setCurrentUser(null);
        setAuthToken(null);
        localStorage.removeItem('bct_current_user_id');
        localStorage.removeItem(AUTH_TOKEN_KEY);
        sessionStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(LAST_ACTIVITY_KEY);
      }
    }, 10000);

    // Cross-tab storage coordination
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'bct_current_user_id' && !e.newValue) {
        setCurrentUser(null);
        setAuthToken(null);
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      events.forEach(evt => window.removeEventListener(evt, handleUserInteraction));
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [currentUser]);

  const login = async (username: string, _password?: string): Promise<AuthResult> => {
    // Prevent duplicate concurrent login attempts
    if (inFlightLoginRef.current) {
      return {
        success: false,
        code: 'CONCURRENT_REQUEST_BLOCKED',
        message: 'طلب تسجيل الدخول قيد المعالجة بالفعل. يرجى الانتظار...'
      };
    }

    inFlightLoginRef.current = true;
    setIsLoading(true);
    const loginStartTime = typeof performance !== 'undefined' ? performance.now() : Date.now();

    try {
      // 5000ms timeout race to guarantee UI never gets stuck
      const executionPromise = new Promise<AuthResult>((resolve) => {
        try {
          // Zero artificial delay - immediate lookup & verification
          const authResult = bctStore.authenticateUser(username, _password);
          const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - loginStartTime;

          if (!authResult.success || !authResult.employee) {
            bctPerformance.recordAuthTiming(elapsed, username, false);
            resolve({
              success: false,
              code: authResult.code,
              message: authResult.message
            });
            return;
          }

          const emp = authResult.employee;
          const token = `bct_tok_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

          // Establish authoritative authenticated session
          setCurrentUser(emp);
          setAuthToken(token);
          localStorage.setItem('bct_current_user_id', emp.id);
          localStorage.setItem(AUTH_TOKEN_KEY, token);
          sessionStorage.setItem(AUTH_TOKEN_KEY, token);
          localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
          localStorage.removeItem(LOGOUT_REASON_KEY);

          bctPerformance.recordAuthTiming(elapsed, username, true);

          resolve({
            success: true,
            code: 'SUCCESS',
            mustChangePassword: Boolean(emp.must_change_password),
            token,
            user: emp
          });
        } catch (err: any) {
          const elapsed = (typeof performance !== 'undefined' ? performance.now() : Date.now()) - loginStartTime;
          bctPerformance.recordAuthTiming(elapsed, username, false);
          resolve({
            success: false,
            code: 'AUTH_EXCEPTION',
            message: err?.message || 'حدث خطأ غير متوقع أثناء تسجيل الدخول'
          });
        }
      });

      const timeoutPromise = new Promise<AuthResult>((resolve) => {
        setTimeout(() => {
          resolve({
            success: false,
            code: 'TIMEOUT',
            message: 'استغرقت عملية تسجيل الدخول أكثر من 5 ثوانٍ. يرجى التحقق من الاتصال وإعادة المحاولة.'
          });
        }, 5000);
      });

      return await Promise.race([executionPromise, timeoutPromise]);
    } finally {
      inFlightLoginRef.current = false;
      setIsLoading(false);
    }
  };

  const logout = () => {
    if (currentUser) {
      bctStore.addAuditLog(currentUser.username, 'LOGOUT', 'auth', currentUser.id);
    }
    setCurrentUser(null);
    setAuthToken(null);
    localStorage.removeItem('bct_current_user_id');
    localStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(LAST_ACTIVITY_KEY);
  };

  const [rbacVersion, setRbacVersion] = useState(0);

  // Immediate Reactive RBAC Updates on Store Mutations with identity stability
  useEffect(() => {
    return bctStore.subscribe(() => {
      setRbacVersion(v => v + 1);
      if (currentUser?.id) {
        const fresh = bctStore.getEmployee(currentUser.id);
        if (fresh) {
          if (fresh.employment_status !== 'active' || fresh.account_status === 'suspended' || fresh.is_system_user === false) {
            setCurrentUser(null);
            setAuthToken(null);
            localStorage.removeItem('bct_current_user_id');
            localStorage.removeItem(AUTH_TOKEN_KEY);
            sessionStorage.removeItem(AUTH_TOKEN_KEY);
            return;
          }
          // Preserve reference identity if user attributes haven't changed to prevent render storms
          setCurrentUser((prev) => {
            if (!prev) return fresh;
            const isUnchanged =
              prev.id === fresh.id &&
              prev.username === fresh.username &&
              prev.account_status === fresh.account_status &&
              prev.employment_status === fresh.employment_status &&
              prev.must_change_password === fresh.must_change_password &&
              prev.position_id === fresh.position_id &&
              prev.job_title_ar === fresh.job_title_ar &&
              prev.job_title_en === fresh.job_title_en &&
              prev.is_system_user === fresh.is_system_user &&
              prev.roles?.length === fresh.roles?.length &&
              (prev.roles || []).every((r, idx) => r === fresh.roles?.[idx]) &&
              JSON.stringify(prev.permission_overrides || null) === JSON.stringify(fresh.permission_overrides || null) &&
              JSON.stringify(prev.report_overrides || null) === JSON.stringify(fresh.report_overrides || null) &&
              JSON.stringify(prev.dashboard_overrides || null) === JSON.stringify(fresh.dashboard_overrides || null) &&
              JSON.stringify(prev.custom_permissions || null) === JSON.stringify(fresh.custom_permissions || null);

            return isUnchanged ? prev : { ...fresh };
          });
        }
      }
    });
  }, [currentUser?.id]);

  const checkIsSuperAdmin = useCallback((): boolean => {
    return rbacService.isSuperAdmin(currentUser);
  }, [currentUser, rbacVersion]);

  const hasPermission = useCallback((permission: string): boolean => {
    if (!currentUser) return false;
    return rbacService.hasPermission(currentUser, permission, bctStore.getJobPositions());
  }, [currentUser, rbacVersion]);

  const canViewReport = useCallback((reportId: string): boolean => {
    if (!currentUser) return false;
    return rbacService.canViewReport(currentUser, reportId, bctStore.getJobPositions(), bctStore.getDepartments());
  }, [currentUser, rbacVersion]);

  const canViewDashboardWidget = useCallback((widgetId: string): boolean => {
    if (!currentUser) return false;
    return rbacService.canViewDashboardWidget(currentUser, widgetId, bctStore.getJobPositions(), bctStore.getDepartments());
  }, [currentUser, rbacVersion]);

  const adminFlag = rbacService.isSuperAdmin(currentUser);

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        currentEmployee: currentUser,
        isAuthenticated: Boolean(currentUser),
        isLoading,
        authToken,
        login,
        logout,
        hasPermission,
        canViewReport,
        canViewDashboardWidget,
        isSuperAdmin: adminFlag,
        checkIsSuperAdmin,
        updateActivity
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
