import { SftpService } from './src/services/sftp.service.js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

async function test() {
  const sftp = new SftpService();
  console.log('Connecting to SFTP...');
  const connected = await sftp.connect();
  if (!connected) {
    console.error('Failed to connect to SFTP');
    process.exit(1);
  }
  console.log('Connected!');

  console.log('Ensuring dir "tickets"...');
  const dirEnsured = await sftp.ensureDir('tickets');
  console.log('Dir ensured:', dirEnsured);

  console.log('Uploading test buffer...');
  const buffer = Buffer.from('test content');
  const uploaded = await sftp.uploadBuffer(buffer, 'tickets/test.txt');
  console.log('Uploaded:', uploaded);

  await sftp.disconnect();
}

test().catch(console.error);
