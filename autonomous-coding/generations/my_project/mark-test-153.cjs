const fs = require('fs');

// Read the feature list
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));

// Find and update test #153 (index 152)
const testIndex = 152;
if (features[testIndex]) {
  features[testIndex].passes = true;
  console.log(`Marked test #153 as passing: ${features[testIndex].description}`);

  // Write back
  fs.writeFileSync('feature_list.json', JSON.stringify(features, null, 2));
  console.log('feature_list.json updated successfully');

  // Count passing tests
  const passing = features.filter(f => f.passes).length;
  const total = features.length;
  console.log(`\nTests passing: ${passing}/${total} (${(passing/total*100).toFixed(1)}%)`);
} else {
  console.log('Test #153 not found at expected index');
}
