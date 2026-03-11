import { SftpService } from '../src/services/sftp.service.js';
import dotenv from 'dotenv';
dotenv.config();

const test = async () => {
    const sftp = new SftpService();
    console.log('Testing SFTP Connection...');
    const connected = await sftp.connect();
    if (connected) {
        console.log('✅ Connection Successful');
        await sftp.disconnect();
        console.log('🔌 Disconnected');
    } else {
        console.error('❌ Connection Failed');
    }
};

test();
