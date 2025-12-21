// Test Supabase connection
// Run this with: npm run supabase:test

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';

// Load .env file
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  console.error('❌ .env file not found!');
  process.exit(1);
}

async function testConnection() {
  console.log('🔍 Testing Supabase Connection...\n');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing environment variables:');
    if (!supabaseUrl) console.error('  - NEXT_PUBLIC_SUPABASE_URL');
    if (!supabaseKey) console.error('  - NEXT_PUBLIC_SUPABASE_ANON_KEY');
    process.exit(1);
  }

  console.log('✅ Environment variables found');
  console.log(`   URL: ${supabaseUrl}`);
  console.log(`   Key: ${supabaseKey.substring(0, 20)}...`);
  console.log('');

  try {
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test connection by checking auth status (doesn't require tables)
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError && authError.message.includes('fetch')) {
      throw new Error('Cannot reach Supabase server. Check your internet connection.');
    }

    console.log('✅ Supabase connection successful!');
    console.log('✅ Can communicate with Supabase API');
    console.log('');

    // Try to check if tables exist
    const { data, error } = await supabase.from('accounts').select('count').limit(1);

    if (error) {
      // If table doesn't exist or schema not found, that's okay - we'll create them
      if (error.message.includes('table') || error.message.includes('schema')) {
        console.log('⚠️  Database tables not created yet');
        console.log('');
        console.log('📋 Next steps:');
        console.log('  1. Set up your DATABASE_URL in .env (for Prisma)');
        console.log('  2. Run: npx prisma migrate dev --name init');
        console.log('  3. Or run: npx prisma db push');
        console.log('');
        console.log('Your Supabase connection is working! ✅');
        return;
      }
      throw error;
    }

    console.log('✅ Database tables are accessible');
    console.log('');
    console.log('🎉 Everything is working perfectly!');
  } catch (error: any) {
    console.error('❌ Connection test failed!');
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    console.error('Common issues:');
    console.error('  1. Check NEXT_PUBLIC_SUPABASE_URL is correct');
    console.error('  2. Check NEXT_PUBLIC_SUPABASE_ANON_KEY is correct');
    console.error('  3. Verify project is not paused in Supabase dashboard');
    console.error('  4. Check internet connection');
    console.error('');
    console.error('Get your credentials from:');
    console.error('https://supabase.com/dashboard/project/oevufcptoaqhjhrijaeo/settings/api');
    process.exit(1);
  }
}

testConnection();

