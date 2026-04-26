import {
  buildSoftDeleteData,
  buildSoftDeleteDataWithInactive,
  isNotDeletedRecord,
  isSoftDeletedRow,
} from './soft-delete.util';

describe('soft-delete.util', () => {
  it('isNotDeletedRecord is deletedAt null', () => {
    expect(isNotDeletedRecord).toEqual({ deletedAt: null });
  });

  it('buildSoftDeleteData sets delete fields', () => {
    const d = buildSoftDeleteData('actor');
    expect(d.deletedBy).toBe('actor');
    expect(d.deletedAt).toBeInstanceOf(Date);
    expect('isActive' in d).toBe(false);
  });

  it('buildSoftDeleteDataWithInactive sets delete fields and isActive', () => {
    const d = buildSoftDeleteDataWithInactive('user-1');
    expect(d.deletedBy).toBe('user-1');
    expect(d.isActive).toBe(false);
    expect(d.deletedAt).toBeInstanceOf(Date);
  });

  it('isSoftDeletedRow', () => {
    expect(isSoftDeletedRow(null)).toBe(false);
    expect(isSoftDeletedRow({ deletedAt: null })).toBe(false);
    expect(isSoftDeletedRow({ deletedAt: new Date() })).toBe(true);
  });
});
