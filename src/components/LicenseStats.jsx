import React, { useEffect, useState } from 'react';
import { FiPackage, FiCheckCircle, FiXCircle, FiAlertCircle } from 'react-icons/fi';
import { resourceApis } from '../api/services.js';
import './LicenseStats.css';

export default function LicenseStats({ dealerId }) {
  const [stats, setStats] = useState({
    totalPackages: 0,
    totalLicenses: 0,
    usedLicenses: 0,
    availableLicenses: 0,
    packages: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchLicenseStats();
  }, [dealerId]);

  const fetchLicenseStats = async () => {
    setLoading(true);
    setError('');
    try {
      // Fetch all license packages for this dealer
      const params = {};
      if (dealerId) {
        params.dealerId = dealerId;
      }
      
      const res = await resourceApis['license-packages'].getAll(params);
      const packages = res.data.data || [];
      
      // Calculate stats
      let totalLicenses = 0;
      let usedLicenses = 0;
      
      packages.forEach(pkg => {
        totalLicenses += pkg.licenseCount || 0;
        usedLicenses += pkg.usedLicenseCount || 0;
      });
      
      setStats({
        totalPackages: packages.length,
        totalLicenses,
        usedLicenses,
        availableLicenses: totalLicenses - usedLicenses,
        packages
      });
    } catch (err) {
      console.error('Error fetching license stats:', err);
      setError('Failed to load license statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="license-stats loading">
        <div className="spinner"></div>
        <span>Loading license stats...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="license-stats error">
        <FiAlertCircle />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="license-stats">
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-icon">
            <FiPackage />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Packages</span>
            <span className="stat-value">{stats.totalPackages}</span>
          </div>
        </div>
        
        <div className="stat-card licenses">
          <div className="stat-icon">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Licenses</span>
            <span className="stat-value">{stats.totalLicenses}</span>
          </div>
        </div>
        
        <div className="stat-card used">
          <div className="stat-icon">
            <FiAlertCircle />
          </div>
          <div className="stat-info">
            <span className="stat-label">Used Licenses</span>
            <span className="stat-value">{stats.usedLicenses}</span>
          </div>
        </div>
        
        <div className="stat-card available">
          <div className="stat-icon">
            <FiCheckCircle />
          </div>
          <div className="stat-info">
            <span className="stat-label">Available Licenses</span>
            <span className={`stat-value ${stats.availableLicenses > 0 ? 'available' : 'exhausted'}`}>
              {stats.availableLicenses}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}