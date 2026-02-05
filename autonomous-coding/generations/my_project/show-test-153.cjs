const fs = require('fs');
const features = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
const test = features[152]; // Test #153 is at index 152 (0-based)
console.log(`Test #153: ${test.description}`);
console.log('\nSteps:');
test.steps.forEach((step, i) => console.log(`  ${step}`));
console.log(`\nPasses: ${test.passes}`);
