import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { useLanguage } from '../hooks/useLanguage';
import { t } from '../lib/i18n';

export default function ProfilePage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language } = useLanguage();

  const [nameForm, setNameForm] = useState({ name: user?.name ?? '', email: user?.email ?? '' });
  const [pwForm, setPwForm] = useState({ current: '', newPw: '', confirm: '' });
  const [nameMsg, setNameMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [pwMsg, setPwMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);
  const [nameSaving, setNameSaving] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const handleNameSave = async () => {
    if (!nameForm.name.trim()) return;
    setNameSaving(true);
    setNameMsg(null);
    try {
      const api = (await import('../services/api')).default;
      await api.patch('/users/me', { name: nameForm.name.trim(), email: nameForm.email.trim() });
      setNameMsg({ type: 'ok', text: t('profile.updated_ok', language) });
    } catch {
      setNameMsg({ type: 'err', text: t('profile.updated_err', language) });
    } finally {
      setNameSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    setPwMsg(null);
    if (pwForm.newPw.length < 6) { setPwMsg({ type: 'err', text: t('profile.pw_too_short', language) }); return; }
    if (pwForm.newPw !== pwForm.confirm) { setPwMsg({ type: 'err', text: t('profile.pw_mismatch', language) }); return; }
    setPwSaving(true);
    try {
      const api = (await import('../services/api')).default;
      await api.post('/users/me/change-password', { current_password: pwForm.current, new_password: pwForm.newPw });
      setPwForm({ current: '', newPw: '', confirm: '' });
      setPwMsg({ type: 'ok', text: t('profile.pw_changed_ok', language) });
    } catch {
      setPwMsg({ type: 'err', text: t('profile.pw_changed_err', language) });
    } finally {
      setPwSaving(false);
    }
  };

  const roleBadge: Record<string, string> = {
    admin: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
    manager: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
    technician: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  };

  const inputClass = "w-full border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const themeOptions = [
    { val: 'light' as const, label: t('profile.theme_light', language), icon: 'M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z' },
    { val: 'dark' as const, label: t('profile.theme_dark', language), icon: 'M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z' },
  ] as const;

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('profile.title', language)}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">{t('profile.subtitle', language)}</p>
      </div>

      {/* Profile card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xl font-bold shrink-0">
            {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{user?.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
            <span className={`inline-block mt-1 text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize ${roleBadge[user?.role ?? ''] ?? ''}`}>
              {user?.role}
            </span>
          </div>
        </div>

        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('profile.edit', language)}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('label.name', language)}</label>
            <input
              type="text"
              value={nameForm.name}
              onChange={(e) => setNameForm((f) => ({ ...f, name: e.target.value }))}
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('label.email', language)}</label>
            <input
              type="email"
              value={nameForm.email}
              onChange={(e) => setNameForm((f) => ({ ...f, email: e.target.value }))}
              className={inputClass}
            />
          </div>
          {nameMsg && (
            <p className={`text-xs ${nameMsg.type === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{nameMsg.text}</p>
          )}
          <button
            onClick={() => void handleNameSave()}
            disabled={nameSaving}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {nameSaving ? t('profile.saving', language) : t('profile.save_changes', language)}
          </button>
        </div>
      </div>

      {/* Change password */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('profile.change_password', language)}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('profile.current_password', language)}</label>
            <input
              type="password"
              value={pwForm.current}
              onChange={(e) => setPwForm((f) => ({ ...f, current: e.target.value }))}
              className={inputClass}
              placeholder={t('profile.enter_current_pw', language)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('profile.new_password', language)}</label>
            <input
              type="password"
              value={pwForm.newPw}
              onChange={(e) => setPwForm((f) => ({ ...f, newPw: e.target.value }))}
              className={inputClass}
              placeholder={t('profile.min_6_chars', language)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t('profile.confirm_password', language)}</label>
            <input
              type="password"
              value={pwForm.confirm}
              onChange={(e) => setPwForm((f) => ({ ...f, confirm: e.target.value }))}
              className={inputClass}
              placeholder={t('profile.reenter_pw', language)}
            />
          </div>
          {pwMsg && (
            <p className={`text-xs ${pwMsg.type === 'ok' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>{pwMsg.text}</p>
          )}
          <button
            onClick={() => void handlePasswordChange()}
            disabled={pwSaving || !pwForm.current || !pwForm.newPw || !pwForm.confirm}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            {pwSaving ? t('profile.changing', language) : t('profile.change_password', language)}
          </button>
        </div>
      </div>

      {/* Theme preference */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">{t('profile.appearance', language)}</h3>
        <div className="flex gap-3">
          {themeOptions.map(({ val, label, icon }) => (
            <button
              key={val}
              onClick={() => setTheme(val)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 text-sm font-medium transition-all ${
                theme === val
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                  : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d={icon} />
              </svg>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
