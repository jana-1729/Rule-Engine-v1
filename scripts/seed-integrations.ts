#!/usr/bin/env tsx

/**
 * Seed Integrations Script
 * 
 * This script syncs integrations from the registry to the database.
 * Run this after adding new integrations to ensure they're available in the UI.
 */

import { prisma } from '../src/lib/prisma';
import { integrationRegistry, loadIntegrations } from '../src/integrations/registry';

async function seedIntegrations() {
  console.log('🌱 Seeding integrations from registry...\n');

  try {
    // Load all integrations from registry
    await loadIntegrations();
    const integrations = integrationRegistry.list();

    console.log(`Found ${integrations.length} integrations in registry\n`);

    let created = 0;
    let updated = 0;
    let skipped = 0;

    for (const integration of integrations) {
      const { metadata } = integration;

      try {
        // Check if integration already exists
        const existing = await prisma.integration.findUnique({
          where: { slug: metadata.slug },
        });

        if (existing) {
          // Update existing integration
          await prisma.integration.update({
            where: { id: existing.id },
            data: {
              name: metadata.name,
              description: metadata.description,
              category: metadata.category,
              logo: metadata.icon || metadata.logo,
              authType: metadata.authType,
              isActive: true,
            },
          });
          console.log(`✓ Updated: ${metadata.name} (${metadata.slug})`);
          updated++;
        } else {
          // Create new integration
          await prisma.integration.create({
            data: {
              slug: metadata.slug,
              name: metadata.name,
              description: metadata.description,
              category: metadata.category,
              logo: metadata.icon || metadata.logo,
              authType: metadata.authType,
              isActive: true,
            },
          });
          console.log(`✓ Created: ${metadata.name} (${metadata.slug})`);
          created++;
        }
      } catch (error: any) {
        console.error(`✗ Failed to seed ${metadata.name}:`, error.message);
        skipped++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`  Created: ${created}`);
    console.log(`  Updated: ${updated}`);
    console.log(`  Skipped: ${skipped}`);
    console.log(`  Total: ${integrations.length}\n`);

    console.log('✅ Integration seeding complete!');
  } catch (error) {
    console.error('❌ Failed to seed integrations:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeding
seedIntegrations();

