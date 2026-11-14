import { useLayoutEffect, useMemo, useRef } from 'react'
import { Color, InstancedMesh, Object3D, Vector2 } from 'three'

type Plant = { x:number; y:number; z:number; sx:number; sy:number; sz:number; color:string }
type PlantKind = 'bark' | 'leaves' | 'needles' | 'stones'

function GroveMesh({ plants, kind }: { plants: Plant[]; kind: PlantKind }) {
  const mesh = useRef<InstancedMesh>(null)
  useLayoutEffect(() => {
    if (!mesh.current) return
    const dummy = new Object3D()
    const color = new Color()
    plants.forEach((plant,i) => {
      dummy.position.set(plant.x,plant.y,plant.z)
      dummy.rotation.y = i * 2.39996
      dummy.scale.set(plant.sx,plant.sy,plant.sz)
      dummy.updateMatrix()
      mesh.current!.setMatrixAt(i,dummy.matrix)
      mesh.current!.setColorAt(i,color.set(plant.color))
    })
    mesh.current.instanceMatrix.needsUpdate = true
    if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true
    mesh.current.computeBoundingSphere()
  },[plants])
  return <instancedMesh ref={mesh} args={[undefined,undefined,plants.length]} castShadow receiveShadow>
    {kind === 'bark' ? <cylinderGeometry args={[.45,1,1,7]} /> : kind === 'needles'
      ? <latheGeometry args={[[[0,-.5],[.71,-.5],[1,-.40],[.86,-.32],[.9,-.26],[.62,-.15],[.67,-.09],[.44,.04],[.51,.1],[.24,.24],[.14,.39],[0,.5]].map(([x,y])=>new Vector2(x,y)),14]} /> : <icosahedronGeometry args={[1,kind === 'leaves' ? 2 : 1]} />}
    <meshStandardMaterial roughness={.94} flatShading={kind === 'stones'}/>
  </instancedMesh>
}

export function Woodland() {
  const grove = useMemo(() => {
    const plants: Record<PlantKind,Plant[]> = { bark:[], leaves:[], needles:[], stones:[] }
    let seed = 4837
    const random = () => { seed = (Math.imul(seed,1664525)+1013904223)>>>0; return seed/4294967296 }
    for (let ring = 0; ring < 4; ring++) {
      const count = [23,32,46,59][ring]
      for (let i = 0; i < count; i++) {
        const angle = (i+random()*.75)*Math.PI*2/count
        const radius = 5.8+ring*5.4+random()*2
        const x = Math.cos(angle)*radius, z = Math.sin(angle)*radius
        if (Math.abs(x-(8.5+.85*Math.sin(z*.29)))<2.1) continue
        // Keep openings toward the houses and footbridge.
        if (ring===0 && i%4===0 || Math.abs(radius-10.4)<1.6 && i%3===0) continue
        const h = 1.35+random()*2.3
        const fir = i%5===0 || i%5===3
        const birch = i%5===1
        plants.bark.push({x,y:h*.39,z,sx:h*.05,sy:h*.8,sz:h*.047,color:birch?'#c9c3a9':'#685442'})
        if (fir) {
          for(let layer=0;layer<4;layer++) {
            const width = h*(.28-layer*.051)
            plants.needles.push({x,y:h*(.44+layer*.153),z,sx:width,sy:h*.44,sz:width,
              color:['#304d31','#3d5d35','#507040','#60834a'][layer]})
          }
        } else {
          const palette = i%11===2 ? ['#834d38','#a76643','#ab8050'] : ['#42663b','#58783b','#71904c']
          for(let l=0;l<7;l++){
            const t=l*2.39996, spread=l===0?0:h*.16, size=h*(.17+random()*.085)
            plants.leaves.push({x:x+Math.cos(t)*spread,y:h*(.69+random()*.24),z:z+Math.sin(t)*spread,
              sx:size,sy:size*(birch?1.23:.8),sz:size,color:palette[l%3]})
          }
        }
      }
    }
    for(let i=0;i<200;i++){
      const angle=random()*Math.PI*2, radius=4.7+random()*15
      const x=Math.cos(angle)*radius,z=Math.sin(angle)*radius
      if(Math.abs(x-(8.5+.85*Math.sin(z*.29)))<1.42 || Math.abs(x-8.5)<2 && Math.abs(z)<.7) continue
      const size=.09+random()*.25
      const stone=i%5===0
      plants[stone?'stones':'leaves'].push({x,y:size*.27,z,sx:size*1.5,sy:size*.65,sz:size,
        color:stone?'#788170':['#587548','#78944c','#41633a','#869850'][i%4]})
    }
    return plants
  },[])
  return <group>
    <GroveMesh kind="bark" plants={grove.bark}/>
    <GroveMesh kind="leaves" plants={grove.leaves}/>
    <GroveMesh kind="needles" plants={grove.needles}/>
    <GroveMesh kind="stones" plants={grove.stones}/>
  </group>
}
