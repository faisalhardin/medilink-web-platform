import { describe, expect, it } from 'vitest';
import { anamnesaSaveButtonVisible } from './anamnesa';

describe('anamnesaSaveButtonVisible', () => {
  it('hides when the form matches the loaded or saved snapshot', () => {
    expect(anamnesaSaveButtonVisible(false, '{}', '{}')).toBe(false);
  });

  it('shows when the form differs', () => {
    expect(anamnesaSaveButtonVisible(false, '{"a":1}', '{}')).toBe(true);
  });

  it('stays visible after an edit is undone until the next save clears the latch', () => {
    expect(anamnesaSaveButtonVisible(true, '{}', '{}')).toBe(true);
  });
});
