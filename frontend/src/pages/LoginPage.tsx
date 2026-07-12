import { useState } from 'react';
import {
  signInWithPopup,
  AuthError,
} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from '../firebase';
import { profileStorageKey } from '../lib/profile';
import './LoginPage.css';

export function LoginPage() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const hasProfile = Boolean(localStorage.getItem(profileStorageKey(result.user.uid)));
      navigate(hasProfile ? '/' : '/profile', { replace: true });
    } catch (e) {
      const authError = e as AuthError;
      switch (authError.code) {
        case 'auth/popup-closed-by-user':
          // ユーザーがポップアップを閉じた場合は何もしない
          break;
        case 'auth/account-exists-with-different-credential':
          setError('このメールアドレスは、別のログイン方法で既に使用されています。');
          break;
        default:
          setError('ログインに失敗しました。もう一度お試しください。');
          console.error(authError);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <h1>ぽけ先輩</h1>
      <div className="login-container">
        {error && <p className="error-message">{error}</p>}
        <button onClick={handleGoogleLogin} disabled={loading} className="google-login-button">
          {loading ? '処理中...' : 'Googleアカウントでログイン'}
        </button>
        <p className="login-note">大学のGoogleアカウントでログインしてください。</p>
      </div>
    </div>
  );
}
