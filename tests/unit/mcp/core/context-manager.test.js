/**
 * @jest-environment node
 */
import { ContextManager } from '../../../../mcp-server/src/core/context-manager.js';

describe('ContextManager', () => {
  it('creates and caches contexts, incrementing hits/misses', async () => {
    const cm = new ContextManager({ maxCacheSize: 50, ttl: 1000 });

    const c1 = await cm.getContext('abc', { user: 'u1' });
    expect(c1).toBeDefined();
    expect(c1.id).toBe('abc');
    expect(c1.metadata.user).toBe('u1');

    const statsAfterMiss = cm.getStats();
    expect(statsAfterMiss.misses).toBeGreaterThanOrEqual(1);

    const c2 = await cm.getContext('abc', { user: 'u1' });
    expect(c2).toBe(c1);
    const statsAfterHit = cm.getStats();
    expect(statsAfterHit.hits).toBeGreaterThanOrEqual(1);
  });

  it('updates contexts and preserves cache, increments invalidations on delete', async () => {
    const cm = new ContextManager({ maxCacheSize: 50, ttl: 1000 });
    const initial = await cm.getContext('xyz', { role: 'admin' });
    expect(initial.metadata.role).toBe('admin');

    const updated = await cm.updateContext('xyz', { role: 'user', flag: true });
    expect(updated.metadata.role).toBe('user');
    expect(updated.metadata.flag).toBe(true);

    // Invalidate by id+metadata used at creation time
    cm.invalidateContext('xyz', { role: 'user', flag: true, created: updated.metadata.created });
    const stats = cm.getStats();
    expect(stats.invalidations).toBeGreaterThanOrEqual(1);
  });

  it('caches arbitrary data with get/set/invalidate methods', () => {
    const cm = new ContextManager({ maxCacheSize: 10, ttl: 1000 });
    expect(cm.getCachedData('k')).toBeUndefined();
    const missStats = cm.getStats();
    expect(missStats.misses).toBeGreaterThanOrEqual(1);

    cm.setCachedData('k', { v: 1 });
    const cached = cm.getCachedData('k');
    expect(cached).toEqual({ v: 1 });

    cm.invalidateCacheKey('k');
    expect(cm.getCachedData('k')).toBeUndefined();
  });
});


