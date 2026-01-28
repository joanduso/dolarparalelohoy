import { computeLatest } from '@/lib/engine/priceEngine';

async function main() {
  const { result, cached } = await computeLatest();
  console.log('priceEngine', {
    cached,
    timestampUtc: result.timestampUtc.toISOString(),
    status: result.quality.status,
    confidence: result.quality.confidence,
    sampleSize: result.quality.sample_size,
    sources: result.quality.sources_used
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
