import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { api } from '../services/api';
import { ScanLine, AlertTriangle, Play, Pause } from 'lucide-react';
import Alert from '../components/Alert';
import Toast from '../components/Toast';

const QRScanner = () => {
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');
  const [manualToken, setManualToken] = useState('');
  const [verifying, setVerifying] = useState(false);
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize html5-qrcode scanner
    scannerRef.current = new Html5QrcodeScanner(
      "qr-reader-container",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      /* verbose= */ false
    );

    const onScanSuccess = async (decodedText) => {
      // Pause scanner to prevent double requests
      try {
        scannerRef.current.clear();
      } catch (err) {
        // Already cleared
      }
      handleVerifyToken(decodedText);
    };

    const onScanFailure = (error) => {
      // Verbose failure can be ignored for clean logs
    };

    scannerRef.current.render(onScanSuccess, onScanFailure);

    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.clear();
        } catch (err) {
          // Cleanup error
        }
      }
    };
  }, []);

  const handleVerifyToken = async (tokenString) => {
    setVerifying(true);
    setError('');
    
    try {
      const result = await api.post('/api/pickups/verify', { token: tokenString });
      if (result.status === 'REJECTED') {
        setError(`REJECTED: ${result.rejectionReason}`);
        // Re-render scanner after 3 seconds on failure
        setTimeout(() => {
          window.location.reload();
        }, 3000);
      } else {
        // APPROVED -> Route to Verification page with state details
        navigate('/teacher/verification', {
          state: {
            student: result.student,
            guardian: result.guardian,
            token: tokenString
          }
        });
      }
    } catch (err) {
      setError(err.message || 'Verification request failed.');
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } finally {
      setVerifying(false);
    }
  };

  const handleManualSubmit = (e) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    handleVerifyToken(manualToken.trim());
  };

  return (
    <div>
      {toast && <Toast message={toast} type="error" onClose={() => setToast('')} />}

      <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', color: 'var(--ink-primary)', marginBottom: '4px' }}>
        QR Scanner Interface
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--ink-secondary)', marginBottom: '32px' }}>
        Point device camera at the guardian's QR code or enter token code manually below.
      </p>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
        gap: '32px'
      }}>
        {/* Scanner Viewfinder Frame */}
        <div className="card-elevation" style={{
          backgroundColor: '#FFFFFF',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px'
        }}>
          {error && <Alert message={error} type="error" />}

          {verifying ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px' }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '4px solid #E2E8F0',
                borderTopColor: '#2D5288',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginBottom: '16px'
              }} />
              <div style={{ fontSize: '14px', color: 'var(--ink-primary)', fontWeight: 600 }}>
                Verifying Security Credentials...
              </div>
            </div>
          ) : (
            <div id="qr-reader-container" style={{ width: '100%', maxWidth: '400px' }} />
          )}
        </div>

        {/* Manual Input Fallback */}
        <div className="card-elevation" style={{ backgroundColor: '#FFFFFF', height: 'fit-content' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--ink-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={18} color="var(--status-warning)" />
            <span>Manual Override Option</span>
          </h3>
          <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', marginBottom: '20px', lineHeight: 1.5 }}>
            Use this fallback interface if camera permissions are blocked or scanner fails to decode.
          </p>

          <form onSubmit={handleManualSubmit}>
            <div className="form-group">
              <label>Token Hash String</label>
              <textarea
                value={manualToken}
                onChange={(e) => setManualToken(e.target.value)}
                placeholder="Paste decrypted base64 token string here..."
                className="form-control"
                style={{ height: '100px', resize: 'none', padding: '12px', fontSize: '13px', fontFamily: 'JetBrains Mono' }}
                required
              />
            </div>

            <button type="submit" disabled={verifying} className="btn-primary" style={{ width: '100%' }}>
              Verify Token Manually
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default QRScanner;
