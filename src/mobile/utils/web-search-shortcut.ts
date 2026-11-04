export interface SearchKey {
  key: string; defaultPrevented: boolean; isComposing: boolean; repeat: boolean;
  metaKey: boolean; ctrlKey: boolean; altKey: boolean; shiftKey: boolean;
}
export function shouldFocusSearch(event: SearchKey, editing: boolean, modalOpen: boolean): boolean {
  return event.key === '/' && !event.defaultPrevented && !event.isComposing && !event.repeat
    && !event.metaKey && !event.ctrlKey && !event.altKey && !event.shiftKey && !editing && !modalOpen;
}
