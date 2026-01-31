import React from 'react';
import FileUpload from '../components/FileUpload';

const FileUploadPage = () => {
  return (
    <div style={{ padding: '20px', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px' }}>File Upload</h1>
      <FileUpload />
    </div>
  );
};

export default FileUploadPage;