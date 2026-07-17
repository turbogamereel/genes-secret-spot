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
const PARKOUR_MIN_TIME_MS = 5000
const PARKOUR_MAX_TIME_MS = 30 * 60 * 1000

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

function sanitizeDisplayName(value: unknown) {
  if (typeof value !== 'string') return ''
  return value.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 32)
}

function sanitizeRunId(value: unknown) {
  if (typeof value !== 'string') return ''
  const runId = value.trim().toLowerCase()
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(runId)
    ? runId
    : ''
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

function sanitizeDailyChallenge(source: unknown) {
  const input = source && typeof source === 'object' ? source as Record<string, unknown> : {}
  const date = typeof input.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input.date)
    ? input.date
    : ''
  return {
    date,
    progress: integer(input.progress, 0, 1000, 0),
    claimed: input.claimed === true
  }
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
    fishSetsState: sanitizeBooleans(progress.fishSetsState, fishSetKeys),
    dailyChallenge: sanitizeDailyChallenge(progress.dailyChallenge)
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
    fishSetsState: row.fish_sets,
    dailyChallenge: row.daily_challenge
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

    if (body.action === 'parkour_start') {
      const displayName = sanitizeDisplayName(body.displayName)
      const runId = crypto.randomUUID()
      const startedAt = new Date()
      const { error } = await supabase.from('parkour_records').upsert({
        wallet_address: walletAddress,
        display_name: displayName,
        active_run_id: runId,
        active_run_started_at: startedAt.toISOString(),
        updated_at: startedAt.toISOString()
      }, { onConflict: 'wallet_address' })

      if (error) throw error
      return json({ ok: true, runId, startedAt: startedAt.toISOString() })
    }

    if (body.action === 'parkour_cancel') {
      const runId = sanitizeRunId(body.runId)
      if (!runId) return json({ error: 'Invalid parkour run id' }, 400)

      const { error } = await supabase
        .from('parkour_records')
        .update({
          active_run_id: null,
          active_run_started_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('wallet_address', walletAddress)
        .eq('active_run_id', runId)

      if (error) throw error
      return json({ ok: true })
    }

    if (body.action === 'parkour_finish') {
      const runId = sanitizeRunId(body.runId)
      const displayName = sanitizeDisplayName(body.displayName)
      if (!runId) return json({ error: 'Invalid parkour run id' }, 400)

      const { data: record, error: readError } = await supabase
        .from('parkour_records')
        .select('active_run_id, active_run_started_at, best_time_ms')
        .eq('wallet_address', walletAddress)
        .maybeSingle()

      if (readError) throw readError
      if (!record || record.active_run_id !== runId || !record.active_run_started_at) {
        return json({ error: 'No matching active parkour run' }, 409)
      }

      const startedAtMs = Date.parse(String(record.active_run_started_at))
      const finishedAt = new Date()
      const timeMs = Math.max(0, finishedAt.getTime() - startedAtMs)
      const previousBest = Number(record.best_time_ms)
      const hasPreviousBest = Number.isFinite(previousBest) && previousBest > 0
      const newBest = !hasPreviousBest || timeMs < previousBest

      if (!Number.isFinite(startedAtMs) || timeMs < PARKOUR_MIN_TIME_MS || timeMs > PARKOUR_MAX_TIME_MS) {
        await supabase
          .from('parkour_records')
          .update({ active_run_id: null, active_run_started_at: null, updated_at: finishedAt.toISOString() })
          .eq('wallet_address', walletAddress)
          .eq('active_run_id', runId)
        return json({ error: 'Parkour run time was outside the accepted range' }, 400)
      }

      const update: Record<string, unknown> = {
        display_name: displayName,
        active_run_id: null,
        active_run_started_at: null,
        updated_at: finishedAt.toISOString()
      }
      if (newBest) {
        update.best_time_ms = timeMs
        update.best_time_at = finishedAt.toISOString()
      }

      const { error: updateError } = await supabase
        .from('parkour_records')
        .update(update)
        .eq('wallet_address', walletAddress)
        .eq('active_run_id', runId)

      if (updateError) throw updateError
      return json({
        ok: true,
        timeMs,
        bestTimeMs: newBest ? timeMs : previousBest,
        newBest
      })
    }

    if (body.action === 'parkour_leaderboard') {
      const { data, error } = await supabase
        .from('parkour_records')
        .select('wallet_address, display_name, best_time_ms')
        .not('best_time_ms', 'is', null)
        .order('best_time_ms', { ascending: true })
        .order('best_time_at', { ascending: true })
        .limit(10)

      if (error) throw error

      const { data: personal, error: personalError } = await supabase
        .from('parkour_records')
        .select('best_time_ms')
        .eq('wallet_address', walletAddress)
        .maybeSingle()

      if (personalError) throw personalError
      const entries = (data || []).map((row, index) => ({
        rank: index + 1,
        walletAddress: String(row.wallet_address || '').toLowerCase(),
        displayName: sanitizeDisplayName(row.display_name),
        bestTimeMs: integer(row.best_time_ms, 1, PARKOUR_MAX_TIME_MS, PARKOUR_MAX_TIME_MS)
      }))
      const personalBestMs = personal?.best_time_ms == null
        ? null
        : integer(personal.best_time_ms, 1, PARKOUR_MAX_TIME_MS, PARKOUR_MAX_TIME_MS)
      return json({ ok: true, entries, personalBestMs })
    }

    if (body.action === 'leaderboard') {
      const { data, error } = await supabase
        .from('player_progress')
        .select('wallet_address, display_name, level, current_xp')
        .order('level', { ascending: false })
        .order('current_xp', { ascending: false })
        .order('updated_at', { ascending: true })
        .limit(10)

      if (error) throw error
      const entries = (data || []).map((row, index) => ({
        rank: index + 1,
        walletAddress: String(row.wallet_address || '').toLowerCase(),
        displayName: sanitizeDisplayName(row.display_name),
        level: integer(row.level, 1, 100, 1),
        currentXp: integer(row.current_xp, 0, 1000000000, 0)
      }))
      return json({ ok: true, entries })
    }

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
      const displayName = sanitizeDisplayName(body.displayName)
      const { error } = await supabase.from('player_progress').upsert({
        wallet_address: walletAddress,
        display_name: displayName,
        state_version: progress.version,
        level: progress.level,
        current_xp: progress.currentXp,
        coins: progress.coins,
        current_energy: progress.currentEnergy,
        last_energy_update_ms: progress.lastEnergyUpdateTimestamp,
        inventory: progress.inventory,
        material_sets: progress.materialSetsState,
        fish_sets: progress.fishSetsState,
        daily_challenge: progress.dailyChallenge,
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
