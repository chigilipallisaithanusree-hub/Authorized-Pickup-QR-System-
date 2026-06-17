import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from 'firebase/auth';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

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
    // Default to Production Mode permanently (Firebase Authentication)
    localStorage.setItem('use_mock_auth', 'false');
    return false;
  });

  useEffect(() => {
    if (isMock) {
      // Offline/Mock mode: Retrieve session from local storage and verify with backend
      const localToken = localStorage.getItem('token');
      const localUser = localStorage.getItem('user');
      
      const verifyLocalSession = async () => {
        if (localToken && localUser) {
          try {
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
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
      return () => {};
    } else {
      // Monitor Firebase Auth state changes
      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        setLoading(true);
        if (firebaseUser) {
          try {
            // Retrieve fresh Firebase ID Token
            const idToken = await firebaseUser.getIdToken(true);
            
            // Fetch user details and role from Flask/MySQL backend
            const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
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
              console.error("Failed to load user role from database:", data.error);
              await signOut(auth);
              clearSession();
            }
          } catch (err) {
            console.error("Auth state synchronization error:", err);
            clearSession();
          }
        } else {
          clearSession();
        }
        setLoading(false);
      });

      return () => unsubscribe();
    }
  }, [isMock]);

  const clearSession = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const toggleMockMode = () => {
    const newMode = !isMock;
    setIsMock(newMode);
    localStorage.setItem('use_mock_auth', newMode ? 'true' : 'false');
    clearSession();
    navigate('/login');
  };

  const login = async (email, password, selectedRole) => {
    setLoading(true);
    try {
      if (isMock) {
        // 1. Direct local login to backend (skipping Firebase)
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/login`, {
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
        
        // Redirect based on lowercase role representation
        const userRole = data.user.role.toLowerCase();
        if (userRole === 'parent') navigate('/parent/dashboard');
        else if (userRole === 'teacher') navigate('/teacher/dashboard');
        else if (userRole === 'admin') navigate('/admin/dashboard');
        
        return { success: true };
      } else {
        // 1. Authenticate with Firebase Authentication
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // 2. Fetch fresh token
        const idToken = await firebaseUser.getIdToken(true);
        
        // 3. Query Flask backend to resolve role permissions
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/profile`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
        });
        const data = await response.json();
        
        if (!response.ok) {
          await signOut(auth);
          throw new Error(data.error || 'Failed to authenticate with backend.');
        }
        
        // 4. Verify user has the role selected in the UI dropdown/tabs (enforcing case-insensitive check)
        if (data.user.role.toLowerCase() !== selectedRole.toLowerCase()) {
          await signOut(auth);
          throw new Error(`Forbidden: This account does not possess the '${selectedRole}' role.`);
        }
        
        setUser(data.user);
        setToken(idToken);
        localStorage.setItem('token', idToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect based on lowercase role representation
        const userRole = data.user.role.toLowerCase();
        if (userRole === 'parent') navigate('/parent/dashboard');
        else if (userRole === 'teacher') navigate('/teacher/dashboard');
        else if (userRole === 'admin') navigate('/admin/dashboard');
        
        return { success: true };
      }
    } catch (err) {
      console.error("Login process failed:", err);
      let userFriendlyMsg = err.message;
      if (err.code === 'auth/invalid-credential') {
        userFriendlyMsg = "Invalid email or password.";
      } else if (err.code === 'auth/user-disabled') {
        userFriendlyMsg = "This account has been disabled by administrators.";
      } else if (err.code === 'auth/network-request-failed') {
        userFriendlyMsg = "Network error. Please check your internet connection.";
      }
      return { success: false, error: userFriendlyMsg };
    } finally {
      setLoading(false);
    }
  };

  const register = async (email, password, fullName, selectedRole) => {
    setLoading(true);
    try {
      if (isMock) {
        // Direct local mock registration
        const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/mock-register`, {
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
        setToken(data.user.firebaseUid);
        localStorage.setItem('token', data.user.firebaseUid);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirect immediately based on role
        const userRole = data.user.role.toLowerCase();
        if (userRole === 'parent') navigate('/parent/dashboard');
        else if (userRole === 'teacher') navigate('/teacher/dashboard');
        else if (userRole === 'admin') navigate('/admin/dashboard');
        
        return { success: true };
      } else {
        // 1. Step 1: Pre-authorization validation check with backend
        const checkResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register-check`, {
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
        
        // 2. Step 2: Create user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const firebaseUser = userCredential.user;
        
        // 3. Step 3: Link Firebase account UID in database
        const linkResponse = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5000'}/api/auth/register-link`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email, firebaseUid: firebaseUser.uid, fullName })
        });
        const linkData = await linkResponse.json();
        if (!linkResponse.ok) {
          // Cleanup Firebase account if database linking fails
          await firebaseUser.delete();
          throw new Error(linkData.error || 'Failed to link account to pre-authorized record.');
        }
        
        // Auto-login after successful registration
        const idToken = await firebaseUser.getIdToken(true);
        setUser(linkData.user);
        setToken(idToken);
        localStorage.setItem('token', idToken);
        localStorage.setItem('user', JSON.stringify(linkData.user));
        
        // Redirect immediately based on role
        const userRole = linkData.user.role.toLowerCase();
        if (userRole === 'parent') navigate('/parent/dashboard');
        else if (userRole === 'teacher') navigate('/teacher/dashboard');
        else if (userRole === 'admin') navigate('/admin/dashboard');
        
        return { success: true };
      }
    } catch (err) {
      console.error("Registration failed:", err);
      let userFriendlyMsg = err.message;
      if (err.code === 'auth/email-already-in-use') {
        userFriendlyMsg = "This email is already in use.";
      } else if (err.code === 'auth/weak-password') {
        userFriendlyMsg = "The password must be at least 6 characters.";
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMsg = "Please enter a valid email address.";
      }
      return { success: false, error: userFriendlyMsg };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email) => {
    try {
      if (isMock) {
        return { success: true, message: `Mock reset link sent to ${email} (Local development mock success).` };
      } else {
        await sendPasswordResetEmail(auth, email);
        return { success: true, message: "A password reset email has been sent. Please check your inbox." };
      }
    } catch (err) {
      console.error("Password reset error:", err);
      let userFriendlyMsg = err.message;
      if (err.code === 'auth/user-not-found') {
        userFriendlyMsg = "No account found with this email address.";
      } else if (err.code === 'auth/invalid-email') {
        userFriendlyMsg = "Please enter a valid email address.";
      }
      return { success: false, error: userFriendlyMsg };
    }
  };

  const logout = async () => {
    if (!isMock) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error("Logout error:", err);
      }
    }
    clearSession();
    navigate('/login');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading, register, resetPassword, isMock, toggleMockMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;
