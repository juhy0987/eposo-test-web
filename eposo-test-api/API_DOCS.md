# API Documentation

## Authentication Endpoints

### `POST /api/auth/signup`

Creates a new user account.

#### Request Body

The request body must be a JSON object with the following properties:

| Field                  | Type   | Description                                           | Required |
| ---------------------- | ------ | ----------------------------------------------------- | -------- |
| `email`                | string | The user's email address. Must be unique.             | Yes      |
| `password`             | string | The user's password. Must be at least 8 characters.   | Yes      |
| `passwordConfirmation` | string | The user's password for confirmation. Must match `password`. | Yes      |

**Example Request:**

```json
{
  "email": "test@example.com",
  "password": "password123",
  "passwordConfirmation": "password123"
}
```

#### Responses

-   **`201 Created`**: The user was successfully created. The response body will contain the new user's data (excluding the password).

    **Example Response Body:**

    ```json
    {
      "id": 1,
      "email": "test@example.com",
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T10:00:00.000Z"
    }
    ```

-   **`400 Bad Request`**: The request body is invalid. This can be due to:
    -   Missing fields.
    -   Email is not in a valid format.
    -   Password is less than 8 characters.
    -   `password` and `passwordConfirmation` do not match.

    The response body will contain an error message detailing the validation failures.

    **Example Error Response:**

    ```json
    {
      "message": [
        "password must be at least 8 characters long.",
        "Password and password confirmation do not match."
      ],
      "error": "Bad Request",
      "statusCode": 400
    }
    ```

-   **`409 Conflict`**: The provided email address is already in use.

    **Example Error Response:**

    ```json
    {
      "message": "Email already in use.",
      "error": "Conflict",
      "statusCode": 409
    }
    ```

## File Upload Endpoints

### `POST /api/upload/initiate`

Initiates a chunked file upload session.

#### Request Body

| Field         | Type   | Description                                      | Required |
| ------------- | ------ | ------------------------------------------------ | -------- |
| `filename`    | string | Unique filename for storage (e.g., UUID + ext)   | Yes      |
| `originalName`| string | Original filename from user's system             | Yes      |
| `mimeType`    | string | MIME type of the file                            | Yes      |
| `totalSize`   | number | Total file size in bytes (max 1GB)              | Yes      |
| `userId`      | number | User ID (optional)                               | No       |

**Example Request:**

```json
{
  "filename": "550e8400-e29b-41d4-a716-446655440000.pdf",
  "originalName": "document.pdf",
  "mimeType": "application/pdf",
  "totalSize": 52428800
}
```

#### Responses

-   **`201 Created`**: Upload session created successfully.

    ```json
    {
      "uploadId": "550e8400-e29b-41d4-a716-446655440000",
      "totalChunks": 10
    }
    ```

### `POST /api/upload/chunk/:uploadId`

Uploads a single chunk of a file.

#### Parameters

- `uploadId` (path): The upload session ID

#### Request Body (multipart/form-data)

| Field        | Type   | Description                          | Required |
| ------------ | ------ | ------------------------------------ | -------- |
| `chunk`      | file   | The chunk file (max 5MB)             | Yes      |
| `chunkIndex` | number | Zero-based index of the chunk        | Yes      |

#### Responses

-   **`200 OK`**: Chunk uploaded successfully.

    ```json
    {
      "success": true,
      "uploadedChunks": 5,
      "totalChunks": 10
    }
    ```

### `GET /api/upload/status/:uploadId`

Retrieves the status of an ongoing or completed upload.

#### Parameters

- `uploadId` (path): The upload session ID

#### Responses

-   **`200 OK`**: Upload status retrieved successfully.

    ```json
    {
      "uploadId": "550e8400-e29b-41d4-a716-446655440000",
      "filename": "document.pdf",
      "totalSize": "52428800",
      "totalChunks": 10,
      "uploadedChunks": 5,
      "uploadedChunkIndices": [0, 1, 2, 3, 4],
      "status": "uploading",
      "createdAt": "2023-10-27T10:00:00.000Z",
      "updatedAt": "2023-10-27T10:05:00.000Z",
      "completedAt": null
    }
    ```

-   **`404 Not Found`**: Upload session not found.

### `POST /api/upload/complete/:uploadId`

Finalizes the upload by merging all chunks into a single file.

#### Parameters

- `uploadId` (path): The upload session ID

#### Responses

-   **`200 OK`**: Upload completed successfully.

    ```json
    {
      "success": true,
      "message": "Upload completed successfully",
      "filePath": "/path/to/uploads/550e8400-e29b-41d4-a716-446655440000.pdf"
    }
    ```

-   **`400 Bad Request`**: Upload incomplete (not all chunks uploaded).