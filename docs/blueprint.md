# **App Name**: TransactionAce Admin

## Core Features:

- User Management: View and manage user details including username, reference ID, type, and wallet balance. Including password resets
- Transaction Overview: Display all transactions from 'deposits' and 'pendingTransactions' collections in a unified view, with filtering and sorting options.
- Pending Transaction Management: List pending transactions with the ability to update their status (e.g., approve or reject).
- Transaction Status Updates: Upon approval of a pending transaction, use the `makeTransfer` API to credit the user's wallet. Handle potential 'errCode' values, specifically '997' and '999', using a tool, which means to consult with customer support for further clarification.
- Real-time Data Updates: Implement real-time updates for transactions and user balances.
- Mobile Responsiveness: Ensure the admin panel is fully responsive and optimized for mobile devices.
- Secure Authentication: Implement secure authentication for admin users to protect sensitive data.

## Style Guidelines:

- Primary color: Deep sky blue (#42A5F5), a professional, confident and modern color.
- Background color: Light gray (#F0F4F8), to ensure a clean and neutral backdrop.
- Accent color: Green (#66BB6A), for positive actions, confirmations and to highlight key elements.
- Font: 'Inter', a grotesque-style sans-serif font, should be used for both headings and body text to ensure optimal readability and a clean modern feel.
- Use a clean, card-based layout to present data clearly. Ensure ample spacing for readability.
- Use a consistent set of minimalist icons for navigation and actions.
- Subtle transitions and animations to enhance user experience without being distracting.