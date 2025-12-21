#!/usr/bin/env node

const fs = require('fs');
const readline = require('readline');
const path = require('path');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log('╔════════════════════════════════════════════════════════════════╗');
console.log('║         Update DATABASE_URL for Prisma                        ║');
console.log('╚════════════════════════════════════════════════════════════════╝');
console.log('');
console.log('✅ Your Supabase API connection is working!');
console.log('⚠️  But Prisma needs the direct database password.');
console.log('');
console.log('Get your database connection string:');
console.log('👉 https://supabase.com/dashboard/project/oevufcptoaqhjhrijaeo/settings/database');
console.log('');
console.log('Steps:');
console.log('  1. Click "Connection string" section');
console.log('  2. Select "URI" tab');
console.log('  3. Toggle OFF "Use connection pooling" (port must be 5432)');
console.log('  4. Copy the full string');
console.log('');
console.log('It looks like:');
console.log('postgresql://postgres:YOUR-PASSWORD@db.oevufcptoaqhjhrijaeo.supabase.co:5432/postgres');
console.log('');
console.log('═══════════════════════════════════════════════════════════════');
console.log('');

rl.question('Paste your database connection string: ', (connectionString) => {
  connectionString = connectionString.trim();
  
  if (!connectionString) {
    console.error('❌ No connection string provided');
    process.exit(1);
  }
  
  if (!connectionString.startsWith('postgresql://')) {
    console.error('❌ Invalid connection string. Must start with: postgresql://');
    process.exit(1);
  }
  
  // Check port
  if (connectionString.includes(':6543/')) {
    console.log('');
    console.log('⚠️  WARNING: You\'re using port 6543 (pooled connection)');
    console.log('   Changing to port 5432 for Prisma compatibility...');
    connectionString = connectionString.replace(':6543/', ':5432/');
  }
  
  // Read .env file
  const envPath = path.join(process.cwd(), '.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    process.exit(1);
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update DATABASE_URL
  const databaseUrlRegex = /DATABASE_URL=.*/;
  if (envContent.match(databaseUrlRegex)) {
    envContent = envContent.replace(databaseUrlRegex, `DATABASE_URL="${connectionString}"`);
  } else {
    // Add it if it doesn't exist
    envContent += `\nDATABASE_URL="${connectionString}"\n`;
  }
  
  // Write back
  fs.writeFileSync(envPath, envContent);
  
  console.log('');
  console.log('✅ Updated DATABASE_URL in .env');
  console.log('');
  console.log('Testing connection...');
  
  const { execSync } = require('child_process');
  
  try {
    execSync('npx prisma db execute --stdin <<< "SELECT 1"', {
      stdio: 'pipe',
      encoding: 'utf-8'
    });
    
    console.log('✅ Database connection successful!');
    console.log('');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                    🎉 SUCCESS!                                 ║');
    console.log('╚════════════════════════════════════════════════════════════════╝');
    console.log('');
    console.log('Next steps:');
    console.log('  1. Create tables:  npx prisma db push');
    console.log('  2. Test again:     npm run supabase:test');
    console.log('  3. Start app:      npm run dev');
    console.log('');
    
  } catch (error) {
    console.error('❌ Connection test failed');
    console.error('');
    console.error('The connection string was saved, but connection failed.');
    console.error('Please check:');
    console.error('  - Password is correct');
    console.error('  - Database is not paused');
    console.error('  - Port is 5432 (not 6543)');
    process.exit(1);
  }
  
  rl.close();
});

