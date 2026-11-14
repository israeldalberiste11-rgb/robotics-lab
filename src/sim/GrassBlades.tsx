import { useLayoutEffect, useMemo, useRef } from 'react'
import { BufferGeometry, Color, DoubleSide, Float32BufferAttribute, InstancedMesh, Object3D } from 'three'

export function GrassBlades({ inset=0, wide=false }: {inset?:number;wide?:boolean}) {
  const mesh = useRef<InstancedMesh>(null)
  const count = wide ? 12500 : 10500
  const geometry = useMemo(() => {
    const position:number[]=[]
    const indices:number[]=[]
    for (let blade=0;blade<5;blade++) {
      const a=blade*2.39996
      const start=position.length/3
      for (let section=0;section<=3;section++) {
        const t=section/4, width=.008*(1-t*.88)
        for (const side of [-1,1]) {
          const spread=.009+.065*t*t
          position.push(Math.cos(a)*spread+Math.sin(a)*width*side,.105*t,-Math.sin(a)*spread+Math.cos(a)*width*side)
        }
        if (section) {
          const i=start+section*2
          indices.push(i-2,i-1,i,i-1,i+1,i)
        }
      }
      position.push(Math.cos(a)*.093,.105,-Math.sin(a)*.093)
      indices.push(start+6,start+7,start+8)
    }
    const result=new BufferGeometry()
    result.setAttribute('position',new Float32BufferAttribute(position,3))
    result.setIndex(indices)
    result.computeVertexNormals()
    const colors=[]
    for(let i=0;i<position.length;i+=3) {
      const t=position[i+1]/.105
      colors.push(.27+t*.70,.37+t*.63,.21+t*.56)
    }
    result.setAttribute('color',new Float32BufferAttribute(colors,3))
    return result
  },[])
  useLayoutEffect(()=>{
    const group=mesh.current!
    let seed=34519
    const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/4294967296)
    const dummy=new Object3D(), color=new Color()
    const palette=['#598535','#638e37','#759d42','#456e30','#85a44b']
    const span=wide?17:10
    for(let i=0;i<count;i++) {
      let x=0,z=0
      do { x=(random()-.5)*span; z=(random()-.5)*span }
      while(inset && Math.max(Math.abs(x),Math.abs(z))<inset)
      const verge=wide ? Math.max(Math.abs(x)/4.75,Math.abs(z)/3.35)>1 : Math.hypot(x,z)>2.7
      const patch=.6+.4*Math.sin(x*2.3)*Math.cos(z*2)
      const height=(verge?.85:.37)*(.46+random()*.8)*patch
      dummy.position.set(x,-.001,z)
      dummy.rotation.y=random()*Math.PI*2
      dummy.scale.set(.48+random()*.60,height,.48+random()*.60)
      dummy.updateMatrix()
      group.setMatrixAt(i,dummy.matrix)
      group.setColorAt(i,color.set(palette[Math.floor(random()*palette.length)]))
    }
    group.instanceMatrix.needsUpdate=true
    if(group.instanceColor) group.instanceColor.needsUpdate=true
    group.computeBoundingSphere()
  },[count,inset,wide])
  return <instancedMesh ref={mesh} args={[geometry,undefined,count]} receiveShadow raycast={()=>null}>
    <meshStandardMaterial vertexColors side={DoubleSide} roughness={.94}/>
  </instancedMesh>
}
