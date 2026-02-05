const fs = require('fs');

const data = JSON.parse(fs.readFileSync('feature_list.json', 'utf8'));
let found = false;

for (let i = 0; i < data.length; i++) {
  if (data[i].description === 'Model comparison view shows capabilities') {
    data[i].passes = true;
    found = true;
    console.log('Updated test #' + (i + 1) + ': Model comparison view shows capabilities');
    break;
  }
}

if (found) {
  fs.writeFileSync('feature_list.json', JSON.stringify(data, null, 2));
  console.log('✅ feature_list.json updated successfully');
} else {
  console.log('❌ Test not found');
}
