// Mock balance storage (in-memory for demo)
// In production, this would connect to Privacy Cash SDK
let mockBalance = { lamports: 0 };

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // For demo: return mock balance
  // In production: call Privacy Cash SDK
  return res.status(200).json({
    success: true,
    balance: {
      lamports: mockBalance.lamports,
      sol: mockBalance.lamports / 1_000_000_000,
    },
    demo: true,
    note: 'Demo mode - Privacy Cash SDK requires dedicated server for production',
  });
};
