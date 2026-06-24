import React from 'react';

const Loader = ({ label = 'Loading...' }) => (
    <div style={{ padding: 24, textAlign: 'center', color: '#475569' }}>{label}</div>
);

export default Loader;