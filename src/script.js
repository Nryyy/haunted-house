import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Timer } from 'three/addons/misc/Timer.js'
import { Sky } from 'three/addons/objects/Sky.js'
import GUI from 'lil-gui'

/**
 * Base
 */
// Debug
const gui = new GUI({ title: 'Налаштування' })
gui.close()

// Canvas
const canvas = document.querySelector('canvas.webgl')

// Scene
const scene = new THREE.Scene()

/**
 * Textures
 */
const textureLoader = new THREE.TextureLoader()

const loadTexture = (path, { color = false, repeat = null } = {}) =>
{
    const texture = textureLoader.load(path)

    if(color)
        texture.colorSpace = THREE.SRGBColorSpace

    if(repeat)
    {
        texture.repeat.set(repeat[0], repeat[1])
        texture.wrapS = THREE.RepeatWrapping
        texture.wrapT = THREE.RepeatWrapping
    }

    return texture
}

// Floor
const floorAlphaTexture = loadTexture('./floor/alpha.webp')
const floorColorTexture = loadTexture('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_diff_1k.webp', { color: true, repeat: [ 8, 8 ] })
const floorARMTexture = loadTexture('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_arm_1k.webp', { repeat: [ 8, 8 ] })
const floorNormalTexture = loadTexture('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_nor_gl_1k.webp', { repeat: [ 8, 8 ] })
const floorDisplacementTexture = loadTexture('./floor/coast_sand_rocks_02_1k/coast_sand_rocks_02_disp_1k.webp', { repeat: [ 8, 8 ] })
const floorTextures = [ floorColorTexture, floorARMTexture, floorNormalTexture, floorDisplacementTexture ]

// Wall
const wallColorTexture = loadTexture('./wall/castle_brick_broken_06_1k/castle_brick_broken_06_diff_1k.webp', { color: true, repeat: [ 1, 1 ] })
const wallARMTexture = loadTexture('./wall/castle_brick_broken_06_1k/castle_brick_broken_06_arm_1k.webp', { repeat: [ 1, 1 ] })
const wallNormalTexture = loadTexture('./wall/castle_brick_broken_06_1k/castle_brick_broken_06_nor_gl_1k.webp', { repeat: [ 1, 1 ] })
const wallTextures = [ wallColorTexture, wallARMTexture, wallNormalTexture ]

// Roof
const roofColorTexture = loadTexture('./roof/roof_slates_02_1k/roof_slates_02_diff_1k.webp', { color: true, repeat: [ 3, 1 ] })
const roofARMTexture = loadTexture('./roof/roof_slates_02_1k/roof_slates_02_arm_1k.webp', { repeat: [ 3, 1 ] })
const roofNormalTexture = loadTexture('./roof/roof_slates_02_1k/roof_slates_02_nor_gl_1k.webp', { repeat: [ 3, 1 ] })
const roofTextures = [ roofColorTexture, roofARMTexture, roofNormalTexture ]

// Bush
const bushColorTexture = loadTexture('./bush/leaves_forest_ground_1k/leaves_forest_ground_diff_1k.webp', { color: true, repeat: [ 2, 1 ] })
const bushARMTexture = loadTexture('./bush/leaves_forest_ground_1k/leaves_forest_ground_arm_1k.webp', { repeat: [ 2, 1 ] })
const bushNormalTexture = loadTexture('./bush/leaves_forest_ground_1k/leaves_forest_ground_nor_gl_1k.webp', { repeat: [ 2, 1 ] })

// Grave (also used for stones on the path and rocks)
const graveColorTexture = loadTexture('./grave/plastered_stone_wall_1k/plastered_stone_wall_diff_1k.webp', { color: true, repeat: [ 0.3, 0.4 ] })
const graveARMTexture = loadTexture('./grave/plastered_stone_wall_1k/plastered_stone_wall_arm_1k.webp', { repeat: [ 0.3, 0.4 ] })
const graveNormalTexture = loadTexture('./grave/plastered_stone_wall_1k/plastered_stone_wall_nor_gl_1k.webp', { repeat: [ 0.3, 0.4 ] })

// Door
const doorColorTexture = loadTexture('./door/color.webp', { color: true })
const doorAlphaTexture = loadTexture('./door/alpha.webp')
const doorAmbientOcclusionTexture = loadTexture('./door/ambientOcclusion.webp')
const doorHeightTexture = loadTexture('./door/height.webp')
const doorNormalTexture = loadTexture('./door/normal.webp')
const doorMetalnessTexture = loadTexture('./door/metalness.webp')
const doorRoughnessTexture = loadTexture('./door/roughness.webp')

// Sign (generated on a canvas)
const signCanvas = document.createElement('canvas')
signCanvas.width = 512
signCanvas.height = 256
const signContext = signCanvas.getContext('2d')
signContext.fillStyle = '#5a3b22'
signContext.fillRect(0, 0, 512, 256)
for(let i = 0; i < 40; i++)
{
    // Wood grain
    signContext.strokeStyle = `rgba(30, 15, 5, ${ 0.15 + Math.random() * 0.25 })`
    signContext.lineWidth = 1 + Math.random() * 3
    signContext.beginPath()
    const y = Math.random() * 256
    signContext.moveTo(0, y)
    signContext.bezierCurveTo(170, y + (Math.random() - 0.5) * 20, 340, y + (Math.random() - 0.5) * 20, 512, y)
    signContext.stroke()
}
signContext.fillStyle = '#e8d7b0'
signContext.textAlign = 'center'
signContext.textBaseline = 'middle'
signContext.font = 'bold 64px Georgia, serif'
signContext.fillText('ОБЕРЕЖНО!', 256, 95)
signContext.font = 'italic 44px Georgia, serif'
signContext.fillText('тут живуть привиди', 256, 170)
const signTexture = new THREE.CanvasTexture(signCanvas)
signTexture.colorSpace = THREE.SRGBColorSpace

