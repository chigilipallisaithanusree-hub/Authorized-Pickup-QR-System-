// 1. All Imports strictly at the absolute top of the file
import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail 
} from 'firebase/auth';
import { auth } from '../firebase';

const API_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

// 2. Initialize the Context
const AuthContext = createContext(null);

// 3. Define the Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const isLoggingInRef = useRef(false);

  const [isMock, setIsMock] = useState(() => {
    const searchParams = new URLSearchParams(window.location.search);
    if (searchParams.has('mock')) {
      const mockParam = searchParams.get('mock');
      if (mockParam === 'true') {
        localStorage.setItem('use_mock_auth', 'true');
        return true;
      } else {
        localStorage.setItem('use_mock_auth', 'false');
        return false;
      }
    }
    // Fall back to Mock Mode if Firebase API Key is not set in environment (e.g., on Vercel deployment without env vars)
    const hasFirebase = !!process.env.REACT_APP_FIREBASE_API_KEY;
    if (!hasFirebase) {
      localStorage.setItem('use_mock_auth', 'true');
      return true;
    }
    return localStorage.getItem('use_mock_auth') === 'true';
  });

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  useEffect(() => {
    if (isMock) {
      const localToken = localStorage.getItem('token');
      const localUser = localStorage.getItem('user');
      
      const verifyLocalSession = async () => {
        if (localToken && localUser) {
          try {
            const response = await fetch(`${API_URL}/api/auth/profile`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${localToken}`,
                'Content-Type': 'application/json'
              }
            });
            const data = await response.json();
            if (response.ok) {
              setUser(data.user);
              setToken(localToken);
            } else {
              clearSession();
            }
          } catch (err) {
            console.error("Local session verification error:", err);
            clearSession();
          }
        } else {
          clearSession();
        }
        setLoading(false);
      };
      
      verifyLocalSession();
    } else {
      // Monitor Firebase Auth state
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (isLoggingInRef.current) {
          return;
        }
        setLoading(true);
        if (firebaseUser) {
          try {
            const idToken = await firebaseUser.getIdToken();
            const storedToken = localStorage.getItem('token');
            const storedUser = localStorage.getItem('user');
            if (storedToken === idToken && storedUser) {
              setUser(JSON.parse(storedUser));
              setToken(idToken);
              setLoading(false);
              return;
            }
            const response = await fetch(`${API_URL}/api/auth/profile`, {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${idToken}`,
                'Content-Type': 'application/json'
              }
            });
            const data = await response.json();
            
            if (response.ok) {
              setUser(data.user);
              setToken(idToken);
              localStorage.setItem('token', idToken);
              localStorage.setItem('user', JSON.stringify(data.user));
            } else {
              clearSession();
              await signOut(auth);
            }
          } catch (err) {
            console.error("Firebase session verification error:", err);
            clearSession();
            await signOut(auth);
          }
        } else {
          clearSession();
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [isMock]);

  const toggleAuthMode = (newMode) => {
    setIsMock(newMode);
    localStorage.setItem('use_mock_auth', newMode ? 'true' : 'false');
    clearSession();
    navigate('/login');
  };

  const login = async (email, password, selectedRole) => {
    setLoading(true);
    try {
      if (isMock) {
        const response = await fetch(`${API_URL}/api/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, password, role: selectedRole })
        });
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Invalid credentials or role.');
        }
        
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        const userRole = data.user.role.toLowerCase();
        if (userRole === 'parent') navigate('/parent/dashboard');
        else if (userRole === 'teacher') navigate('/teacher/dashboard');
        else if (userRole === 'admin') navigate('/admin/dashboard');
        
        return { success: true };
      } else {
        isLoggingInRef.current = true;
        let userCredential;
        let idToken;
        let data;
        let success = false;
        
        try {
          userCredential = await signInWithEmailAndPassword(auth, email, password);
          const firebaseUser = userCredential.user;
          idToken = await firebaseUser.getIdToken();
          
          const response = await fetch(`${API_URL}/api/auth/profile`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${idToken}`,
              'Content-Type': 'application/json'
            }
          });
          data = await response.json();
          if (response.ok) {
            success = true;
          } else {
            await signOut(auth);
          }
        } catch (fbErr) {
          console.warn("Firebase authentication failed. Attempting mock fallback...", fbErr);
        }
        
        if (success) {
          setUser(data.user);
          setToken(idToken);
          localStorage.setItem('token', idToken);
          localStorage.setItem('user', JSON.stringify(data.user));
          
          const userRole = data.user.role.toLowerCase();
          if (userRole === 'parent') navigate('/parent/dashboard');
          else if (userRole === 'teacher') navigate('/teacher/dashboard');
          else if (userRole === 'admin') navigate('/admin/dashboard');
          
          return { success: true };
        } else {
          // Attempt Mock Fallback
          const response = await fetch(`${API_URL}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password, role: selectedRole })
          });
          const mockData = await response.json();
          
          if (!response.ok) {
            throw new Error(mockData.error || 'Invalid credentials or role.');
          }
          
          // Switch to mock mode automatically
          setIsMock(true);
          localStorage.setItem('use_mock_auth', 'true');
          
          setUser(mockData.user);
          setToken(mockData.token);
          localStorage.setItem('token', mockData.token);
          localStorage.setItem('user', JSON.stringify(mockData.user));
          
          const userRole = mockData.user.role.toLowerCase();
          if (userRole === 'parent') navigate('/parent/dashboard');
          else if (userRole === 'teacher') navigate('/teacher/dashboard');
          else if (userRole === 'admin') navigate('/admin/dashboard');
          
          return { success: true };
        }
      }
    } catch (err) {
      console.error("Login failed:", err);
      return { success: false, error: err.message };
    } finally {
      isLoggingInRef.current = false;
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      if (!isMock) {
        await signOut(auth);
      }
      clearSession();
      navigate('/login');
      return { success: true };
    } catch (err) {
      console.error("Logout failed:", err);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, fullName, selectedRole) => {
    setLoading(true);
    try {
      if (isMock) {
        const response = await fetch(`${API_URL}/api/auth/mock-register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, role: selectedRole, fullName, password })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Registration failed.');
        }
        
        setUser(data.user);
        setToken(data.token);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        const userRole = data.user.role.toLowerCase();
        if (userRole === 'parent') navigate('/parent/dashboard');
        else if (userRole === 'teacher') navigate('/teacher/dashboard');
        else if (userRole === 'admin') navigate('/admin/dashboard');
        
        return { success: true };
      } else {
        isLoggingInRef.current = true;
        const checkResponse = await fetch(`${API_URL}/api/auth/register-check`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, role: selectedRole })
        });
        const checkData = await checkResponse.json();
        if (!checkResponse.ok) {
          throw new Error(checkData.error || 'Registration authorization failed.');
        }
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        const linkResponse = await fetch(`${API_URL}/api/auth/register-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, firebaseUid: firebaseUser.uid, fullName })
        });
        const linkData = await linkResponse.json();
        if (!linkResponse.ok) {
          await firebaseUser.delete();
          throw new Error(linkData.error || 'Failed to link account.');
        }
        
        setUser(linkData.user);
        const idToken = await firebaseUser.getIdToken();
        setToken(idToken);
        localStorage.setItem('token', idToken);
        localStorage.setItem('user', JSON.stringify(linkData.user));
        
        const userRole = linkData.user.role.toLowerCase();
        if (userRole === 'parent') navigate('/parent/dashboard');
        else if (userRole === 'teacher') navigate('/teacher/dashboard');
        else if (userRole === 'admin') navigate('/admin/dashboard');
        
        return { success: true };
      }
    } catch (err) {
      console.error("Registration failed:", err);
      return { success: false, error: err.message };
    } finally {
      isLoggingInRef.current = false;
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      if (isMock) {
        return { success: true, message: "Mock password reset email sent successfully." };
      } else {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: "Password reset email sent successfully. Please check your inbox." };
      }
    } catch (err) {
      console.error("Password reset failed:", err);
      return { success: false, error: err.message };
    }
  };

  const value = {
    user,
    token,
    isMock,
    loading,
    login,
    logout,
    register,
    resetPassword,
    toggleAuthMode
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

// 4. Reusable Custom Hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
