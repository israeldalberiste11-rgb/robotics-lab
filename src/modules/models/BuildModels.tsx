import type { ReactNode } from 'react'
import { Line } from '@react-three/drei'
import { Shell } from '../../sim/Rover'

export type Part = { id: string; name: string; detail: string }
type Select = { selected: string | null; select: (id: string) => void }
const steel = '#8d959b', dark = '#282a30', bone = '#e5ddd0', wine = '#8B1E3F'

export const HAND_PARTS: Part[] = [
  { id:'shoulder', name:'Shoulder', detail:'The shoulder actuator rotates the upper arm and carries the elbow, wrist, and hand with it.' },
  { id:'elbow', name:'Elbow', detail:'A pin joint and linkage move the forearm relative to the upper arm.' },
  { id:'wrist', name:'Wrist', detail:'The wrist changes hand orientation independently of the elbow.' },
  { id:'hand', name:'Hand and tendons', detail:'Each segmented finger curls about its knuckle joints. Tendon lines illustrate how a remote servo can transmit force into the fingers.' },
]

function Axle({ radius, depth, color = steel }: { radius: number; depth: number; color?: string }) {
  return <mesh rotation-x={Math.PI/2} castShadow receiveShadow>
    <cylinderGeometry args={[radius,radius,depth,28]} /><meshStandardMaterial color={color} metalness={.49} roughness={.36} />
  </mesh>
}
function ClickPart({ id, selected, select, children }: Select & { id: string; children: ReactNode }) {
  return <group onClick={(event) => { event.stopPropagation(); select(id) }}>
    {children}
    {selected === id && <mesh><sphereGeometry args={[.04,10,8]} /><meshBasicMaterial wireframe color="#e65086" depthTest={false} /></mesh>}
  </group>
}
export interface HandPose { shoulder: number; elbow: number; wrist: number; curl: number }
export const HAND_HOME: HandPose = { shoulder: -20, elbow: -54, wrist: 17, curl: 22 }
export function InMoov({ pose, selected, select, fingers }: Select & { pose: HandPose; fingers?: number[] }) {
  const radians = (degrees: number) => degrees * Math.PI / 180
  return <group>
    <Shell at={[0,.025,0]} size={[.245,.05,.214]} color={dark} radius={.019} />
    <Shell at={[0,.079,0]} size={[.135,.11,.13]} color={wine} radius={.023} />
    <group position={[0,.134,0]} rotation-z={radians(pose.shoulder)}>
      <ClickPart id="shoulder" selected={selected} select={select}><Axle radius={.062} depth={.105} color={bone} /><Axle radius={.035} depth={.113} color={dark} /></ClickPart>
      <Shell at={[0,.112,0]} size={[.095,.212,.09]} color={bone} radius={.032} />
      <Shell at={[.039,.11,.037]} size={[.021,.135,.017]} color={steel} />
      <group position={[0,.228,0]} rotation-z={radians(pose.elbow)}>
        <ClickPart id="elbow" selected={selected} select={select}><Axle radius={.042} depth={.091} color={bone} /><Axle radius={.026} depth={.103} color={dark} /></ClickPart>
        <Shell at={[0,.095,0]} size={[.084,.182,.076]} color={bone} radius={.024} />
        <Shell at={[-.03,.085,.032]} size={[.018,.132,.022]} color={dark} />
        <Line points={[[-.037,.015,.041],[-.047,.075,.042],[-.028,.156,.039]]} color="#9b634b" lineWidth={2} />
        <group position={[0,.19,0]} rotation-z={radians(pose.wrist)}>
          <ClickPart id="wrist" selected={selected} select={select}><Axle radius={.03} depth={.068} color={steel} /><Axle radius={.018} depth={.075} color={dark} /></ClickPart>
          <group position={[0,.043,0]}>
            <ClickPart id="hand" selected={selected} select={select}>
              <Shell at={[0,0,0]} size={[.035,.071,.082]} color={bone} radius={.013} />
              <Line points={[[.021,-.034,0],[.024,0,0],[.018,.031,.029]]} color="#b88b61" lineWidth={2}/>
              <Shell at={[.019,-.002,0]} size={[.008,.05,.06]} color={dark} />
              {[0,1,2,3,4].map((i) => {
                const thumb = i === 4, length = [.036,.043,.041,.032,.033][i]
                const curl = radians((fingers?.[i] ?? pose.curl) * (thumb ? -.35 : .7))
                return <group key={i} position={[0,thumb ? .005 : .033,thumb ? -.042 : -.031 + .021*i]}
                  rotation-x={thumb ? -.88 : (i - 1.5) * .08}>
                  <group rotation-z={curl}>
                    <Shell at={[0,length/2,0]} size={[.017,length,.015]} color={bone} radius={.005} />
                    <group position={[0,length,0]} rotation-z={curl*.8}>
                      <Shell at={[0,length*.28,0]} size={[.014,length*.59,.014]} color={bone} radius={.005} />
                      <group position={[0,length*.58,0]} rotation-z={curl*.55}>
                        <Shell at={[0,length*.2,0]} size={[.013,length*.48,.012]} color={bone} radius={.005} />
                      </group>
                    </group>
                  </group>
                </group>
              })}
            </ClickPart>
          </group>
        </group>
      </group>
    </group>
  </group>
}