/**
 * Shared materials
 */
const wallMaterial = new THREE.MeshStandardMaterial({
    map: wallColorTexture,
    aoMap: wallARMTexture,
    roughnessMap: wallARMTexture,
    metalnessMap: wallARMTexture,
    normalMap: wallNormalTexture
})

const roofMaterial = new THREE.MeshStandardMaterial({
    map: roofColorTexture,
    aoMap: roofARMTexture,
    roughnessMap: roofARMTexture,
    metalnessMap: roofARMTexture,
    normalMap: roofNormalTexture
})

const stoneMaterial = new THREE.MeshStandardMaterial({
    map: graveColorTexture,
    aoMap: graveARMTexture,
    roughnessMap: graveARMTexture,
    metalnessMap: graveARMTexture,
    normalMap: graveNormalTexture
})

const woodMaterial = new THREE.MeshStandardMaterial({
    color: '#3d2a1c',
    roughness: 0.9,
    normalMap: wallNormalTexture,
    normalScale: new THREE.Vector2(0.3, 0.3)
})

const darkWoodMaterial = new THREE.MeshStandardMaterial({
    color: '#22160e',
    roughness: 1
})

const windowMaterial = new THREE.MeshStandardMaterial({
    color: '#1a0f05',
    emissive: '#ff9a3c',
    emissiveIntensity: 1.5
})

/**
 * Floor
 */
const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20, 100, 100),
    new THREE.MeshStandardMaterial({
        alphaMap: floorAlphaTexture,
        transparent: true,
        map: floorColorTexture,
        aoMap: floorARMTexture,
        roughnessMap: floorARMTexture,
        metalnessMap: floorARMTexture,
        normalMap: floorNormalTexture,
        displacementMap: floorDisplacementTexture,
        displacementScale: 0.3,
        displacementBias: - 0.2
    })
)
floor.rotation.x = - Math.PI * 0.5
scene.add(floor)

/**
 * House
 */
// House container
const house = new THREE.Group()
scene.add(house)

// Walls
const walls = new THREE.Mesh(
    new THREE.BoxGeometry(4, 2.5, 4),
    wallMaterial
)
walls.position.y += 1.25
house.add(walls)

// Roof
const roof = new THREE.Mesh(
    new THREE.ConeGeometry(3.5, 1.5, 4),
    roofMaterial
)
roof.position.y = 2.5 + 0.75
roof.rotation.y = Math.PI * 0.25
house.add(roof)

// Chimney
const chimney = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 1.4, 0.5),
    wallMaterial
)
chimney.position.set(1, 3.4, - 0.8)
house.add(chimney)

// Door
const door = new THREE.Mesh(
    new THREE.PlaneGeometry(2.2, 2.2, 100, 100),
    new THREE.MeshStandardMaterial({
        map: doorColorTexture,
        transparent: true,
        alphaMap: doorAlphaTexture,
        aoMap: doorAmbientOcclusionTexture,
        displacementMap: doorHeightTexture,
        displacementScale: 0.15,
        displacementBias: - 0.04,
        normalMap: doorNormalTexture,
        metalnessMap: doorMetalnessTexture,
        roughnessMap: doorRoughnessTexture
    })
)
door.position.y = 1
door.position.z = 2 + 0.01
house.add(door)

// Door lamp (a small glowing bulb above the door)
const doorLamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.08, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#ff7d46' })
)
doorLamp.position.set(0, 2.2, 2.15)
house.add(doorLamp)

// Windows (glowing planes on the sides and back)
const windowGeometry = new THREE.PlaneGeometry(0.7, 0.9)
const windows = []
const windowPlacements = [
    { position: [ 2.01, 1.4, - 0.6 ], rotationY: Math.PI * 0.5 },
    { position: [ - 2.01, 1.4, 0.6 ], rotationY: - Math.PI * 0.5 },
    { position: [ - 0.9, 1.4, - 2.01 ], rotationY: Math.PI },
    { position: [ 0.9, 1.4, - 2.01 ], rotationY: Math.PI }
]
for(const placement of windowPlacements)
{
    const windowMesh = new THREE.Mesh(windowGeometry, windowMaterial)
    windowMesh.position.set(...placement.position)
    windowMesh.rotation.y = placement.rotationY

    // Window frame (cross)
    const frameVertical = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.95, 0.04), darkWoodMaterial)
    const frameHorizontal = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.06, 0.04), darkWoodMaterial)
    windowMesh.add(frameVertical, frameHorizontal)

    windows.push(windowMesh)
    house.add(windowMesh)
}

