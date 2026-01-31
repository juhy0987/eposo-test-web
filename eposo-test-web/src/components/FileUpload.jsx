import React, { useState, useRef, useEffect } from 'react';
import { uploadFile } from '../services/uploadService';
import './FileUpload.css';

const FileUpload = () => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploads, setUploads] = useState([]);
  const fileInputRef = useRef(null);
  const dragCounter = useRef(0);

  // Load saved uploads from localStorage on mount
  useEffect(() => {
    const savedUploads = localStorage.getItem('pendingUploads');
    if (savedUploads) {
      const parsedUploads = JSON.parse(savedUploads);
      setUploads(parsedUploads.filter(u => u.status !== 'completed'));
    }
  }, []);

  // Save uploads to localStorage whenever they change
  useEffect(() => {
    if (uploads.length > 0) {
      localStorage.setItem('pendingUploads', JSON.stringify(uploads));
    }
  }, [uploads]);

  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(Array.from(files));
    }
    // Reset input value to allow selecting the same file again
    e.target.value = '';
  };

  const handleFiles = (files) => {
    files.forEach((file) => {
      // Check file size limit (1GB)
      const maxSize = 1024 * 1024 * 1024; // 1GB
      if (file.size > maxSize) {
        alert('업로드 가능한 최대 파일 크기는 1GB입니다.');
        return;
      }

      // Create upload entry
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const newUpload = {
        id: uploadId,
        file: null, // We'll store file reference separately
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type,
        uploadedSize: 0,
        progress: 0,
        status: 'pending', // pending, uploading, completed, failed, paused
        startTime: Date.now(),
        estimatedTimeRemaining: null,
        error: null,
        uploadSessionId: null,
        uploadedChunks: [],
      };

      setUploads((prev) => [...prev, newUpload]);

      // Start upload
      startUpload(uploadId, file);
    });
  };

  const startUpload = async (uploadId, file) => {
    const updateUpload = (updates) => {
      setUploads((prev) =>
        prev.map((u) => (u.id === uploadId ? { ...u, ...updates } : u))
      );
    };

    try {
      updateUpload({ status: 'uploading' });

      await uploadFile(
        file,
        uploadId,
        (progress, uploadedSize, estimatedTime) => {
          updateUpload({
            progress,
            uploadedSize,
            estimatedTimeRemaining: estimatedTime,
          });
        },
        (uploadSessionId, uploadedChunks) => {
          updateUpload({
            uploadSessionId,
            uploadedChunks,
          });
        }
      );

      updateUpload({
        status: 'completed',
        progress: 100,
        uploadedSize: file.size,
        estimatedTimeRemaining: 0,
      });

      // Remove from localStorage after completion
      setTimeout(() => {
        setUploads((prev) => prev.filter((u) => u.id !== uploadId));
      }, 3000);
    } catch (error) {
      updateUpload({
        status: 'failed',
        error: error.message || 'Upload failed',
      });
    }
  };

  const handleRetry = (uploadId) => {
    const upload = uploads.find((u) => u.id === uploadId);
    if (!upload) return;

    // We need to get the file again from user
    // For now, we'll just remove the failed upload
    // In a real app, you might want to store file references differently
    alert('Please select the file again to retry upload.');
    setUploads((prev) => prev.filter((u) => u.id !== uploadId));
  };

  const handleRemove = (uploadId) => {
    setUploads((prev) => prev.filter((u) => u.id !== uploadId));
  };

  const formatSize = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2);
  };

  const formatTime = (seconds) => {
    if (!seconds || seconds === Infinity) return '--';
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const secs = Math.round(seconds % 60);
    return `${minutes}m ${secs}s`;
  };

  return (
    <>
      <div
        className={`file-upload-area ${isDragging ? 'dragging' : ''}`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          multiple
        />
        <div className="upload-content">
          <div className="upload-icon">📁</div>
          <p className="upload-text">
            Drag and drop files here or
          </p>
          <button
            className="upload-button"
            onClick={() => fileInputRef.current?.click()}
          >
            Upload
          </button>
        </div>
      </div>

      {uploads.length > 0 && (
        <div className="upload-status-panel">
          {uploads.map((upload) => (
            <div key={upload.id} className="upload-item">
              <div className="upload-header">
                <span className="upload-filename" title={upload.fileName}>
                  {upload.fileName}
                </span>
                <button
                  className="remove-button"
                  onClick={() => handleRemove(upload.id)}
                  title="Remove"
                >
                  ✕
                </button>
              </div>
              
              <div className="upload-info">
                <span className="upload-size">
                  {formatSize(upload.uploadedSize)} / {formatSize(upload.fileSize)} MB
                </span>
                <span className="upload-progress">{Math.round(upload.progress)}%</span>
                {upload.status === 'uploading' && upload.estimatedTimeRemaining !== null && (
                  <span className="upload-time">
                    {formatTime(upload.estimatedTimeRemaining)} remaining
                  </span>
                )}
              </div>

              <div className="progress-bar">
                <div
                  className={`progress-fill ${upload.status}`}
                  style={{ width: `${upload.progress}%` }}
                />
              </div>

              {upload.status === 'failed' && (
                <div className="upload-error">
                  <span>{upload.error}</span>
                  <button
                    className="retry-button"
                    onClick={() => handleRetry(upload.id)}
                  >
                    Retry
                  </button>
                </div>
              )}

              {upload.status === 'completed' && (
                <div className="upload-success">✓ Upload completed</div>
              )}
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default FileUpload;