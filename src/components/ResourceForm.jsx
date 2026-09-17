// components/ResourceForm.jsx
import { useEffect, useMemo, useState, useRef } from 'react';
import { resourceApis, subUserApi } from '../api/services.js';
import { getRefLabel } from '../utils/formatters.js';
import "./Resourceform.css";

function toInputDate(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
}

function toInputDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
}

function buildInitialValues(fields, record) {
  const values = {};

  fields.forEach((field) => {
    if (field.type === 'group') {
      values[field.name] = {};
      field.fields.forEach((child) => {
        values[field.name][child.name] = record?.[field.name]?.[child.name]
          ?? child.defaultValue
          ?? (child.type === 'checkbox' ? false : '');
      });
      return;
    }

    const raw = record?.[field.name];
    if (field.type === 'reference') {
      values[field.name] = raw?._id || raw || '';
      return;
    }
    if (field.type === 'multi-reference') {
      if (Array.isArray(raw)) {
        values[field.name] = raw.map(item => typeof item === 'object' ? item._id : item).filter(Boolean);
      } else {
        values[field.name] = [];
      }
      return;
    }
    if (field.type === 'date') {
      values[field.name] = toInputDate(raw);
      return;
    }
    if (field.type === 'datetime') {
      values[field.name] = toInputDateTime(raw);
      return;
    }
    if (field.type === 'checkbox') {
      values[field.name] = raw ?? field.defaultValue ?? false;
      return;
    }
    if (field.type === 'select') {
      values[field.name] = raw ?? field.defaultValue ?? '';
      return;
    }

    values[field.name] = raw ?? field.defaultValue ?? '';
  });

  return values;
}