// Bushes
const bushGeometry = new THREE.SphereGeometry(1, 16, 16)
const bushMaterial = new THREE.MeshStandardMaterial({
    color: '#ccffcc',
    map: bushColorTexture,
    aoMap: bushARMTexture,
    roughnessMap: bushARMTexture,
    metalnessMap: bushARMTexture,
    normalMap: bushNormalTexture
})

const bushPlacements = [
    { scale: 0.5, position: [ 0.8, 0.2, 2.2 ] },
    { scale: 0.25, position: [ 1.4, 0.1, 2.1 ] },
    { scale: 0.4, position: [ - 0.8, 0.1, 2.2 ] },
    { scale: 0.15, position: [ - 1, 0.05, 2.6 ] },
    { scale: 0.35, position: [ 2.3, 0.1, - 1.5 ] },
    { scale: 0.3, position: [ - 2.3, 0.1, - 1.2 ] }
]
const bushes = []
for(const placement of bushPlacements)
{
    const bush = new THREE.Mesh(bushGeometry, bushMaterial)
    bush.scale.setScalar(placement.scale)
    bush.position.set(...placement.position)
    bush.rotation.x = - 0.75
    bushes.push(bush)
    house.add(bush)
}

/**
 * Shed (garage)
 */
const shed = new THREE.Group()
shed.position.set(- 5, 0, 0.5)
shed.rotation.y = 0.15
scene.add(shed)

const shedWalls = new THREE.Mesh(
    new THREE.BoxGeometry(2.4, 1.8, 3),
    wallMaterial
)
shedWalls.position.y = 0.9
shed.add(shedWalls)

// Gable roof: a 3-sided cylinder is a triangular prism
const shedRoof = new THREE.Mesh(
    new THREE.CylinderGeometry(1.55, 1.55, 3.3, 3),
    roofMaterial
)
shedRoof.rotation.x = - Math.PI * 0.5
shedRoof.scale.set(1, 1, 0.5)
shedRoof.position.y = 1.8 + 0.39
shed.add(shedRoof)

// Garage gate made of planks
const shedGate = new THREE.Group()
for(let i = 0; i < 6; i++)
{
    const plank = new THREE.Mesh(new THREE.BoxGeometry(0.27, 1.5, 0.05), woodMaterial)
    plank.position.x = - 0.7 + i * 0.28
    plank.rotation.z = (Math.random() - 0.5) * 0.03
    shedGate.add(plank)
}
const gateBar = new THREE.Mesh(new THREE.BoxGeometry(1.75, 0.12, 0.06), darkWoodMaterial)
gateBar.position.set(0, 0.2, 0.03)
gateBar.rotation.z = 0.08
shedGate.add(gateBar)
shedGate.position.set(0, 0.75, 1.52)
shed.add(shedGate)

/**
 * Outhouse (back yard toilet)
 */
const outhouse = new THREE.Group()
outhouse.position.set(4.2, 0, - 4.5)
outhouse.rotation.y = - 0.6
scene.add(outhouse)

const outhouseBody = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 2, 1.1),
    woodMaterial
)
outhouseBody.position.y = 1
outhouse.add(outhouseBody)

const outhouseRoof = new THREE.Mesh(
    new THREE.BoxGeometry(1.4, 0.1, 1.4),
    roofMaterial
)
outhouseRoof.position.y = 2.05
outhouseRoof.rotation.x = - 0.15
outhouse.add(outhouseRoof)

const outhouseDoor = new THREE.Mesh(
    new THREE.BoxGeometry(0.75, 1.7, 0.04),
    darkWoodMaterial
)
outhouseDoor.position.set(0, 0.9, 0.56)
outhouse.add(outhouseDoor)

// The classic little moon on the door
const outhouseMoon = new THREE.Mesh(
    new THREE.RingGeometry(0.05, 0.09, 16, 1, 0, Math.PI * 1.2),
    new THREE.MeshBasicMaterial({ color: '#ffcf8a', side: THREE.DoubleSide })
)
outhouseMoon.position.set(0, 1.45, 0.585)
outhouse.add(outhouseMoon)

/**
 * Fence (instanced pickets)
 */
const fenceLeft = - 7
const fenceRight = 7
const fenceZ = 7
const picketSpacing = 0.35
const picketPositions = []
for(let x = fenceLeft; x <= fenceRight; x += picketSpacing)
{
    // Gap for the gate in front of the path
    if(Math.abs(x) < 0.9)
        continue

    picketPositions.push(x)
}

const fencePickets = new THREE.InstancedMesh(
    new THREE.BoxGeometry(0.12, 1, 0.05),
    woodMaterial,
    picketPositions.length
)
const dummy = new THREE.Object3D()
picketPositions.forEach((x, index) =>
{
    dummy.position.set(x, 0.4 + Math.random() * 0.1, fenceZ)
    dummy.rotation.set((Math.random() - 0.5) * 0.15, 0, (Math.random() - 0.5) * 0.15)
    dummy.scale.y = 0.8 + Math.random() * 0.3
    dummy.updateMatrix()
    fencePickets.setMatrixAt(index, dummy.matrix)
})
scene.add(fencePickets)

