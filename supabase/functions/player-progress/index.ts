import { createClient } from 'npm:@supabase/supabase-js@2'
import { verify } from 'npm:@dcl/platform-crypto-middleware@1.1.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': [
    'apikey',
    'authorization',
    'content-type',
    'x-client-info',
    'x-identity-timestamp',
    'x-identity-metadata',
    'x-identity-auth-chain-0',
    'x-identity-auth-chain-1',
    'x-identity-auth-chain-2'
  ].join(', ')
}

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
const EXPECTED_PARCEL = '-77,139'
const SIGNED_REQUEST_PATH = '/functions/v1/player-progress'

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error('Missing Supabase server environment variables')
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false }
})

const fetcher = {
  fetch: (url: string, init?: RequestInit) => fetch(url, init)
}

const integer = (value: unknown, min: number, max: number, fallback: number) => {
  const number = Number(value)
  if (!Number.isFinite(number)) return fallback
  return Math.max(min, Math.min(max, Math.floor(number)))
}

const countKeys = {
  fish: [
    'yellowPerch',
    'crappie',
    'rainbowTrout',
    'channelCatfish',
    'northernPike',
    'crystalEel',
    'gildedGar',
    'stormSalmon',
    'violetMoonfish'
  ],
  materials: ['shell', 'cloth', 'driftwood'],
  junk: ['junk', 'seaweed']
} as const

const materialSetKeys = ['beachcomber', 'dockRepair', 'fishersSupply'] as const
const fishSetKeys = ['docksideDuo', 'freshwaterHaul', 'crystalPredators', 'lakeLegends'] as const

function sanitizeCounts(source: unknown, keys: readonly string[]) {
  const input = source && typeof source === 'object' ? source as Record<string, unknown> : {}
  return Object.fromEntries(keys.map((key) => [key, integer(input[key], 0, 1000000, 0)]))
}

function sanitizeBooleans(source: unknown, keys: readonly string[]) {
  const input = source && typeof source === 'object' ? source as Record<string, unknown> : {}
  return Object.fromEntries(keys.map((key) => [key, input[key] === true]))
}

function sanitizeProgress(source: unknown) {
  const progress = source && typeof source === 'object' ? source as Record<string, unknown> : {}
  const inventory = progress.inventory && typeof progress.inventory === 'object'
    ? progress.inventory as Record<string, unknown>
    : {}

  return {
    version: 1 as const,
    level: integer(progress.level, 1, 100, 1),
    currentXp: integer(progress.currentXp, 0, 1000000000, 0),
    coins: integer(progress.coins, 0, 2000000000, 0),
    currentEnergy: integer(progress.currentEnergy, 0, 1000000, 10),
    lastEnergyUpdateTimestamp: integer(
      progress.lastEnergyUpdateTimestamp,
      0,
      Date.now() + 300000,
      Date.now()
    ),
    inventory: {
      fish: sanitizeCounts(inventory.fish, countKeys.fish),
      materials: sanitizeCounts(inventory.materials, countKeys.materials),
      junk: sanitizeCounts(inventory.junk, countKeys.junk)
    },
    materialSetsState: sanitizeBooleans(progress.materialSetsState, materialSetKeys),
    fishSetsState: sanitizeBooleans(progress.fishSetsState, fishSetKeys)
  }
}

function rowToProgress(row: Record<string, unknown>) {
  return sanitizeProgress({
    version: row.state_version,
    level: row.level,
    currentXp: row.current_xp,
    coins: row.coins,
    currentEnergy: row.current_energy,
    lastEnergyUpdateTimestamp: row.last_energy_update_ms,
    inventory: row.inventory,
    materialSetsState: row.material_sets,
    fishSetsState: row.fish_sets
  })
}

function json(data: Record<string, unknown>, status = 200) {
  return Response.json(data, { status, headers: corsHeaders })
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  try {
    const headers: Record<string, string> = {}
    request.headers.forEach((value, key) => { headers[key.toLowerCase()] = value })
    const verification = await verify(request.method, SIGNED_REQUEST_PATH, headers, {
      fetcher,
      expiration: 5 * 60 * 1000,
      metadataValidator: (metadata) =>
        metadata.signer === 'decentraland-kernel-scene' && metadata.parcel === EXPECTED_PARCEL
    })

    const walletAddress = verification.auth.toLowerCase()
    const body = await request.json() as Record<string, unknown>

    if (body.action === 'load') {
      const { data, error } = await supabase
        .from('player_progress')
        .select('*')
        .eq('wallet_address', walletAddress)
        .maybeSingle()

      if (error) throw error
      return json({ ok: true, progress: data ? rowToProgress(data as Record<string, unknown>) : null })
    }

    if (body.action === 'save') {
      const progress = sanitizeProgress(body.progress)
      const { error } = await supabase.from('player_progress').upsert({
        wallet_address: walletAddress,
        state_version: progress.version,
        level: progress.level,
        current_xp: progress.currentXp,
        coins: progress.coins,
        current_energy: progress.currentEnergy,
        last_energy_update_ms: progress.lastEnergyUpdateTimestamp,
        inventory: progress.inventory,
        material_sets: progress.materialSetsState,
        fish_sets: progress.fishSetsState,
        updated_at: new Date().toISOString()
      }, { onConflict: 'wallet_address' })

      if (error) throw error
      return json({ ok: true, updatedAt: new Date().toISOString() })
    }

    return json({ error: 'Unknown action' }, 400)
  } catch (error) {
    console.error('[player-progress]', error)
    const status = typeof error === 'object' && error && 'statusCode' in error
      ? Number((error as { statusCode?: number }).statusCode) || 401
      : 500
    const message = error instanceof Error ? error.message : 'Request failed'
    return json({ error: message }, status)
  }
})
