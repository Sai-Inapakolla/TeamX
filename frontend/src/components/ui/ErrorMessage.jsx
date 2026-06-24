import React from 'react';

const ErrorMessage = ({ message }) => (
    <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: 12, borderRadius: 10 }}>
        {message}
    </div>
);

export default ErrorMessage;