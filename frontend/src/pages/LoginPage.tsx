import { useState, FormEvent } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  AuthError,
} from 'firebase/auth';
import { auth } from '../firebase';
import './LoginPage.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (isSignUp: boolean) => {
    setLoading(true);
    setError('');
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      // ログイン/新規登録成功後はApp.tsx側で自動的にリダイレクトされる
    } catch (e) {
      const authError = e as AuthError;
      switch (authError.code) {
        case 'auth/invalid-email':
          setError('正しいメールアドレス形式で入力してください。');
          break;
        case 'auth/email-already-in-use':
          setError('このメールアドレスは既に使用されています。');
          break;
        case 'auth/weak-password':
          setError('パスワードは6文字以上で入力してください。');
          break;
        case 'auth/invalid-credential':
          setError('メールアドレスまたはパスワードが間違っています。');
          break;
        default:
          setError('エラーが発生しました。もう一度お試しください。');
          console.error(authError);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
  };

  return (
    <div className="login-page">
      <h1>ぽけ先輩</h1>
      <form onSubmit={handleSubmit} className="login-form">
        <div className="input-group">
          <label htmlFor="email">メールアドレス</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="input-group">
          <label htmlFor="password">パスワード</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-message">{error}</p>}
        <div className="button-group">
          <button onClick={() => handleAuth(false)} disabled={loading} className="login-button">
            {loading ? '処理中...' : 'ログイン'}
          </button>
          <button onClick={() => handleAuth(true)} disabled={loading} className="signup-button">
            {loading ? '処理中...' : '新規登録'}
          </button>
        </div>
      </form>
    </div>
  );
}