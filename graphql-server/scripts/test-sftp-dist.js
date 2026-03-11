import { SftpService } from '../dist/services/sftp.service.js';
import dotenv from 'dotenv';
dotenv.config();

// Create simplified test runner for JS
(async () => {
    try {
        console.log('Testing SFTP Connection...');
        const sftp = new SftpService();
        await sftp.connect();
        console.log('✅ Connection Successful!');

        // List files
        console.log('Listing files in upload folder...');
        const list = await sftp.list('/upload');
        console.log('📂 Files found:', list.length);

        await sftp.disconnect();
        console.log('🔌 Disconnected');
    } catch (error) {
        console.error('❌ Connection Failed:', error.message);
    }
})();
