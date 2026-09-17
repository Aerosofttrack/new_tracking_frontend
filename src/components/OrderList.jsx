// components/OrderList.jsx
import React, { useState, useEffect } from 'react';
import { orderApi } from '../api/services.js';
import DataTable from './DataTable.jsx';
import Pagination from './Pagination.jsx';
import { getErrorMessage } from '../api/client.js';

export default function OrderList({ user }) {
  const [orders, setOrders] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await orderApi.getMyOrders({ page, limit: 10 });
      setOrders(res.data.data || []);
      setMeta(res.data.meta || { total: 0, page: 1, limit: 10 });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [page]);

  const columns = [
    { key: 'orderNumber', label: 'Order #' },
    { key: 'orderType', label: 'Type' },
    { key: 'amount', label: 'Amount' },
    { key: 'paymentStatus', label: 'Payment Status' },
    { key: 'orderStatus', label: 'Order Status' },
    { key: 'createdAt', label: 'Date', format: 'datetime' },
  ];

  return (
    <div className="order-list">
      <h2>My Orders</h2>
      {error && <div className="alert alert-error">{error}</div>}
      <DataTable
        columns={columns}
        rows={orders}
        loading={loading}
        onView={(row) => {
          // View order details
          console.log('View order:', row);
        }}
      />
      <Pagination meta={meta} onPageChange={setPage} />
    </div>
  );
}