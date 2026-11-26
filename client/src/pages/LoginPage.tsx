import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Shuffle } from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '../layouts/MainLayout';
import { Button } from '../components/common/Button';
import { Avatar } from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import {
  AVATAR_PREFIX,
  CharacterAvatarPicker,
  HERO_CHARACTERS,
  getCharacterByAvatarValue,
} from '../components/common/CharacterMarks';
import { userService } from '../services/user.service';
import { getApiErrorMessage } from '../services/api';

interface LoginValues {
  email: string;
  password: string;
}

interface RegisterValues {
  fullName: string;
  email: string;
  department: string;
  course: string;
  yearOfStudy: string;
  password: string;
  confirmPassword: string;
}

export const LoginPage: React.FC<{ initialTab?: 'signin' | 'signup' }> = ({
  initialTab = 'signin',
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, hasAnyLeadership, user, login, register: registerAccount, refreshSession } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup'>(initialTab);
  const [submitting, setSubmitting] = useState(false);
  const [selectedSignupAvatar, setSelectedSignupAvatar] = useState<string>(
    () => `${AVATAR_PREFIX}${HERO_CHARACTERS[Math.floor(Math.random() * HERO_CHARACTERS.length)].id}`
  );
  const [selectedLoginAvatar, setSelectedLoginAvatar] = useState<string | null>(null);

  const activeAvatar = tab === 'signup' ? selectedSignupAvatar : selectedLoginAvatar;
  const activeSpec = activeAvatar ? getCharacterByAvatarValue(activeAvatar) : null;

  const handleAvatarSelect = (val: string | null) => {
    if (tab === 'signup') {
      if (val) setSelectedSignupAvatar(val);
    } else {
      setSelectedLoginAvatar(val);
    }
  };

  const handleShuffleAvatar = () => {
    const others = HERO_CHARACTERS.filter((c) => `${AVATAR_PREFIX}${c.id}` !== activeAvatar);
    const pick = others[Math.floor(Math.random() * others.length)] ?? HERO_CHARACTERS[0];
    handleAvatarSelect(`${AVATAR_PREFIX}${pick.id}`);
  };

  const explicitFrom = (location.state as { from?: string } | null)?.from;
  const from = explicitFrom || '/dashboard';

  const hasMemberOnly =
    user?.memberships.some((m) => m.status === 'ACTIVE' && m.role === 'MEMBER') ?? false;
  const showPortalChooser =
    isAuthenticated && hasAnyLeadership && !explicitFrom && (hasMemberOnly || user?.globalRole === 'SUPER_ADMIN');

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (explicitFrom) {
      navigate(explicitFrom, { replace: true });
      return;
    }
    if (hasAnyLeadership && !hasMemberOnly && user?.globalRole !== 'SUPER_ADMIN') {
      navigate('/president', { replace: true });
      return;
    }
    if (!hasAnyLeadership) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, explicitFrom, hasAnyLeadership, hasMemberOnly, user?.globalRole, navigate]);

  const loginForm = useForm<LoginValues>();
  const registerForm = useForm<RegisterValues>();
  const passwordVal = registerForm.watch('password');

  const onLogin = async (values: LoginValues) => {
    setSubmitting(true);
    try {
      let signedUser = await login(values);
      if (selectedLoginAvatar) {
        signedUser = await userService.updateProfile({ profileImage: selectedLoginAvatar });
        await refreshSession();
      }
      toast.success('Signed in successfully');
      if (explicitFrom) {
        navigate(explicitFrom, { replace: true });
        return;
      }
      const isLeader =
        signedUser.globalRole === 'SUPER_ADMIN' ||
        signedUser.memberships.some(
          (m) =>
            m.status === 'ACTIVE' &&
            ['PRESIDENT', 'VICE_PRESIDENT', 'SECRETARY', 'TREASURER', 'COORDINATOR'].includes(
              m.role
            )
        );
      const hasPlainMember = signedUser.memberships.some(
        (m) => m.status === 'ACTIVE' && m.role === 'MEMBER'
      );
      if (isLeader && !hasPlainMember && signedUser.globalRole !== 'SUPER_ADMIN') {
        navigate('/president', { replace: true });
      } else if (!isLeader) {
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Invalid email or password'));
    } finally {
      setSubmitting(false);
    }
  };

  const onRegister = async (values: RegisterValues) => {
    setSubmitting(true);
    try {
      await registerAccount({ ...values, profileImage: selectedSignupAvatar });
      toast.success('Account created! Welcome to ClubConnect.');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getApiErrorMessage(err, 'Could not create account'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MainLayout>
      <section className="py-12 sm:py-16">
        <div className="max-w-md mx-auto px-4">
          <div className="text-center mb-8">
            <CharacterAvatarPicker
              selectedValue={activeAvatar}
              onSelect={handleAvatarSelect}
              allowDeselect={tab === 'signin'}
              size={44}
              className="mb-3"
            />
            <div className="mb-3 flex items-center justify-center gap-2 text-[12px] text-[#615d59]">
              {tab === 'signup' ? (
                <>
                  <span>
                    Avatar: <strong className="text-black">{activeSpec?.label ?? 'Scholar'}</strong>
                  </span>
                  <button
                    type="button"
                    onClick={handleShuffleAvatar}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-black/10 text-[11px] font-medium text-black hover:bg-[#f6f5f4] transition-colors cursor-pointer"
                  >
                    <Shuffle className="w-3 h-3" />
                    Shuffle
                  </button>
                </>
              ) : selectedLoginAvatar ? (
                <>
                  <span>
                    Switching to <strong className="text-black">{activeSpec?.label}</strong> on sign-in
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedLoginAvatar(null)}
                    className="underline hover:text-black cursor-pointer"
                  >
                    Clear
                  </button>
                </>
              ) : (
                <span>Click any avatar above to rock a new vibe on sign-in</span>
              )}
            </div>
            <h1 className="text-[32px] font-bold text-black tracking-[-0.03em]">
              {tab === 'signin' ? 'Sign in to ClubConnect' : 'Create your ClubConnect account'}
            </h1>
            <p className="mt-1.5 text-[14px] text-[#615d59]">
              Authenticated via secure HTTP-only cookies and PostgreSQL.
            </p>
          </div>

          <div className="notion-card p-6 sm:p-8">
            {showPortalChooser ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <Avatar
                    initials={(user?.fullName || 'CC').slice(0, 2).toUpperCase()}
                    profileImage={user?.profileImage}
                    seed={user?.id || user?.fullName}
                    size="lg"
                  />
                  <div>
                    <h2 className="text-[20px] font-bold text-black">Choose your portal</h2>
                    <p className="mt-0.5 text-[13px] text-[#615d59]">
                      Signed in as {user?.fullName} — pick where to start.
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => navigate('/president', { replace: true })}
                    className="w-full text-left p-4 rounded-[10px] border border-[#0075de]/30 bg-[#e6f3fe]/45 hover:bg-[#e6f3fe] transition-colors cursor-pointer"
                  >
                    <div className="text-[15px] font-bold text-[#0075de]">Open President Portal</div>
                    <div className="mt-0.5 text-[13px] text-[#615d59]">
                      Manage members, verify contributions, coordinate events, and view analytics.
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('/dashboard', { replace: true })}
                    className="w-full text-left p-4 rounded-[10px] border border-black/[0.08] bg-[#faf9f8] hover:bg-[#f6f5f4] transition-colors cursor-pointer"
                  >
                    <div className="text-[15px] font-bold text-black">Open Member Portal</div>
                    <div className="mt-0.5 text-[13px] text-[#615d59]">
                      Track personal tasks, event RSVPs, applications, and contributions.
                    </div>
                  </button>
                </div>
              </div>
            ) : (
              <>
            <div className="grid grid-cols-2 gap-1 rounded-[8px] bg-[#f6f5f4] p-1 mb-6">
              <button
                type="button"
                onClick={() => setTab('signin')}
                className={`py-2 rounded-[6px] text-[14px] font-medium cursor-pointer transition-colors ${
                  tab === 'signin' ? 'bg-white text-black' : 'text-[#615d59] hover:text-black'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => setTab('signup')}
                className={`py-2 rounded-[6px] text-[14px] font-medium cursor-pointer transition-colors ${
                  tab === 'signup' ? 'bg-white text-black' : 'text-[#615d59] hover:text-black'
                }`}
              >
                Create Account
              </button>
            </div>

            {tab === 'signin' ? (
              <form onSubmit={loginForm.handleSubmit(onLogin)} className="space-y-4">
                <div>
                  <label htmlFor="login-email" className="block text-[13px] font-medium mb-1">
                    Email *
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    {...loginForm.register('email', { required: 'Email is required' })}
                    className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-[12px] text-[#e32d14]">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="login-password" className="block text-[13px] font-medium mb-1">
                    Password *
                  </label>
                  <input
                    id="login-password"
                    type="password"
                    autoComplete="current-password"
                    {...loginForm.register('password', { required: 'Password is required' })}
                    className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                  />
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-[12px] text-[#e32d14]">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button variant="primary" size="lg" type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            ) : (
              <form onSubmit={registerForm.handleSubmit(onRegister)} className="space-y-4">
                <div>
                  <label htmlFor="reg-name" className="block text-[13px] font-medium mb-1">
                    Full Name *
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    {...registerForm.register('fullName', { required: 'Full name is required' })}
                    className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                  />
                  {registerForm.formState.errors.fullName && (
                    <p className="mt-1 text-[12px] text-[#e32d14]">
                      {registerForm.formState.errors.fullName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-[13px] font-medium mb-1">
                    Campus Email *
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    {...registerForm.register('email', {
                      required: 'Email is required',
                      pattern: { value: /\S+@\S+\.\S+/, message: 'Enter a valid email' },
                    })}
                    className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                  />
                  {registerForm.formState.errors.email && (
                    <p className="mt-1 text-[12px] text-[#e32d14]">
                      {registerForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label htmlFor="reg-dept" className="block text-[12px] font-medium mb-1">
                      Department *
                    </label>
                    <input
                      id="reg-dept"
                      type="text"
                      placeholder="CS"
                      {...registerForm.register('department', { required: 'Required' })}
                      className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[13px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-course" className="block text-[12px] font-medium mb-1">
                      Course *
                    </label>
                    <input
                      id="reg-course"
                      type="text"
                      placeholder="B.Tech"
                      {...registerForm.register('course', { required: 'Required' })}
                      className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[13px]"
                    />
                  </div>
                  <div>
                    <label htmlFor="reg-year" className="block text-[12px] font-medium mb-1">
                      Year *
                    </label>
                    <input
                      id="reg-year"
                      type="text"
                      placeholder="2nd Year"
                      {...registerForm.register('yearOfStudy', { required: 'Required' })}
                      className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[13px]"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="reg-pass" className="block text-[13px] font-medium mb-1">
                    Password * (8+ chars, upper, lower, number)
                  </label>
                  <input
                    id="reg-pass"
                    type="password"
                    {...registerForm.register('password', {
                      required: 'Password is required',
                      minLength: { value: 8, message: 'At least 8 characters' },
                      validate: (v) =>
                        (/[A-Z]/.test(v) && /[a-z]/.test(v) && /[0-9]/.test(v)) ||
                        'Include uppercase, lowercase, and a number',
                    })}
                    className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                  />
                  {registerForm.formState.errors.password && (
                    <p className="mt-1 text-[12px] text-[#e32d14]">
                      {registerForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <div>
                  <label htmlFor="reg-confirm" className="block text-[13px] font-medium mb-1">
                    Confirm Password *
                  </label>
                  <input
                    id="reg-confirm"
                    type="password"
                    {...registerForm.register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: (v) => v === passwordVal || 'Passwords do not match',
                    })}
                    className="w-full px-3 py-2 rounded-[8px] border border-black/15 text-[14px]"
                  />
                  {registerForm.formState.errors.confirmPassword && (
                    <p className="mt-1 text-[12px] text-[#e32d14]">
                      {registerForm.formState.errors.confirmPassword.message}
                    </p>
                  )}
                </div>

                <Button variant="primary" size="lg" type="submit" disabled={submitting} className="w-full">
                  {submitting ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            )}
              </>
            )}
          </div>
        </div>
      </section>
    </MainLayout>
  );
};
