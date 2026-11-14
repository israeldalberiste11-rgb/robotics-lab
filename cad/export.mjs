import { writeFileSync } from 'node:fs'
import { Scene, Mesh, MeshStandardMaterial, ExtrudeGeometry, Shape, Path } from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js'
import { profiles } from './profiles.mjs'

globalThis.FileReader = class {
  async readAsArrayBuffer(blob) {
    this.result = await blob.arrayBuffer()
    this.onloadend()
  }
}

function trace(path, points) {
  points.forEach(([x,y],i)=>i?path.lineTo(x/1000,y/1000):path.moveTo(x/1000,y/1000))
  path.closePath()
  return path
}

const scene = new Scene()
for (const [name, spec] of Object.entries(profiles)) {
  const shape = trace(new Shape(),spec.outline)
  for (const cut of spec.cutouts) shape.holes.push(trace(new Path(),cut))
  for (const {x,y,r} of spec.holes) {
    const ring=Array.from({length:24},(_,i)=>[x+r*Math.cos(i*Math.PI/12),y-r*Math.sin(i*Math.PI/12)])
    shape.holes.push(trace(new Path(),ring))
  }
  const geometry = new ExtrudeGeometry(shape,{depth:spec.thickness/1000,bevelEnabled:false,curveSegments:16})
  geometry.translate(0,0,-spec.thickness/2000)
  geometry.normalizeNormals()
  const mesh = new Mesh(mergeVertices(geometry,1e-7),new MeshStandardMaterial({color:spec.color,metalness:.54,roughness:.42}))
  mesh.name = name
  mesh.userData = { units:'m', thicknessMm:spec.thickness, construction:'Original parametric profile' }
  scene.add(mesh)
}
const buffer = await new GLTFExporter().parseAsync(scene,{binary:true})
writeFileSync(new URL('../src/assets/mechanical-parts.glb',import.meta.url),Buffer.from(buffer))
