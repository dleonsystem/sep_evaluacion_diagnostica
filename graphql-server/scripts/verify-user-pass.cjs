const crypto = require('crypto');

const savedHash = 'f0c77a108eb8c5d755138fb8155710a9:2f9d9f60ef87395a65ac6ec8169ad4716c89a3f6514c7d1359b6f42900bc1a8d621';
const passwordsToTry = ['vVSGziWnBJTm', 'kKKThqWN86a4'];

const [salt, hash] = savedHash.split(':');

passwordsToTry.forEach(password => {
  [32, 64].forEach(len => {
    const hashCalculado = crypto.scryptSync(password, salt, len).toString('hex');
    const coincide = (hash === hashCalculado);
    console.log(`Password: ${password} (len: ${len}) -> ${coincide ? 'MATCH' : 'NO MATCH'}`);
  });
});
