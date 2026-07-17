import { engine } from '@dcl/sdk/ecs'
import { getTriggerEvents } from '@dcl/asset-packs/dist/events'
import { TriggerType } from '@dcl/asset-packs'
import {
  cancelParkourRun,
  finishParkourRun,
  isParkourRunActive,
  startParkourRun
} from './ui'

const START_TRIGGER_NAMES = ['PARKOUR_START']
// The uploaded scene currently uses PARKOUr_FINISH with a lowercase r.
// Keep both spellings supported so renaming it later will not break the timer.
const FINISH_TRIGGER_NAMES = ['PARKOUR_FINISH', 'PARKOUr_FINISH']

function findFirstEntity(names: string[]) {
  for (const name of names) {
    const entity = engine.getEntityOrNullByName(name)
    if (entity) return { entity, name }
  }
  return null
}

export function setupParkour() {
  const start = findFirstEntity(START_TRIGGER_NAMES)
  const finish = findFirstEntity(FINISH_TRIGGER_NAMES)

  if (!start) {
    console.error(`[Parkour] Start trigger not found. Expected one of: ${START_TRIGGER_NAMES.join(', ')}`)
  } else {
    const startEvents = getTriggerEvents(start.entity)
    startEvents.on(TriggerType.ON_PLAYER_ENTERS_AREA, () => {
      // Re-entering the start area restarts the attempt cleanly.
      if (isParkourRunActive()) cancelParkourRun('RUN RESTARTED')
      startParkourRun()
    })
    console.log(`[Parkour] Start trigger connected: ${start.name}`)
  }

  if (!finish) {
    console.error(`[Parkour] Finish trigger not found. Expected one of: ${FINISH_TRIGGER_NAMES.join(', ')}`)
  } else {
    const finishEvents = getTriggerEvents(finish.entity)
    finishEvents.on(TriggerType.ON_PLAYER_ENTERS_AREA, () => {
      finishParkourRun()
    })
    console.log(`[Parkour] Finish trigger connected: ${finish.name}`)
  }
}
