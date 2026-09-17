import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { 
  FiPlus, 
  FiRefreshCw, 
  FiAlertCircle, 
  FiCheckCircle,
  FiEdit2,
  FiSearch,
  FiX,
  FiArrowLeft,
  FiUsers,
  FiBox,
  FiKey,
  FiFileText,
  FiFolder,
  FiLink,
  FiCpu,
  FiSliders,
  FiShield,
  FiLock,
  FiGrid,
  FiUser,
  FiUserPlus,
} from 'react-icons/fi';
import { FaCar, FaUserTie, FaUserFriends } from 'react-icons/fa';
import { resourceApis } from '../api/services.js';
import { getErrorMessage } from '../api/client.js';
import { getResourceByKey } from '../config/resources.js';
import { useAuth } from '../context/AuthContext.jsx';
import DataTable from '../components/DataTable.jsx';
import Modal from '../components/Modal.jsx';
import Pagination from '../components/Pagination.jsx';
import ResourceForm from '../components/ResourceForm.jsx';
import SubUserAccessPanel from '../components/SubuserAccessPanel.jsx';
import LicenseStats from '../components/LicenseStats.jsx';
import "./Resourcepage.css";
import UserAccessPanel from '../components/UserAccessPanel.jsx';

// Map emoji/string icons to React Icon components
const iconMap = {
  '👤': <FiUser />,
  '👥': <FiUsers />,
  '🧑‍💼': <FaUserTie />,
  '📦': <FiBox />,
  '🔑': <FiKey />,
  '📜': <FiFileText />,
  '🚗': <FaCar />,
  '🗂️': <FiFolder />,
  '🔗': <FiLink />,
  '📡': <FiCpu />,
  '🔀': <FiSliders />,
  '🛡️': <FiShield />,
  '🔐': <FiLock />,
  'users': <FiUsers />,
  'sub-users': <FaUserFriends />,
  'dealers': <FaUserTie />,
  'license-packages': <FiBox />,
  'licenses': <FiKey />,
  'license-histories': <FiFileText />,
  'vehicles': <FaCar />,
  'vehicle-groups': <FiFolder />,
  'vehicle-group-members': <FiLink />,
  'devices': <FiCpu />,
  'device-assignments': <FiSliders />,
  'user-access': <FiShield />,
  'resource-access': <FiLock />,
};

const getResourceIcon = (resource) => {
  if (!resource) return <FiGrid />;
  
  if (resource.icon) {
    if (typeof resource.icon === 'string') {
      if (iconMap[resource.icon]) {
        return iconMap[resource.icon];
      }
      if (iconMap[resource.key]) {
        return iconMap[resource.key];
      }
      const titleKey = resource.title?.toLowerCase().replace(/\s+/g, '-');
      if (iconMap[titleKey]) {
        return iconMap[titleKey];
      }
    }
    if (React.isValidElement(resource.icon)) {
      return resource.icon;
    }
  }
  
  if (iconMap[resource.key]) {
    return iconMap[resource.key];
  }
  
  return <FiGrid />;
};

