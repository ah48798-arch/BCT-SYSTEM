import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Shield, Eye, EyeOff, Lock, User, AlertCircle, CheckCircle, Globe, RotateCcw } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, isLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const navigate = useNavigate();

  const [username, setUsername] = useState('bashdar.gm');
  const [password, setPassword] = useState('BctPassword2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [canRetry, setCanRetry] = useState(false);
  const [inactivityNotice, setInactivityNotice] = useState<string | null>(() => {
    const reason = localStorage.getItem('bct_logout_reason');
    if (reason === 'inactivity') {
      localStorage.removeItem('bct_logout_reason');
      return 'inactivity';
    }
    return null;
  });

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMessage('');
    setCanRetry(false);

    if (!username.trim() || !password.trim()) {
      setErrorMessage(t('auth.errorInvalid'));
      return;
    }

    try {
      const result = await login(username, password);
      if (result.success) {
        if (result.mustChangePassword) {
          navigate('/change-password', { replace: true });
        } else {
          navigate('/dashboard', { replace: true });
        }
      } else {
        setErrorMessage(result.message || t('auth.errorInvalid'));
        if (result.code === 'TIMEOUT' || result.code === 'AUTH_EXCEPTION') {
          setCanRetry(true);
        }
      }
    } catch (err: any) {
      setErrorMessage(
        language === 'ar'
          ? 'تعذر إتمام عملية تسجيل الدخول. يرجى المحاولة مرة أخرى.'
          : 'Unable to complete login. Please try again.'
      );
      setCanRetry(true);
    }
  };

  const demoAccounts: Array<{ username: string; title_ar: string; title_en: string; tempPassword?: string }> = [
    { username: 'bashdar.gm', title_ar: 'المدير العام', title_en: 'General Manager' },
    { username: 'ahmed.ops', title_ar: 'مدير العمليات', title_en: 'Operations Manager' },
    { username: 'omar.consult', title_ar: 'رئيس المستشارين', title_en: 'Head of Consultants' },
    { username: 'fatima.fin', title_ar: 'المدير المالي والإداري', title_en: 'Finance Manager' },
    { username: 'mahmoud.qa', title_ar: 'مسؤول الجودة والأنظمة', title_en: 'Quality Officer' },
    { username: 'yasser.apply', title_ar: 'أخصائي التقديمات', title_en: 'Applications Specialist' },
    { username: 'karim.acc', title_ar: 'المحاسب وأمين التحصيل', title_en: 'Accountant' },
    { username: 'tarek.mkt', title_ar: 'مسؤول التسويق (مؤقت: 123)', title_en: 'Marketing Mgr (Temp: 123)', tempPassword: '123' },
  ];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-bct-navy/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-bct-teal/20 rounded-full blur-3xl pointer-events-none" />

      {/* Language Toggle in Top Corner */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setLanguage(language === 'ar' ? 'en' : 'ar')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-bold text-slate-200 hover:bg-slate-700 transition"
        >
          <Globe className="w-4 h-4 text-bct-teal" />
          <span>{language === 'ar' ? 'English' : 'العربية'}</span>
        </button>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        
        {/* Official Brand Logo */}
        <div className="text-center mb-6">
          <div className="inline-block p-4 rounded-2xl bg-white shadow-xl mb-4 border border-slate-100">
            <img 
              src="/assets/brand/BCT_Vertical_Mono_Navy.png" 
              alt="BCT" 
              className="h-16 w-auto object-contain mx-auto"
            />
          </div>
          <h2 className="text-xl font-extrabold text-white">
            {t('brand.name')}
          </h2>
          <p className="mt-1 text-xs text-slate-400">
            {t('brand.tagline')}
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white py-8 px-6 sm:px-10 shadow-2xl rounded-2xl border border-slate-200">
          
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-800">
              {t('auth.loginTitle')}
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              {t('auth.loginSubtitle')}
            </p>
          </div>

          {inactivityNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
              <span className="font-semibold leading-relaxed">
                {language === 'ar'
                  ? 'تم تسجيل خروجك تلقائياً بعد 15 دقيقة من عدم النشاط لحماية بيانات الشركة.'
                  : 'You were automatically logged out after 15 minutes of inactivity to protect company data.'}
              </span>
            </div>
          )}

          {errorMessage && (
            <div className="mb-5 p-3 rounded-lg bg-red-50 border border-red-200 flex flex-col gap-2 text-xs text-red-700 animate-in fade-in">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-500 mt-0.5" />
                <span className="flex-1 font-medium">{errorMessage}</span>
              </div>
              {canRetry && (
                <div className="ps-6">
                  <button
                    type="button"
                    onClick={() => handleSubmit()}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-red-700 hover:text-red-900 underline"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{language === 'ar' ? 'إعادة المحاولة الآن' : 'Retry Now'}</span>
                  </button>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Username Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('auth.username')}
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  disabled={isLoading}
                  className="block w-full ps-10 pe-3 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bct-navy focus:border-bct-navy focus:bg-white text-slate-800 transition disabled:opacity-60"
                  placeholder="e.g. bashdar.gm"
                />
              </div>
            </div>

            {/* Password Input with Show/Hide */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t('auth.password')}
              </label>
              <div className="relative rounded-lg shadow-sm">
                <div className="absolute inset-y-0 start-0 ps-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isLoading}
                  className="block w-full ps-10 pe-10 py-2.5 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:ring-2 focus:ring-bct-navy focus:border-bct-navy focus:bg-white text-slate-800 transition disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 end-0 pe-3 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between text-xs pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="w-4 h-4 text-bct-navy rounded border-slate-300 focus:ring-bct-navy"
                />
                <span className="text-slate-600">{t('auth.rememberMe')}</span>
              </label>

              <a href="#forgot" className="font-semibold text-bct-navy hover:underline">
                {t('auth.forgotPassword')}
              </a>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-2.5 px-4 border border-transparent rounded-lg shadow-md text-xs font-bold text-white bg-bct-navy hover:bg-bct-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-bct-navy disabled:opacity-50 transition flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>{t('auth.loggingIn')}</span>
                  </span>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>{t('auth.loginButton')}</span>
                  </>
                )}
              </button>
            </div>

          </form>

          {/* Quick Demo Credentials Selector */}
          <div className="mt-6 pt-5 border-t border-slate-100">
            <p className="text-[11px] font-bold text-slate-500 mb-2">
              {language === 'ar' ? 'حسابات تجريبية سريعة للاختبار:' : 'Quick Demo Logins for RBAC Testing:'}
            </p>
            <div className="grid grid-cols-2 gap-1.5">
              {demoAccounts.map((acc) => (
                <button
                  key={acc.username}
                  type="button"
                  disabled={isLoading}
                  onClick={() => {
                    setUsername(acc.username);
                    setPassword(acc.tempPassword || 'BctPassword2026!');
                    setErrorMessage('');
                  }}
                  className={`text-start px-2 py-1.5 rounded-lg border text-[11px] transition ${
                    username === acc.username 
                      ? 'border-bct-navy bg-slate-50 font-bold text-bct-navy' 
                      : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-semibold truncate">
                    {language === 'ar' ? acc.title_ar : acc.title_en}
                  </div>
                  <div className="text-[9px] text-slate-400 font-mono">
                    {acc.username}
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 text-center">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1">
              <CheckCircle className="w-3 h-3 text-emerald-500 inline" />
              <span>{t('auth.secureNotice')}</span>
            </p>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Login;
