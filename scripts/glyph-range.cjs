const fontnik = require('fontnik');
const fs = require('fs');
const [, , path, start, end] = process.argv;
fontnik.range({ font: fs.readFileSync(path), start: +start, end: +end }, (err, data) => {
  if (err) { console.error(err); process.exit(1); }
  process.stdout.write(data);
});
