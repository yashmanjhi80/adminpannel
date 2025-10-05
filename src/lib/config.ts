
export const config = {
  // Admin and Authentication APIs
  api: {
    adminLogin: 'https://game.zyronetworks.shop/admin-login',
    recentTransactions: 'https://game.zyronetworks.shop/agent/recent-transactions',
    paymentCallback: 'https://game.zyronetworks.shop/payment-callback',
  },

  // Manual Transfer API
  transfer: {
    apiUrl: 'http://gsmd.336699bet.com/makeTransfer.aspx',
    secret_key: '904c3acfdc028f495ccc5b60d01dcc49',
    operatorcode: 'i4bi',
    providercode: 'JE',
  },

  // Payment Callback Secrets
  lgPay: {
    secret: 'l8BlAeUb5Bd3zwGHCvLs3GNSFRKJ71nL',
    notifyUrl: 'https://game.zyronetworks.shop/payment-callback',
  },

  // Database Configuration
  db: {
    mongo_uri: process.env.MONGO_URI || 'mongodb://localhost:27017',
    db_name: process.env.DB_NAME || 'user',
  },
};
