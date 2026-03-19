const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_in_production';

const payload = { id: 'test-id', email: 'jose_mx@hotmail.com', rol: 'RESPONSABLE_CCT' };
const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });

try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('JWT Verification: SUCCESS');
  console.log('Payload:', JSON.stringify(decoded, null, 2));
  console.log('Token starts with:', token.substring(0, 20));
} catch (err) {
  console.error('JWT Verification: FAILED', err.message);
}