function FieldInput({ field, value, onChange, referenceOptions = [], disabled = false }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click - moved to top level
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (field.type === 'textarea') {
    return (
      <textarea
        className="input"
        rows={3}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
    );
  }

  if (field.type === 'select') {
    const opts = Array.isArray(field.options)
      ? field.options
      : Object.values(field.options ?? {});

    return (
      <select
        className="input"
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">Select...</option>
        {opts.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    );
  }

  if (field.type === 'reference') {
    const waitingOnDependency = field.dependsOn && disabled;

    let options = [];
    
    if (field.includeAdminOption) {
      options.push({ 
        _id: 'ADMIN', 
        name: field.adminOptionLabel || 'Administrator' 
      });
    }
    
    options = [...options, ...referenceOptions];

    return (
      <select
        className="input"
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">
          {waitingOnDependency ? `Select ${field.dependsOnLabel || field.dependsOn} first` : 'Select...'}
        </option>
        {options.map((option) => (
          <option key={option._id} value={option._id}>
            {option._id === 'ADMIN' ? option.name : getRefLabel(option)}
          </option>
        ))}
      </select>
    );
  }

  if (field.type === 'multi-reference') {
    const selected = new Set(Array.isArray(value) ? value : []);
    
    // Filter options based on search
    const filteredOptions = referenceOptions.filter(option => {
      if (!searchTerm) return true;
      const label = getRefLabel(option).toLowerCase();
      return label.includes(searchTerm.toLowerCase());
    });

    const toggle = (id) => {
      const next = new Set(selected);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      onChange(Array.from(next));
    };

    const selectAll = () => {
      const allIds = referenceOptions.map(opt => opt._id);
      onChange(allIds);
    };

    const clearAll = () => {
      onChange([]);
    };

    // Get selected option labels for display
    const selectedLabels = referenceOptions
      .filter(opt => selected.has(opt._id))
      .map(opt => getRefLabel(opt));

    return (
      <div className="multi-select-tags" ref={dropdownRef}>
        <div 
          className={`multi-select-tags-input ${disabled ? 'disabled' : ''}`}
          onClick={() => !disabled && setIsDropdownOpen(!isDropdownOpen)}
        >
          <div className="tags-container">
            {selectedLabels.length > 0 ? (
              selectedLabels.map((label, index) => (
                <span key={index} className="tag">
                  {label}
                  <button
                    type="button"
                    className="tag-remove"
                    onClick={(e) => {
                      e.stopPropagation();
                      const id = referenceOptions.find(opt => getRefLabel(opt) === label)?._id;
                      if (id) toggle(id);
                    }}
                    disabled={disabled}
                  >
                    ×
                  </button>
                </span>
              ))
            ) : (
              <span className="placeholder">
                {disabled 
                  ? `Select ${field.dependsOnLabel || field.dependsOn} first` 
                  : `Select ${field.label}...`}
              </span>
            )}
          </div>
          <div className="dropdown-controls">
            {selected.size > 0 && (
              <span className="selected-count">{selected.size} selected</span>
            )}
            <span className="dropdown-arrow">{isDropdownOpen ? '▲' : '▼'}</span>
          </div>
        </div>
        
        {isDropdownOpen && !disabled && (
          <div className="multi-select-tags-dropdown">
            <div className="dropdown-header">
              <div className="dropdown-search">
                <input
                  type="text"
                  className="input input-sm"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
              <div className="dropdown-actions">
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectAll();
                  }}
                >
                  Select All
                </button>
                <button
                  type="button"
                  className="btn btn-sm btn-secondary"
                  onClick={(e) => {
                    e.stopPropagation();
                    clearAll();
                  }}
                >
                  Clear All
                </button>
              </div>
            </div>
            <div className="dropdown-options">
              {filteredOptions.length === 0 ? (
                <div className="empty-options">No options found</div>
              ) : (
                filteredOptions.map((option) => {
                  const isSelected = selected.has(option._id);
                  return (
                    <div
                      key={option._id}
                      className={`dropdown-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => toggle(option._id)}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(option._id)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="option-label">{getRefLabel(option)}</span>
                      {isSelected && <span className="check-mark">✓</span>}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (field.type === 'checkbox') {
    return (
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={Boolean(value)}
          disabled={disabled}
          onChange={(event) => onChange(event.target.checked)}
        />
        <span>{field.label}</span>
      </label>
    );
  }

  if (field.type === 'tel') {
    const maxLength = field.maxLength || 10;
    return (
      <input
        className="input"
        type="tel"
        inputMode="numeric"
        pattern="[0-9]*"
        maxLength={maxLength}
        minLength={field.minLength}
        value={value ?? ''}
        disabled={disabled}
        onChange={(event) => {
          const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, maxLength);
          onChange(digitsOnly);
        }}
      />
    );
  }

  return (
    <input
      className="input"
      type={field.type === 'password' ? 'password' : field.type}
      value={value ?? ''}
      min={field.min}
      minLength={field.minLength}
      disabled={disabled}
      onChange={(event) => onChange(field.type === 'number' ? Number(event.target.value) : event.target.value)}
    />
  );
}

export default function ResourceForm({ fields, record, mode, onSubmit, submitting, error, fixedValues = {} }) {
  const initialValues = useMemo(() => buildInitialValues(fields, record), [fields, record]);
  const [values, setValues] = useState(initialValues);
  const [referenceData, setReferenceData] = useState({});

  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const dependencySnapshot = useMemo(() => {
    const snapshot = {};
    fields.forEach((field) => {
      if ((field.type === 'reference' || field.type === 'multi-reference') && field.dependsOn) {
        const depValue = values[field.dependsOn] ?? 
                        fixedValues[field.dependsOn] ?? 
                        record?.[field.dependsOn];
        snapshot[field.dependsOn] = depValue ?? '';
      }
      if (field.ref === 'sub-users') {
        snapshot.ownerUserId = values.ownerUserId ?? fixedValues.ownerUserId ?? record?.ownerUserId ?? '';
      }
    });
    return snapshot;
  }, [fields, values, fixedValues, record]);
  
  const dependencyKey = JSON.stringify(dependencySnapshot);

  // Fetch reference dropdown options
  useEffect(() => {
    const refFields = fields.filter((field) => field.type === 'reference' || field.type === 'multi-reference');

    refFields.forEach((field) => {
      // Special handling for sub-users - fetch from user_access
     
if (field.ref === 'sub-users') {
  // Check if we have a dealerId from fixedValues (DEALER user case)
  const dealerIdFromFixed = fixedValues?.dealerId;
  const ownerId = values.ownerUserId ?? fixedValues.ownerUserId ?? record?.ownerUserId;
  
  // CASE 1: DEALER user with fixed dealerId - show all sub-users for this dealer
  if (dealerIdFromFixed) {
    console.log('DEALER: Fetching all sub-users for dealer:', dealerIdFromFixed);
    
    // Fetch all sub-users for this dealer using the users API with role filter
    resourceApis.users.getAll({
      dealerId: dealerIdFromFixed,
      role: 'SUB_USER',
      limit: 1000
    })
    .then((res) => {
      const subUsers = res.data.data || [];
      console.log('DEALER: Found sub-users:', subUsers);
      setReferenceData((prev) => ({ ...prev, [field.name]: subUsers }));
    })
    .catch((err) => {
      console.error('Error fetching sub-users for dealer:', err);
      setReferenceData((prev) => ({ ...prev, [field.name]: [] }));
    });
    return;
  }
  
  // CASE 2: USER role - fetch sub-users for a specific owner
  if (!ownerId) {
    console.log('No ownerId found, clearing sub-users');
    setReferenceData((prev) => ({ ...prev, [field.name]: [] }));
    return;
  }

  console.log('USER: Fetching sub-users for owner:', ownerId);
  // Use subUserApi to get only approved sub-users from user_access
  subUserApi.getForDropdown(ownerId)
    .then((res) => {
      console.log('USER: Found sub-users:', res.data.data);
      setReferenceData((prev) => ({ ...prev, [field.name]: res.data.data || [] }));
    })
    .catch((err) => {
      console.error('Error fetching sub-users for owner:', err);
      setReferenceData((prev) => ({ ...prev, [field.name]: [] }));
    });
  return;
}

      // Regular handling for other reference fields
      let dependencyValue = field.dependsOn
        ? (values[field.dependsOn] ?? fixedValues[field.dependsOn] ?? record?.[field.dependsOn])
        : undefined;

      if (field.dependsOn && !dependencyValue && record) {
        const recordValue = record[field.dependsOn];
        if (recordValue) {
          dependencyValue = typeof recordValue === 'object' ? recordValue._id : recordValue;
          setValues(prev => ({
            ...prev,
            [field.dependsOn]: dependencyValue
          }));
        }
      }

      if (field.dependsOn && !dependencyValue) {
        if (fixedValues[field.dependsOn]) {
          const params = {
            limit: 100,
            ...(field.refParams || {}),
            [field.dependsOn]: fixedValues[field.dependsOn],
          };

          resourceApis[field.ref]
            ?.getAll(params)
            .then((res) => {
              setReferenceData((prev) => ({ ...prev, [field.name]: res.data.data || [] }));
            })
            .catch(() => {
              setReferenceData((prev) => ({ ...prev, [field.name]: [] }));
            });
          return;
        }
        
        setReferenceData((prev) => ({ ...prev, [field.name]: [] }));
        return;
      }

      const params = {
        limit: 100,
        ...(field.refParams || {}),
      };

      if (field.dependsOn && dependencyValue) {
        params[field.dependsOn] = dependencyValue;
      }

      resourceApis[field.ref]
        ?.getAll(params)
        .then((res) => {
          setReferenceData((prev) => ({ ...prev, [field.name]: res.data.data || [] }));
        })
        .catch(() => {
          setReferenceData((prev) => ({ ...prev, [field.name]: [] }));
        });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fields, dependencyKey, fixedValues, values.ownerUserId, record]);

  const setFieldValue = (name, nextValue) => {
    setValues((prev) => {
      const next = { ...prev, [name]: nextValue };

      fields.forEach((field) => {
        if (field.type === 'reference' && field.dependsOn === name) {
          next[field.name] = '';
        }
        if (field.type === 'multi-reference' && field.dependsOn === name) {
          next[field.name] = [];
        }
        if (name === 'ownerUserId') {
          fields.forEach((f) => {
            if (f.ref === 'sub-users' && f.type === 'multi-reference') {
              next[f.name] = [];
            }
          });
        }
      });

      return next;
    });
  };

  const setGroupValue = (groupName, childName, nextValue) => {
    setValues((prev) => ({
      ...prev,
      [groupName]: {
        ...prev[groupName],
        [childName]: nextValue,
      },
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    const payload = { ...values, ...fixedValues };

    fields.forEach((field) => {
      if (field.type === 'password' && mode === 'edit' && !payload[field.name]) {
        delete payload[field.name];
      }
      if (field.type === 'date' && payload[field.name]) {
        payload[field.name] = new Date(payload[field.name]).toISOString();
      }
      if (field.type === 'datetime' && payload[field.name]) {
        payload[field.name] = new Date(payload[field.name]).toISOString();
      }
      if (field.type === 'reference' && payload[field.name] === '') {
        payload[field.name] = null;
      }
    });

    onSubmit(payload);
  };

  return (
    <form className="resource-form" onSubmit={handleSubmit}>
      {error && <div className="alert alert-error">{error}</div>}

      <div className="form-grid">
        {fields.map((field) => {
          if (field.type === 'group') {
            return (
              <fieldset key={field.name} className="form-group-box">
                <legend>{field.label}</legend>
                <div className="form-grid">
                  {field.fields.map((child) => (
                    <label key={child.name} className="form-field">
                      <span>{child.label}{child.required ? ' *' : ''}</span>
                      <FieldInput
                        field={child}
                        value={values[field.name]?.[child.name]}
                        onChange={(next) => setGroupValue(field.name, child.name, next)}
                      />
                    </label>
                  ))}
                </div>
              </fieldset>
            );
          }

          if (field.type === 'checkbox') {
            return (
              <div key={field.name} className="form-field checkbox-wrap">
                <FieldInput
                  field={field}
                  value={values[field.name]}
                  onChange={(next) => setFieldValue(field.name, next)}
                />
              </div>
            );
          }

          const isRequired = field.required || (field.requiredOnCreate && mode === 'create');
          const isWaitingOnDependency =
            (field.type === 'reference' || field.type === 'multi-reference') &&
            field.dependsOn &&
            !(values[field.dependsOn] ?? fixedValues[field.dependsOn]);

          return (
            <label key={field.name} className="form-field">
              <span>{field.label}{isRequired ? ' *' : ''}</span>
<FieldInput
  field={field}
  value={values[field.name]}
  referenceOptions={referenceData[field.name] || []}
  disabled={isWaitingOnDependency || mode === 'view'}
  onChange={(next) => setFieldValue(field.name, next)}
/>
            </label>
          );
        })}
      </div>

{mode !== 'view' && (
  <div className="form-actions">
    <button type="submit" className="btn btn-primary" disabled={submitting}>
      {submitting ? 'Saving...' : mode === 'create' ? 'Create' : 'Update'}
    </button>
  </div>
)}
    </form>
  );
}