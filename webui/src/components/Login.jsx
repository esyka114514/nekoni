import { useState } from 'react';
import { login, setToken } from '../api';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await login(key);
      if (response.data.token === 'no-auth-required') {
        navigate('/');
      } else {
        setToken(response.data.token);
        navigate('/');
      }
    } catch (err) {
      setError(err.response?.data?.error || '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Nekoni WebUI</h1>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>认证密钥</label>
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="请输入 token"
              autoFocus
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <button type="submit" disabled={loading} className="login-btn">
            {loading ? '登录中...' : '登录'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
