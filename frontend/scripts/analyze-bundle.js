/**
 * Bundle Analysis Script
 * Analyzes the production bundle size and composition
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔍 Analyzing bundle...');

// Build the app first
console.log('📦 Building production bundle...');
try {
  execSync('npm run build', { stdio: 'inherit' });
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Analyze bundle size
const buildPath = path.join(__dirname, '../build');
const staticPath = path.join(buildPath, 'static');

function getFileSize(filePath) {
  const stats = fs.statSync(filePath);
  return (stats.size / 1024).toFixed(2); // KB
}

function analyzeDirectory(dirPath, prefix = '') {
  const items = fs.readdirSync(dirPath);
  let totalSize = 0;
  
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      console.log(`📁 ${prefix}${item}/`);
      totalSize += analyzeDirectory(itemPath, prefix + '  ');
    } else {
      const size = parseFloat(getFileSize(itemPath));
      totalSize += size;
      
      const sizeStr = size > 1024 ? `${(size / 1024).toFixed(2)} MB` : `${size} KB`;
      const icon = size > 500 ? '🔴' : size > 100 ? '🟡' : '🟢';
      
      console.log(`${icon} ${prefix}${item} - ${sizeStr}`);
    }
  });
  
  return totalSize;
}

console.log('\n📊 Bundle Analysis Results:');
console.log('=' .repeat(50));

if (fs.existsSync(staticPath)) {
  const totalSize = analyzeDirectory(staticPath);
  const totalSizeMB = (totalSize / 1024).toFixed(2);
  
  console.log('=' .repeat(50));
  console.log(`📈 Total bundle size: ${totalSizeMB} MB`);
  
  // Performance recommendations
  console.log('\n💡 Performance Recommendations:');
  
  if (totalSize > 2048) { // > 2MB
    console.log('⚠️  Bundle size is large (>2MB). Consider:');
    console.log('   - Code splitting with React.lazy()');
    console.log('   - Tree shaking unused dependencies');
    console.log('   - Optimizing images and assets');
  } else if (totalSize > 1024) { // > 1MB
    console.log('⚡ Bundle size is moderate (>1MB). Consider:');
    console.log('   - Lazy loading non-critical components');
    console.log('   - Compressing assets');
  } else {
    console.log('✅ Bundle size is optimal (<1MB)');
  }
  
  // Check for large files
  console.log('\n🔍 Large Files Analysis:');
  checkLargeFiles(staticPath);
  
} else {
  console.log('❌ Build directory not found');
}

function checkLargeFiles(dirPath, threshold = 100) { // 100KB threshold
  const items = fs.readdirSync(dirPath);
  
  items.forEach(item => {
    const itemPath = path.join(dirPath, item);
    const stats = fs.statSync(itemPath);
    
    if (stats.isDirectory()) {
      checkLargeFiles(itemPath, threshold);
    } else {
      const size = parseFloat(getFileSize(itemPath));
      if (size > threshold) {
        console.log(`🔴 Large file: ${item} (${size} KB)`);
        
        // Specific recommendations
        if (item.endsWith('.js')) {
          console.log('   💡 Consider code splitting or removing unused code');
        } else if (item.endsWith('.css')) {
          console.log('   💡 Consider CSS purging or splitting');
        } else if (item.match(/\.(png|jpg|jpeg|gif|svg)$/)) {
          console.log('   💡 Consider image optimization or lazy loading');
        }
      }
    }
  });
}

console.log('\n✅ Bundle analysis complete!');
console.log('💡 Run "npm run build:analyze" for detailed webpack analysis');