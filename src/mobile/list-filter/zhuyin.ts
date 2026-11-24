import { ZHUYIN_INITIAL_CHARS } from './zhuyin-table';

/** Zhuyin initials ㄅ…ㄩ (the symbols a 注音 keyboard types first). */
const ZHUYIN = /^[ㄅ-ㄩ]+$/;

let index: Map<string, Set<string>> | null = null;
function table(): Map<string, Set<string>> {
  if (index) return index;
  index = new Map();
  for (const [initial, chars] of Object.entries(ZHUYIN_INITIAL_CHARS)) {
    for (const ch of chars) {
      let set = index.get(ch);
      if (!set) { set = new Set(); index.set(ch, set); }
      set.add(initial);
    }
  }
  return index;
}

export function isZhuyinQuery(q: string): boolean {
  return ZHUYIN.test(q);
}

/** Possible zhuyin initials of one character (several for 多音字, e.g. 長 → ㄔ/ㄓ). */
export function zhuyinInitials(ch: string): ReadonlySet<string> {
  return table().get(ch) ?? new Set();
}

/**
 * 注音首字: 「ㄊㄐㄉ」 matches 台積電. The query matches when its initials
 * line up with consecutive characters of the name, from the start of the name
 * or of any later character (so 「ㄐㄉ」 also finds 台積電).
 */
export function matchesZhuyin(name: string, query: string): boolean {
  if (!isZhuyinQuery(query)) return false;
  const chars = [...name];
  const q = [...query];
  for (let start = 0; start + q.length <= chars.length; start += 1) {
    let ok = true;
    for (let i = 0; i < q.length; i += 1) {
      if (!zhuyinInitials(chars[start + i]).has(q[i])) { ok = false; break; }
    }
    if (ok) return true;
  }
  return false;
}
