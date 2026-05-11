import { useState } from 'react';
import {
  startRegistration,
  startAuthentication,
} from '@simplewebauthn/browser';
import api from '../services/api';

export function usePasskeyRegister() {
  const [status, setStatus] = useState('idle'); // idle | loading | success | error
  const [message, setMessage] = useState('');

  const register = async (registerToken) => {
    setStatus('loading');
    setMessage('');
    try {
      const optRes = await api.post('/webauthn/register/options', { token: registerToken });
      const attResp = await startRegistration(optRes.data);
      const verRes = await api.post('/webauthn/register/verify', {
        token: registerToken,
        response: attResp,
      });
      setStatus('success');
      setMessage(verRes.data.message || 'Passkey registered!');
      return true;
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Registration failed';
      setStatus('error');
      setMessage(msg);
      return false;
    }
  };

  return { register, status, message, setStatus };
}

export function usePasskeyAuth() {
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);

  const authenticate = async (checkinToken) => {
    setStatus('loading');
    setMessage('');
    setResult(null);
    try {
      const optRes = await api.post('/webauthn/auth/options', { token: checkinToken });
      const { employeeId, ...authOptions } = optRes.data;

      const assertResp = await startAuthentication(authOptions);

      const verRes = await api.post('/webauthn/auth/verify', {
        token: checkinToken,
        response: assertResp,
        employeeId,
      });

      setStatus('success');
      setMessage(verRes.data.message);
      setResult(verRes.data);
      return verRes.data;
    } catch (err) {
      const msg =
        err?.response?.data?.error ||
        err?.message ||
        'Authentication failed';
      setStatus('error');
      setMessage(msg);
      return null;
    }
  };

  return { authenticate, status, message, result, setStatus };
}
