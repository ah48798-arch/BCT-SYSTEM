import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { bctStore } from '../../services/store';
import { validatePasswordStrength } from '../../utils/cryptoUtils';
import { ShieldCheck, Lock, Eye, EyeOff, AlertCircle, LogOut, CheckCircle2 } from 'lucide-react';

export const MandatoryChangePasswordModal: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { isRtl } = useLanguage();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDone, setSuccessDone] = useState(false);

  // If user doesn't require password change, don't render anything (unless briefly displaying success)
  if (!currentUser || (!currentUser.must_change_password && !successDone)) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!currentPassword.trim()) {
      setErrorMessage(
        isRtl
          ? 'يرجى إدخال كلمة المرور الحالية أو المؤقتة (123)'
          : 'Please enter your current or temporary password (123)'
      );
      return;
    }

    const strength = validatePasswordStrength(newPassword, currentPassword);
    if (!strength.isValid) {
      setErrorMessage(isRtl ? strength.messageAr || '' : strength.messageEn || '');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage(
        isRtl
          ? 'كلمتا المرور الجديدتان غير متطابقتين'
          : 'New password and confirmation do not match'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const res = bctStore.changeUserPassword(currentUser.id, currentPassword, newPassword);
      if (!res.success) {
        setErrorMessage(
          res.message ||
            (isRtl
              ? 'فشل تغيير كلمة المرور. يرجى التحقق من كلمة المرور الحالية.'
              : 'Failed to update password. Please check your current password.')
        );
        return;
      }

      setSuccessDone(true);
      setTimeout(() => {
        setSuccessDone(false);
      }, 750);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] bg-slate-900/85 backdrop-blur-md flex items-center justify-center p-4"
      onKeyDown={(e) => {
        // Prevent closing modal with Escape key
        if (e.key === 'Escape') {
          e.preventDefault();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6 sm:p-8 border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Icon & Title */}
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3 border border-amber-200 shadow-sm">
            <ShieldCheck className="w-8 h-8" />
          </div>

          <h3 className="text-lg font-black text-slate-800">
            {isRtl ? 'تغيير كلمة المرور إلزامي للمتابعة' : 'Mandatory Password Change'}
          </h3>

          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            {isRtl
              ? 'حسابك يتطلب تعيين كلمة مرور جديدة للمرة الأولى أو بعد إعادة التعيين من قِبل مسؤول النظام لضمان أمان حسابك وسريته.'
              : 'Your account requires setting a new password upon first login or after an administrative reset to ensure system security.'}
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-mono font-bold">
            <span>@{currentUser.username}</span>
            <span>•</span>
            <span className="font-sans font-semibold">
              {isRtl ? currentUser.full_name_ar : currentUser.full_name_en}
            </span>
          </div>
        </div>

        {/* Success Notice if saved */}
        {successDone && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-800 font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>
              {isRtl
                ? 'تم حفظ كلمة المرور بنجاح! جارٍ تحويلك إلى لوحة التحكم...'
                : 'Password updated successfully! Redirecting to dashboard...'}
            </span>
          </div>
        )}

        {/* Error Notice */}
        {errorMessage && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-700 font-semibold animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Current Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRtl ? 'كلمة المرور الحالية (المؤقتة: 123)' : 'Current (Temporary) Password'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full ps-10 pe-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-bct-navy focus:bg-white text-slate-800 transition"
                placeholder={isRtl ? 'أدخل كلمة المرور الحالية أو (123)' : 'Enter current or temporary password'}
              />
              <button
                type="button"
                onClick={() => setShowCurrent(!showCurrent)}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRtl ? 'كلمة المرور الجديدة' : 'New Password'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                className="w-full ps-10 pe-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-bct-navy focus:bg-white text-slate-800 transition"
                placeholder={isRtl ? 'يجب ألا تقل عن 6 أحرف أو أرقام' : 'At least 6 characters'}
              />
              <button
                type="button"
                onClick={() => setShowNew(!showNew)}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              {isRtl ? 'تأكيد كلمة المرور الجديدة' : 'Confirm New Password'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full ps-10 pe-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-bct-navy focus:bg-white text-slate-800 transition"
                placeholder={isRtl ? 'أعد كتابة كلمة المرور الجديدة' : 'Re-enter new password'}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Policy Tips */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-[11px] text-slate-500 space-y-1">
            <p className="font-bold text-slate-700">
              {isRtl ? 'شروط كلمة المرور الآمنة:' : 'Password Security Policy:'}
            </p>
            <ul className="list-disc list-inside space-y-0.5">
              <li>{isRtl ? 'يجب ألا تقل عن 6 أحرف أو أرقام.' : 'Must be at least 6 characters long.'}</li>
              <li>{isRtl ? 'لا يمكن استخدام كلمة المرور الافتراضية (123).' : 'Cannot reuse temporary password (123).'}</li>
            </ul>
          </div>

          {/* Buttons */}
          <div className="pt-2 space-y-2">
            <button
              type="submit"
              disabled={isSubmitting || successDone}
              className="w-full py-2.5 px-4 rounded-xl shadow-md text-xs font-bold text-white bg-bct-navy hover:bg-bct-dark focus:outline-none focus:ring-2 focus:ring-bct-navy disabled:opacity-50 transition flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>
                {isSubmitting
                  ? (isRtl ? 'جارٍ الحفظ وتحديث الحساب...' : 'Saving password...')
                  : (isRtl ? 'حفظ كلمة المرور والمتابعة إلى النظام' : 'Save Password & Continue')}
              </span>
            </button>

            <button
              type="button"
              onClick={logout}
              className="w-full py-2 px-4 rounded-xl text-xs font-semibold text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{isRtl ? 'تسجيل الخروج والعودة لاحقاً' : 'Sign Out & Return Later'}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
