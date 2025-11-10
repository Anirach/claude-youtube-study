#!/usr/bin/env node

/**
 * Database Backup Script
 * Creates a backup of the SQLite database and exports data to JSON
 */

const fs = require('fs');
const path = require('path');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const BACKUP_DIR = path.join(__dirname, '../../backups');
const DB_PATH = path.join(__dirname, '../../data/app.db');

async function createBackup() {
  console.log('🔄 Starting backup process...');

  try {
    // Create backups directory if it doesn't exist
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
      console.log('✅ Created backups directory');
    }

    const timestamp = new Date().toISOString().replace(/:/g, '-').split('.')[0];
    const backupName = `backup-${timestamp}`;
    const backupPath = path.join(BACKUP_DIR, backupName);

    // Create backup directory
    fs.mkdirSync(backupPath, { recursive: true });

    // 1. Copy SQLite database file
    if (fs.existsSync(DB_PATH)) {
      const dbBackupPath = path.join(backupPath, 'app.db');
      fs.copyFileSync(DB_PATH, dbBackupPath);
      console.log('✅ Database file backed up');
    }

    // 2. Export data to JSON
    console.log('🔄 Exporting data to JSON...');

    const videos = await prisma.video.findMany({
      include: { category: true }
    });

    const categories = await prisma.category.findMany();

    const knowledgeGraph = await prisma.knowledgeGraph.findMany();

    const chatSessions = await prisma.chatSession.findMany();

    const exportData = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0.0',
        counts: {
          videos: videos.length,
          categories: categories.length,
          knowledgeGraph: knowledgeGraph.length,
          chatSessions: chatSessions.length
        }
      },
      videos: videos.map(v => ({
        ...v,
        tags: JSON.parse(v.tags || '[]'),
        summaryJson: v.summaryJson ? JSON.parse(v.summaryJson) : null
      })),
      categories,
      knowledgeGraph,
      chatSessions: chatSessions.map(s => ({
        ...s,
        videoIds: JSON.parse(s.videoIds || '[]'),
        messages: JSON.parse(s.messages || '[]')
      }))
    };

    const jsonPath = path.join(backupPath, 'data-export.json');
    fs.writeFileSync(jsonPath, JSON.stringify(exportData, null, 2));
    console.log('✅ Data exported to JSON');

    // 3. Create backup manifest
    const manifest = {
      backupName,
      timestamp,
      type: 'full',
      size: getDirectorySize(backupPath),
      files: fs.readdirSync(backupPath),
      statistics: exportData.metadata.counts
    };

    const manifestPath = path.join(backupPath, 'manifest.json');
    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
    console.log('✅ Manifest created');

    // 4. Clean old backups (keep last 10)
    cleanOldBackups();

    console.log(`\n✅ Backup completed successfully!`);
    console.log(`📁 Backup location: ${backupPath}`);
    console.log(`📊 Statistics:`);
    console.log(`   - Videos: ${exportData.metadata.counts.videos}`);
    console.log(`   - Categories: ${exportData.metadata.counts.categories}`);
    console.log(`   - Knowledge Graph Entries: ${exportData.metadata.counts.knowledgeGraph}`);
    console.log(`   - Chat Sessions: ${exportData.metadata.counts.chatSessions}`);
    console.log(`   - Total Size: ${formatBytes(manifest.size)}`);

  } catch (error) {
    console.error('❌ Backup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

function getDirectorySize(dirPath) {
  let size = 0;
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const filePath = path.join(dirPath, file);
    const stats = fs.statSync(filePath);

    if (stats.isFile()) {
      size += stats.size;
    } else if (stats.isDirectory()) {
      size += getDirectorySize(filePath);
    }
  });

  return size;
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function cleanOldBackups() {
  const MAX_BACKUPS = 10;

  if (!fs.existsSync(BACKUP_DIR)) return;

  const backups = fs.readdirSync(BACKUP_DIR)
    .filter(name => name.startsWith('backup-'))
    .map(name => ({
      name,
      path: path.join(BACKUP_DIR, name),
      mtime: fs.statSync(path.join(BACKUP_DIR, name)).mtime.getTime()
    }))
    .sort((a, b) => b.mtime - a.mtime);

  // Remove old backups
  if (backups.length > MAX_BACKUPS) {
    const toRemove = backups.slice(MAX_BACKUPS);
    toRemove.forEach(backup => {
      fs.rmSync(backup.path, { recursive: true, force: true });
      console.log(`🗑️  Removed old backup: ${backup.name}`);
    });
  }
}

// Run backup
createBackup();
