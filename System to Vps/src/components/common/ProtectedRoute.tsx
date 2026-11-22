import React from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { ShieldAlert, ArrowLeft, ArrowRight } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredPermission?: string;
  requireAdmin?: boolean;
  allowPendingPasswordChange?: boolean;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requireAdmin = false,
  allowPendingPasswordChange = false
}) => {
  const { isAuthenticated, isSuperAdmin, hasPermission, currentUser } = useAuth();
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Fast intercept: If user must change password, strictly forbid entering regular app routes
  if (currentUser?.must_change_password) {
    if (!allowPendingPasswordChange && location.pathname !== '/change-password') {
      return <Navigate to="/change-password" replace />;
    }
  } else {
    // If user has already changed password and tries to access /change-password, redirect to dashboard
    if (allowPendingPasswordChange && location.pathname === '/change-password') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  const isDenied = (requireAdmin && !isSuperAdmin) || (Boolean(requiredPermission) && !hasPermission(requiredPermission!));

  if (isDenied) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-8 text-center space-y-5 animate-in fade-in zoom-in-95 duration-200">
          
          {/* Security Icon */}
          <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100 shadow-xs">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div>
            <h2 className="text-lg font-black text-slate-800">
              {language === 'ar' ? 'صلاحية غير كافية' : 'Access Restricted'}
            </h2>
            
            {/* Mandatory Required Prompts */}
            <p className="text-sm font-bold text-rose-700 mt-2 bg-rose-50 py-2.5 px-4 rounded-xl border border-rose-100">
              {language === 'ar' 
                ? 'ليس لديك صلاحية للوصول إلى هذه الصفحة.' 
                : 'You do not have permission to access this page.'}
            </p>

            <p className="text-xs text-slate-500 mt-3 leading-relaxed">
              {language === 'ar'
                ? 'تم حظر الوصول إلى هذه الوحدة وفق مصفوفة الصلاحيات المعتمدة لحسابك. يرجى التواصل مع المدير العام أو مسؤول النظام.'
                : 'Access to this module is restricted based on your assigned role and permissions. Please contact your system administrator.'}
            </p>
          </div>

          {currentUser && (
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
              <span className="font-semibold text-slate-500">
                {language === 'ar' ? 'الحساب الحالي:' : 'Current User:'}
              </span>
              <span className="font-mono font-bold text-bct-navy">
                {currentUser.username} ({currentUser.position_id})
              </span>
            </div>
          )}

          {/* Action Button: Return to authorized dashboard */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-3 px-4 rounded-xl bg-bct-navy text-white text-xs font-bold hover:bg-bct-dark transition shadow-md flex items-center justify-center gap-2"
          >
            {language === 'ar' ? <ArrowRight className="w-4 h-4" /> : <ArrowLeft className="w-4 h-4" />}
            <span>
              {language === 'ar' 
                ? 'العودة إلى لوحة المؤشرات المعتمدة' 
                : 'Return to Authorized Dashboard'}
            </span>
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
