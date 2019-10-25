const fs=require('fs');

const pkey = fs.readFileSync('./ssl/key.pem', 'utf8'),
pcert = fs.readFileSync('./ssl/certTest.pem', 'utf8');

exports.config = { key : pkey, cert : pcert, passphrase : '5555555555'};
