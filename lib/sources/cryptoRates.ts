/**
 * BTC/USD from CoinGecko's public endpoint (no API key). We don't have a
 * real BOB market for BTC in Bolivia — the number shown to users is a
 * synthetic cross-rate: BTC/USD × our own paralelo USD/BOB reference, not a
 * live P2P listing. Label it as referential wherever it's displayed.
 */
export async function fetchBtcUsd(): Promise<number | null> {
  try {
    const response = await fetch(
      'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
      { next: { revalidate: 5 * 60 } }
    );
    if (!response.ok) return null;
    const data = (await response.json()) as { bitcoin?: { usd?: number } };
    const usd = data.bitcoin?.usd;
    return typeof usd === 'number' && usd > 0 ? usd : null;
  } catch (error) {
    console.warn('[crypto-rates] BTC/USD unavailable', String(error));
    return null;
  }
}
