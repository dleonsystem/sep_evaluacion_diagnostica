import Client from 'ssh2-sftp-client';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') });

const sftp = new Client();

async function test() {
  try {
    console.log('Connecting to:', process.env.SFTP_HOST, ':', process.env.SFTP_PORT);
    await sftp.connect({
      host: process.env.SFTP_HOST || 'localhost',
      port: parseInt(process.env.SFTP_PORT || '2222'),
      username: process.env.SFTP_USER || 'eia_user',
      password: process.env.SFTP_PASSWORD || 'eia_password',
    });
    console.log('Connected!');
    
    const cwd = await sftp.realPath('.');
    console.log('CWD:', cwd);
    
    const listRoot = await sftp.list('.');
    console.log('List .:', listRoot.map(f => f.name));
    
    if (listRoot.some(f => f.name === 'upload')) {
        console.log('Found upload folder');
        const listUpload = await sftp.list('upload');
        console.log('List upload content:', listUpload.map(f => f.name));
    } else {
        console.log('upload folder NOT found in .');
    }
    
    await sftp.end();
  } catch (err) {
    console.error('Failed:', err);
  }
}

test();
