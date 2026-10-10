const PRODUCTION_BUILD_PHASE = 'phase-production-build';

type RuntimeEnvironment = {
  NEXT_PHASE?: string;
  ENABLE_RATE_DB?: string;
};

export function isProductionBuild(env: RuntimeEnvironment = {
  NEXT_PHASE: process.env.NEXT_PHASE
}) {
  return env.NEXT_PHASE === PRODUCTION_BUILD_PHASE;
}

export function shouldUseRateDatabase(env: RuntimeEnvironment = {
  NEXT_PHASE: process.env.NEXT_PHASE,
  ENABLE_RATE_DB: process.env.ENABLE_RATE_DB
}) {
  return env.ENABLE_RATE_DB === 'true' && !isProductionBuild(env);
}
