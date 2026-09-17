// LicenseActivation.jsx
import { useEffect, useState, useCallback } from 'react';
import { Plus, Trash2, FileText, Cpu, Smartphone, Truck, Users, Settings, Building, CreditCard, X } from 'lucide-react';
import './LicenseActivation.css';

// API Configuration
// const API_BASE = 'https://gps-backend-3hl6.onrender.com/api';
const API_BASE = process.env.REACT_APP_API_URL;
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
});

const VEHICLE_BODIES = ['Truck', 'Car', 'Bus', 'Van', 'Auto', 'Tractor', 'Trailer'];

const VEHICLE_MAKES = {
  TATA: ['ACE 1109', '407', '709', 'Prima', 'Signa'],
  'Ashok Leyland': ['Dost', 'Boss', 'Partner', 'Ecomet'],
  Mahindra: ['Bolero Pickup', 'Jeeto', 'Furio', 'Blazo'],
  Eicher: ['Pro 1049', 'Pro 2049', 'Pro 3015'],
  'Bharat Benz': ['1015R', '1217C', '1723C'],
};

const PAYMENT_MODES = ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'OTHER'];

const DEFAULT_ATTRIBUTES = [];

const emptyForm = {
  dealerId: '',
  packageId: '',
  sim: { model: '', imei: '', number: '' },
  device: { imei: '', model: '', protocol: 'TCP', port: '' },
  vehicle: { number: '', body: '', make: '', model: '' },
  ownerUserId: '',
  subUserId: '',
  paymentMode: 'ONLINE',
  transactionReference: '',
  amount: '', // Added amount field
  notes: '',
};

