#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec } = require('child_process');
const { promisify } = require('util');

const execPromise = promisify(exec);

// Load .env file manually
const envPaths = [
  path.join(__dirname, '../.env'),
  path.join(__dirname, '../env')
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      if (line.trim().startsWith('#') || !line.trim()) return;
      const [key, ...value] = line.split('=');
      if (key && value.length > 0) {
        process.env[key.trim()] = value.join('=').trim();
      }
    });
    break;
  }
}

const CONTENT_DIR = path.join(__dirname, '../content');
const SYNC_STATE_FILE = path.join(__dirname, '../.content-sync-state.json');
const BUCKET_NAME = process.env.R2_BUCKET_NAME || 'dereva-media';
const USE_WRANGLER = (process.env.USE_WRANGLER || 'true').toLowerCase() === 'true';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || process.env.ACCOUNT_ID;
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || process.env.CLOUDFLARE_API_KEY;

/**
 * Calculate MD5 hash of a file
 */
function calculateFileHash(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const hashSum = crypto.createHash('md5');
  hashSum.update(fileBuffer);
  return hashSum.digest('hex');
}

/**
 * Load sync state from disk
 */
function loadSyncState() {
  if (fs.existsSync(SYNC_STATE_FILE)) {
    try {
      const content = fs.readFileSync(SYNC_STATE_FILE, 'utf8');
      return JSON.parse(content);
    } catch (error) {
      console.warn('⚠️  Could not parse sync state file, starting fresh:', error.message);
      return { files: {}, lastSync: null };
    }
  }
  return { files: {}, lastSync: null };
}

/**
 * Save sync state to disk
 */
