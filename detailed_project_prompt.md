
# Prompt for Building a Next.js Admin Dashboard

## 1. Project Goal

Build a comprehensive admin dashboard for managing users and financial transactions. The dashboard must be a secure, single-page application built with Next.js and will interact with several external APIs for authentication, data fetching, and performing actions.

## 2. Core Technologies

-   **Framework**: Next.js with the App Router
-   **Language**: TypeScript
-   **UI Components**: shadcn/ui
-   **Styling**: Tailwind CSS
-   **Data Fetching**: Use Server Actions (`'use server'`) for all backend communication.

## 3. Key Features

### a. Authentication

-   Create a dedicated login page at `/login`.
-   Implement an authentication system using an external API.
-   On successful login, user data should be stored in the browser's local storage to maintain the session.
-   Unauthenticated users attempting to access any other page should be redirected to the login page.
-   Implement a "Logout" button that clears the session from local storage and redirects to the login page.

### b. Dashboard Page (Homepage `/`)

-   This page should be protected and only accessible after login.
-   Display summary cards showing key metrics:
    -   Total Users
    -   Total Transactions
    -   Pending Transactions
    -   Total Deposit Amount
-   Include a bar chart showing a static overview of "Successful" vs. "Pending" transactions over several months.
-   Implement a collapsible sidebar for navigation between Dashboard, Users, and Transactions pages.

### c. Users Page (`/users`)

-   This page should be protected.
-   Display a table of all users fetched from the internal database.
-   The table should show `Username`, `Reference ID`, `Wallet Balance`, and `Password`.
-   For each user, provide the following actions:
    -   **Show/Hide Password**: A button to toggle the visibility of the user's password.
    -   **Add Money**: A button that opens a dialog to manually add funds to a user's wallet via an API call.
    -   **Reset Password**: A placeholder button that shows a toast notification.

### d. Transactions Page (`/transactions`)

-   This page should be protected.
-   Fetch and display a list of all recent transactions from an external API.
-   The table should show `Username`, `Order ID`, `Amount`, `Date`, and `Status`.
-   The status should be displayed as a colored badge (e.g., green for "SUCCESSFUL", yellow for "PENDING").
-   For transactions with a "PENDING" status, provide an "Approve" button. Clicking it should trigger a callback to another external API to confirm the transaction.

### e. "Add Money" Dialog

-   This dialog should be a form where an admin can manually trigger a deposit for a user.
-   All parameters required by the `makeTransfer` API (including the `apiUrl`) must be present and **editable**.
-   The `referenceid` should be automatically populated with a unique, numbers-only ID (e.g., using `Date.now()`).
-   The `signature` field must be automatically recalculated and updated in real-time whenever any of the other form fields (`amount`, `username`, etc.) are changed. Use a client-side MD5 library for this.

---

## 4. API Specifications

### a. Admin Login

-   **Endpoint**: `POST https://game.zyronetworks.shop/admin-login`
-   **Request Body** (`application/json`):
    ```json
    {
      "username": "someuser",
      "password": "somepassword"
    }
    ```
-   **Success Response** (`application/json`):
    ```json
    {
        "success": true,
        "message": "Admin login successful!",
        "user": {
            "username": "yash7879",
            "email": "yash7879@gmail.com",
            "role": "admin"
        }
    }
    ```

### b. Get Recent Transactions

-   **Endpoint**: `GET https://game.zyronetworks.shop/agent/recent-transactions`
-   **Success Response** (`application/json`):
    ```json
    {
        "success": true,
        "count": 50,
        "transactions": [
            {
                "_id": "68de14651af7a045ea6a09f8",
                "orderId": "ORD1759384675415555",
                "username": "suk",
                "amount": 200,
                "status": "pending",
                "createdAt": "2025-10-02T05:57:57.463Z"
            }
        ]
    }
    ```

### c. Make Transfer (Add Money)

-   **Endpoint**: `GET http://gsmd.336699bet.com/makeTransfer.aspx`
-   **Request**: GET request with URL query parameters.
-   **Example**: `<API_URL>/makeTransfer.aspx?operatorcode=xxx&username=xxx&...`
-   **Parameters**:
    -   `operatorcode`
    -   `providercode`
    -   `username`
    -   `password`
    -   `referenceid` (unique, max 20 chars)
    -   `type` (`0` for deposit)
    -   `amount` (double)
    -   `signature`
-   **Signature Formula**: `MD5(amount + operatorcode + password + providercode + referenceid + type + username + secret_key)` converted to uppercase. `secret_key` is `904c3acfdc028f495ccc5b60d01dcc49`.
-   **Success Response**: A JSON object where `errCode` is `'0'`.
    ```json
    {
      "errCode": "0",
      "errMsg": "OK"
    }
    ```

### d. Approve Transaction (Payment Callback)

-   **Endpoint**: `POST https://game.zyronetworks.shop/payment-callback`
-   **Request Body** (`application/x-www-form-urlencoded`):
    -   `order_sn`: The `orderId` of the transaction.
    -   `money`: The transaction amount.
    -   `status`: `'1'` for success.
    -   `pay_time`: Current timestamp, formatted as `yyyy-MM-dd HH:mm:ss`.
    -   `remark`: A short note, e.g., 'ManualApproval'.
    -   `sign`: The generated MD5 signature.
-   **Signature Formula**: `MD5(money=${money}&notify_url=${LG_PAY_NOTIFY_URL}&order_sn=${order_sn}&remark=${remark}&status=${status}&key=${LG_PAY_SECRET})` converted to uppercase.
    -   `LG_PAY_NOTIFY_URL` is `https://game.zyronetworks.shop/payment-callback`
    -   `LG_PAY_SECRET` is `l8BlAeUb5Bd3zwGHCvLs3GNSFRKJ71nL`
-   **Success Response**: A plain text response containing the word "ok".
