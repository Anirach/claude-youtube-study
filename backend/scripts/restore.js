#!/usr/bin/env node

/**
 * Database Restore Script
 * Restores data from a backup
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const prisma = new PrismaClient();

const BACKUP_DIR = path.join(__dirname, '../../backups');
const DB_PATH = path.join(__dirname, '../../data/app.db');

async function listBackups() {
  if (!fs.existsSync(BACKUP_DIR)) {
    console.log('❌ No backups directory found');
    return [];
  }

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(name => name.startsWith('backup-'))
    .map(name => {
      const manifestPath = path.join(BACKUP_DIR, name, 'manifest.json');
      if (fs.existsSync(manifestPath)) {
        const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
        return manifest;
      }
      return null;
    })
    .filter(Boolean)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  return backups;
}

async function promptUser(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(resolve => {
    rl.question(question, answer => {
      rl.close();
      resolve(answer);
    });
  });
}

async function restoreFromBackup(backupName) {
  console.log(`🔄 Starting restore from: ${backupName}`);

  try {
    const backupPath = path.join(BACKUP_DIR, backupName);

    if (!fs.existsSync(backupPath)) {
      console.error('❌ Backup not found');
      process.exit(1);
    }

    // Load manifest
    const manifestPath = path.join(backupPath, 'manifest.json');
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

    console.log('📋 Backup Information:');
    console.log(`   Date: ${manifest.timestamp}`);
    console.log(`   Videos: ${manifest.statistics.videos}`);
    console.log(`   Categories: ${manifest.statistics.categories}`);
    console.log(`   Knowledge Graph: ${manifest.statistics.knowledgeGraph}`);
    console.log(`   Chat Sessions: ${manifest.statistics.chatSessions}`);

    // Confirm restore
    const confirm = await promptUser('\n⚠️  This will replace all current data. Continue? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
      console.log('❌ Restore cancelled');
      process.exit(0);
    }

    // 1. Clear existing data
    console.log('🔄 Clearing existing data...');
    await prisma.knowledgeGraph.deleteMany();
    await prisma.chatSession.deleteMany();
    await prisma.video.deleteMany();
    await prisma.category.deleteMany();
    console.log('✅ Existing data cleared');

    // 2. Restore from JSON
    console.log('🔄 Restoring data from JSON...');

    const dataPath = path.join(backupPath, 'data-export.json');
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

    // Restore categories first (for foreign key relationships)
    for (const category of data.categories) {
      await prisma.category.create({ data: category });
    }
    console.log(`✅ Restored ${data.categories.length} categories`);

    // Restore videos
    for (const video of data.videos) {
      await prisma.video.create({
        data: {
          ...video,
          tags: JSON.stringify(video.tags),
          summaryJson: video.summaryJson ? JSON.stringify(video.summaryJson) : null,
          category: undefined // Remove the included category
        }
      });
    }
    console.log(`✅ Restored ${data.videos.length} videos`);

    // Restore knowledge graph
    for (const kg of data.knowledgeGraph) {
      await prisma.knowledgeGraph.create({ data: kg });
    }
    console.log(`✅ Restored ${data.knowledgeGraph.length} knowledge graph entries`);

    // Restore chat sessions
    for (const session of data.chatSessions) {
      await prisma.chatSession.create({
        data: {
          ...session,
          videoIds: JSON.stringify(session.videoIds),
          messages: JSON.stringify(session.messages)
        }
      });
    }
    console.log(`✅ Restored ${data.chatSessions.length} chat sessions`);

    console.log('\n✅ Restore completed successfully!');
    console.log('📊 Summary:');
    console.log(`   - Categories: ${data.categories.length}`);
    console.log(`   - Videos: ${data.videos.length}`);
    console.log(`   - Knowledge Graph: ${data.knowledgeGraph.length}`);
    console.log(`   - Chat Sessions: ${data.chatSessions.length}`);

  } catch (error) {
    console.error('❌ Restore failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

async function main() {
  console.log('📦 YouTube Study App - Database Restore\n');

  const backups = await listBackups();

  if (backups.length === 0) {
    console.log('❌ No backups found');
    process.exit(0);
  }

  console.log('Available backups:');
  backups.forEach((backup, index) => {
    console.log(`\n${index + 1}. ${backup.backupName}`);
    console.log(`   Date: ${new Date(backup.timestamp).toLocaleString()}`);
    console.log(`   Videos: ${backup.statistics.videos} | Categories: ${backup.statistics.categories}`);
  });

  const answer = await promptUser('\nSelect backup number to restore (or "q" to quit): ');

  if (answer.toLowerCase() === 'q') {
    console.log('👋 Goodbye!');
    process.exit(0);
  }

  const index = parseInt(answer) - 1;

  if (index < 0 || index >= backups.length) {
    console.log('❌ Invalid selection');
    process.exit(1);
  }

  await restoreFromBackup(backups[index].backupName);
}

// Run restore
main();
