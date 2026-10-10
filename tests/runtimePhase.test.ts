import { describe, expect, it } from 'vitest';
import { isProductionBuild, shouldUseRateDatabase } from '../lib/runtimePhase';

describe('runtime phase guards', () => {
  it('disables the rates database only while Next.js is producing the build', () => {
    expect(isProductionBuild({ NEXT_PHASE: 'phase-production-build' })).toBe(true);
    expect(shouldUseRateDatabase({
      NEXT_PHASE: 'phase-production-build',
      ENABLE_RATE_DB: 'true'
    })).toBe(false);
    expect(shouldUseRateDatabase({
      NEXT_PHASE: 'phase-production-server',
      ENABLE_RATE_DB: 'true'
    })).toBe(true);
  });

  it('keeps persistence disabled when the feature flag is off', () => {
    expect(shouldUseRateDatabase({ ENABLE_RATE_DB: 'false' })).toBe(false);
    expect(shouldUseRateDatabase({})).toBe(false);
  });
});
