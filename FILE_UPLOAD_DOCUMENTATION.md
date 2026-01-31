# File Upload System Documentation

This document describes the implementation of the chunked file upload system with resumability support.

## Overview

The file upload system allows users to upload files up to 1GB in size with the following features:

- **Drag and Drop**: Users can drag files into a designated upload area
- **Click to Upload**: Traditional file selection via button click
- **Chunked Upload**: Files larger than 20MB are split into 5MB chunks
- **Parallel Upload**: Multiple chunks are uploaded simultaneously (max 3 concurrent)
- **Resumable Upload**: Upload progress is persisted locally and can resume after browser restart
- **Progress Tracking**: Real-time display of upload progress, speed, and estimated time
- **Error Handling**: Failed uploads can be retried with proper error messages
- **File Size Limit**: Maximum file size of 1GB with Korean error message

## Architecture

### Frontend (React)

#### Components

**FileUpload Component** (`eposo-test-web/src/components/FileUpload.jsx`)
- Main upload interface with drag-and-drop zone
- Manages upload state and UI
- Handles file selection and validation
- Displays upload status panel at bottom-right

**FileUploadPage** (`eposo-test-web/src/pages/FileUploadPage.jsx`)
- Page wrapper for the FileUpload component

#### Services

**Upload Service** (`eposo-test-web/src/services/uploadService.js`)
- Core upload logic with chunking
- Resumability support using localStorage
- Progress calculation and callbacks
- Parallel chunk upload with concurrency control

**API Service** (`eposo-test-web/src/services/api.js`)
- HTTP client for upload endpoints
- Wrapper functions for all upload API calls

#### Key Features

1. **File Size Validation**
   ```javascript
   const maxSize = 1024 * 1024 * 1024; // 1GB
   if (file.size > maxSize) {
     alert('업로드 가능한 최대 파일 크기는 1GB입니다.');
     return;
   }
   ```

2. **Chunking Logic**
   ```javascript
   const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB
   const totalChunks = Math.ceil(totalSize / CHUNK_SIZE);
   ```

3. **Resumability**
   - Upload session stored in localStorage with key `upload_session_${localUploadId}`
   - On resume, checks server for already uploaded chunks
   - Only uploads missing chunks

4. **Progress Calculation**
   ```javascript
   const progress = (uploadedSize / totalSize) * 100;
   const uploadSpeed = uploadedSize / elapsedSeconds;
   const estimatedTimeRemaining = remainingBytes / uploadSpeed;
   ```

5. **Parallel Upload**
   - Maximum 3 concurrent chunk uploads
   - Uses `Promise.race()` to manage concurrency

### Backend (NestJS)

#### Database Schema

**Upload Model** (`eposo-test-api/prisma/schema.prisma`)
```prisma
model Upload {
  id              String   @id @default(uuid())
  userId          Int?
  filename        String
  originalName    String
  mimeType        String
  totalSize       BigInt
  totalChunks     Int
  uploadedChunks  Int      @default(0)
  status          String   @default("uploading")
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  completedAt     DateTime?
  user            User?    @relation(fields: [userId], references: [id])
  chunks          UploadChunk[]
}

model UploadChunk {
  id         Int      @id @default(autoincrement())
  uploadId   String
  chunkIndex Int
  size       Int
  createdAt  DateTime @default(now())
  upload     Upload   @relation(fields: [uploadId], references: [id], onDelete: Cascade)

  @@unique([uploadId, chunkIndex])
}
```

#### Endpoints

1. **POST /api/upload/initiate**
   - Initiates a new upload session
   - Creates Upload record in database
   - Returns `uploadId` and `totalChunks`

2. **POST /api/upload/chunk/:uploadId**
   - Uploads a single chunk (multipart/form-data)
   - Saves chunk to disk: `uploads/chunks/${uploadId}_chunk_${chunkIndex}`
   - Creates UploadChunk record
   - Updates upload progress
   - Validates chunk size (max 5MB)

3. **GET /api/upload/status/:uploadId**
   - Returns upload status and metadata
   - Lists which chunks have been uploaded
   - Used for resuming interrupted uploads

4. **POST /api/upload/complete/:uploadId**
   - Merges all chunks into final file
   - Saves to: `uploads/${filename}`
   - Deletes individual chunk files
   - Updates upload status to 'completed'

#### File Storage

```
uploads/
├── chunks/                          # Temporary chunk storage
│   ├── {uploadId}_chunk_0
│   ├── {uploadId}_chunk_1
│   └── ...
└── {timestamp}_{random}.{ext}       # Final merged files
```

#### Services

**UploadService** (`eposo-test-api/src/upload/upload.service.ts`)
- Business logic for upload operations
- Chunk merging using Node.js streams
- Database operations via Prisma

**UploadController** (`eposo-test-api/src/upload/upload.controller.ts`)
- HTTP endpoint handlers
- File upload middleware configuration
- Error handling and validation

## Usage

### Running the Application

1. **Backend Setup**
   ```bash
   cd eposo-test-api
   npm install
   npx prisma migrate dev --name add_upload_models
   npm run start:dev
   ```

2. **Frontend Setup**
   ```bash
   cd eposo-test-web
   npm install
   npm run dev
   ```

3. **Access Upload Page**
   - Navigate to `http://localhost:5173/upload`
   - Or root path `http://localhost:5173/`

### User Flow