const fenceRailGeometry = new THREE.BoxGeometry(fenceRight - 0.9, 0.08, 0.04)
const fenceRails = new THREE.Group()
for(const side of [ - 1, 1 ])
{
    for(const height of [ 0.25, 0.65 ])
    {
        const rail = new THREE.Mesh(fenceRailGeometry, darkWoodMaterial)
        rail.position.set(side * (0.9 + (fenceRight - 0.9) * 0.5), height, fenceZ - 0.05)
        fenceRails.add(rail)
    }
}
scene.add(fenceRails)

/**
 * Path
 */
const path = new THREE.Group()
scene.add(path)

const pathStoneGeometry = new THREE.CylinderGeometry(0.3, 0.32, 0.12, 9)
for(let z = 2.6; z < 8.5; z += 0.55)
{
    const stone = new THREE.Mesh(pathStoneGeometry, stoneMaterial)
    stone.position.set((Math.random() - 0.5) * 0.3, 0.05, z)
    stone.rotation.y = Math.random() * Math.PI
    stone.scale.set(0.8 + Math.random() * 0.4, 1, 0.8 + Math.random() * 0.3)
    path.add(stone)
}

/**
 * Sign
 */
const sign = new THREE.Group()
sign.position.set(1.7, 0, 6.2)
sign.rotation.y = - 0.35
scene.add(sign)

const signPost = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.5, 0.1), darkWoodMaterial)
signPost.position.y = 0.75
sign.add(signPost)

const signBoard = new THREE.Mesh(
    new THREE.BoxGeometry(1.1, 0.55, 0.05),
    [
        woodMaterial, woodMaterial, woodMaterial, woodMaterial,
        new THREE.MeshStandardMaterial({ map: signTexture, roughness: 0.9 }),
        woodMaterial
    ]
)
signBoard.position.set(0, 1.3, 0.08)
signBoard.rotation.z = - 0.06
sign.add(signBoard)

/**
 * Dead trees
 */
const trees = new THREE.Group()
scene.add(trees)

const branchGeometry = new THREE.CylinderGeometry(0.03, 0.08, 1, 6)
branchGeometry.translate(0, 0.5, 0) // Pivot at the base

const createBranch = (parent, length, thickness, depth) =>
{
    const branch = new THREE.Mesh(branchGeometry, darkWoodMaterial)
    branch.scale.set(thickness, length, thickness)
    parent.add(branch)

    if(depth > 0)
    {
        const childrenCount = 2 + Math.floor(Math.random() * 2)
        for(let i = 0; i < childrenCount; i++)
        {
            const holder = new THREE.Group()
            holder.position.y = length * (0.6 + Math.random() * 0.4)
            holder.rotation.y = Math.random() * Math.PI * 2
            holder.rotation.z = 0.4 + Math.random() * 0.5
            parent.add(holder)
            createBranch(holder, length * 0.6, thickness * 0.6, depth - 1)
        }
    }
}

const treePlacements = [
    [ - 6.5, - 4.5, 3.2 ],
    [ 6.3, 3.5, 2.6 ],
    [ - 2.5, - 7, 2.8 ],
    [ 7.2, - 1.5, 2.2 ]
]
for(const [ x, z, height ] of treePlacements)
{
    const tree = new THREE.Group()
    tree.position.set(x, - 0.1, z)
    tree.rotation.y = Math.random() * Math.PI
    createBranch(tree, height, 2.2, 3)
    trees.add(tree)
}

/**
 * Graves
 */
const graveGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.2)
const crossVerticalGeometry = new THREE.BoxGeometry(0.15, 1.1, 0.15)
const crossHorizontalGeometry = new THREE.BoxGeometry(0.6, 0.15, 0.15)

const graves = new THREE.Group()
scene.add(graves)

// Places where graves must not appear
const isBlocked = (x, z) =>
{
    if(Math.abs(x) < 2.8 && Math.abs(z) < 2.8) return true                // House
    if(x > - 6.8 && x < - 3.2 && z > - 1.5 && z < 2.6) return true        // Shed
    if(Math.abs(x - 4.2) < 1.2 && Math.abs(z + 4.5) < 1.2) return true    // Outhouse
    if(Math.abs(x) < 1.1 && z > 2) return true                           // Path
    if(Math.abs(z - fenceZ) < 0.5) return true                           // Fence
    if(Math.abs(x - 1.7) < 0.8 && Math.abs(z - 6.2) < 0.6) return true    // Sign
    return false
}

let gravesCount = 0
while(gravesCount < 30)
{
    // Coordinates
    const angle = Math.random() * Math.PI * 2
    const radius = 3.5 + Math.random() * 5
    const x = Math.sin(angle) * radius
    const z = Math.cos(angle) * radius

    if(isBlocked(x, z))
        continue

    // Mesh (every fifth grave is a cross)
    let grave
    if(gravesCount % 5 === 0)
    {
        grave = new THREE.Group()
        const vertical = new THREE.Mesh(crossVerticalGeometry, stoneMaterial)
        const horizontal = new THREE.Mesh(crossHorizontalGeometry, stoneMaterial)
        horizontal.position.y = 0.2
        grave.add(vertical, horizontal)
    }
    else
    {
        grave = new THREE.Mesh(graveGeometry, stoneMaterial)
    }

    grave.position.x = x
    grave.position.y = Math.random() * 0.4
    grave.position.z = z
    grave.rotation.x = (Math.random() - 0.5) * 0.4
    grave.rotation.y = (Math.random() - 0.5) * 0.4
    grave.rotation.z = (Math.random() - 0.5) * 0.4

    // Add to the graves group
    graves.add(grave)
    gravesCount++
}

