import axios from 'axios';

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_PARALLEL_UPLOADS = 3;

/**
 * Uploads a file in chunks with resumability support
 * @param {File} file - The file to upload
 * @param {string} localUploadId - Local identifier for tracking
 * @param {Function} onProgress - Progress callback (progress%, uploadedBytes, estimatedTime)
 * @param {Function} onSessionUpdate - Session update callback (sessionId, uploadedChunks)
 * @returns {Promise<void>}
 */
export const uploadFile = async (file, localUploadId, onProgress, onSessionUpdate) => {
  const totalSize = file.size;
  const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
  
  // Generate unique filename
  const fileExtension = file.name.split('.').pop();
  const uniqueFilename = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}.${fileExtension}`;

  // Check for existing upload session in localStorage
  const savedSession = localStorage.getItem(`upload_session_${localUploadId}`);
  let uploadSessionId = null;
  let uploadedChunks = [];

  if (savedSession) {
    const session = JSON.parse(savedSession);
    uploadSessionId = session.uploadSessionId;
    
    // Check server status to get which chunks are already uploaded
    try {
      const statusResponse = await axios.get(`/api/upload/status/${uploadSessionId}`);
      uploadedChunks = statusResponse.data.uploadedChunkIndices || [];
      onSessionUpdate(uploadSessionId, uploadedChunks);
    } catch (error) {
      // If session not found on server, start new upload
      uploadSessionId = null;
      uploadedChunks = [];
    }
  }

  // Initiate upload if no existing session
  if (!uploadSessionId) {
    const initiateResponse = await axios.post('/api/upload/initiate', {
      filename: uniqueFilename,
      originalName: file.name,
      mimeType: file.type || 'application/octet-stream',
      totalSize: totalSize,
    });

    uploadSessionId = initiateResponse.data.uploadId;
    
    // Save session to localStorage
    localStorage.setItem(
      `upload_session_${localUploadId}`,
      JSON.stringify({
        uploadSessionId,
        filename: file.name,
        totalSize,
        totalChunks,
      })
    );
    
    onSessionUpdate(uploadSessionId, uploadedChunks);
  }

  // Determine which chunks need to be uploaded
  const chunksToUpload = [];
  for (let i = 0; i < totalChunks; i++) {
    if (!uploadedChunks.includes(i)) {
      chunksToUpload.push(i);
    }
  }

  // Calculate initial uploaded size
  let uploadedSize = uploadedChunks.length * CHUNK_SIZE;
  if (uploadedChunks.length > 0 && uploadedChunks.includes(totalChunks - 1)) {
    // Adjust for last chunk which might be smaller
    const lastChunkSize = totalSize - (totalChunks - 1) * CHUNK_SIZE;
    uploadedSize = uploadedSize - CHUNK_SIZE + lastChunkSize;
  }

  const startTime = Date.now();
  let lastUpdateTime = startTime;
  let lastUploadedSize = uploadedSize;

  // Upload chunks in parallel with concurrency limit
  const uploadChunk = async (chunkIndex) => {
    const start = chunkIndex * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, totalSize);
    const chunk = file.slice(start, end);

    const formData = new FormData();
    formData.append('chunk', chunk);
    formData.append('chunkIndex', chunkIndex);

    await axios.post(`/api/upload/chunk/${uploadSessionId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    // Update progress
    uploadedSize += chunk.size;
    uploadedChunks.push(chunkIndex);

    const progress = (uploadedSize / totalSize) * 100;
    const currentTime = Date.now();
    const elapsedSeconds = (currentTime - startTime) / 1000;
    const uploadSpeed = uploadedSize / elapsedSeconds; // bytes per second
    const remainingBytes = totalSize - uploadedSize;
    const estimatedTimeRemaining = remainingBytes / uploadSpeed;

    onProgress(progress, uploadedSize, estimatedTimeRemaining);
    onSessionUpdate(uploadSessionId, uploadedChunks);

    // Update localStorage with progress
    const savedSession = localStorage.getItem(`upload_session_${localUploadId}`);
    if (savedSession) {
      const session = JSON.parse(savedSession);
      session.uploadedChunks = uploadedChunks;
      session.uploadedSize = uploadedSize;
      localStorage.setItem(`upload_session_${localUploadId}`, JSON.stringify(session));
    }
  };

  // Upload chunks with concurrency control
  const uploadPromises = [];
  for (let i = 0; i < chunksToUpload.length; i++) {
    const chunkIndex = chunksToUpload[i];
    uploadPromises.push(uploadChunk(chunkIndex));

    // Wait for some promises to complete before adding more
    if (uploadPromises.length >= MAX_PARALLEL_UPLOADS) {
      await Promise.race(uploadPromises);
      // Remove completed promises
      uploadPromises.splice(
        uploadPromises.findIndex((p) => p.status === 'fulfilled'),
        1
      );
    }
  }

  // Wait for all remaining uploads to complete
  await Promise.all(uploadPromises);

  // Complete the upload
  await axios.post(`/api/upload/complete/${uploadSessionId}`);

  // Clean up localStorage
  localStorage.removeItem(`upload_session_${localUploadId}`);

  // Update progress to 100%
  onProgress(100, totalSize, 0);
};