const { pinyin } = require('pinyin-pro');
const fs = require('fs');
const INIT = [['zh','ㄓ'],['ch','ㄔ'],['sh','ㄕ'],['b','ㄅ'],['p','ㄆ'],['m','ㄇ'],['f','ㄈ'],['d','ㄉ'],['t','ㄊ'],['n','ㄋ'],['l','ㄌ'],['g','ㄍ'],['k','ㄎ'],['h','ㄏ'],['j','ㄐ'],['q','ㄑ'],['x','ㄒ'],['r','ㄖ'],['z','ㄗ'],['c','ㄘ'],['s','ㄙ']];
function initial(py) {
  py = py.replace(/ü/g,'v');
  for (const [p,z] of INIT) if (py.startsWith(p)) return z;
  // zero-initial: y/w spellings map to the medial
  if (py.startsWith('yu')) return 'ㄩ';
  if (py.startsWith('y')) return 'ㄧ';
  if (py.startsWith('w')) return 'ㄨ';
  const finals = [['ang','ㄤ'],['eng','ㄥ'],['ai','ㄞ'],['ei','ㄟ'],['ao','ㄠ'],['ou','ㄡ'],['an','ㄢ'],['en','ㄣ'],['er','ㄦ'],['a','ㄚ'],['o','ㄛ'],['e','ㄜ']];
  for (const [p,z] of finals) if (py.startsWith(p)) return z;
  return null;
}
const groups = {};
let n = 0;
for (let cp = 0x4e00; cp <= 0x9fff; cp++) {
  const ch = String.fromCodePoint(cp);
  const reads = pinyin(ch, { toneType: 'none', multiple: true, type: 'array' });
  const inits = new Set(reads.map(initial).filter(Boolean));
  if (!inits.size) continue;
  n++;
  for (const z of inits) (groups[z] ??= []).push(ch);
}
const out = Object.fromEntries(Object.entries(groups).map(([z, chs]) => [z, chs.join('')]));
fs.writeFileSync('zhuyin-initials.json', JSON.stringify(out));
console.log(n, 'chars', Object.keys(out).length, 'initials', fs.statSync('zhuyin-initials.json').size, 'bytes');