/**
 * Rocks
 */
const rocks = new THREE.Group()
scene.add(rocks)

const rockGeometry = new THREE.DodecahedronGeometry(0.3, 0)
while(rocks.children.length < 25)
{
    const angle = Math.random() * Math.PI * 2
    const radius = 3 + Math.random() * 6
    const x = Math.sin(angle) * radius
    const z = Math.cos(angle) * radius
    if(isBlocked(x, z))
        continue

    const rock = new THREE.Mesh(rockGeometry, stoneMaterial)
    rock.position.set(x, 0, z)
    rock.scale.set(0.4 + Math.random() * 0.8, 0.3 + Math.random() * 0.5, 0.4 + Math.random() * 0.8)
    rock.rotation.set(Math.random(), Math.random(), Math.random())
    rocks.add(rock)
}

/**
 * Lights
 */
// Ambient light
const ambientLight = new THREE.AmbientLight('#86cdff', 0.275)
scene.add(ambientLight)

// Directional light (moonlight)
const directionalLight = new THREE.DirectionalLight('#86cdff', 1)
directionalLight.position.set(3, 2, - 8)
scene.add(directionalLight)

// Door light
const doorLight = new THREE.PointLight('#ff7d46', 5)
doorLight.position.set(0, 2.2, 2.5)
house.add(doorLight)

// Lightning light (flashes from time to time)
const lightningLight = new THREE.DirectionalLight('#c8d8ff', 0)
lightningLight.position.set(- 4, 10, 6)
scene.add(lightningLight)

/**
 * Moon
 */
const moon = new THREE.Mesh(
    new THREE.SphereGeometry(1.6, 32, 32),
    new THREE.MeshBasicMaterial({ color: '#e6efff', fog: false })
)
moon.position.set(8, 14, - 28)
scene.add(moon)

/**
 * Ghosts
 */
const ghostGeometry = new THREE.SphereGeometry(0.12, 16, 16)
const ghostsSettings = [
    { color: '#8800ff', speed: 0.5, radius: 4 },
    { color: '#ff0088', speed: - 0.38, radius: 5 },
    { color: '#ff0000', speed: 0.23, radius: 6 }
]
const ghosts = ghostsSettings.map((settings) =>
{
    const light = new THREE.PointLight(settings.color, 6)
    const body = new THREE.Mesh(
        ghostGeometry,
        new THREE.MeshBasicMaterial({ color: settings.color, transparent: true, opacity: 0.8 })
    )
    light.add(body)
    scene.add(light)
    return { light, body, settings }
})

/**
 * Bats
 */
const batBodyGeometry = new THREE.SphereGeometry(0.06, 8, 8)
const wingShape = new THREE.Shape()
wingShape.moveTo(0, 0)
wingShape.lineTo(0.3, 0.08)
wingShape.lineTo(0.25, - 0.02)
wingShape.lineTo(0.18, 0.02)
wingShape.lineTo(0.12, - 0.04)
wingShape.lineTo(0.06, - 0.01)
wingShape.lineTo(0, - 0.05)
const wingGeometry = new THREE.ShapeGeometry(wingShape)
wingGeometry.rotateX(- Math.PI * 0.5)
const batMaterial = new THREE.MeshBasicMaterial({ color: '#050505', side: THREE.DoubleSide })

const bats = []
for(let i = 0; i < 7; i++)
{
    const bat = new THREE.Group()
    const body = new THREE.Mesh(batBodyGeometry, batMaterial)
    body.scale.set(0.7, 0.7, 1.4)
    const leftWing = new THREE.Mesh(wingGeometry, batMaterial)
    const rightWing = new THREE.Mesh(wingGeometry, batMaterial)
    rightWing.scale.x = - 1
    bat.add(body, leftWing, rightWing)
    scene.add(bat)

    bats.push({
        group: bat,
        leftWing,
        rightWing,
        radius: 3 + Math.random() * 4,
        height: 3.5 + Math.random() * 2.5,
        speed: (0.4 + Math.random() * 0.5) * (Math.random() < 0.5 ? - 1 : 1),
        offset: Math.random() * Math.PI * 2,
        flapSpeed: 18 + Math.random() * 8
    })
}

/**
 * Sky
 */
const sky = new Sky()
sky.scale.setScalar(100)
scene.add(sky)

const skyParameters = {
    turbidity: 10,
    rayleigh: 3,
    mieCoefficient: 0.1,
    mieDirectionalG: 0.95,
    elevation: - 2.2,
    azimuth: 162
}
const sunPosition = new THREE.Vector3()
const updateSky = () =>
{
    sky.material.uniforms.turbidity.value = skyParameters.turbidity
    sky.material.uniforms.rayleigh.value = skyParameters.rayleigh
    sky.material.uniforms.mieCoefficient.value = skyParameters.mieCoefficient
    sky.material.uniforms.mieDirectionalG.value = skyParameters.mieDirectionalG

    const phi = THREE.MathUtils.degToRad(90 - skyParameters.elevation)
    const theta = THREE.MathUtils.degToRad(skyParameters.azimuth)
    sunPosition.setFromSphericalCoords(1, phi, theta)
    sky.material.uniforms.sunPosition.value.copy(sunPosition)
}
updateSky()

