import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import { CampaignerLogoIcon } from '../ui/CampaignerLogo';

interface AuthPageProps {
  notification?: string | null;
  onClearNotification?: () => void;
  onSetNotification: (message: string | null) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ 
  notification, 
  onClearNotification, 
  onSetNotification: _onSetNotification 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [nameOrEmail, setNameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const clearNotifications = () => {
    if (onClearNotification) onClearNotification();
    if (error) setError(null);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();
    setIsLoading(true);

    const identifier = nameOrEmail.trim();

    if (!identifier || !password) {
      setError('Please enter your name or email and password.');
      setIsLoading(false);
      return;
    }

    // Support email input or fallback domain if entered as a username
    const effectiveEmail = identifier.includes('@') 
      ? identifier 
      : `${identifier.toLowerCase().replace(/\s+/g, '')}@example.com`;

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: effectiveEmail,
      password,
    });

    if (signInError) {
      if (signInError.message === 'Invalid login credentials') {
        setError('Invalid login credentials. Please check your details.');
      } else {
        setError(signInError.message);
      }
      setIsLoading(false);
    } else {
      const welcomeName = 
        signInData.user?.user_metadata?.full_name || 
        (identifier.includes('@') ? identifier.split('@')[0] : identifier) || 
        'User';
      _onSetNotification(`Welcome back, ${welcomeName}!`);
    }
  };

  return (
    <div className="min-h-[100dvh] w-full relative flex items-center justify-center p-3 sm:p-5 overflow-hidden select-none bg-slate-950">
      {/* Background Image Layer matching the uploaded digital analytics visual */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <picture>
          <source 
            media="(min-width: 640px)" 
            srcSet="/src/assets/images/login_tech_bg_wide_1789035566121.jpg" 
          />
          <img 
            src="/src/assets/images/login_digital_tablet_bg_1789035545057.jpg" 
            alt="Digital analytics tablet background"
            className="w-full h-full object-cover object-center sm:object-right md:object-center brightness-90 contrast-105"
            referrerPolicy="no-referrer"
          />
        </picture>
        {/* Subtle dark gradient overlay ensuring high card contrast and optical hierarchy */}
        <div className="absolute inset-0 bg-slate-950/45 backdrop-blur-[2px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-slate-950/60" />
      </div>

      {/* Mobile Card Container strictly matching the attached reference design, fitted perfectly for the viewport */}
      <div className="relative z-10 w-full max-w-[360px] sm:max-w-[380px] bg-[#18202c]/95 backdrop-blur-md rounded-[28px] sm:rounded-[32px] overflow-hidden shadow-2xl border border-gray-800/80 flex flex-col my-auto">
        
        {/* Top Architectural Skyscraper Header with angled cut and diagonal ribbon */}
        <div className="relative w-full h-48 sm:h-56 overflow-hidden bg-black flex-shrink-0">
          {/* Angled Skyscraper Image */}
          <div 
            className="w-full h-full relative"
            style={{ clipPath: 'polygon(0 0, 100% 0, 100% 74%, 0 100%)' }}
          >
            <img 
              src="/src/assets/images/monochrome_skyscrapers_1789034967776.jpg" 
              alt="City Skyscraper Architecture"
              className="w-full h-full object-cover grayscale contrast-125 brightness-95"
              referrerPolicy="no-referrer"
            />
            {/* Subtle dark gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/50 pointer-events-none" />

            {/* Signature Emerald Diagonal Slash Ribbon */}
            <div 
              className="absolute -left-12 top-20 sm:top-24 w-[150%] h-6 sm:h-7 bg-[#0b7b50] shadow-xl pointer-events-none transform -rotate-[20deg] origin-center"
            />
          </div>
        </div>

        {/* Login Form Body */}
        <div className="px-6 sm:px-7 pt-1 pb-7 sm:pb-8 flex flex-col -mt-4 z-10">
          {/* Brand Logo Emblem */}
          <div className="flex justify-center mb-2.5">
            <CampaignerLogoIcon size={44} badge={true} idPrefix="auth-logo" className="shadow-lg shadow-emerald-950/40" />
          </div>

          {/* Heading */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white text-center tracking-tight">
            Login
          </h1>
          <p className="text-[#0b7b50] dark:text-emerald-400 text-xs sm:text-sm font-medium text-center mt-1 sm:mt-1.5 mb-5 sm:mb-6">
            Sign in to continue.
          </p>

          {/* Feedback messages */}
          {error && (
            <div className="mb-4 p-2.5 text-xs text-red-200 bg-red-950/70 border border-red-800/80 rounded-xl text-center">
              {error}
            </div>
          )}
          {notification && (
            <div className="mb-4 p-2.5 text-xs text-emerald-200 bg-[#0b7b50]/20 border border-[#0b7b50]/40 rounded-xl text-center">
              {notification}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            {/* NAME / EMAIL field */}
            <div>
              <label 
                htmlFor="name" 
                className="block text-[10px] sm:text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-1.5 px-1 text-left"
              >
                NAME
              </label>
              <input
                id="name"
                name="name"
                type="text"
                autoComplete="email"
                required
                value={nameOrEmail}
                onChange={(e) => {
                  setNameOrEmail(e.target.value);
                  clearNotifications();
                }}
                placeholder="Jiara Martins"
                className="w-full bg-[#11161f] text-white placeholder-gray-500 rounded-2xl px-4 sm:px-5 py-3 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#0b7b50] border border-gray-800 transition-all shadow-inner"
              />
            </div>

            {/* PASSWORD field */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-[10px] sm:text-[11px] font-semibold text-gray-300 uppercase tracking-widest mb-1.5 px-1 text-left"
              >
                PASSWORD
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearNotifications();
                }}
                placeholder="******"
                className="w-full bg-[#11161f] text-white placeholder-gray-500 rounded-2xl px-4 sm:px-5 py-3 text-xs sm:text-sm font-normal focus:outline-none focus:ring-2 focus:ring-[#0b7b50] border border-gray-800 transition-all shadow-inner tracking-wider"
              />
            </div>

            {/* Log in Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0b7b50] hover:bg-[#09734a] active:bg-[#07603d] text-white font-bold text-sm sm:text-base py-3 sm:py-3.5 rounded-2xl shadow-lg shadow-[#0b7b50]/25 transition-all flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5 text-white" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                    </svg>
                    Logging in...
                  </span>
                ) : (
                  'Log in'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
