import React, { useState } from 'react';
import { supabase } from '../../services/supabase';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Card from '../ui/Card';

interface UpdatePasswordPageProps {
  onSuccess: () => void;
}

const KeyIcon: React.FC<{className?: string}> = ({className}) => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
    </svg>
);

const EyeIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const EyeSlashIcon: React.FC<{className?: string}> = ({className}) => <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={className}><path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.243 4.243l-4.243-4.243" /></svg>;


const UpdatePasswordPage: React.FC<UpdatePasswordPageProps> = ({ onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    
    setIsLoading(true);

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      // Sign out of the recovery session before calling onSuccess
      await supabase.auth.signOut();
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <div className="w-full max-w-md space-y-8">
            <div className="text-center">
                <KeyIcon className="mx-auto h-12 w-auto text-brand-500" />
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
                    Update Your Password
                </h2>
            </div>
            <Card className="p-8 space-y-6 !shadow-2xl">
                <p className="text-sm text-center text-gray-600 dark:text-gray-400">
                    You have successfully verified your identity. Please enter a new password below.
                </p>
                <form className="space-y-6" onSubmit={handleSubmit}>
                    <Input
                        id="new-password"
                        name="new-password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="New Password"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        iconRight={showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        onIconRightClick={() => setShowPassword(!showPassword)}
                    />
                    <Input
                        id="confirm-password"
                        name="confirm-password"
                        type={showConfirmPassword ? 'text' : 'password'}
                        placeholder="Confirm New Password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        iconRight={showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                        onIconRightClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    />
                    {error && <p className="text-red-500 text-sm text-center">{error}</p>}
                    <div>
                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Update Password
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    </div>
  );
};

export default UpdatePasswordPage;