/**
 * Fog
 */
const fogParameters = {
    color: '#04343f',
    density: 0.1
}
scene.fog = new THREE.FogExp2(fogParameters.color, fogParameters.density)

/**
 * Sizes
 */
const sizes = {
    width: window.innerWidth,
    height: window.innerHeight
}

window.addEventListener('resize', () =>
{
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

/**
 * Camera
 */
// Base camera
const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
camera.position.x = 4
camera.position.y = 2
camera.position.z = 8
scene.add(camera)

// Controls
const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true
controls.target.set(0, 1, 0)
controls.maxPolarAngle = Math.PI * 0.49
controls.minDistance = 2
controls.maxDistance = 18

/**
 * Renderer
 */
const renderer = new THREE.WebGLRenderer({
    canvas: canvas,
    antialias: true
})
renderer.setSize(sizes.width, sizes.height)
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/**
 * Shadows
 */
// Renderer
renderer.shadowMap.enabled = true
renderer.shadowMap.type = THREE.PCFSoftShadowMap

// Cast and receive
directionalLight.castShadow = true
for(const ghost of ghosts)
    ghost.light.castShadow = true

walls.castShadow = true
walls.receiveShadow = true
roof.castShadow = true
chimney.castShadow = true
floor.receiveShadow = true

scene.traverse((child) =>
{
    if(!child.isMesh)
        return

    if(shed.getObjectById(child.id) || outhouse.getObjectById(child.id) || trees.getObjectById(child.id) || sign.getObjectById(child.id))
    {
        child.castShadow = true
        child.receiveShadow = true
    }
})
fencePickets.castShadow = true

for(const grave of graves.children)
{
    grave.traverse((child) =>
    {
        child.castShadow = true
        child.receiveShadow = true
    })
}
for(const rock of rocks.children)
{
    rock.castShadow = true
    rock.receiveShadow = true
}
for(const stone of path.children)
    stone.receiveShadow = true

// Mapping
directionalLight.shadow.mapSize.width = 512
directionalLight.shadow.mapSize.height = 512
directionalLight.shadow.camera.top = 9
directionalLight.shadow.camera.right = 9
directionalLight.shadow.camera.bottom = - 9
directionalLight.shadow.camera.left = - 9
directionalLight.shadow.camera.near = 1
directionalLight.shadow.camera.far = 25

for(const ghost of ghosts)
{
    ghost.light.shadow.mapSize.width = 256
    ghost.light.shadow.mapSize.height = 256
    ghost.light.shadow.camera.far = 10
}

/**
 * Sounds (generated with Web Audio API, no files needed)
 */
const sound = {
    enabled: false,
    volume: 0.6,
    context: null,
    master: null,
    whisperGain: null
}

const createNoiseBuffer = (context, seconds) =>
{
    const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate)
    const data = buffer.getChannelData(0)
    for(let i = 0; i < data.length; i++)
        data[i] = Math.random() * 2 - 1
    return buffer
}

const initSound = () =>
{
    const context = new AudioContext()
    const master = context.createGain()
    master.gain.value = sound.volume
    master.connect(context.destination)

    // Wind: looping noise through a band-pass filter whose frequency slowly wanders
    const wind = context.createBufferSource()
    wind.buffer = createNoiseBuffer(context, 4)
    wind.loop = true
    const windFilter = context.createBiquadFilter()
    windFilter.type = 'bandpass'
    windFilter.frequency.value = 400
    windFilter.Q.value = 1.5
    const windLfo = context.createOscillator()
    windLfo.frequency.value = 0.08
    const windLfoGain = context.createGain()
    windLfoGain.gain.value = 250
    windLfo.connect(windLfoGain).connect(windFilter.frequency)
    const windGain = context.createGain()
    windGain.gain.value = 0.25
    wind.connect(windFilter).connect(windGain).connect(master)
    wind.start()
    windLfo.start()

    // Ghost whisper: a wobbly tone whose volume depends on the nearest ghost
    const whisper = context.createOscillator()
    whisper.type = 'sine'
    whisper.frequency.value = 330
    const vibrato = context.createOscillator()
    vibrato.frequency.value = 5
    const vibratoGain = context.createGain()
    vibratoGain.gain.value = 18
    vibrato.connect(vibratoGain).connect(whisper.frequency)
    const whisperGain = context.createGain()
    whisperGain.gain.value = 0
    whisper.connect(whisperGain).connect(master)
    whisper.start()
    vibrato.start()

    sound.context = context
    sound.master = master
    sound.whisperGain = whisperGain
}

const playThunder = (delay) =>
{
    if(!sound.enabled || !sound.context)
        return

    const context = sound.context
    const startTime = context.currentTime + delay
    const source = context.createBufferSource()
    source.buffer = createNoiseBuffer(context, 4)
    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 180
    const gain = context.createGain()
    gain.gain.setValueAtTime(0, startTime)
    gain.gain.linearRampToValueAtTime(1.6, startTime + 0.08)
    gain.gain.exponentialRampToValueAtTime(0.001, startTime + 3.5)
    source.connect(filter).connect(gain).connect(sound.master)
    source.start(startTime)
    source.stop(startTime + 4)
}

const soundButton = document.querySelector('.sound-button')
const toggleSound = () =>
{
    if(!sound.context)
        initSound()

    sound.enabled = !sound.enabled
    if(sound.enabled)
        sound.context.resume()
    else
        sound.context.suspend()

    soundButton.textContent = sound.enabled ? '🔊 Вимкнути звук' : '🔇 Увімкнути звук'
}
soundButton.addEventListener('click', toggleSound)

/**
 * Animation parameters
 */
const animationParameters = {
    ghostsSpeed: 1,
    ghostsIntensity: 6,
    ghostsHeight: 1,
    doorFlicker: true,
    doorIntensity: 5,
    windowsFlicker: true,
    lightning: true,
    lightningInterval: 8,
    batsSpeed: 1,
    flashNow: () => triggerLightning()
}

let lightningTime = - 10
let nextLightning = 4
const triggerLightning = () =>
{
    lightningTime = timer.getElapsed()
    playThunder(0.4 + Math.random() * 1.2)
}

/**
 * Debug panel
 */
// Lights
const lightsFolder = gui.addFolder('Світло')
lightsFolder.addColor(ambientLight, 'color').name('Амбієнт: колір')
lightsFolder.add(ambientLight, 'intensity').min(0).max(3).step(0.01).name('Амбієнт: інтенсивність')
lightsFolder.addColor(directionalLight, 'color').name('Місяць: колір')
lightsFolder.add(directionalLight, 'intensity').min(0).max(5).step(0.01).name('Місяць: інтенсивність')
lightsFolder.add(directionalLight.position, 'x').min(- 10).max(10).step(0.1).name('Місяць: X')
lightsFolder.add(directionalLight.position, 'y').min(0.5).max(10).step(0.1).name('Місяць: Y')
lightsFolder.add(directionalLight.position, 'z').min(- 10).max(10).step(0.1).name('Місяць: Z')
lightsFolder.addColor(doorLight, 'color').name('Двері: колір')
lightsFolder.add(animationParameters, 'doorIntensity').min(0).max(20).step(0.1).name('Двері: інтенсивність')
lightsFolder.add(animationParameters, 'doorFlicker').name('Двері: миготіння')
lightsFolder.addColor(windowMaterial, 'emissive').name('Вікна: колір')
lightsFolder.add(animationParameters, 'windowsFlicker').name('Вікна: мерехтіння')

// Ghosts
const ghostsFolder = gui.addFolder('Привиди')
ghostsFolder.add(animationParameters, 'ghostsSpeed').min(0).max(5).step(0.01).name('Швидкість')
ghostsFolder.add(animationParameters, 'ghostsIntensity').min(0).max(20).step(0.1).name('Інтенсивність')
ghostsFolder.add(animationParameters, 'ghostsHeight').min(0).max(3).step(0.01).name('Амплітуда висоти')
ghosts.forEach((ghost, index) =>
{
    ghostsFolder.addColor(ghost.settings, 'color').name(`Привид ${ index + 1 }: колір`).onChange((value) =>
    {
        ghost.light.color.set(value)
        ghost.body.material.color.set(value)
    })
    ghostsFolder.add(ghost.settings, 'radius').min(3).max(9).step(0.1).name(`Привид ${ index + 1 }: радіус`)
})

// Sky
const skyFolder = gui.addFolder('Небо')
skyFolder.add(skyParameters, 'turbidity').min(0).max(20).step(0.1).name('Каламутність').onChange(updateSky)
skyFolder.add(skyParameters, 'rayleigh').min(0).max(4).step(0.001).name('Релеївське розсіювання').onChange(updateSky)
skyFolder.add(skyParameters, 'mieCoefficient').min(0).max(0.1).step(0.001).name('Коефіцієнт Мі').onChange(updateSky)
skyFolder.add(skyParameters, 'mieDirectionalG').min(0).max(1).step(0.001).name('Напрямленість Мі').onChange(updateSky)
skyFolder.add(skyParameters, 'elevation').min(- 10).max(90).step(0.1).name('Висота сонця').onChange(updateSky)
skyFolder.add(skyParameters, 'azimuth').min(- 180).max(180).step(0.1).name('Азимут').onChange(updateSky)
skyFolder.add(moon, 'visible').name('Показати місяць')

// Fog
const fogFolder = gui.addFolder('Туман')
fogFolder.addColor(fogParameters, 'color').name('Колір').onChange((value) => scene.fog.color.set(value))
fogFolder.add(scene.fog, 'density').min(0).max(0.3).step(0.001).name('Щільність')

// Textures
const texturesFolder = gui.addFolder('Текстури')
const textureParameters = { floorRepeat: 8, wallRepeat: 1, roofRepeat: 3 }
texturesFolder.add(textureParameters, 'floorRepeat').min(1).max(20).step(1).name('Підлога: повторення').onChange((value) =>
{
    for(const texture of floorTextures)
        texture.repeat.set(value, value)
})
texturesFolder.add(textureParameters, 'wallRepeat').min(0.5).max(4).step(0.5).name('Стіни: повторення').onChange((value) =>
{
    for(const texture of wallTextures)
        texture.repeat.set(value, value)
})
texturesFolder.add(textureParameters, 'roofRepeat').min(1).max(8).step(1).name('Дах: повторення').onChange((value) =>
{
    for(const texture of roofTextures)
        texture.repeat.x = value
})
texturesFolder.add(floor.material, 'displacementScale').min(0).max(1).step(0.001).name('Підлога: зміщення')
texturesFolder.add(floor.material, 'displacementBias').min(- 1).max(1).step(0.001).name('Підлога: зсув')

// Effects
const effectsFolder = gui.addFolder('Ефекти')
effectsFolder.add(animationParameters, 'lightning').name('Блискавки')
effectsFolder.add(animationParameters, 'lightningInterval').min(2).max(30).step(0.5).name('Інтервал блискавок, с')
effectsFolder.add(animationParameters, 'flashNow').name('Блискавка зараз!')
effectsFolder.add(animationParameters, 'batsSpeed').min(0).max(3).step(0.01).name('Швидкість кажанів')
effectsFolder.add(sound, 'volume').min(0).max(1).step(0.01).name('Гучність').onChange((value) =>
{
    if(sound.master)
        sound.master.gain.value = value
})

/**
 * Animate
 */
const timer = new Timer()
const batTarget = new THREE.Vector3()

const tick = () =>
{
    // Timer
    timer.update()
    const elapsedTime = timer.getElapsed()
    const deltaTime = timer.getDelta()

    // Ghosts
    let nearestGhostDistance = Infinity
    for(const ghost of ghosts)
    {
        const settings = ghost.settings
        settings.angle = (settings.angle ?? 0) + deltaTime * settings.speed * animationParameters.ghostsSpeed
        const angle = settings.angle
        ghost.light.position.x = Math.cos(angle) * settings.radius
        ghost.light.position.z = Math.sin(angle) * settings.radius
        ghost.light.position.y = Math.sin(angle) * Math.sin(angle * 2.34) * Math.sin(angle * 3.45) * animationParameters.ghostsHeight + 0.3
        ghost.light.intensity = animationParameters.ghostsIntensity * (0.8 + Math.sin(elapsedTime * 7 + settings.radius) * 0.2)
        ghost.body.visible = ghost.light.position.y > 0

        nearestGhostDistance = Math.min(nearestGhostDistance, ghost.light.position.distanceTo(camera.position))
    }

    // Door light flicker: smooth wobble with random short blackouts
    if(animationParameters.doorFlicker)
    {
        const wobble = 0.85 + Math.sin(elapsedTime * 13) * 0.08 + Math.sin(elapsedTime * 31) * 0.07
        const blackout = Math.sin(elapsedTime * 2.3) > 0.93 && Math.random() < 0.6 ? 0.05 : 1
        doorLight.intensity = animationParameters.doorIntensity * wobble * blackout
    }
    else
    {
        doorLight.intensity = animationParameters.doorIntensity
    }
    doorLamp.material.color.copy(doorLight.color).multiplyScalar(doorLight.intensity / Math.max(animationParameters.doorIntensity, 0.001))

    // Windows candle flicker
    windowMaterial.emissiveIntensity = animationParameters.windowsFlicker
        ? 1.3 + Math.sin(elapsedTime * 9) * 0.15 + Math.sin(elapsedTime * 23) * 0.1
        : 1.5

    // Lightning
    if(animationParameters.lightning && elapsedTime > nextLightning)
    {
        triggerLightning()
        nextLightning = elapsedTime + animationParameters.lightningInterval * (0.6 + Math.random() * 0.8)
    }
    const sinceLightning = elapsedTime - lightningTime
    if(sinceLightning < 0.6)
    {
        // Double flash
        const flash = Math.max(0, 1 - sinceLightning / 0.12) + Math.max(0, 1 - Math.abs(sinceLightning - 0.25) / 0.1) * 0.7
        lightningLight.intensity = flash * 6
        scene.fog.color.set(fogParameters.color).lerp(new THREE.Color('#9fb3c8'), flash * 0.5)
    }
    else if(lightningLight.intensity !== 0)
    {
        lightningLight.intensity = 0
        scene.fog.color.set(fogParameters.color)
    }

    // Bats
    for(const bat of bats)
    {
        const angle = bat.offset + elapsedTime * bat.speed * animationParameters.batsSpeed
        const y = bat.height + Math.sin(elapsedTime * 1.3 + bat.offset) * 0.4
        bat.group.position.set(Math.cos(angle) * bat.radius, y, Math.sin(angle) * bat.radius)

        const nextAngle = angle + 0.05 * Math.sign(bat.speed || 1)
        batTarget.set(Math.cos(nextAngle) * bat.radius, y, Math.sin(nextAngle) * bat.radius)
        bat.group.lookAt(batTarget)

        const flap = Math.sin(elapsedTime * bat.flapSpeed * Math.max(animationParameters.batsSpeed, 0.2)) * 0.8
        bat.leftWing.rotation.z = flap
        bat.rightWing.rotation.z = - flap
    }

    // Ghost whisper volume
    if(sound.whisperGain)
        sound.whisperGain.gain.value = THREE.MathUtils.clamp(1 - nearestGhostDistance / 6, 0, 1) * 0.08

    // Update controls
    controls.update()

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
}

tick()
