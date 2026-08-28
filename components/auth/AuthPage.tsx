import React, { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';
import { supabase } from '../../services/supabase';

const RocketIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.63 2.18a14.98 14.98 0 00-2.17 6.16m5.84 2.58v-4.8m-5.84 4.8m5.84-4.8L9.63 2.18m-2.17 6.16a14.98 14.98 0 00-6.16 12.12 14.98 14.98 0 0012.12 6.16" />
    </svg>
);

const ArrowRightOnRectangleIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
    </svg>
);

const PaperAirplaneIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>;

const EyeIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const EyeSlashIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" /></svg>;


interface AuthPageProps {
  notification?: string | null;
  onClearNotification?: () => void;
  onSetNotification: (message: string | null) => void;
}

type FormMode = 'login' | 'register' | 'resetPassword';

const AuthPage: React.FC<AuthPageProps> = ({ notification, onClearNotification, onSetNotification }) => {
  const [formMode, setFormMode] = useState<FormMode>('login');
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const clearNotifications = () => {
    if (onClearNotification) onClearNotification();
    if (error) setError(null);
  };
  
  const handleLoginOrRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();
    setIsLoading(true);

    if (!email || (formMode !== 'resetPassword' && !password) || (formMode === 'register' && !name)) {
        setError("Please fill in all required fields.");
        setIsLoading(false);
        return;
    }

    if (formMode === 'login') {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message === 'Invalid login credentials') {
            setError('Invalid credentials. Please double-check your email and password.');
        } else {
            setError(error.message);
        }
        setIsLoading(false);
      }
      // On success, the onAuthStateChange listener in App.tsx handles the state change.
    } else { // register
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
          },
        }
      });
      if (error) {
        setError(error.message);
        setIsLoading(false);
      }
      // On success, the onAuthStateChange listener handles the automatic sign-in.
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    clearNotifications();
    setIsLoading(true);
    
    if (!email) {
        setError("Please enter your email address.");
        setIsLoading(false);
        return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin, // Redirect back to the app after password update
    });

    if (error) {
        setError(error.message);
    } else {
        onSetNotification("Password reset email sent. Please check your inbox.");
        setFormMode('login');
    }
    setIsLoading(false);
  };
  
  const getTitle = () => {
    switch(formMode) {
      case 'login': return 'Sign in to your account';
      case 'register': return 'Create a new account';
      case 'resetPassword': return 'Reset your password';
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
            <RocketIcon className="mx-auto h-12 w-auto text-brand-500" />
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            {getTitle()}
          </h2>
        </div>
        <Card className="p-8 space-y-6 !shadow-2xl">
          {notification && (
            <div className="p-4 text-sm text-green-800 rounded-lg bg-green-50 dark:bg-gray-800 dark:text-green-400" role="alert">
              {notification}
            </div>
          )}

          {formMode === 'resetPassword' ? (
             <form className="space-y-6" onSubmit={handlePasswordReset}>
                <p className="text-sm text-gray-600 dark:text-gray-400">Enter your email address and we will send you a link to reset your password.</p>
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="Email address" required value={email} onChange={e => { setEmail(e.target.value); clearNotifications(); }} />
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                <div>
                  <Button type="submit" className="w-full" isLoading={isLoading}>
                     <PaperAirplaneIcon className="h-5 w-5 mr-2" />
                     Send Reset Link
                  </Button>
                </div>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={handleLoginOrRegister}>
                {formMode === 'register' && <Input id="name" name="name" type="text" placeholder="Full Name" required value={name} onChange={e => { setName(e.target.value); clearNotifications(); }} />}
                <Input id="email" name="email" type="email" autoComplete="email" placeholder="Email address" required value={email} onChange={e => { setEmail(e.target.value); clearNotifications(); }} />
                <Input 
                    id="password" 
                    name="password" 
                    type={showPassword ? 'text' : 'password'} 
                    autoComplete="current-password" 
                    placeholder="Password" 
                    required 
                    value={password} 
                    onChange={e => { setPassword(e.target.value); clearNotifications(); }}
                    iconRight={showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                    onIconRightClick={() => setShowPassword(!showPassword)}
                />
                
                {formMode === 'login' && (
                    <div className="text-right text-sm">
                        <button type="button" onClick={() => { setFormMode('resetPassword'); clearNotifications(); }} className="font-medium text-brand-500 hover:text-brand-400">
                            Forgot password?
                        </button>
                    </div>
                )}
                
                {error && <p className="text-red-500 text-sm text-center">{error}</p>}

                <div>
                  <Button type="submit" className="w-full" isLoading={isLoading}>
                     <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
                    {formMode === 'login' ? 'Sign In' : 'Register'}
                  </Button>
                </div>
            </form>
          )}

          <p className="text-center text-sm text-gray-600 dark:text-gray-400">
            {formMode === 'login' && "Don't have an account?"}
            {formMode === 'register' && "Already have an account?"}
            {formMode === 'resetPassword' && "Remembered your password?"}
            <button onClick={() => { setFormMode(formMode === 'login' ? 'register' : 'login'); clearNotifications(); }} className="font-medium text-brand-500 hover:text-brand-400 ml-1">
                {formMode === 'login' ? 'Register' : 'Sign In'}
            </button>
          </p>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;