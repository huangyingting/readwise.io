const fs = require('fs');
const path = require('path');

(async () => {
  const domainsRes = await fetch('https://api.mail.tm/domains');
  const domainsData = await domainsRes.json();
  const domain = domainsData['hydra:member'][0].domain;

  const rand = Math.random().toString(36).substring(2, 10);
  const address = `rwreader_${rand}@${domain}`;
  const password = `RwClone2026!_${rand}`;

  console.log('Creating temp email:', address);
  const createRes = await fetch('https://api.mail.tm/accounts', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  });
  const account = await createRes.json();

  const tokenRes = await fetch('https://api.mail.tm/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ address, password })
  });
  const tokenData = await tokenRes.json();

  const info = {
    firstName: 'Alex',
    email: address,
    password: password,
    mailTmId: account.id,
    mailTmToken: tokenData.token
  };

  fs.mkdirSync(path.join(__dirname, '..', 'data'), { recursive: true });
  fs.writeFileSync(path.join(__dirname, '..', 'data', 'temp_account.json'), JSON.stringify(info, null, 2));
  console.log('Saved temp account info:', info.email);
})();
