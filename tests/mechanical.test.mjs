import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { profiles } from '../cad/profiles.mjs'

test('GLB loads every named component as a closed metre-scale mesh',async()=>{
  const bytes=Uint8Array.from(readFileSync(new URL('../src/assets/mechanical-parts.glb',import.meta.url)))
  const {scene}=await new GLTFLoader().parseAsync(bytes.buffer,'')
  for(const [name,spec] of Object.entries(profiles)){
    const node=scene.getObjectByName(name)
    assert.ok(node?.isMesh,name)
    const {geometry}=node
    geometry.computeBoundingBox()
    assert.ok(Math.abs((geometry.boundingBox.max.z-geometry.boundingBox.min.z)*1000-spec.thickness)<.001,name)
    const vertices=geometry.attributes.position
    const index=geometry.index
    const keys=Array.from({length:vertices.count},(_,i)=>[vertices.getX(i),vertices.getY(i),vertices.getZ(i)].map(n=>Math.round(n*1e7)).join('/'))
    const edges=new Map()
    for(let i=0;i<index.count;i+=3){
      const tri=[0,1,2].map(j=>keys[index.getX(i+j)])
      assert.equal(new Set(tri).size,3,name)
      for(let j=0;j<3;j++){
        const edge=[tri[j],tri[(j+1)%3]].sort().join(':')
        edges.set(edge,(edges.get(edge)??0)+1)
      }
    }
    assert.ok([...edges.values()].every(count=>count===2),name)
  }
})
