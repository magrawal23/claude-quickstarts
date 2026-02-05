const fs = require('fs');

// Read feature list
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Mark test #162 as passing
features[161].passes = true;

// Write back
fs.writeFileSync('feature_list.json', JSON.stringify(features, null, 2));

console.log('✅ Marked Test #162 as passing');
console.log('Test: ' + features[161].description);