export default function ResourcePage() {
  const { user } = useAuth();
  const { resourceKey } = useParams();
  const resource = getResourceByKey(resourceKey);
  const api = resourceApis[resourceKey] || (() => {
  // If the resource uses 'users' as the entityName, use the users API
  if (resource?.entityName === 'User' || resource?.entityName === 'Employee' || resource?.entityName === 'Dealer' || resource?.entityName === 'Sub User') {
    return resourceApis.users;
  }
  return null;
})();
  const [searchParams] = useSearchParams();
  const [rows, setRows] = useState([]);
  const [meta, setMeta] = useState(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');

  // State for dealer users modal
  const [usersModalOpen, setUsersModalOpen] = useState(false);
  const [dealerUsers, setDealerUsers] = useState([]);
  const [dealerUsersLoading, setDealerUsersLoading] = useState(false);
  const [selectedDealer, setSelectedDealer] = useState(null);

  const navigate = useNavigate();

  // Get dealerFilter from URL params
  const dealerFilter = searchParams.get('dealerId');

  // Check if current user is a regular USER
  const isUser = user?.role === 'USER';
  const isDealer = user?.role === 'DEALER';
  const isAdmin = user?.role === 'ADMIN';
  const isSubUser = user?.role === 'SUB_USER';

  // Then in the return section, before the panel, add:
{resourceKey === 'license-packages' && isDealer && (
  <LicenseStats dealerId={user?.dealerId} />
)}

// Or if you want to show it for both ADMIN and DEALER:
{resourceKey === 'license-packages' && (
  <LicenseStats dealerId={isDealer ? user?.dealerId : null} />
)}

const canEditResource = resource?.editableBy
  ? resource.editableBy.includes(user?.role)
  : !isUser && !Boolean(resource?.readOnly || resource?.readOnlyForRoles?.includes(user?.role));

const canViewResource = resource?.viewableBy
  ? resource.viewableBy.includes(user?.role)
  : canEditResource;

const hideActionsForUser = (!canEditResource && !canViewResource) || (isSubUser && resourceKey === 'licenses');

  // Helper function to check if user can create this resource
// Helper function to check if user can create this resource
const canCreateResource = (resource, user) => {
  // SUB_USER cannot create anything
  if (user?.role === 'SUB_USER') return false;
  
  if (!resource?.creatable) return false;
  if (resource.readOnlyForRoles?.includes(user?.role)) return false;
  if (resource.readOnly) return false;
  
  // Check creatableBy array
  if (resource.creatableBy) {
    return resource.creatableBy.includes(user?.role);
  }
  
  // Check roles array (default)
  if (resource.roles) {
    return resource.roles.includes(user?.role);
  }
  
  return true;
};


// const openView = async (row) => {
//   setModalMode('view');
//   setFormError('');
//   setSelectedRecord(null);
//   setModalOpen(true);

//   try {
//     const res = await api.getById(row._id);
//     let record = res.data.data;

//     if (resourceKey === 'vehicle-groups') {
//       // reuse the same enrichment logic as openEdit
//       try {
//         const membersRes = await resourceApis['vehicle-group-members'].getAll({ groupId: row._id, limit: 1000 });
//         const memberVehicleIds = (membersRes.data.data || [])
//           .map((m) => (typeof m.vehicleId === 'object' ? m.vehicleId?._id : m.vehicleId))
//           .filter(Boolean);
//         record = { ...record, vehicleIds: memberVehicleIds };

//         const accessRes = await resourceApis['resource-access'].getAll({
//           resourceType: 'VEHICLE_GROUP',
//           resourceId: row._id,
//           limit: 1000,
//         });
//         const subUserIds = (accessRes.data.data || [])
//           .map((a) => (typeof a.sharedUserId === 'object' ? a.sharedUserId?._id : a.sharedUserId))
//           .filter(Boolean);
//         record = { ...record, subUserAccessIds: subUserIds };
//       } catch (err) {
//         console.error('Error loading vehicle group data:', err);
//       }
//     }

//     setSelectedRecord(record);
//   } catch (err) {
//     setFormError(getErrorMessage(err));
//     setSelectedRecord(row);
//   }
// };
  // Function to fetch users for a specific dealer
 
  const fetchDealerUsers = async (dealer) => {
    setSelectedDealer(dealer);
    setUsersModalOpen(true);
    setDealerUsersLoading(true);
    
    try {
      const res = await resourceApis.users.getAll({
        dealerId: dealer._id,
        role: 'USER'
      });
      setDealerUsers(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDealerUsersLoading(false);
    }
  };

  // Function to refresh dealer users
  const refreshDealerUsers = useCallback(async () => {
    if (!selectedDealer) return;
    
    setDealerUsersLoading(true);
    try {
      const res = await resourceApis.users.getAll({
        dealerId: selectedDealer._id,
        role: 'USER'
      });
      setDealerUsers(res.data.data || []);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDealerUsersLoading(false);
    }
  }, [selectedDealer]);

  // Handle delete from dealer users modal
  const handleDeleteDealerUser = async (row) => {
    const confirmed = window.confirm(`Delete user "${row.username}"?`);
    if (!confirmed) return;

    try {
      await resourceApis.users.remove(row._id);
      showToast('User deleted successfully');
      await refreshDealerUsers();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  // Extra action for dealers - View Users button (hide for USER role)
  const extraAction = resource?.key === 'dealers' && !isUser
    ? {
        label: 'View Users',
        onClick: (row) => fetchDealerUsers(row),
        render: (row) => (
          <span className="view-users-btn-content">
            <FiUsers className="btn-icon" />
            <span className="btn-text">View Users</span>
            <span className={`badge-count ${(row?.userCount || 0) > 0 ? 'has-users' : 'no-users'}`}>
              {row?.userCount || 0}
            </span>
          </span>
        )
      }
    : undefined;

// Add this function to count users for each dealer
const countUsersForDealers = useCallback(async (dealers) => {
  if (!dealers || dealers.length === 0) return dealers;
  
  try {
    // Fetch all users
    const usersRes = await resourceApis.users.getAll({
      role: 'USER',
      limit: 1000 // Get all users
    });
    
    const users = usersRes.data.data || [];
    
    // Count users per dealer
    const userCountMap = {};
    users.forEach(user => {
      if (user.dealerId) {
        const dealerId = typeof user.dealerId === 'object' ? user.dealerId._id : user.dealerId;
        if (dealerId) {
          userCountMap[dealerId] = (userCountMap[dealerId] || 0) + 1;
        }
      }
    });
    
    // Add userCount to each dealer
    return dealers.map(dealer => ({
      ...dealer,
      userCount: userCountMap[dealer._id] || 0
    }));
  } catch (err) {
    console.error('Error counting users:', err);
    return dealers;
  }
}, []);

const loadData = useCallback(async () => {
  if (!api) return;
  setLoading(true);
  setError('');
  try {
    const params = {
      page,
      limit: 10,
      ...(resource?.listParams || {}),
      ...(dealerFilter ? { dealerId: dealerFilter } : {}),
    };
    if (search && resource?.searchable) params.search = search;

// In ResourcePage.jsx, update the loadData function for SUB_USER licenses

// For SUB_USER viewing licenses - show licenses of the USERs who approved them
if (resourceKey === 'licenses' && isSubUser && user?._id) {
  try {
    // Get all user_access records where sharedUserId = subuser._id and status = ACTIVE
    const accessRes = await resourceApis['user-access'].getAll({
      sharedUserId: user._id,
      status: 'ACTIVE',
      limit: 1000
    });
    
    const accessRecords = accessRes.data.data || [];
    console.log('User Access records for subuser:', accessRecords);
    
    // Get owner user IDs (the USERs who approved this subuser)
    const ownerUserIds = accessRecords.map(record => 
      typeof record.ownerUserId === 'object' ? record.ownerUserId._id : record.ownerUserId
    ).filter(Boolean);
    
    console.log('Owner User IDs:', ownerUserIds);
    
    if (ownerUserIds.length > 0) {
      // Show licenses where userId is in the ownerUserIds list
      params.userId = { $in: ownerUserIds };
    } else {
      // No access, return empty
      console.log('No owner user IDs found, returning empty');
      setRows([]);
      setMeta({ total: 0, page, limit: 10 });
      setLoading(false);
      return;
    }
  } catch (err) {
    console.error('Error fetching user access for subuser licenses:', err);
    setRows([]);
    setMeta({ total: 0, page, limit: 10 });
    setLoading(false);
    return;
  }
}

    // For SUB_USER viewing vehicles - show vehicles from owners who approved them
    if (resourceKey === 'vehicles' && isSubUser && user?._id) {
      try {
        const accessRes = await resourceApis['user-access'].getAll({
          sharedUserId: user._id,
          status: 'ACTIVE',
          limit: 1000
        });
        
        const accessRecords = accessRes.data.data || [];
        const ownerUserIds = accessRecords.map(record => 
          typeof record.ownerUserId === 'object' ? record.ownerUserId._id : record.ownerUserId
        ).filter(Boolean);
        
        if (ownerUserIds.length > 0) {
          params.ownerUserId = { $in: ownerUserIds };
        } else {
          setRows([]);
          setMeta({ total: 0, page, limit: 10 });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching user access for subuser:', err);
        setRows([]);
        setMeta({ total: 0, page, limit: 10 });
        setLoading(false);
        return;
      }
    }

    // For SUB_USER viewing vehicle groups - show groups from owners who approved them
    if (resourceKey === 'vehicle-groups' && isSubUser && user?._id) {
      try {
        const accessRes = await resourceApis['user-access'].getAll({
          sharedUserId: user._id,
          status: 'ACTIVE',
          limit: 1000
        });
        
        const accessRecords = accessRes.data.data || [];
        const ownerUserIds = accessRecords.map(record => 
          typeof record.ownerUserId === 'object' ? record.ownerUserId._id : record.ownerUserId
        ).filter(Boolean);
        
        if (ownerUserIds.length > 0) {
          params.ownerUserId = { $in: ownerUserIds };
        } else {
          setRows([]);
          setMeta({ total: 0, page, limit: 10 });
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error fetching user access for subuser:', err);
        setRows([]);
        setMeta({ total: 0, page, limit: 10 });
        setLoading(false);
        return;
      }
    }

    // For sub-users - filter based on role
    if (resourceKey === 'sub-users' && isUser && user?._id) {
      params.parentId = user._id;
    }

    const res = await api.getAll(params);
    let data = [];
    let metadata = null;
    
    // Handle different response structures
    if (res.data.data) {
      if (Array.isArray(res.data.data)) {
        data = res.data.data;
        metadata = res.data.meta || { total: res.data.data.length, page, limit: 10 };
      } else {
        data = res.data.data.data || [];
        metadata = res.data.data.meta || null;
      }
    } else if (res.data && Array.isArray(res.data)) {
      data = res.data;
      metadata = { total: res.data.length, page, limit: 10 };
    } else {
      data = [];
      metadata = { total: 0, page, limit: 10 };
    }
    
    // If filtering didn't work on backend, filter on frontend
    if (resourceKey === 'sub-users' && isUser && user?._id) {
      const filteredData = data.filter(item => {
        const itemParentId = typeof item.parentId === 'object' ? item.parentId?._id : item.parentId;
        const itemReferredBy = typeof item.referredByUserId === 'object' ? item.referredByUserId?._id : item.referredByUserId;
        const itemOwner = typeof item.ownerUserId === 'object' ? item.ownerUserId?._id : item.ownerUserId;
        return itemParentId === user._id || itemReferredBy === user._id || itemOwner === user._id;
      });
      
      if (filteredData.length !== data.length) {
        data = filteredData;
        if (metadata) {
          metadata.total = data.length;
        }
      }
    }
    
    // For sub-users, fetch the owner user details to display username
    if (resourceKey === 'sub-users') {
      // ... existing sub-users enrichment code
    }
    
    // If this is the dealers resource, count users for each dealer
    if (resourceKey === 'dealers') {
      const dealersWithCount = await countUsersForDealers(data);
      setRows(dealersWithCount);
    } else {
      setRows(data);
    }
    
    setMeta(metadata);
  } catch (err) {
    setError(getErrorMessage(err));
    setRows([]);
    setMeta({ total: 0, page, limit: 10 });
  } finally {
    setLoading(false);
  }
}, [api, page, search, resource?.searchable, resource?.listParams, dealerFilter, resourceKey, countUsersForDealers, isUser, isSubUser, user]);


useEffect(() => {
    setPage(1);
    setSearch('');
  }, [resourceKey]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const showToast = (message) => {
    setToast(message);
    setTimeout(() => setToast(''), 3000);
  };

  const openCreate = () => {
    setModalMode('create');
    setSelectedRecord(null);
    setFormError('');
    setModalOpen(true);
  };


const openView = async (row) => {
  setModalMode('view');
  setFormError('');
  setSelectedRecord(null);
  setModalOpen(true);

  try {
    const res = await api.getById(row._id);
    let record = res.data.data;

    if (resourceKey === 'vehicle-groups') {
      try {
        // Load vehicle members for THIS SPECIFIC group
        const membersRes = await resourceApis['vehicle-group-members'].getAll({ 
          groupId: row._id, 
          limit: 1000 
        });
        const memberVehicleIds = (membersRes.data.data || [])
          .map((m) => (typeof m.vehicleId === 'object' ? m.vehicleId?._id : m.vehicleId))
          .filter(Boolean);
        record = { ...record, vehicleIds: memberVehicleIds };

        // Load sub-user access for THIS SPECIFIC group ONLY
        const accessRes = await resourceApis['resource-access'].getAll({
          resourceType: 'VEHICLE_GROUP',
          resourceId: row._id,  // THIS IS THE CRITICAL PART - filter by group ID
          limit: 1000,
        });
        
        console.log('Access records for group', row._id, ':', accessRes.data.data);
        
        const subUserIds = (accessRes.data.data || [])
          .map((a) => {
            // Handle both object and string IDs
            const sharedUserId = typeof a.sharedUserId === 'object' 
              ? a.sharedUserId?._id 
              : a.sharedUserId;
            return sharedUserId;
          })
          .filter(Boolean);
        
        console.log('Extracted sub-user IDs:', subUserIds);
        record = { ...record, subUserAccessIds: subUserIds };
        
      } catch (err) {
        console.error('Error loading vehicle group data:', err);
      }
    }

    setSelectedRecord(record);
  } catch (err) {
    setFormError(getErrorMessage(err));
    setSelectedRecord(row);
  }
};

const openEdit = async (row) => {
  setModalMode('edit');
  setFormError('');
  setSelectedRecord(null);
  setModalOpen(true);

  try {
    const res = await api.getById(row._id);
    let record = res.data.data;

    if (resourceKey === 'vehicle-groups') {
      try {
        // Load vehicle members for THIS SPECIFIC group
        const membersRes = await resourceApis['vehicle-group-members'].getAll({
          groupId: row._id,
          limit: 1000,
        });
        const memberVehicleIds = (membersRes.data.data || [])
          .map((member) => (typeof member.vehicleId === 'object' ? member.vehicleId?._id : member.vehicleId))
          .filter(Boolean);
        record = { ...record, vehicleIds: memberVehicleIds };

        // Load sub-user access for THIS SPECIFIC group ONLY
        const accessRes = await resourceApis['resource-access'].getAll({
          resourceType: 'VEHICLE_GROUP',
          resourceId: row._id,  // THIS IS THE CRITICAL PART - filter by group ID
          limit: 1000
        });
        
        console.log('Access records for group', row._id, ':', accessRes.data.data);
        
        const subUserIds = (accessRes.data.data || [])
          .map((access) => {
            const sharedUserId = typeof access.sharedUserId === 'object' 
              ? access.sharedUserId?._id 
              : access.sharedUserId;
            return sharedUserId;
          })
          .filter(Boolean);
        
        console.log('Extracted sub-user IDs:', subUserIds);
        record = { ...record, subUserAccessIds: subUserIds };
        
      } catch (err) {
        console.error('Error loading vehicle group data:', err);
      }
    }

    setSelectedRecord(record);
  } catch (err) {
    setFormError(getErrorMessage(err));
    setSelectedRecord(row);
  }
};

  const handleDelete = async (row) => {
    const confirmed = window.confirm(`Delete this ${resource.title.slice(0, -1).toLowerCase()} record?`);
    if (!confirmed) return;

    try {
      await api.remove(row._id);
      showToast('Record deleted successfully');
      loadData();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const formFields = resource?.fields
    ?.filter((field) => !((isDealer || isUser) && field.name === 'dealerId'))
    .filter((field) => !(isUser && field.name === 'ownerUserId'))
    .filter((field) => !field.hideForRoles?.includes(user?.role)) || [];

  const effectiveFixedValues = {
    ...resource?.fixedValues,
  };

  // When the dealerId field is hidden because the current user IS the
  // dealer, other fields (ownerUserId/packageId/deviceId) still declare
  // `dependsOn: 'dealerId'` so their dropdowns can be scoped correctly.
  // Without this, those dropdowns have no dealerId to key off at all and
  // just sit empty/disabled forever, in both create and edit.
  if (isDealer && user?._id) {
    effectiveFixedValues.dealerId = user._id;
  }

  // A plain USER isn't picking a dealer or an owner — they belong to a
  // dealer already, and they ARE the owner. Fill both in from their own
  // account so resources like Vehicle Groups (which a user can create for
  // their own vehicles) work without those hidden fields.
  if (isUser) {
    const ownDealerId = typeof user?.dealerId === 'object' ? user?.dealerId?._id : user?.dealerId;
    if (ownDealerId) {
      effectiveFixedValues.dealerId = ownDealerId;
    }
    if (user?._id) {
      effectiveFixedValues.ownerUserId = user._id;
    }
  }

  // Vehicle Group membership lives in the separate vehicle_group_members
  // join table, so saving a group's chosen vehicle list means diffing
  // against whatever's already there: create rows for newly-checked
  // vehicles, delete rows for unchecked ones, leave the rest untouched.
const syncVehicleGroupMembers = async (groupId, desiredVehicleIds) => {
  try {
    // Get existing members for this group
    const existingRes = await resourceApis['vehicle-group-members'].getAll({ 
      groupId, 
      limit: 1000 
    });
    const existing = existingRes.data.data || [];

    // Create maps for comparison
    const existingByVehicleId = {};
    existing.forEach((member) => {
      const vehicleId = typeof member.vehicleId === 'object' 
        ? member.vehicleId?._id 
        : member.vehicleId;
      if (vehicleId) {
        existingByVehicleId[vehicleId] = member;
      }
    });

    const desiredSet = new Set(desiredVehicleIds || []);
    const existingSet = new Set(Object.keys(existingByVehicleId));

    // Find IDs to add (in desired but not in existing)
    const toAdd = desiredVehicleIds?.filter(id => !existingSet.has(id)) || [];

    // Find records to remove (in existing but not in desired)
    const toRemove = existing.filter(member => {
      const vehicleId = typeof member.vehicleId === 'object' 
        ? member.vehicleId?._id 
        : member.vehicleId;
      return vehicleId && !desiredSet.has(vehicleId);
    });

    console.log('Sync vehicle members:', {
      groupId,
      desiredVehicleIds,
      existingCount: existing.length,
      toAdd: toAdd.length,
      toRemove: toRemove.length
    });

    // Add new members
    const addPromises = toAdd.map((vehicleId) => 
      resourceApis['vehicle-group-members'].create({ 
        groupId, 
        vehicleId 
      })
    );

    // Remove members that are no longer in the group
    const removePromises = toRemove.map((member) => 
      resourceApis['vehicle-group-members'].remove(member._id)
    );

    // Execute all operations
    await Promise.all([...addPromises, ...removePromises]);
    
    console.log(`Synced vehicle members: added ${toAdd.length}, removed ${toRemove.length}`);
  } catch (err) {
    console.error('Error syncing vehicle group members:', err);
    setError(getErrorMessage(err));
  }
};


const syncGroupSubUserAccess = async (groupId, desiredSubUserIds, context) => {
  try {
    // Get existing access records for this group
    const existingRes = await resourceApis['resource-access'].getAll({
      resourceType: 'VEHICLE_GROUP',
      resourceId: groupId,
      limit: 1000,
    });
    const existing = existingRes.data.data || [];

    // Create a map of existing access by sharedUserId
    const existingBySharedUserId = {};
    existing.forEach((access) => {
      const sharedUserId = typeof access.sharedUserId === 'object' 
        ? access.sharedUserId?._id 
        : access.sharedUserId;
      if (sharedUserId) {
        existingBySharedUserId[sharedUserId] = access;
      }
    });

    // Create sets for comparison
    const desiredSet = new Set(desiredSubUserIds || []);
    const existingSet = new Set(Object.keys(existingBySharedUserId));

    // Find IDs to add (in desired but not in existing)
    const toAdd = desiredSubUserIds?.filter(id => !existingSet.has(id)) || [];

    // Find IDs to remove (in existing but not in desired)
    const toRemove = existing.filter(access => {
      const sharedUserId = typeof access.sharedUserId === 'object' 
        ? access.sharedUserId?._id 
        : access.sharedUserId;
      return sharedUserId && !desiredSet.has(sharedUserId);
    });

    console.log('Sync sub-user access:', {
      groupId,
      desiredSubUserIds,
      existingCount: existing.length,
      toAdd: toAdd.length,
      toRemove: toRemove.length
    });

    // Add new access records
    const addPromises = toAdd.map((sharedUserId) =>
      resourceApis['resource-access'].create({
        dealerId: context.dealerId,
        ownerUserId: context.ownerUserId,
        sharedUserId,
        resourceType: 'VEHICLE_GROUP',
        resourceId: groupId,
        permissions: {
          tracking: true,
          playback: true,
          reports: true,
          history: true,
          commands: false,
        },
        status: 'ACTIVE',
        createdBy: context.createdBy,
      })
    );

    // Remove access records that are no longer needed
    const removePromises = toRemove.map((access) => 
      resourceApis['resource-access'].remove(access._id)
    );

    // Execute all operations
    await Promise.all([...addPromises, ...removePromises]);
    
    console.log(`Synced sub-user access: added ${toAdd.length}, removed ${toRemove.length}`);
  } catch (err) {
    console.error('Error syncing sub-user access for group:', err);
    setError(getErrorMessage(err));
  }
};

const handleSubmit = async (payload) => {
  setSubmitting(true);
  setFormError('');

  const data = { ...payload };
  
  // vehicleIds and subUserAccessIds are form-only fields for picking
  // group membership / sub-user access — they don't live on the
  // vehicle-group document itself, so strip both before saving.
  const vehicleIdsForGroup = resourceKey === 'vehicle-groups' ? data.vehicleIds || [] : null;
  const subUserIdsForGroup = resourceKey === 'vehicle-groups' ? data.subUserAccessIds || [] : null;
  if (resourceKey === 'vehicle-groups') {
    delete data.vehicleIds;
    delete data.subUserAccessIds;
  }

  // Always ensure createdBy is set for vehicle groups
  if (resourceKey === 'vehicle-groups') {
    if (!data.createdBy && user?._id) {
      data.createdBy = user._id;
    }
    if (!data.createdBy && data.ownerUserId) {
      data.createdBy = data.ownerUserId;
    }
  }

  // For sub-users
  if (resourceKey === 'sub-users') {
    if (isUser && user?._id) {
      // USER: auto-set dealerId and parentId to themselves
      const ownDealerId = typeof user?.dealerId === 'object' ? user?.dealerId?._id : user?.dealerId;
      if (ownDealerId) {
        data.dealerId = ownDealerId;
      }
      data.parentId = user._id;
      data.referredByUserId = user._id;
      data.createdBy = user._id;
      // USER-created sub-users: PENDING in user table
      data.status = 'PENDING';
      data.approvalStatus = 'PENDING';
      data.approvedBy = null;
      data.approvedAt = null;
      data.canLogin = true;
      data.role = 'SUB_USER';
      // Flag to create User Access after creation
      data._createUserAccess = true;
      data._userAccessStatus = 'PENDING';
    }
    
    if (isAdmin) {
      // ADMIN: parentId is selected in the form
      if (data.parentId) {
        data.referredByUserId = data.parentId;
      }
      data.createdBy = user._id;
      
      // ADMIN-created sub-users: ACTIVE in user table
      data.status = 'ACTIVE';
      data.approvalStatus = 'APPROVED';
      data.approvedBy = user._id;
      data.approvedAt = new Date().toISOString();
      data.canLogin = true;
      data.role = 'SUB_USER';
      
      // Flag to create User Access record after sub-user creation
      data._createUserAccess = true;
      data._userAccessStatus = 'PENDING';
    }
  }

  // For other resources, set createdBy, activatedBy, assignedBy if needed
  if (modalMode === 'create' && user?._id) {
    ['createdBy', 'activatedBy', 'assignedBy'].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(data, field) && !data[field]) {
        data[field] = user._id;
      }
    });
  }

  console.log('Submitting data:', data); // Debug log

  try {
    let savedRecord;
    if (modalMode === 'create') {
      // STEP 1: Create the sub-user in the User table
      const res = await api.create(data);
      savedRecord = res.data.data;
      
      // STEP 2: Create User Access record for this sub-user
      if (resourceKey === 'sub-users' && data._createUserAccess && savedRecord?._id) {
        try {
          // Get the owner user ID (the USER who owns this sub-user)
          const ownerUserId = data.parentId || user._id;
          
          // Get dealerId - handle both object and string cases
          let dealerId = data.dealerId || (isUser ? user?.dealerId : null);
          
          // If dealerId is an object, extract the _id
          if (dealerId && typeof dealerId === 'object') {
            dealerId = dealerId._id || dealerId;
          }
          
          // If dealerId is still null, try to get it from the logged-in user
          if (!dealerId && user?.dealerId) {
            dealerId = typeof user.dealerId === 'object' ? user.dealerId._id : user.dealerId;
          }
          
          // Check if we have all required data
          if (!dealerId) {
            console.error('Missing dealerId for user access:', { data, user });
            showToast('Warning: Could not create access record. Dealer ID missing.');
            return;
          }
          
          if (!ownerUserId) {
            console.error('Missing ownerUserId for user access:', { data, user });
            showToast('Warning: Could not create access record. Owner ID missing.');
            return;
          }
          
          if (!savedRecord._id) {
            console.error('Missing sharedUserId for user access:', { savedRecord });
            showToast('Warning: Could not create access record. Sub-user ID missing.');
            return;
          }
          
          // Prepare user access data with all required fields
          // Use 'PENDING' for admin-created (needs user approval), 'ACTIVE' for user-created
          const userAccessStatus = isAdmin ? 'PENDING' : 'ACTIVE';
          
          const userAccessData = {
            dealerId: dealerId,
            ownerUserId: ownerUserId,
            sharedUserId: savedRecord._id,
            permissions: {
              dashboard: true,
              liveTracking: true,
              playback: true,
              reports: true,
              alerts: true,
              settings: false
            },
            status: userAccessStatus,
            createdBy: data.createdBy || user._id
          };
          
          console.log('Creating User Access record:', JSON.stringify(userAccessData, null, 2));
          
          // Create the user access record
          const accessRes = await resourceApis['user-access'].create(userAccessData);
          console.log('User Access record created:', accessRes.data);
          
          showToast(isAdmin ? 'Sub-user created with pending access request' : 'Sub-user created successfully');
        } catch (accessErr) {
          console.error('Error creating user access:', accessErr);
          console.error('Error response:', accessErr.response?.data);
          console.error('Error status:', accessErr.response?.status);
          // Don't fail the whole operation
          showToast('Sub-user created but access request failed: ' + (accessErr.response?.data?.message || accessErr.message));
        }
      } else {
        showToast('Record created successfully');
      }
    } else {
      // Update existing record
      const res = await api.update(selectedRecord._id, data);
      savedRecord = res.data.data;
      showToast('Record updated successfully');
    }

    // Sync vehicle-group membership + sub-user access — both live in
    // separate join tables, so they're diffed/synced here rather than
    // being sent as fields on the vehicle-group document itself.
    if (resourceKey === 'vehicle-groups' && savedRecord?._id) {
      await syncVehicleGroupMembers(savedRecord._id, vehicleIdsForGroup || []);
      await syncGroupSubUserAccess(savedRecord._id, subUserIdsForGroup || [], {
        dealerId: data.dealerId,
        ownerUserId: data.ownerUserId || data.createdBy,
        createdBy: data.createdBy || user._id,
      });
    }

    setModalOpen(false);
    
    if (usersModalOpen && selectedDealer) {
      await refreshDealerUsers();
    }
    
    loadData();
  } catch (err) {
    const errorMessage = getErrorMessage(err);
    setFormError(errorMessage);
    console.error('Submit error:', err);
  } finally {
    setSubmitting(false);
  }
};

  if (!resource) {
    return (
      <div className="page">
        <div className="alert alert-error">
          <FiAlertCircle className="alert-icon" />
          <div className="alert-content">
            <h3>Resource Not Found</h3>
            <p>The requested resource could not be found.</p>
          </div>
        </div>
      </div>
    );
  }

if (resource.roles && !resource.roles.includes(user?.role)) {
  return (
    <div className="page">
      <div className="alert alert-error">
        <FiShield className="alert-icon" />
        <div className="alert-content">
          <h3>Access Denied</h3>
          <p>You don't have access to this section.</p>
        </div>
      </div>
    </div>
  );
}

if (resource?.component === 'UserAccessPanel' && isUser) {
  return <UserAccessPanel 
    user={user} 
    resourceIcon={getResourceIcon(resource)} 
    resource={resource}
  />;
}

  // USER accounts don't manage User Access via the generic create/edit form
  // — access is granted implicitly by toggling one of their approved
  // sub-users on/off, which inserts/removes the matching User Access record
  // for them. ADMIN/DEALER still get the standard table+form below.
  if (resourceKey === 'user-access' && isUser) {
    return <SubUserAccessPanel 
      user={user} 
      resourceIcon={getResourceIcon(resource)} 
      resource={resource}
      isUser={isUser} // Pass the isUser flag
    />;
  }

  const resourceIcon = getResourceIcon(resource);

  return (
    <div className="page">
      {toast && (
        <div className="toast">
          <FiCheckCircle className="toast-icon" />
          {toast}
        </div>
      )}

      <header className="page-header">
        <div className="page-header-content">
          <div className="page-title-group">
            {dealerFilter && (
              <button 
                className="btn btn-secondary btn-sm back-button"
                onClick={() => navigate('/resources/dealers')}
              >
                <FiArrowLeft /> Back to Dealers
              </button>
            )}
            <h1>
              <span className="resource-icon">{resourceIcon}</span>
              {dealerFilter ? `Users for Dealer` : resource.title}
              {dealerFilter && (
                <span className="badge badge-info">
                  <FiUser /> Filtered by Dealer
                </span>
              )}
            </h1>
            <p>{dealerFilter ? `Showing users belonging to the selected dealer` : resource.description}</p>
          </div>
          {/* Show Add New button only if:
              1. Not read-only for this user
              2. Resource has creatable: true
              3. User has appropriate role based on resource configuration
          */}
          {canCreateResource(resource, user) && (
            <button type="button" className="btn btn-primary" onClick={openCreate}>
              <FiPlus /> Add New
            </button>
          )}
        </div>
      </header>

         {/* Show License Stats for License Packages page */}
    {resourceKey === 'license-packages' && (
      <LicenseStats dealerId={isDealer ? user?.dealerId : null} />
    )}

      <section className="panel">
        <div className="toolbar">
          <div className="toolbar-left">
            {resource.searchable && (
              <div className="search-wrapper">
                <input
                  className="input search-input"
                  placeholder={`Search ${resource.title.toLowerCase()}...`}
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(1);
                  }}
                />
                {search && (
                  <button 
                    className="search-clear"
                    onClick={() => setSearch('')}
                    aria-label="Clear search"
                  >
                    <FiX />
                  </button>
                )}
              </div>
            )}
          </div>
          <div className="toolbar-right">
            <span className="record-count">
              {meta?.total || 0} records
            </span>
            <button type="button" className="btn btn-secondary" onClick={loadData}>
              <FiRefreshCw className={loading ? 'spinning' : ''} /> Refresh
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-error">
            <FiAlertCircle className="alert-icon" />
            <div className="alert-content">
              <h3>Error</h3>
              <p>{error}</p>
            </div>
          </div>
        )}

<DataTable
  columns={resource.columns}
  rows={rows}
  loading={loading}
  onEdit={canEditResource ? openEdit : null}
  onView={canViewResource ? openView : null}
  onDelete={handleDelete}
  extraAction={extraAction}
  hideActions={hideActionsForUser}
/>

        <Pagination meta={meta} onPageChange={setPage} />
      </section>

      <Modal
  open={modalOpen}
  title={
    <div className="modal-title">
      <span className="modal-icon">
        {modalMode === 'create' ? <FiUserPlus /> : modalMode === 'view' ? <FiSearch /> : <FiEdit2 />}
      </span>
      {modalMode === 'create'
        ? `Create ${resource.title.slice(0, -1)}`
        : modalMode === 'view'
        ? `View ${resource.title.slice(0, -1)}`
        : `Edit ${resource.title.slice(0, -1)}`}
    </div>
  }
  onClose={() => setModalOpen(false)}
  wide
>
  <ResourceForm
    fields={formFields}
    record={selectedRecord}
    mode={modalMode}
    submitting={submitting}
    error={formError}
    onSubmit={handleSubmit}
    fixedValues={effectiveFixedValues}
  />
</Modal>

      {/* Users List Modal for Dealers */}
      <Modal
        open={usersModalOpen}
        title={
          <div className="modal-title">
            <span className="modal-icon"><FiUsers /></span>
            Users for Dealer: {selectedDealer?.name || selectedDealer?.username}
          </div>
        }
        onClose={() => {
          setUsersModalOpen(false);
          setDealerUsers([]);
          setSelectedDealer(null);
        }}
        wide
      >
        {dealerUsersLoading ? (
          <div className="table-loading">
            <div className="spinner" />
            <span>Loading users...</span>
          </div>
        ) : dealerUsers.length === 0 ? (
          <div className="empty-state">No users found for this dealer.</div>
        ) : (
          <>
            <div className="modal-table-info">
              <span>Total Users: {dealerUsers.length}</span>
            </div>
            <DataTable
              columns={[
                { key: 'username', label: 'Username' },
                { key: 'name', label: 'Name' },
                { key: 'email', label: 'Email' },
                { key: 'phoneNumber', label: 'Phone' },
                { key: 'status', label: 'Status' },
              ]}
              rows={dealerUsers}
              loading={false}
              onEdit={() => {}}
              onDelete={handleDeleteDealerUser}
              // Hide actions for USER role in the modal too
              hideActions={isUser}
            />
          </>
        )}
      </Modal>
    </div>
  );
}