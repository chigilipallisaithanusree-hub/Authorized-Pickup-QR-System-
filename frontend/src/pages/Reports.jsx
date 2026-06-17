import React, { useState } from 'react';
import { api } from '../services/api';
import { FileText, Download, Calendar } from 'lucide-react';
import Toast from '../components/Toast';
import Alert from '../components/Alert';

const Reports = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [format, setFormat] = useState('csv');
  const [downloading, setDownloading] = useState(false);
  const [toast, setToast] = useState('');
  const [error, setError] = useState('');

  const handleExport = async (e) => {
    e.preventDefault();
    setError('');
    setDownloading(true);
    
    try {
      const queryParams = new URLSearchParams();
      if (startDate) queryParams.append('startDate', startDate);
      if (endDate) queryParams.append('endDate', endDate);
      queryParams.append('format', format);
      
      const blob = await api.get(`/api/reports/export?${queryParams.toString()}`);
      
      // Create download url link
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `pickup_report_${new Date().toISOString().slice(0, 10)}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      
      setToast('Report generated and downloaded successfully.');
    } catch (err) {
      setError(err.message || 'Export request failed.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div>
      {toast && <Toast message={toast} type="success" onClose={() => setToast('')} />}

      <h1 style={{ fontFamily: 'Outfit', fontSize: '28px', color: 'var(--ink-primary)', marginBottom: '4px' }}>
        Compliance Reports
      </h1>
      <p style={{ fontSize: '15px', color: 'var(--ink-secondary)', marginBottom: '32px' }}>
        Export pickup logs history for district board auditing.
      </p>

      {error && <Alert message={error} type="error" />}

      <div style={{ maxWidth: '540px' }}>
        <div className="card-elevation" style={{ backgroundColor: '#FFFFFF' }}>
          <h3 style={{ fontSize: '18px', color: 'var(--ink-primary)', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <FileText size={18} color="var(--brand-primary)" />
            <span>Report Exporter Settings</span>
          </h3>

          <form onSubmit={handleExport}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
              <div className="form-group">
                <label>Start Date</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="var(--ink-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>End Date</label>
                <div style={{ position: 'relative' }}>
                  <Calendar size={16} color="var(--ink-secondary)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="form-control"
                    style={{ paddingLeft: '38px' }}
                  />
                </div>
              </div>
            </div>

            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label>Export File Format</label>
              <div style={{ display: 'flex', gap: '16px' }}>
                {['csv', 'pdf'].map(fmt => (
                  <label key={fmt} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '14px', textTransform: 'none', fontWeight: 500 }}>
                    <input
                      type="radio"
                      name="format"
                      value={fmt}
                      checked={format === fmt}
                      onChange={() => setFormat(fmt)}
                      style={{ width: '16px', height: '16px', accentColor: 'var(--brand-primary)' }}
                    />
                    <span>{fmt.toUpperCase()} Document</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={downloading}
              className="btn-primary"
              style={{ width: '100%', height: '48px' }}
            >
              <Download size={18} />
              <span>{downloading ? 'Compiling Report...' : 'Download Report File'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Reports;
