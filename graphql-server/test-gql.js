import fs from 'fs';

async function check() {
    try {
        const token = Buffer.from('admin@sep.gob.mx:' + Date.now()).toString('base64');

        const res = await fetch('http://localhost:4000/graphql', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                query: `query { getSolicitudes(limit: 1000) { id, cct, turno } }`
            })
        });
        const resData = await res.json();
        fs.writeFileSync('graphql-res.json', JSON.stringify(resData, null, 2));
    } catch (e) {
        console.error(e);
    }
}

check();
