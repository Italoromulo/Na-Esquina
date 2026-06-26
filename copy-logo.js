const fs = require('fs');
const path = require('path');

const source = 'C:\\Users\\g\\Downloads\\logo-removebg-preview.png';
const destination = 'd:\\Tela-inicial\\assets\\images\\logo.png';

try {
  // Ensure target directory exists
  const destDir = path.dirname(destination);
  if (!fs.existsSync(destDir)) {
    fs.mkdirSync(destDir, { recursive: true });
  }
  
  fs.copyFileSync(source, destination);
  console.log('COPY_SUCCESS');
} catch (err) {
  console.error('COPY_FAILED', err);
}