export default function LicenseActivation({ onCancel, onActivated }) {
  const [packages, setPackages] = useState([]);
  const [dealers, setDealers] = useState([]);
  const [users, setUsers] = useState([]);
  const [subUsers, setSubUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [attributes, setAttributes] = useState(DEFAULT_ATTRIBUTES);

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [loadingDealers, setLoadingDealers] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [toast, setToast] = useState(null);

  const selectedPackage = packages.find((p) => p._id === form.packageId);
  const selectedDealer = dealers.find((d) => d._id === form.dealerId);

  // Auto-fill amount when package is selected
  useEffect(() => {
    if (selectedPackage && selectedPackage.price) {
      setForm(prev => ({
        ...prev,
        amount: selectedPackage.price.toString()
      }));
    }
  }, [selectedPackage]);

  // ---- initial data load - load dealers and packages ----------------------------
  useEffect(() => {
    (async () => {
      try {
        setLoadingDealers(true);
        
        // Get the current user info to check role
        const userRes = await fetch(`${API_BASE}/auth/me`, { headers: authHeaders() });
        const userData = await userRes.json();
        const currentUserData = userData.data || userData;
        setCurrentUser(currentUserData);
        
        // Load packages
        const pkgRes = await fetch(`${API_BASE}/license-packages?limit=100`, { headers: authHeaders() });
        const pkgJson = await pkgRes.json();
        setPackages(pkgJson.data || []);
        
        // Load dealers - only users with DEALER role
        const dealerRes = await fetch(`${API_BASE}/users?role=DEALER&limit=100`, { headers: authHeaders() });
        const dealerJson = await dealerRes.json();
        setDealers(dealerJson.data || []);
        
        // If current user is DEALER, auto-select them
        if (currentUserData && currentUserData.role === 'DEALER') {
          setForm(prev => ({
            ...prev,
            dealerId: currentUserData._id
          }));
        }
      } catch (err) {
        setToast({
          type: 'error',
          message: 'Could not load packages / dealers. Check your connection and try again.'
        });
        setTimeout(() => setToast(null), 8000);
        console.error('Initial load error:', err);
      } finally {
        setLoadingDealers(false);
      }
    })();
  }, []);

  // ---- fetch users (owners) whenever dealer changes ---------------------------
  useEffect(() => {
    if (!form.dealerId) {
      setUsers([]);
      setSubUsers([]);
      setForm(prev => ({
        ...prev,
        ownerUserId: '',
        subUserId: ''
      }));
      return;
    }
    
    (async () => {
      try {
        setLoadingUsers(true);
        // Fetch users that belong to this dealer (role: USER)
        const res = await fetch(
          `${API_BASE}/users?dealerId=${form.dealerId}&role=USER&limit=100`,
          { headers: authHeaders() }
        );
        const json = await res.json();
        setUsers(json.data || []);
        // Reset sub-users when dealer changes
        setSubUsers([]);
        setForm(prev => ({
          ...prev,
          ownerUserId: '',
          subUserId: ''
        }));
      } catch (err) {
        console.error('Error fetching users:', err);
        setUsers([]);
      } finally {
        setLoadingUsers(false);
      }
    })();
  }, [form.dealerId]);

  // ---- fetch sub users whenever the owner changes ---------------------------
  useEffect(() => {
    if (!form.ownerUserId) {
      setSubUsers([]);
      return;
    }
    (async () => {
      try {
        const res = await fetch(
          `${API_BASE}/users?parentId=${form.ownerUserId}&role=SUB_USER&limit=100`,
          { headers: authHeaders() }
        );
        const json = await res.json();
        setSubUsers(json.data || []);
      } catch {
        setSubUsers([]);
      }
    })();
  }, [form.ownerUserId]);

  // ---- fetch packages for the selected dealer ---------------------------
  useEffect(() => {
    if (!form.dealerId) {
      setPackages([]);
      setForm(prev => ({
        ...prev,
        packageId: ''
      }));
      return;
    }
    
    (async () => {
      try {
        // Fetch packages for this dealer
        const res = await fetch(
          `${API_BASE}/license-packages?dealerId=${form.dealerId}&limit=100`,
          { headers: authHeaders() }
        );
        const json = await res.json();
        setPackages(json.data || []);
        // Reset package selection
        setForm(prev => ({
          ...prev,
          packageId: ''
        }));
      } catch (err) {
        console.error('Error fetching packages:', err);
        setPackages([]);
      }
    })();
  }, [form.dealerId]);

  const updateField = useCallback((section, field, value) => {
    setForm((prev) =>
      section
        ? { ...prev, [section]: { ...prev[section], [field]: value } }
        : { ...prev, [field]: value }
    );
    // Clear error for this field when user types
    if (errors[field] || errors[`${section}${field}`]) {
      setErrors(prev => ({
        ...prev,
        [field]: '',
        [`${section}${field}`]: ''
      }));
    }
  }, [errors]);

  const updateAttribute = (index, field, value) => {
    setAttributes((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const addAttribute = () => {
    setAttributes((prev) => [...prev, { key: '', value: '', type: 'text' }]);
  };

  const removeAttribute = (index) => {
    setAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  // ---- validation ------------------------------------------------------------
  const validate = () => {
    const next = {};
    if (!form.dealerId) next.dealerId = 'Select a dealer first';
    if (!form.packageId) next.packageId = 'Select a license package';
    if (!form.sim.model) next.simModel = 'Required';
    if (!form.sim.imei) next.simImei = 'Required';
    if (!form.sim.number) next.simNumber = 'Required';
    if (!form.device.imei) next.deviceImei = 'Required';
    if (!form.device.model) next.deviceModel = 'Required';
    if (!form.device.protocol) next.deviceProtocol = 'Required';
    if (!form.device.port) next.devicePort = 'Required';
    if (!form.vehicle.number) next.vehicleNumber = 'Required';
    if (!form.vehicle.body) next.vehicleBody = 'Required';
    if (!form.vehicle.make) next.vehicleMake = 'Required';
    if (!form.vehicle.model) next.vehicleModel = 'Required';
    if (!form.ownerUserId) next.ownerUserId = 'Select a user owner';
    if (!form.paymentMode) next.paymentMode = 'Select payment mode';
    if (!form.amount) next.amount = 'Enter amount';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  // ---- submit ------------------------------------------------------------
  const handleActivate = async () => {
    if (!validate()) return;

    const known = { color: '', chassisNumber: '', engineNumber: '' };
    const customAttributes = [];
    attributes.forEach((row) => {
      if (!row.key) return;
      const k = row.key.trim().toLowerCase();
      if (k === 'color') known.color = row.value;
      else if (k === 'chassis no') known.chassisNumber = row.value;
      else if (k === 'engine no') known.engineNumber = row.value;
      else customAttributes.push({ key: row.key, value: row.value });
    });

    setSubmitting(true);
    setLoadError('');
    setToast(null);
    
    try {
      const payload = {
        dealerId: form.dealerId,
        packageId: form.packageId,
        sim: form.sim,
        device: { 
        ...form.device, 
        port: Number(form.device.port),
        // Ensure IMEI is included and properly formatted
        imei: form.device.imei.trim()
      },
        vehicle: { ...form.vehicle, ...known, customAttributes },
        ownerUserId: form.ownerUserId,
        subUserId: form.subUserId || undefined,
        paymentMode: form.paymentMode,
        transactionReference: form.transactionReference || '',
        amount: Number(form.amount) || 0,
        notes: form.notes || `Activation for ${form.vehicle.number}`,
        notes: form.notes || `Activation for ${form.vehicle.number}`,
      // Important: This will associate the device with the owner
      assignedUserId: form.ownerUserId,
      };

      console.log('Activation payload:', payload);

      const res = await fetch(`${API_BASE}/licenses/activate`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.message || 'Activation failed');
      }

      // Show success toast with order details
      const orderData = json.data?.order;
      let message = '✅ License activated successfully!';
      
      if (orderData) {
        message = `✅ License Activated Successfully!\n\n📋 Order #: ${orderData.orderNumber}\n💰 Amount: ₹${orderData.amount}\n💳 Payment: ${orderData.paymentMode}\n🚗 Vehicle: ${form.vehicle.number}`;
      }
      
      setToast({
        type: 'success',
        message: message
      });
      
      // Call the onActivated callback if provided
      if (onActivated) {
        onActivated(json.data);
      }

      // Reset form
      setForm(emptyForm);
      setAttributes(DEFAULT_ATTRIBUTES);
      setUsers([]);
      setSubUsers([]);
      
      // If user is DEALER, keep their ID selected
      if (currentUser && currentUser.role === 'DEALER') {
        setForm(prev => ({
          ...prev,
          dealerId: currentUser._id
        }));
      }
      
      // Clear toast after 10 seconds
      setTimeout(() => setToast(null), 10000);
      
    } catch (err) {
      setToast({
        type: 'error',
        message: err.message || 'Activation failed. Please try again.'
      });
      setTimeout(() => setToast(null), 8000);
    } finally {
      setSubmitting(false);
    }
  };

  const available = selectedPackage
    ? selectedPackage.licenseCount - selectedPackage.usedLicenseCount
    : null;

  // Check if current user is ADMIN
  const isAdmin = currentUser?.role === 'ADMIN';

  return (
    <div className="la-page">
      {/* Toast Notification */}
      {toast && (
        <div className={`la-toast la-toast-${toast.type}`}>
          <div className="la-toast-content">
            {toast.message.split('\n').map((line, index) => (
              <div key={index}>
                {line}
                {index < toast.message.split('\n').length - 1 && <br />}
              </div>
            ))}
          </div>
          <button 
            className="la-toast-close"
            onClick={() => setToast(null)}
            type="button"
          >
            <X size={18} />
          </button>
        </div>
      )}

      <div className="la-header">
        <div>
          <h1>🚗 License Activation</h1>
          <p>Activate a new license for user, device and vehicle</p>
        </div>
        <div className="la-header-actions">
          <button className="la-btn la-btn-ghost" onClick={onCancel} type="button">Cancel</button>
          <button className="la-btn la-btn-primary" onClick={handleActivate} disabled={submitting} type="button">
            {submitting ? '⏳ Activating…' : '🔑 Activate License'}
          </button>
        </div>
      </div>

      {loadError && (
        <div className="la-alert la-alert-error">
          <div className="la-alert-content">{loadError}</div>
        </div>
      )}

      {/* Dealer Selection - Only show for ADMIN */}
      {isAdmin && (
        <section className="la-card">
          <h2 className="la-card-title"><Building size={18} /> Dealer Selection</h2>
          <div className="la-card-body">
            <div className="la-field">
              <label>Select Dealer <span className="req">*</span></label>
              <select
                value={form.dealerId}
                onChange={(e) => updateField(null, 'dealerId', e.target.value)}
                className={errors.dealerId ? 'la-error' : ''}
                disabled={loadingDealers}
              >
                <option value="">{loadingDealers ? 'Loading dealers...' : 'Select a dealer'}</option>
                {dealers.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.companyName || d.name || d.username} 
                    {d.companyName ? ` (${d.username})` : ''}
                  </option>
                ))}
              </select>
              {errors.dealerId && <span className="la-error-text">{errors.dealerId}</span>}
              {selectedDealer && (
                <div className="la-dealer-info">
                  <span className="la-hint">Selected: {selectedDealer.name || selectedDealer.username}</span>
                  {selectedDealer.email && <span className="la-hint"> • {selectedDealer.email}</span>}
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Show dealer info for DEALER users */}
      {!isAdmin && currentUser && (
        <section className="la-card">
          <h2 className="la-card-title"><Building size={18} /> Dealer Information</h2>
          <div className="la-card-body">
            <div className="la-dealer-info-display">
              <div className="la-field">
                <label>Dealer</label>
                <input 
                  type="text" 
                  value={currentUser.companyName || currentUser.name || currentUser.username} 
                  readOnly 
                  className="la-readonly"
                />
              </div>
              {currentUser.email && (
                <div className="la-field">
                  <label>Email</label>
                  <input 
                    type="text" 
                    value={currentUser.email} 
                    readOnly 
                    className="la-readonly"
                  />
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Payment Information */}
      <section className="la-card">
        <h2 className="la-card-title"><CreditCard size={18} /> Payment Information</h2>
        <div className="la-card-body la-grid-3">
          <div className="la-field">
            <label>Amount <span className="req">*</span></label>
            <input
              type="number"
              value={form.amount}
              onChange={(e) => updateField(null, 'amount', e.target.value)}
              placeholder="Enter amount"
              className={errors.amount ? 'la-error' : ''}
              disabled={!form.dealerId}
              min="0"
              step="1"
            />
            {errors.amount && <span className="la-error-text">{errors.amount}</span>}
            {selectedPackage && selectedPackage.price && (
              <span className="la-hint">Package price: ₹{selectedPackage.price}</span>
            )}
          </div>
          <div className="la-field">
            <label>Payment Mode <span className="req">*</span></label>
            <select
              value={form.paymentMode}
              onChange={(e) => updateField(null, 'paymentMode', e.target.value)}
              className={errors.paymentMode ? 'la-error' : ''}
              disabled={!form.dealerId}
            >
              <option value="">Select payment mode</option>
              {PAYMENT_MODES.map((mode) => (
                <option key={mode} value={mode}>{mode.replace('_', ' ')}</option>
              ))}
            </select>
            {errors.paymentMode && <span className="la-error-text">{errors.paymentMode}</span>}
          </div>
          <div className="la-field">
            <label>Transaction Reference</label>
            <input
              value={form.transactionReference}
              onChange={(e) => updateField(null, 'transactionReference', e.target.value)}
              placeholder="TX123456789"
              disabled={!form.dealerId}
            />
            <span className="la-hint">Optional: Transaction ID or reference number</span>
          </div>
          <div className="la-field" style={{ gridColumn: 'span 3' }}>
            <label>Notes</label>
            <input
              value={form.notes}
              onChange={(e) => updateField(null, 'notes', e.target.value)}
              placeholder="Any additional notes..."
              disabled={!form.dealerId}
            />
          </div>
        </div>
      </section>

      {/* License Information */}
      <section className="la-card">
        <h2 className="la-card-title"><FileText size={18} /> License Information</h2>
        <div className="la-card-body la-license-grid">
          <div className="la-field">
            <label>License Package <span className="req">*</span></label>
            <select
              value={form.packageId}
              onChange={(e) => updateField(null, 'packageId', e.target.value)}
              className={errors.packageId ? 'la-error' : ''}
              disabled={!form.dealerId || loadingUsers}
            >
              <option value="">
                {!form.dealerId ? 'Select a dealer first' : 
                 packages.length === 0 ? 'No packages available for this dealer' : 
                 'Select a package'}
              </option>
              {packages.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.packageName} (ID: {p.packageCode}) - {p.licenseCount - p.usedLicenseCount} available
                </option>
              ))}
            </select>
            {errors.packageId && <span className="la-error-text">{errors.packageId}</span>}

            <label className="la-mt">Duration</label>
            <input 
              type="text" 
              value={selectedPackage ? `${selectedPackage.duration?.value || 0} ${selectedPackage.duration?.unit || 'Months'}` : ''} 
              readOnly 
              className="la-readonly" 
            />
          </div>

          <div className="la-stats-box">
            <div className="la-stat">
              <span className="la-stat-label">Total Licenses</span>
              <span className="la-stat-value">{selectedPackage ? selectedPackage.licenseCount : '—'}</span>
            </div>
            <div className="la-stat">
              <span className="la-stat-label">Used Licenses</span>
              <span className="la-stat-value">{selectedPackage ? selectedPackage.usedLicenseCount : '—'}</span>
            </div>
            <div className="la-stat">
              <span className="la-stat-label">Available Licenses</span>
              <span className="la-stat-value la-stat-available">{available !== null ? available : '—'}</span>
            </div>
          </div>
        </div>
      </section>

      {/* SIM Information */}
      <section className="la-card">
        <h2 className="la-card-title"><Smartphone size={18} /> SIM Information</h2>
        <div className="la-card-body la-grid-3">
          <div className="la-field">
            <label>SIM Model <span className="req">*</span></label>
            <input
              value={form.sim.model}
              onChange={(e) => updateField('sim', 'model', e.target.value)}
              placeholder="SIM7600E"
              className={errors.simModel ? 'la-error' : ''}
              disabled={!form.dealerId}
            />
            {errors.simModel && <span className="la-error-text">{errors.simModel}</span>}
          </div>
          <div className="la-field">
            <label>SIM IMEI <span className="req">*</span></label>
            <input
              value={form.sim.imei}
              onChange={(e) => updateField('sim', 'imei', e.target.value)}
              placeholder="860120060123456"
              className={errors.simImei ? 'la-error' : ''}
              disabled={!form.dealerId}
            />
            {errors.simImei && <span className="la-error-text">{errors.simImei}</span>}
          </div>
          <div className="la-field">
            <label>SIM Number <span className="req">*</span></label>
            <input
              value={form.sim.number}
              onChange={(e) => updateField('sim', 'number', e.target.value)}
              placeholder="9876543210"
              className={errors.simNumber ? 'la-error' : ''}
              disabled={!form.dealerId}
            />
            {errors.simNumber && <span className="la-error-text">{errors.simNumber}</span>}
          </div>
        </div>
      </section>

      {/* Device Information */}
      <section className="la-card">
        <h2 className="la-card-title"><Cpu size={18} /> Device Information</h2>
        <div className="la-card-body la-grid-4">
          <div className="la-field">
            <label>Device IMEI <span className="req">*</span></label>
            <input
              value={form.device.imei}
              onChange={(e) => updateField('device', 'imei', e.target.value)}
              placeholder="868715060987654"
              className={errors.deviceImei ? 'la-error' : ''}
              disabled={!form.dealerId}
            />
            {errors.deviceImei && <span className="la-error-text">{errors.deviceImei}</span>}
          </div>
          <div className="la-field">
            <label>Device Model <span className="req">*</span></label>
            <input
              value={form.device.model}
              onChange={(e) => updateField('device', 'model', e.target.value)}
              placeholder="VT300"
              className={errors.deviceModel ? 'la-error' : ''}
              disabled={!form.dealerId}
            />
            {errors.deviceModel && <span className="la-error-text">{errors.deviceModel}</span>}
          </div>
          <div className="la-field">
            <label>Device Protocol <span className="req">*</span></label>
            <select
              value={form.device.protocol}
              onChange={(e) => updateField('device', 'protocol', e.target.value)}
              className={errors.deviceProtocol ? 'la-error' : ''}
              disabled={!form.dealerId}
            >
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
              <option value="UDP">OB22</option>
              <option value="UDP">JC371</option>
              <option value="UDP">FMB20</option>
              
            </select>
            {errors.deviceProtocol && <span className="la-error-text">{errors.deviceProtocol}</span>}
          </div>
          <div className="la-field">
            <label>Port <span className="req">*</span></label>
            <input
              value={form.device.port}
              onChange={(e) => updateField('device', 'port', e.target.value.replace(/\D/g, ''))}
              placeholder="5023"
              className={errors.devicePort ? 'la-error' : ''}
              disabled={!form.dealerId}
            />
            {errors.devicePort && <span className="la-error-text">{errors.devicePort}</span>}
          </div>
        </div>
      </section>

      {/* Vehicle Information */}
      <section className="la-card">
        <h2 className="la-card-title"><Truck size={18} /> Vehicle Information</h2>
        <div className="la-card-body la-grid-4">
          <div className="la-field">
            <label>Vehicle No <span className="req">*</span></label>
            <input
              value={form.vehicle.number}
              onChange={(e) => updateField('vehicle', 'number', e.target.value)}
              placeholder="TN 01 AB 1234"
              className={errors.vehicleNumber ? 'la-error' : ''}
              disabled={!form.dealerId}
            />
            {errors.vehicleNumber && <span className="la-error-text">{errors.vehicleNumber}</span>}
          </div>
          <div className="la-field">
            <label>Vehicle Body <span className="req">*</span></label>
            <select
              value={form.vehicle.body}
              onChange={(e) => updateField('vehicle', 'body', e.target.value)}
              className={errors.vehicleBody ? 'la-error' : ''}
              disabled={!form.dealerId}
            >
              <option value="">Select</option>
              {VEHICLE_BODIES.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
            {errors.vehicleBody && <span className="la-error-text">{errors.vehicleBody}</span>}
          </div>
          <div className="la-field">
            <label>Vehicle Make <span className="req">*</span></label>
            <select
              value={form.vehicle.make}
              onChange={(e) => {
                updateField('vehicle', 'make', e.target.value);
                updateField('vehicle', 'model', '');
              }}
              className={errors.vehicleMake ? 'la-error' : ''}
              disabled={!form.dealerId}
            >
              <option value="">Select</option>
              {Object.keys(VEHICLE_MAKES).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.vehicleMake && <span className="la-error-text">{errors.vehicleMake}</span>}
          </div>
          <div className="la-field">
            <label>Vehicle Model <span className="req">*</span></label>
            <select
              value={form.vehicle.model}
              onChange={(e) => updateField('vehicle', 'model', e.target.value)}
              disabled={!form.vehicle.make || !form.dealerId}
              className={errors.vehicleModel ? 'la-error' : ''}
            >
              <option value="">Select</option>
              {(VEHICLE_MAKES[form.vehicle.make] || []).map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {errors.vehicleModel && <span className="la-error-text">{errors.vehicleModel}</span>}
          </div>
        </div>
      </section>

      {/* Owner Information */}
      <section className="la-card">
        <h2 className="la-card-title"><Users size={18} /> Owner Information</h2>
        <div className="la-card-body la-grid-2">
          <div className="la-field">
            <label>User Owner <span className="req">*</span></label>
            <select
              value={form.ownerUserId}
              onChange={(e) => {
                updateField(null, 'ownerUserId', e.target.value);
                updateField(null, 'subUserId', '');
              }}
              className={errors.ownerUserId ? 'la-error' : ''}
              disabled={!form.dealerId || loadingUsers}
            >
              <option value="">
                {!form.dealerId ? 'Select a dealer first' : 
                 loadingUsers ? 'Loading users...' :
                 users.length === 0 ? 'No users found for this dealer' : 
                 'Select owner'}
              </option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.name || u.username}
                  {u.companyName ? ` (${u.companyName})` : ''}
                </option>
              ))}
            </select>
            {errors.ownerUserId && <span className="la-error-text">{errors.ownerUserId}</span>}
            {form.dealerId && users.length === 0 && !loadingUsers && (
              <span className="la-hint">⚠️ No users found for this dealer. Create users first.</span>
            )}
          </div>
          <div className="la-field">
            <label>Sub User</label>
            <select
              value={form.subUserId}
              onChange={(e) => updateField(null, 'subUserId', e.target.value)}
              disabled={!form.ownerUserId || loadingUsers}
            >
              <option value="">
                {!form.ownerUserId ? 'Select owner first' : 
                 subUsers.length === 0 ? 'No sub-users available' : 
                 'Select sub user (optional)'}
              </option>
              {subUsers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name || s.username}
                </option>
              ))}
            </select>
            <span className="la-hint">
              {form.ownerUserId && subUsers.length === 0 && !loadingUsers
                ? 'No sub-users available for this owner.' 
                : 'Select a sub-user if available'}
            </span>
          </div>
        </div>
      </section>

      {/* Custom Attributes */}
      <section className="la-card">
        <div className="la-card-title-row">
          <h2 className="la-card-title"><Settings size={18} /> Custom Attributes</h2>
          <button className="la-btn la-btn-outline" onClick={addAttribute} type="button" disabled={!form.dealerId}>
            <Plus size={16} /> Add Attribute
          </button>
        </div>
        <div className="la-card-body">
          <table className="la-attr-table">
            <thead>
              <tr>
                <th className="la-col-num">#</th>
                <th>Key</th>
                <th>Value</th>
                <th className="la-col-action">Action</th>
              </tr>
            </thead>
            <tbody>
              {attributes.map((row, i) => (
                <tr key={i}>
                  <td className="la-col-num">{i + 1}</td>
                  <td>
                    <input 
                      value={row.key} 
                      onChange={(e) => updateAttribute(i, 'key', e.target.value)} 
                      placeholder="Key"
                      disabled={!form.dealerId}
                    />
                  </td>
                  <td>
                    <input
                      type={row.type === 'date' ? 'date' : 'text'}
                      value={row.value}
                      onChange={(e) => updateAttribute(i, 'value', e.target.value)}
                      placeholder="Value"
                      disabled={!form.dealerId}
                    />
                  </td>
                  <td className="la-col-action">
                    <button 
                      className="la-icon-btn" 
                      onClick={() => removeAttribute(i)} 
                      type="button" 
                      aria-label="Remove attribute"
                      disabled={!form.dealerId}
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="la-footer">
        <button className="la-btn la-btn-ghost" onClick={onCancel} type="button">Cancel</button>
        <button className="la-btn la-btn-primary" onClick={handleActivate} disabled={submitting || !form.dealerId} type="button">
          <FileText size={16} /> {submitting ? '⏳ Activating…' : '🔑 Activate License'}
        </button>
      </div>
    </div>
  );
}