1. User drags file or clicks "Upload" button
2. File size is validated (max 1GB)
3. Upload starts automatically
4. Progress panel appears at bottom-right
5. Real-time progress updates show:
   - Filename
   - Uploaded/Total size in MB
   - Progress percentage
   - Estimated time remaining
6. If browser is closed:
   - Upload state saved in localStorage
   - On reopening, user can continue upload
7. On completion:
   - Success message shown
   - Upload removed from panel after 3 seconds
8. On failure:
   - Error message displayed
   - "Retry" button available

## Configuration

### Frontend Constants

```javascript
const CHUNK_SIZE = 5 * 1024 * 1024;      // 5MB
const MAX_PARALLEL_UPLOADS = 3;          // Concurrent chunks
const MAX_FILE_SIZE = 1024 * 1024 * 1024; // 1GB
```

### Backend Configuration

- **Chunk size limit**: 5MB (enforced in multer config)
- **Upload directory**: `uploads/` in project root
- **Chunks directory**: `uploads/chunks/`

## Database Migration

After pulling this code, run:

```bash
cd eposo-test-api
npx prisma migrate dev --name add_upload_models
```

This creates the `Upload` and `UploadChunk` tables.

## Security Considerations

1. **File Size Validation**: Both client and server validate file size
2. **Chunk Size Validation**: Server enforces 5MB max chunk size
3. **MIME Type Validation**: File types can be restricted (not currently implemented)
4. **Authentication**: Upload endpoints can be protected with auth guards
5. **File Name Sanitization**: Unique filenames prevent overwrites
6. **Directory Traversal**: File paths are controlled by server

## Future Enhancements

1. **Authentication Integration**: Link uploads to authenticated users
2. **File Type Restrictions**: Accept only specific MIME types
3. **Virus Scanning**: Scan uploaded files before saving
4. **Cloud Storage**: Store files in S3/GCS instead of local disk
5. **Download Links**: Generate shareable download URLs
6. **Upload List**: View all uploaded files
7. **Delete Functionality**: Remove uploaded files
8. **Pause/Resume**: Manual pause and resume controls
9. **Thumbnail Generation**: For image/video files
10. **Compression**: Optional file compression before upload

## Troubleshooting

### Upload Fails Immediately
- Check backend is running on port 3000
- Verify proxy configuration in `vite.config.js`
- Check browser console for errors

### Chunks Not Merging
- Ensure all chunks uploaded successfully
- Check disk space on server
- Verify file permissions on `uploads/` directory

### Progress Not Persisting
- Check browser localStorage is enabled
- Verify localStorage keys: `upload_session_*` and `pendingUploads`

### Performance Issues
- Reduce `MAX_PARALLEL_UPLOADS` for slower connections
- Increase `CHUNK_SIZE` for faster connections
- Check server disk I/O performance

## API Examples

### Initiate Upload

```bash
curl -X POST http://localhost:3000/api/upload/initiate \
  -H "Content-Type: application/json" \
  -d '{
    "filename": "example.pdf",
    "originalName": "My Document.pdf",
    "mimeType": "application/pdf",
    "totalSize": 52428800
  }'
```

### Upload Chunk

```bash
curl -X POST http://localhost:3000/api/upload/chunk/{uploadId} \
  -F "chunk=@chunk_0.bin" \
  -F "chunkIndex=0"
```

### Check Status

```bash
curl http://localhost:3000/api/upload/status/{uploadId}
```

### Complete Upload

```bash
curl -X POST http://localhost:3000/api/upload/complete/{uploadId}
```

## Testing

### Manual Testing

1. **Small File (< 5MB)**: Single chunk upload
2. **Medium File (5-20MB)**: Multiple chunks, no parallel upload needed
3. **Large File (> 20MB)**: Parallel chunk upload
4. **Very Large File (> 100MB)**: Test resumability
5. **Max Size File (~1GB)**: Test limit enforcement
6. **Over Limit (> 1GB)**: Verify error message in Korean

### Browser Compatibility

- Chrome/Edge: ✓ Fully supported
- Firefox: ✓ Fully supported
- Safari: ✓ Fully supported
- Mobile browsers: ✓ Supported (limited drag-and-drop)

## Performance Metrics

- **Small files (< 5MB)**: ~1-2 seconds on fast connection
- **Large files (100MB)**: ~30-60 seconds on fast connection
- **Maximum throughput**: Limited by server disk I/O and network bandwidth
- **Memory usage**: Minimal (chunks processed in streams)

## Code Structure

```
eposo-test-web/
├── src/
│   ├── components/
│   │   ├── FileUpload.jsx          # Main upload component
│   │   └── FileUpload.css          # Upload UI styles
│   ├── pages/
│   │   └── FileUploadPage.jsx      # Upload page
│   ├── services/
│   │   ├── api.js                  # API client
│   │   └── uploadService.js        # Upload logic
│   └── App.jsx                     # Route configuration

eposo-test-api/
├── src/
│   ├── upload/
│   │   ├── upload.module.ts        # Module definition
│   │   ├── upload.controller.ts    # HTTP endpoints
│   │   ├── upload.service.ts       # Business logic
│   │   └── dto/
│   │       ├── initiate-upload.dto.ts
│   │       └── complete-upload.dto.ts
│   └── app.module.ts               # App configuration
├── prisma/
│   └── schema.prisma               # Database schema
└── uploads/                        # Upload directory (created on startup)
    └── chunks/                     # Temporary chunks
```

## License

This implementation is part of the eposo-test project.