function saveSyncState(state) {
  try {
    fs.writeFileSync(SYNC_STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (error) {
    console.error('❌ Failed to save sync state:', error.message);
  }
}

/**
 * Check if file needs to be uploaded
 */
function fileNeedsUpload(filePath, syncState) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const key = 'content/' + relativePath.replace(/\\/g, '/').replace(/^content\//, '');

  if (!syncState.files[key]) {
    return { needsUpload: true, reason: 'new' };
  }

  const stats = fs.statSync(filePath);
  const currentHash = calculateFileHash(filePath);
  const savedState = syncState.files[key];

  if (savedState.hash !== currentHash) {
    return { needsUpload: true, reason: 'modified' };
  }

  if (savedState.mtime !== stats.mtime.getTime()) {
    return { needsUpload: true, reason: 'timestamp-changed' };
  }

  return { needsUpload: false, reason: 'unchanged' };
}

/**
 * Update sync state for a file after successful upload
 */
function updateFileState(filePath, syncState) {
  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const key = 'content/' + relativePath.replace(/\\/g, '/').replace(/^content\//, '');
  
  const stats = fs.statSync(filePath);
  const hash = calculateFileHash(filePath);

  syncState.files[key] = {
    hash: hash,
    mtime: stats.mtime.getTime(),
    size: stats.size,
    lastUpload: Date.now()
  };

  return syncState;
}

/**
 * Delete a file from R2
 */
async function deleteFileFromR2(key, retries = 3) {
  if (!USE_WRANGLER) {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      console.error('Missing credentials for API mode; falling back to wrangler.');
      return deleteViaWrangler(key, retries);
    }
    return deleteViaApiWithRetries(key, retries);
  }
  return deleteViaWrangler(key, retries);
}

async function deleteViaWrangler(key, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const escapedPath = `"${BUCKET_NAME}/${key}"`;
    const cmd = `wrangler r2 object delete ${escapedPath} --remote`;
    
    console.log(`🗑️  (wrangler) Deleting (${attempt}/${retries}): ${key}`);
    
    try {
      const { stdout, stderr } = await execPromise(cmd);
      if (stdout) console.log(stdout.trim());
      if (stderr && !stderr.includes('success')) console.error(stderr.trim());
      console.log(`✅ Deleted from R2: ${key}`);
      return true;
    } catch (error) {
      const err = (error.stderr || '').toString().trim();
      
      if (err.includes('not found') || err.includes('NoSuchKey')) {
        console.log(`ℹ️  File already deleted: ${key}`);
        return true;
      }
      
      if (attempt === retries) {
        console.error(`❌ Failed to delete ${key} after ${retries} attempts.`);
        console.error('Error:', error.message || error);
        return false;
      } else {
        console.log(`⚠️  Retrying delete ${key} (Attempt ${attempt + 1}/${retries})...`);
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }
  return false;
}

async function deleteViaApiWithRetries(key, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`🗑️  (api) Deleting (${attempt}/${retries}): ${key}`);
      await deleteViaApi(key);
      console.log(`✅ Deleted from R2: ${key}`);
      return true;
    } catch (err) {
      if (err.message && (err.message.includes('404') || err.message.includes('NoSuchKey'))) {
        console.log(`ℹ️  File already deleted: ${key}`);
        return true;
      }
      
      console.error(err && err.message ? err.message : err);
      
      if (attempt === retries) {
        console.error(`❌ Failed to delete ${key} after ${retries} attempts via API.`);
        return false;
      } else {
        const delay = 1000 * attempt;
        console.log(`⚠️  Retrying delete ${key} (Attempt ${attempt + 1}/${retries}) in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

async function deleteViaApi(key) {
  let fetchFn = global.fetch;
  if (!fetchFn) {
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      throw new Error('No fetch available. Please run on Node 18+ or install node-fetch.');
    }
  }

  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${encodedKey}`;
  
  const headers = {
    Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
  };

  const res = await fetchFn(url, { method: 'DELETE', headers });
  const text = await res.text();

  if (!res.ok) {
    let msg = `R2 API delete failed: ${res.status} ${res.statusText}`;
    try {
      const body = JSON.parse(text);
      msg += ` - ${JSON.stringify(body)}`;
    } catch (e) {
      msg += ` - ${text}`;
    }
    throw new Error(msg);
  }

  return text;
}

/**
 * Clean up sync state and delete remote files for locally deleted files
 */
async function cleanupSyncState(syncState, currentFiles, deleteRemote = true) {
  const currentKeys = new Set(currentFiles.map(f => {
    const relativePath = path.relative(path.join(__dirname, '..'), f);
    return 'content/' + relativePath.replace(/\\/g, '/').replace(/^content\//, '');
  }));

  const stateKeys = Object.keys(syncState.files);
  const deletedKeys = stateKeys.filter(key => !currentKeys.has(key));

  if (deletedKeys.length === 0) {
    return syncState;
  }

  console.log(`\n🗑️  Found ${deletedKeys.length} deleted file(s) locally`);

  if (deleteRemote) {
    console.log('🔄 Deleting from R2...\n');
    
    let successCount = 0;
    let failureCount = 0;

    for (let i = 0; i < deletedKeys.length; i++) {
      const key = deletedKeys[i];
      console.log(`[${i + 1}/${deletedKeys.length}] ${key}`);
      
      const success = await deleteFileFromR2(key);
      if (success) {
        successCount++;
        delete syncState.files[key];
      } else {
        failureCount++;
      }
    }

    console.log(`\n✅ Successfully deleted from R2: ${successCount}`);
    if (failureCount > 0) {
      console.log(`❌ Failed to delete from R2: ${failureCount}`);
    }
  } else {
    deletedKeys.forEach(key => {
      delete syncState.files[key];
    });
    console.log(`🧹 Cleaned up ${deletedKeys.length} deleted file(s) from sync state (no R2 deletion)`);
  }

  return syncState;
}

/**
 * Uploads a single file to R2 using wrangler with retries
 */
async function uploadFile(filePath, retries = 5) {
  if (fs.statSync(filePath).isDirectory()) return;

  const relativePath = path.relative(path.join(__dirname, '..'), filePath);
  const key = 'content/' + relativePath.replace(/\\/g, '/').replace(/^content\//, '');

  if (!USE_WRANGLER) {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      console.error('Missing credentials for API mode; falling back to wrangler.');
      return uploadViaWrangler(filePath, key, retries);
    }
    return uploadViaApiWithRetries(filePath, key, retries);
  }

  return uploadViaWrangler(filePath, key, retries);
}

async function uploadViaWrangler(filePath, key, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const escapedPath = `"${BUCKET_NAME}/${key}"`;
    const escapedFile = `"${filePath}"`;
    const cmd = `wrangler r2 object put ${escapedPath} --file=${escapedFile} --remote`;

    console.log(`⤴️  (wrangler) Uploading (${attempt}/${retries}): ${key}`);

    try {
      const { stdout, stderr } = await execPromise(cmd);
      if (stdout) console.log(stdout.trim());
      if (stderr) console.error(stderr.trim());
      console.log(`✅ Uploaded: ${key}`);
      return true;
    } catch (error) {
      const out = (error.stdout || '').toString().trim();
      const err = (error.stderr || '').toString().trim();
      
      if (out) console.log(out);
      if (err) console.error(err);

      if (attempt === retries) {
        console.error(`❌ Failed to upload ${key} after ${retries} attempts.`);
        console.error('Error message:', error.message || error);
        return false;
      } else {
        console.log(`⚠️  Retrying ${key} (Attempt ${attempt + 1}/${retries}) in ${2000 * Math.pow(2, attempt - 1)}ms...`);
        await new Promise(resolve => setTimeout(resolve, 2000 * Math.pow(2, attempt - 1)));
      }
    }
  }
  return false;
}

async function uploadViaApiWithRetries(filePath, key, retries = 5) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`⤴️  (api) Uploading (${attempt}/${retries}): ${key}`);
      await uploadViaApi(filePath, key);
      console.log(`✅ Uploaded: ${key}`);
      return true;
    } catch (err) {
      console.error(err && err.message ? err.message : err);

      if (attempt === retries) {
        console.error(`❌ Failed to upload ${key} after ${retries} attempts via API.`);
        return false;
      } else {
        const delay = 2000 * Math.pow(2, attempt - 1);
        console.log(`⚠️  Retrying ${key} (Attempt ${attempt + 1}/${retries}) in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

async function uploadViaApi(filePath, key) {
  let fetchFn = global.fetch;
  if (!fetchFn) {
    try {
      fetchFn = require('node-fetch');
    } catch (e) {
      throw new Error('No fetch available. Please run on Node 18+ or install node-fetch.');
    }
  }

  const buffer = fs.readFileSync(filePath);
  const encodedKey = key.split('/').map(encodeURIComponent).join('/');
  const url = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/r2/buckets/${BUCKET_NAME}/objects/${encodedKey}`;

  const headers = {
    Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
    'Content-Type': 'application/octet-stream',
    'Content-Length': String(buffer.length),
  };

  const res = await fetchFn(url, { method: 'PUT', headers, body: buffer });
  const text = await res.text();

  if (!res.ok) {
    let msg = `R2 API upload failed: ${res.status} ${res.statusText}`;
    try {
      const body = JSON.parse(text);
      msg += ` - ${JSON.stringify(body)}`;
    } catch (e) {
      msg += ` - ${text}`;
    }
    throw new Error(msg);
  }

  return text;
}

/**
 * List content structure
 */
function listContent() {
  console.log('📚 Content Library Structure\n');
  console.log('=' .repeat(60));

  if (!fs.existsSync(CONTENT_DIR)) {
    console.log('❌ Content directory not found');
    return;
  }

  const categories = fs.readdirSync(CONTENT_DIR)
    .filter(item => {
      const fullPath = path.join(CONTENT_DIR, item);
      return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
    })
    .sort();

  categories.forEach(category => {
    const categoryPath = path.join(CONTENT_DIR, category);
    console.log(`\n📁 ${category}/`);

    const modules = fs.readdirSync(categoryPath)
      .filter(item => {
        const fullPath = path.join(categoryPath, item);
        return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
      })
      .sort();

    modules.forEach(module => {
      const modulePath = path.join(categoryPath, module);
      console.log(`   ├─ ${module}/`);

      const lessons = fs.readdirSync(modulePath)
        .filter(item => {
          const fullPath = path.join(modulePath, item);
          return fs.statSync(fullPath).isDirectory() && !item.startsWith('.');
        })
        .sort();

      lessons.forEach((lesson, idx) => {
        const isLast = idx === lessons.length - 1;
        const prefix = isLast ? '└─' : '├─';
        const lessonPath = path.join(modulePath, lesson);
        
        const hasIndex = fs.existsSync(path.join(lessonPath, 'index.html'));
        const icon = hasIndex ? '✅' : '⚠️ ';
        
        console.log(`   │  ${prefix} ${lesson}/ ${icon}`);
      });
    });
  });

  console.log('\n' + '='.repeat(60));
}

/**
 * Scans directory and uploads all files
 */
async function syncAll(forceAll = false, deleteRemote = true) {
  console.log('--- Starting Content Sync ---');

  let syncState = loadSyncState();

  if (forceAll) {
    console.log('🔄 Force mode enabled - will upload all files');
    syncState = { files: {}, lastSync: null };
  } else if (syncState.lastSync) {
    const lastSyncDate = new Date(syncState.lastSync);
    console.log(`📋 Last sync: ${lastSyncDate.toLocaleString()}`);
  } else {
    console.log('📋 No previous sync found - will upload all files');
  }

  if (!deleteRemote) {
    console.log('⚠️  Remote deletion disabled - deleted local files will remain in R2');
  }

  const files = [];

  function walk(dir) {
    const list = fs.readdirSync(dir);
    list.forEach(file => {
      const fullPath = path.join(dir, file);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        // Skip README files and hidden files
        if (!file.startsWith('.') && file !== 'README.md' && file !== '.gitkeep') {
          files.push(fullPath);
        }
      }
    });
  }

  if (fs.existsSync(CONTENT_DIR)) {
    walk(CONTENT_DIR);
  } else {
    console.error(`Error: Content directory not found at ${CONTENT_DIR}`);
    return;
  }

  console.log(`📁 Found ${files.length} content files`);

  syncState = await cleanupSyncState(syncState, files, deleteRemote);

  const filesToUpload = [];
  const skippedFiles = [];

  for (const file of files) {
    const check = fileNeedsUpload(file, syncState);
    if (check.needsUpload) {
      filesToUpload.push({ path: file, reason: check.reason });
    } else {
      skippedFiles.push(file);
    }
  }

  console.log(`\n📊 Sync Summary:`);
  console.log(`   🆕 New files: ${filesToUpload.filter(f => f.reason === 'new').length}`);
  console.log(`   ✏️  Modified files: ${filesToUpload.filter(f => f.reason === 'modified').length}`);
  console.log(`   ⏭️  Skipped (unchanged): ${skippedFiles.length}`);
  console.log(`   📤 Total to upload: ${filesToUpload.length}\n`);

  if (filesToUpload.length === 0) {
    console.log('✨ Everything is up to date! No uploads needed.');
    syncState.lastSync = Date.now();
    saveSyncState(syncState);
    return;
  }

  let successCount = 0;
  let failureCount = 0;

  for (let i = 0; i < filesToUpload.length; i++) {
    const { path: file, reason } = filesToUpload[i];
    const relativePath = path.relative(path.join(__dirname, '..'), file);
    
    console.log(`\n[${i + 1}/${filesToUpload.length}] ${reason === 'new' ? '🆕' : '✏️'} ${relativePath}`);
    
    const success = await uploadFile(file);
    if (success) {
      successCount++;
      syncState = updateFileState(file, syncState);
      saveSyncState(syncState);
    } else {
      failureCount++;
    }
  }

  syncState.lastSync = Date.now();
  saveSyncState(syncState);

  console.log('\n--- Sync Complete ---');
  console.log(`✅ Successfully uploaded: ${successCount}`);
  if (failureCount > 0) {
    console.log(`❌ Failed uploads: ${failureCount}`);
  }
  console.log(`💾 Sync state saved to: ${SYNC_STATE_FILE}`);
}

/**
 * Watch mode: upload changed files immediately
 */
async function watchMode() {
  console.log('--- Initial Sync ---');
  await syncAll();

  console.log(`\n👀 Watching for changes in: ${CONTENT_DIR}`);
  console.log('Press Ctrl+C to stop.\n');

  let syncState = loadSyncState();

  fs.watch(CONTENT_DIR, { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    const fullPath = path.join(CONTENT_DIR, filename);

    setTimeout(async () => {
      if (fs.existsSync(fullPath) && !fs.statSync(fullPath).isDirectory()) {
        // Skip README and hidden files
        if (filename.startsWith('.') || filename.endsWith('README.md') || filename.endsWith('.gitkeep')) {
          return;
        }

        syncState = loadSyncState();
        const check = fileNeedsUpload(fullPath, syncState);

        if (check.needsUpload) {
          console.log(`\n🔔 Change detected: ${filename} (${check.reason})`);
          const success = await uploadFile(fullPath);
          if (success) {
            syncState = updateFileState(fullPath, syncState);
            syncState.lastSync = Date.now();
            saveSyncState(syncState);
          }
        } else {
          console.log(`⏭️  Skipped (unchanged): ${filename}`);
        }
      }
    }, 100);
  });
}

/**
 * Show sync state statistics
 */
function showStats() {
  const syncState = loadSyncState();

  console.log('📊 Content Sync Statistics');
  console.log('========================\n');

  if (syncState.lastSync) {
    const lastSyncDate = new Date(syncState.lastSync);
    console.log(`Last sync: ${lastSyncDate.toLocaleString()}`);
  } else {
    console.log('Last sync: Never');
  }

  const fileCount = Object.keys(syncState.files).length;
  console.log(`Tracked files: ${fileCount}`);

  if (fileCount > 0) {
    const totalSize = Object.values(syncState.files).reduce((sum, file) => sum + file.size, 0);
    const totalSizeMB = (totalSize / (1024 * 1024)).toFixed(2);
    console.log(`Total size: ${totalSizeMB} MB`);

    const recentFiles = Object.entries(syncState.files)
      .sort((a, b) => b[1].lastUpload - a[1].lastUpload)
      .slice(0, 10);

    console.log('\nMost recently uploaded files:');
    recentFiles.forEach(([key, data]) => {
      const uploadDate = new Date(data.lastUpload);
      const sizeMB = (data.size / 1024).toFixed(1);
      console.log(`  ${uploadDate.toLocaleString()} - ${key} (${sizeMB} KB)`);
    });
  }

  console.log(`\nSync state file: ${SYNC_STATE_FILE}`);
}

/**
 * Reset sync state
 */
function resetSyncState() {
  if (fs.existsSync(SYNC_STATE_FILE)) {
    fs.unlinkSync(SYNC_STATE_FILE);
    console.log('✅ Sync state has been reset');
    console.log('💡 Next sync will upload all files');
  } else {
    console.log('ℹ️  No sync state file found');
  }
}

/**
 * Main Entry Point
 */
const args = process.argv.slice(2);
const deleteRemote = !args.includes('--no-delete');

if (args.includes('--list')) {
  listContent();
} else if (args.includes('--watch')) {
  watchMode();
} else if (args.includes('--stats')) {
  showStats();
} else if (args.includes('--reset')) {
  resetSyncState();
} else if (args.includes('--force')) {
  syncAll(true, deleteRemote);
} else if (args.includes('--help')) {
  console.log(`
Dereva Smart Content Management Tool
=====================================

Usage: node manage_content.js [options]

Options:
  (none)        Smart sync - only upload new or modified content files
  --list        List content library structure
  --watch       Watch mode - continuously monitor and upload changes
  --force       Force mode - upload all files regardless of state
  --no-delete   Don't delete remote files when deleted locally
  --stats       Show sync state statistics
  --reset       Reset sync state (next sync will upload all files)
  --help        Show this help message

Environment Variables:
  USE_WRANGLER           Set to 'true' to use wrangler CLI instead of API
  CLOUDFLARE_ACCOUNT_ID  Your Cloudflare account ID (for API mode)
  CLOUDFLARE_API_TOKEN   Your Cloudflare API token (for API mode)
  R2_BUCKET_NAME         R2 bucket name (default: dereva-media)

Examples:
  node manage_content.js                    # Smart sync (recommended)
  node manage_content.js --list             # List content structure
  node manage_content.js --watch            # Watch for changes
  node manage_content.js --force            # Upload everything
  node manage_content.js --no-delete        # Sync but don't delete remote files
  node manage_content.js --stats            # View statistics
  node manage_content.js --reset            # Reset and re-sync

Content Structure:
  content/
  ├── A1/                    # License category
  │   ├── 01-module-name/    # Module
  │   │   └── lesson-01-name/  # Lesson (self-contained)
  │   │       ├── index.html   # Main content
  │   │       ├── images/      # Local images
  │   │       └── videos/      # Local videos

Notes:
  - README.md and .gitkeep files are automatically skipped
  - Files are uploaded to: ${BUCKET_NAME}/content/...
  - Use --list to see your content structure before syncing
`);
} else {
  syncAll(false, deleteRemote);
}
