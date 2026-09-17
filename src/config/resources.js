import {
  UserRole,
  EmploymentType,
  Occupation,
  EntityStatus,
  OnboardingType,
  DurationUnit,
  DeviceStatus,
  ResourceType,
} from './enums.js';
import { getRefLabel } from '../utils/formatters.js';

const idField = (name, label, ref, required = false) => ({
  name,
  label,
  type: 'reference',
  ref,
  required,
});

const employeeDealerField = (name, label, ref, required = false) => ({
  name,
  label,
  type: 'reference',
  ref,
  required,
  refParams: { role: 'DEALER' },
  customOptions: async () => {
    return [];
  }
});

export const resources = [
  {
    key: 'users',
    title: 'Create Users',
    entityName: 'User',
    description: 'Manage system users, dealers, and staff',
    icon: '👤',
    roles: ['ADMIN', 'DEALER'],
    fixedValues: { role: 'USER' },
    listParams: { role: 'USER' },
    searchable: true,
    creatable: true,
    creatableBy: ['ADMIN', 'DEALER'],
    columns: [
      { key: 'username', label: 'Username' },
      { key: 'name', label: 'Name' },
      { key: 'role', label: 'Role' },
      { key: 'dealerId', label: 'Dealer' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { ...idField('dealerId', 'Dealer', 'users'), refParams: { role: 'DEALER' } },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', requiredOnCreate: true, minLength: 6 },
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'employmentType', label: 'Employment Type', type: 'select', options: EmploymentType, hideForRoles: ['DEALER', 'ADMIN'] },
      { name: 'occupation', label: 'Occupation', type: 'select', options: Occupation, hideForRoles: ['DEALER', 'ADMIN'] },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', minLength: 10, maxLength: 10 },
      { name: 'status', label: 'Status', type: 'select', options: EntityStatus, defaultValue: 'ACTIVE' },
      { name: 'onboardingType', label: 'Onboarding Type', type: 'select', options: OnboardingType, hideForRoles: ['DEALER', 'ADMIN'] },
      {
        name: 'address',
        label: 'Address',
        type: 'group',
        fields: [
          { name: 'addressLine1', label: 'Address Line 1', type: 'text' },
          { name: 'addressLine2', label: 'Address Line 2', type: 'text' },
          { name: 'city', label: 'City', type: 'text' },
          { name: 'state', label: 'State', type: 'text' },
          { name: 'country', label: 'Country', type: 'text' },
          { name: 'pincode', label: 'Pincode', type: 'tel', minLength: 6, maxLength: 6 },
        ],
      },
    ],
  },

  // SINGLE sub-users resource - works for both ADMIN and USER
  {
    key: 'sub-users',
    title: 'Subuser Requests',
    entityName: 'Sub User',
    description: 'Manage sub accounts',
    icon: '👥',
    roles: ['ADMIN', 'DEALER'],
    searchable: true,
    creatable: true,
    creatableBy: ['ADMIN', 'DEALER'],
    fixedValues: {
      role: 'SUB_USER',
    },
    listParams: {
      role: 'SUB_USER',
    },
    columns: [
      { key: 'username', label: 'Username' },
      { key: 'name', label: 'Name' },
      {
        key: 'parentId',  // Use parentId instead of ownerUserId
        label: 'Owner',
        render: (row) => {
          if (!row.parentId) return 'N/A';
          // If parentId is an object with username
          if (typeof row.parentId === 'object') {
            return row.parentId.username || row.parentId.name || 'Unknown';
          }
          // If it's a string ID (fallback)
          return row.parentId;
        }
      },
      {
        key: 'dealerId',
        label: 'Dealer',
        render: (row) => {
          if (!row.dealerId) return 'N/A';
          if (typeof row.dealerId === 'object') {
            return row.dealerId.username || row.dealerId.name || 'Unknown';
          }
          return row.dealerId;
        }
      },
      { key: 'email', label: 'Email' },
      { key: 'phoneNumber', label: 'Phone' },
      {
        key: 'status',
        label: 'Status',
        render: (row) => {
          if (!row.status) return 'N/A';
          const status = row.status.toUpperCase();
          const color = status === 'ACTIVE' ? 'green' : status === 'PENDING' ? 'orange' : 'red';
          return <span style={{ color, fontWeight: 'bold' }}>{status}</span>;
        }
      },
    ],
    fields: [
      {
        ...idField('dealerId', 'Dealer', 'users', true),
        refParams: { role: 'DEALER' },
        helpText: 'Select the dealer for this sub-user',
        hideForRoles: ['USER'],
      },
      {
        ...idField('parentId', 'Owner User', 'users', true),  // Use parentId instead of ownerUserId
        refParams: { role: 'USER' },
        dependsOn: 'dealerId',
        helpText: 'Select the owner user for this sub-user',
        hideForRoles: ['USER'],
      },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', requiredOnCreate: true, minLength: 6 },
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', minLength: 10, maxLength: 10 },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        options: ['ACTIVE', 'PENDING', 'INACTIVE'],
        defaultValue: 'ACTIVE',
        hideForRoles: ['USER'],
        helpText: 'Set status to ACTIVE to make the sub-user available immediately'
      },
    ],
  },

  // Admin-only — creates a user record with role hardcoded to DEALER
  {
    key: 'dealers',
    title: 'Create Dealers',
    entityName: 'Dealer',
    description: 'Onboard new dealer accounts',
    icon: '🧑‍💼',
    roles: ['ADMIN'],
    fixedValues: { role: 'DEALER' },
    listParams: { role: 'DEALER' },
    searchable: true,
    creatable: true,
    creatableBy: ['ADMIN'],
    columns: [
      { key: 'username', label: 'Username' },
      { key: 'name', label: 'Full Name' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', requiredOnCreate: true, minLength: 6 },
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', minLength: 10, maxLength: 10 },
      { name: 'status', label: 'Status', type: 'select', options: EntityStatus, defaultValue: 'ACTIVE' },
      { name: 'onboardingType', label: 'Onboarding Type', type: 'select', options: OnboardingType, hideForRoles: ['DEALER', 'ADMIN'] },
      {
        name: 'address',
        label: 'Address',
        type: 'group',
        fields: [
          { name: 'addressLine1', label: 'Address Line 1', type: 'text' },
          { name: 'addressLine2', label: 'Address Line 2', type: 'text' },
          { name: 'city', label: 'City', type: 'text' },
          { name: 'state', label: 'State', type: 'text' },
          { name: 'country', label: 'Country', type: 'text' },
          { name: 'pincode', label: 'Pincode', type: 'tel', minLength: 6, maxLength: 6 },
        ],
      },
    ],
  },

  // Admin only — creates a user record with role hardcoded to EMPLOYEE
  {
    key: 'employees',
    title: 'Create Employees',
    entityName: 'Employee',
    description: 'Onboard staff/employee accounts',
    icon: '🧑‍🔧',
    roles: ['ADMIN'],
    fixedValues: { role: 'EMPLOYEE' },
    listParams: { role: 'EMPLOYEE' },
    searchable: true,
    creatable: true,
    creatableBy: ['ADMIN'],
    columns: [
      { key: 'username', label: 'Username' },
      { key: 'name', label: 'Name' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      {
        ...idField('dealerId', 'Dealer', 'users', true),
        refParams: { role: 'DEALER' },
        includeAdminOption: true,
        adminOptionLabel: 'Administrator (System)',
        helpText: 'Select the dealer for this employee, or choose Administrator for system-level access'
      },
      { name: 'username', label: 'Username', type: 'text', required: true },
      { name: 'password', label: 'Password', type: 'password', requiredOnCreate: true, minLength: 6 },
      { name: 'name', label: 'Full Name', type: 'text', required: true },
      { name: 'employmentType', label: 'Employment Type', type: 'select', options: EmploymentType },
      { name: 'occupation', label: 'Occupation', type: 'select', options: Occupation },
      { name: 'designation', label: 'Designation', type: 'text' },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phoneNumber', label: 'Phone Number', type: 'tel', minLength: 10, maxLength: 10 },
      { name: 'status', label: 'Status', type: 'select', options: EntityStatus, defaultValue: 'ACTIVE' },
      {
        name: 'address',
        label: 'Address',
        type: 'group',
        fields: [
          { name: 'addressLine1', label: 'Address Line 1', type: 'text' },
          { name: 'addressLine2', label: 'Address Line 2', type: 'text' },
          { name: 'city', label: 'City', type: 'text' },
          { name: 'state', label: 'State', type: 'text' },
          { name: 'country', label: 'Country', type: 'text' },
          { name: 'pincode', label: 'Pincode', type: 'tel', minLength: 6, maxLength: 6 },
        ],
      },
    ],
  },

  // In resources.js, update the license-packages fields

{
  key: 'license-packages',
  title: 'License Packages',
  entityName: 'License Package',
  description: 'Subscription packages and pricing',
  icon: '📦',
  roles: ['ADMIN', 'DEALER'],
  readOnlyForRoles: ['DEALER'],
  creatable: true,
  creatableBy: ['ADMIN'],
  viewableBy: ['ADMIN', 'USER', 'DEALER'],
  showStats: true,
  columns: [
    { key: 'packageCode', label: 'Code' },
    { key: 'packageName', label: 'Name' },
    { key: 'price', label: 'Price' },
    { key: 'licenseCount', label: 'Licenses' },
    { key: 'status', label: 'Status' },
    { key: 'orderNumber', label: 'Order #' },
    { key: 'paymentMode', label: 'Payment' },
    { key: 'paymentStatus', label: 'Payment Status' },
    { key: 'orderDate', label: 'Order Date', format: 'date' },
  ],
  fields: [
    {
      ...idField('dealerId', 'Dealer', 'users', true),
      refParams: { role: 'DEALER' }
    },
    { name: 'packageCode', label: 'Package Code', type: 'text', required: true },
    { name: 'packageName', label: 'Package Name', type: 'text', required: true },
    { name: 'description', label: 'Description', type: 'textarea' },
    {
      name: 'duration',
      label: 'Duration',
      type: 'group',
      fields: [
        { name: 'value', label: 'Value', type: 'number', required: true, min: 1 },
        { name: 'unit', label: 'Unit', type: 'select', options: DurationUnit, required: true },
      ],
    },
    { name: 'price', label: 'Price', type: 'number', required: true, min: 0 },
    { name: 'licenseCount', label: 'License Count', type: 'number', required: true, min: 0 },
   { 
      name: 'paymentMode', 
      label: 'Payment Mode', 
      type: 'select', 
      options: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'OTHER'],
      defaultValue: 'ONLINE',
      helpText: 'Payment mode for this order'
    },
    { 
      name: 'transactionReference', 
      label: 'Transaction Reference', 
      type: 'text',
      helpText: 'Transaction ID or reference number'
    },
    { 
      name: 'orderNotes', 
      label: 'Order Notes', 
      type: 'textarea',
      helpText: 'Additional notes for the order'
    },
    { 
      name: 'orderNumber', 
      label: 'Order Number', 
      type: 'text',
      helpText: 'Auto-generated order number'
    },
    { 
      name: 'paymentStatus', 
      label: 'Payment Status', 
      type: 'select', 
      options: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      defaultValue: 'COMPLETED',
    },
    { 
      name: 'orderStatus', 
      label: 'Order Status', 
      type: 'select', 
      options: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
      defaultValue: 'COMPLETED',
    },
    { name: 'status', label: 'Status', type: 'select', options: ['ACTIVE', 'INACTIVE'], defaultValue: 'ACTIVE' },
  ],
},

{
  key: 'licenses',
  title: 'Licenses',
  entityName: 'License',
  description: 'Active and expired user licenses',
  icon: '🔑',
  roles: ['ADMIN', 'DEALER', 'USER', 'SUB_USER'],
  creatable: false,
  readOnlyForRoles: ['SUB_USER', 'DEALER'],
  viewableBy: ['ADMIN', 'USER', 'DEALER'],
  columns: [
    { key: 'packageId', label: 'Package' },
    { key: 'dealerId', label: 'Dealer' },
    { key: 'userId', label: 'User' },
    { key: 'startDate', label: 'Start', format: 'date' },
    { key: 'expiryDate', label: 'Expiry', format: 'date' },
    { key: 'status', label: 'Status' },
    { key: 'orderNumber', label: 'Order #' },
    { key: 'paymentMode', label: 'Payment' },
    { key: 'paymentStatus', label: 'Payment Status' },
    { key: 'orderDate', label: 'Order Date', format: 'date' },
  ],
  fields: [
    {
      ...idField('dealerId', 'Dealer', 'users', true),
      refParams: { role: 'DEALER' },
      helpText: 'Select the dealer for this license'
    },
    {
      ...idField('packageId', 'Package', 'license-packages', true),
      dependsOn: 'dealerId',
      helpText: 'Select a package for the selected dealer'
    },
    {
      ...idField('userId', 'User', 'users', true),
      refParams: { role: 'USER' },
      dependsOn: 'dealerId',
      helpText: 'Select a user for the selected dealer'
    },
    { name: 'startDate', label: 'Start Date', type: 'date', required: true },
    { name: 'expiryDate', label: 'Expiry Date', type: 'date', required: true },
    { name: 'status', label: 'Status', type: 'select', options: EntityStatus, defaultValue: 'ACTIVE' },
    { ...idField('activatedBy', 'Activated By', 'users', true) },
    { name: 'activatedAt', label: 'Activated At', type: 'datetime', required: true },
    { 
      name: 'paymentMode', 
      label: 'Payment Mode', 
      type: 'select', 
      options: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'OTHER'],
      defaultValue: 'ONLINE',
      helpText: 'Payment mode for this activation'
    },
    { 
      name: 'transactionReference', 
      label: 'Transaction Reference', 
      type: 'text',
      helpText: 'Transaction ID or reference number'
    },
    { 
      name: 'orderNotes', 
      label: 'Order Notes', 
      type: 'textarea',
      helpText: 'Additional notes for the activation'
    },
    { 
      name: 'orderNumber', 
      label: 'Order Number', 
      type: 'text',
      helpText: 'Auto-generated order number'
    },
    { 
      name: 'paymentStatus', 
      label: 'Payment Status', 
      type: 'select', 
      options: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'],
      defaultValue: 'COMPLETED',
    },
    { 
      name: 'orderStatus', 
      label: 'Order Status', 
      type: 'select', 
      options: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'],
      defaultValue: 'COMPLETED',
    },
  ],
},

  {
    key: 'license-histories',
    title: 'License History',
    entityName: 'License History',
    description: 'License assignment history per vehicle',
    icon: '📜',
    roles: ['ADMIN', 'DEALER'],
    creatable: false,
    readOnlyForRoles: ['SUB_USER', 'DEALER'],
    viewableBy: ['ADMIN', 'USER', 'DEALER'],
    columns: [
      { key: 'licenseId', label: 'License' },
      { key: 'vehicleId', label: 'Vehicle' },
      { key: 'deviceId', label: 'Device' },
      { key: 'assignedFrom', label: 'From', format: 'datetime' },
      { key: 'assignedTo', label: 'To', format: 'datetime' },
      { key: 'assignedBy', label: 'Assigned By' },
    ],
    fields: [
      idField('licenseId', 'License', 'licenses', true),
      idField('vehicleId', 'Vehicle', 'vehicles', true),
      idField('deviceId', 'Device', 'devices', true),
      { name: 'assignedFrom', label: 'Assigned From', type: 'datetime', required: true },
      { name: 'assignedTo', label: 'Assigned To', type: 'datetime' },
      idField('assignedBy', 'Assigned By', 'users', true),
      { name: 'remarks', label: 'Remarks', type: 'textarea' },
    ],
  },

  {
    key: 'vehicles',
    title: 'Vehicles',
    entityName: 'Vehicle',
    description: 'Fleet vehicles and registration details',
    icon: '🚗',
    searchable: true,
    roles: ['ADMIN', 'DEALER', 'USER', 'SUB_USER'],
    creatable: false,
    readOnlyForRoles: ['SUB_USER', 'DEALER'],
    viewableBy: ['ADMIN', 'USER', 'DEALER'],
    columns: [
      { key: 'vehicleNumber', label: 'Number' },
      { key: 'make', label: 'Make' },
      { key: 'model', label: 'Model' },
      { key: 'ownerUserId', label: 'Owner' },
      { key: 'deviceId', label: 'Device' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      {
        ...idField('dealerId', 'Dealer', 'users', true),
        refParams: { role: 'DEALER' },
        helpText: 'Select the dealer for this vehicle'
      },
      {
        ...idField('ownerUserId', 'Owner', 'users', true),
        refParams: { role: 'USER' },
        dependsOn: 'dealerId',
        helpText: 'Select a user for the selected dealer'
      },
      {
        ...idField('deviceId', 'Device', 'devices'),
        dependsOn: 'dealerId',
        helpText: 'Select a device for the selected dealer'
      },
      { name: 'vehicleNumber', label: 'Vehicle Number', type: 'text', required: true },
      { name: 'make', label: 'Make', type: 'text' },
      { name: 'model', label: 'Model', type: 'text' },
      { name: 'year', label: 'Year', type: 'text' },
      { name: 'chassisNumber', label: 'Chassis Number', type: 'text' },
      { name: 'engineNumber', label: 'Engine Number', type: 'text' },
      { name: 'color', label: 'Color', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: EntityStatus, defaultValue: 'ACTIVE' },
    ],
  },

  {
  key: 'vehicle-groups',
  title: 'Vehicle Groups',
  entityName: 'Vehicle Group',
  description: 'Organize vehicles into groups and manage sub-user access',
  icon: '🗂️',
  roles: ['ADMIN', 'USER'],
  creatable: true,
  creatableBy: ['USER'],
  dependsOn: 'ownerUserId',
  // NEW — replaces readOnlyForRoles for this resource
  editableBy: ['ADMIN', 'USER'],           // full edit access
  viewableBy: ['ADMIN', 'USER', 'DEALER', 'SUB_USER'],
    columns: [
      { key: 'groupName', label: 'Group Name' },
      { key: 'ownerUserId', label: 'Owner' },
      { key: 'dealerId', label: 'Dealer' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      {
        ...idField('dealerId', 'Dealer', 'users', true),
        refParams: { role: 'DEALER' },
        helpText: 'Select the dealer for this vehicle group'
      },
      {
        ...idField('ownerUserId', 'Owner', 'users', true),
        refParams: { role: 'USER' },
        dependsOn: 'dealerId',
        helpText: 'Select a user for the selected dealer'
      },
      { name: 'groupName', label: 'Group Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      {
        name: 'vehicleIds',
        label: 'Vehicles',
        type: 'multi-reference',
        ref: 'vehicles',
        dependsOn: 'ownerUserId',
        helpText: 'Select which of this owner\'s vehicles belong to the group',
      },
      {
        name: 'subUserAccessIds',
        label: 'Sub-Users with Access',
        type: 'multi-reference',
        ref: 'sub-users',
        dependsOn: 'ownerUserId',
        refParams: { role: 'SUB_USER' },
        helpText: 'Select which sub-users can access this vehicle group',
      },
      { name: 'status', label: 'Status', type: 'select', options: EntityStatus, defaultValue: 'ACTIVE' },
      {
        ...idField('createdBy', 'Created By', 'users', true),
        hideForRoles: ['ADMIN', 'USER']
      },
    ],
  },

  {
    key: 'devices',
    title: 'Devices',
    entityName: 'Device',
    description: 'GPS tracking devices and SIM details',
    icon: '📡',
    searchable: true,
    roles: ['ADMIN', 'DEALER'],
    readOnlyForRoles: ['SUB_USER', 'DEALER'],
    viewableBy: ['ADMIN', 'USER', 'DEALER'],
    creatable: false,
    columns: [
      { key: 'imei', label: 'IMEI' },
      { key: 'serialNumber', label: 'Serial' },
      { key: 'deviceModel', label: 'Model' },
      { key: 'ownerUserId', label: 'Owner' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      {
        ...idField('dealerId', 'Dealer', 'users', true),
        refParams: { role: 'DEALER' },
        helpText: 'Select the dealer for this device'
      },
      {
        ...idField('ownerUserId', 'Owner', 'users', true),
        refParams: { role: 'USER' },
        dependsOn: 'dealerId',
        helpText: 'Select a user for the selected dealer'
      },
      {
        ...idField('licenseId', 'License', 'licenses'),
        dependsOn: 'dealerId',
        helpText: 'Select a license for the selected dealer'
      },
      { name: 'imei', label: 'IMEI', type: 'text', required: true },
      { name: 'serialNumber', label: 'Serial Number', type: 'text' },
      { name: 'deviceModel', label: 'Device Model', type: 'text' },
      { name: 'manufacturer', label: 'Manufacturer', type: 'text' },
      { name: 'protocol', label: 'Protocol', type: 'text' },
      { name: 'firmwareVersion', label: 'Firmware Version', type: 'text' },
      { name: 'simNumber', label: 'SIM Number', type: 'text' },
      { name: 'simImei', label: 'SIM IMEI', type: 'text' },
      { name: 'simProvider', label: 'SIM Provider', type: 'text' },
      { name: 'status', label: 'Status', type: 'select', options: DeviceStatus, defaultValue: 'PENDING' },
      { name: 'installedAt', label: 'Installed At', type: 'datetime' },
      { name: 'lastHeartbeatAt', label: 'Last Heartbeat', type: 'datetime' },
      { ...idField('createdBy', 'Created By', 'users', true) },
    ],
  },

  {
    key: 'device-assignments',
    title: 'Device Assignments',
    entityName: 'Device Assignment',
    description: 'Device-to-vehicle assignment history',
    icon: '🔀',
    roles: [],
    creatable: false,
    columns: [
      { key: 'deviceId', label: 'Device' },
      { key: 'vehicleId', label: 'Vehicle' },
      { key: 'assignedFrom', label: 'From', format: 'datetime' },
      { key: 'assignedTo', label: 'To', format: 'datetime' },
      { key: 'assignedBy', label: 'Assigned By' },
    ],
    fields: [
      idField('deviceId', 'Device', 'devices', true),
      idField('vehicleId', 'Vehicle', 'vehicles', true),
      { name: 'assignedFrom', label: 'Assigned From', type: 'datetime', required: true },
      { name: 'assignedTo', label: 'Assigned To', type: 'datetime' },
      idField('assignedBy', 'Assigned By', 'users', true),
      { name: 'remarks', label: 'Remarks', type: 'textarea' },
    ],
  },

  {
    key: 'user-access',
    title: 'User Access',
    entityName: 'User Access',
    description: 'Shared dashboard access between users',
    icon: '🛡️',
    roles: ['ADMIN', 'DEALER', 'USER'],
    viewableBy: ['ADMIN', 'USER', 'DEALER'],
    creatable: false,
    creatableBy: ['USER'], // Only USER can create here
    component: 'UserAccessPanel',
    columns: [
      { key: 'ownerUserId', label: 'Owner' },
      { key: 'sharedUserId', label: 'Shared User' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      idField('dealerId', 'Dealer', 'users', true),
      idField('ownerUserId', 'Owner User', 'users', true),
      idField('sharedUserId', 'Shared User', 'users', true),
      {
        name: 'permissions',
        label: 'Permissions',
        type: 'group',
        fields: [
          { name: 'dashboard', label: 'Dashboard', type: 'checkbox', defaultValue: true },
          { name: 'liveTracking', label: 'Live Tracking', type: 'checkbox', defaultValue: true },
          { name: 'playback', label: 'Playback', type: 'checkbox', defaultValue: true },
          { name: 'reports', label: 'Reports', type: 'checkbox', defaultValue: true },
          { name: 'alerts', label: 'Alerts', type: 'checkbox', defaultValue: true },
          { name: 'settings', label: 'Settings', type: 'checkbox', defaultValue: false },
        ],
      },
      { name: 'status', label: 'Status', type: 'select', options: EntityStatus, defaultValue: 'ACTIVE' },
      idField('createdBy', 'Created By', 'users', true),
    ],
  },

  {
    key: 'resource-access',
    title: 'Resource Access',
    entityName: 'Resource Access',
    description: 'Fine-grained resource sharing permissions',
    icon: '🔐',
    roles: ['ADMIN', "USER", "DEALER"],
    creatable: false,
    columns: [
      { key: 'sharedUserId', label: 'Shared User' },
      { key: 'resourceType', label: 'Resource Type' },
      { key: 'resourceId', label: 'Resource' },
      { key: 'status', label: 'Status' },
    ],
    fields: [
      idField('dealerId', 'Dealer', 'users', true),
      idField('ownerUserId', 'Owner User', 'users', true),
      idField('sharedUserId', 'Shared User', 'users', true),
      { name: 'resourceType', label: 'Resource Type', type: 'select', options: ResourceType, required: true },
      { name: 'resourceId', label: 'Resource ID', type: 'text' },
      {
        name: 'permissions',
        label: 'Permissions',
        type: 'group',
        fields: [
          { name: 'tracking', label: 'Tracking', type: 'checkbox', defaultValue: true },
          { name: 'playback', label: 'Playback', type: 'checkbox', defaultValue: true },
          { name: 'reports', label: 'Reports', type: 'checkbox', defaultValue: true },
          { name: 'history', label: 'History', type: 'checkbox', defaultValue: true },
          { name: 'commands', label: 'Commands', type: 'checkbox', defaultValue: false },
        ],
      },
      { name: 'status', label: 'Status', type: 'select', options: EntityStatus, defaultValue: 'ACTIVE' },
      idField('createdBy', 'Created By', 'users', true),
    ],
  },

 // config/resources.js - Add Orders resource

{
  key: 'orders',
  title: 'My Orders',
  entityName: 'Order',
  description: 'View order history for license packages and user activations',
  icon: '📋',
  roles: ['ADMIN', 'DEALER', 'USER', 'SUB_USER'],
  viewableBy: ['ADMIN', 'DEALER', 'USER', 'SUB_USER'],
  creatable: false,
  searchable: true,
  columns: [
    { key: 'orderNumber', label: 'Order #' },
    { 
      key: 'orderType', 
      label: 'Type',
      render: (row) => {
        const types = {
          'LICENSE_PACKAGE': '📦 License Package',
          'USER_ACTIVATION': '🔑 User Activation',
          'LICENSE_RENEWAL': '🔄 License Renewal'
        };
        return types[row.orderType] || row.orderType;
      }
    },
    { 
      key: 'dealerId', 
      label: 'Dealer',
      render: (row) => {
        if (!row.dealerId) return 'N/A';
        if (typeof row.dealerId === 'object') {
          return row.dealerId.name || row.dealerId.username || 'Unknown';
        }
        return row.dealerId;
      }
    },
    { 
      key: 'userId', 
      label: 'User',
      render: (row) => {
        if (!row.userId) return 'N/A';
        if (typeof row.userId === 'object') {
          return row.userId.name || row.userId.username || 'Unknown';
        }
        return row.userId;
      }
    },
    { 
      key: 'amount', 
      label: 'Amount',
      render: (row) => {
        if (!row.amount) return '₹0';
        return `₹${row.amount.toLocaleString()}`;
      }
    },
    { 
      key: 'paymentStatus', 
      label: 'Payment Status',
      render: (row) => {
        const status = row.paymentStatus || 'PENDING';
        const colors = {
          'COMPLETED': 'green',
          'PENDING': 'orange',
          'FAILED': 'red',
          'REFUNDED': 'purple'
        };
        return <span style={{ color: colors[status] || 'gray', fontWeight: 'bold' }}>{status}</span>;
      }
    },
    { 
      key: 'orderStatus', 
      label: 'Order Status',
      render: (row) => {
        const status = row.orderStatus || 'PENDING';
        const colors = {
          'COMPLETED': 'green',
          'PROCESSING': 'blue',
          'PENDING': 'orange',
          'CANCELLED': 'red'
        };
        return <span style={{ color: colors[status] || 'gray', fontWeight: 'bold' }}>{status}</span>;
      }
    },
    { 
      key: 'createdAt', 
      label: 'Date', 
      format: 'datetime' 
    },
  ],
  fields: [
    { name: 'orderNumber', label: 'Order Number', type: 'text' },
    { 
      name: 'orderType', 
      label: 'Order Type', 
      type: 'select', 
      options: ['LICENSE_PACKAGE', 'USER_ACTIVATION', 'LICENSE_RENEWAL'] 
    },
    {
      ...idField('dealerId', 'Dealer', 'users', true),
      refParams: { role: 'DEALER' }
    },
    {
      ...idField('userId', 'User', 'users'),
      refParams: { role: 'USER' }
    },
    {
      ...idField('packageId', 'Package', 'license-packages')
    },
    {
      ...idField('licenseId', 'License', 'licenses')
    },
    { name: 'amount', label: 'Amount', type: 'number', required: true },
    { 
      name: 'paymentMode', 
      label: 'Payment Mode', 
      type: 'select', 
      options: ['CASH', 'CARD', 'UPI', 'BANK_TRANSFER', 'CHEQUE', 'ONLINE', 'OTHER'] 
    },
    { name: 'transactionReference', label: 'Transaction Reference', type: 'text' },
    { 
      name: 'paymentStatus', 
      label: 'Payment Status', 
      type: 'select', 
      options: ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'] 
    },
    { 
      name: 'orderStatus', 
      label: 'Order Status', 
      type: 'select', 
      options: ['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'] 
    },
    { name: 'description', label: 'Description', type: 'textarea' },
    { name: 'notes', label: 'Notes', type: 'textarea' },
    {
      ...idField('createdBy', 'Created By', 'users')
    },
  ],
},
];

export function getResourceByKey(key) {
  return resources.find((resource) => resource.key === key);
}