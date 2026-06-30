const fs = require('fs');

const password = encodeURIComponent('VjHTs4%b/.A5.-R');
const dbUrl = `DATABASE_URL="postgresql://postgres.wbypylvyzbeglwpsrwuo:${password}@aws-1-eu-west-3.pooler.supabase.com:6543/postgres?pgbouncer=true"`;
const directUrl = `DIRECT_URL="postgresql://postgres.wbypylvyzbeglwpsrwuo:${password}@aws-1-eu-west-3.pooler.supabase.com:5432/postgres"`;

const envContent = `${dbUrl}\n${directUrl}\n`;
fs.writeFileSync('.env', envContent);

let localEnv = fs.readFileSync('.env.local', 'utf8');
localEnv = localEnv.replace(/DATABASE_URL=".*"/, dbUrl);
localEnv = localEnv.replace(/DIRECT_URL=".*"/, directUrl);
fs.writeFileSync('.env.local', localEnv);

console.log('Fixed environments');
