import React from 'react';

const EmptyState = ({ title, description }) => (
    <div style={{ padding: 24, textAlign: 'center', border: '1px dashed #d1d5db', borderRadius: 12, background: '#fff' }}>
        <div style={{ fontWeight: 700, marginBottom: 8 }}>{title}</div>
        <div style={{ color: '#6b7280' }}>{description}</div>
    </div>
);

export default EmptyState;