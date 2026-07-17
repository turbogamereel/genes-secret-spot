import {
  ColliderLayer,
  engine,
  Entity,
  InputAction,
  MeshCollider,
  pointerEventsSystem,
  Transform
} from '@dcl/sdk/ecs'
import { Quaternion, Vector3 } from '@dcl/sdk/math'
import {
  isFishingInteractionBusy,
  registerFishButtonHandler,
  setupUi,
  showFishingHint,
  startFishingWithEnergy,
  updateUiAnimation
} from './ui'

// The water model is a 16 x 16 metre plane before scene scaling.
// Each placed water entity gets its own pointer-only interaction surface.
const WATER_MODEL_SIZE_METRES = 16
const INTERACTION_HEIGHT_METRES = 0.08
const INTERACTION_Y_OFFSET_METRES = 0.12
const MAX_DISTANCE_FROM_WATER_METRES = 3.6

const WATER_ENTITY_NAMES = ['waterreal.glb_2', 'waterreal.glb_3']

type FishingArea = {
  water: Entity
  surface: Entity
}

function worldToLocal(worldPosition: Vector3.ReadonlyVector3, parent: Entity): Vector3.MutableVector3 {
  const parentTransform = Transform.get(parent)
  const relative = Vector3.subtract(worldPosition, parentTransform.position)
  const inverseRotation = Quaternion.create(
    -parentTransform.rotation.x,
    -parentTransform.rotation.y,
    -parentTransform.rotation.z,
    parentTransform.rotation.w
  )
  const unrotated = Vector3.rotate(relative, inverseRotation)

  return Vector3.create(
    unrotated.x / parentTransform.scale.x,
    unrotated.y / parentTransform.scale.y,
    unrotated.z / parentTransform.scale.z
  )
}

function createWaterInteractionSurface(water: Entity): Entity {
  const waterTransform = Transform.get(water)
  const surface = engine.addEntity()

  Transform.create(surface, {
    parent: water,
    position: Vector3.create(0, INTERACTION_Y_OFFSET_METRES / waterTransform.scale.y, 0),
    scale: Vector3.create(
      WATER_MODEL_SIZE_METRES,
      INTERACTION_HEIGHT_METRES / waterTransform.scale.y,
      WATER_MODEL_SIZE_METRES
    )
  })

  // Clickable for fishing without blocking avatars walking around the shore,
  // stage, or Gene's Bait & Bar platform.
  MeshCollider.setBox(surface, ColliderLayer.CL_POINTER)
  return surface
}

function distanceToNearestWaterPoint(playerWorld: Vector3.ReadonlyVector3, area: FishingArea): number {
  const playerLocal = worldToLocal(playerWorld, area.water)
  const waterTransform = Transform.get(area.water)
  const surfaceTransform = Transform.get(area.surface)
  const halfWidth = surfaceTransform.scale.x / 2
  const halfDepth = surfaceTransform.scale.z / 2

  const nearestX = Math.max(
    surfaceTransform.position.x - halfWidth,
    Math.min(playerLocal.x, surfaceTransform.position.x + halfWidth)
  )
  const nearestZ = Math.max(
    surfaceTransform.position.z - halfDepth,
    Math.min(playerLocal.z, surfaceTransform.position.z + halfDepth)
  )

  const worldDx = (playerLocal.x - nearestX) * waterTransform.scale.x
  const worldDz = (playerLocal.z - nearestZ) * waterTransform.scale.z
  return Math.sqrt(worldDx * worldDx + worldDz * worldDz)
}

export function main() {
  setupUi()
  engine.addSystem(updateUiAnimation)

  const fishingAreas: FishingArea[] = []

  for (const waterName of WATER_ENTITY_NAMES) {
    const water = engine.getEntityOrNullByName(waterName)
    if (!water) {
      console.error(`[Fishing] Could not find ${waterName}`)
      continue
    }

    const surface = createWaterInteractionSurface(water)
    const area = { water, surface }
    fishingAreas.push(area)

    pointerEventsSystem.onPointerDown(
      {
        entity: surface,
        opts: {
          button: InputAction.IA_POINTER,
          hoverText: 'FISH',
          maxDistance: 18
        }
      },
      () => attemptFishing(fishingAreas)
    )
  }

  const attemptFromUi = () => attemptFishing(fishingAreas)
  registerFishButtonHandler(attemptFromUi)

  if (fishingAreas.length === 0) {
    console.error('[Fishing] No fishing areas were created.')
  }
}

function attemptFishing(fishingAreas: FishingArea[]) {
  if (isFishingInteractionBusy()) return

  if (fishingAreas.length === 0) {
    showFishingHint('Fishing areas are still loading. Try again in a moment.')
    return
  }

  const playerPosition = Transform.get(engine.PlayerEntity).position
  const distance = fishingAreas.reduce(
    (nearest, area) => Math.min(nearest, distanceToNearestWaterPoint(playerPosition, area)),
    Number.POSITIVE_INFINITY
  )

  if (distance > MAX_DISTANCE_FROM_WATER_METRES) {
    showFishingHint("Move closer to either water area or Gene's Bait & Bar to fish.")
    return
  }

  startFishingWithEnergy()
}
