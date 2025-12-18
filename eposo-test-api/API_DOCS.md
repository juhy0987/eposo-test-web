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