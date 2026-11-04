import { shouldFocusSearch, type SearchKey } from './web-search-shortcut';
const key: SearchKey = { key: '/', defaultPrevented: false, isComposing: false, repeat: false, metaKey: false, ctrlKey: false, altKey: false, shiftKey: false };
it('focuses search only for the bare slash shortcut', () => { expect(shouldFocusSearch(key, false, false)).toBe(true); expect(shouldFocusSearch({...key, key: 'a'}, false, false)).toBe(false); });
it.each(['defaultPrevented', 'isComposing', 'repeat', 'metaKey', 'ctrlKey', 'altKey', 'shiftKey'] as const)('preserves %s events', flag => { expect(shouldFocusSearch({...key, [flag]: true}, false, false)).toBe(false); });
it('preserves typing and modal keyboard interactions', () => { expect(shouldFocusSearch(key, true, false)).toBe(false); expect(shouldFocusSearch(key, false, true)).toBe(false); });
