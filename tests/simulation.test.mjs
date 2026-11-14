import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'

const asModule = text => 'data:text/javascript;base64,' + Buffer.from(text).toString('base64')
const compile = file => ts.transpile(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{
  target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.ESNext,
})
const driveModule=asModule(compile('src/lib/drive.ts'))
const {stepDifferential,turningRadius}=await import(driveModule)
const {fk,ik,ARM,HOME,toScene}=await import(asModule(compile('src/arm/kinematics.ts')))
const {pidStep,simulateResponse,settlingTime}=await import(asModule(compile('src/lib/pid.ts')))
const {applyCommand,navigate,plan,sense,START,GOAL,OBSTACLES,distance}=await import(asModule(compile('src/lib/sta.ts').replace("'./drive'",JSON.stringify(driveModule))))
const {parseProgram,EXAMPLE}=await import(asModule(compile('src/lib/program.ts')))
const {readRuns}=await import(asModule(compile('src/lib/experiments.ts')))
const near=(actual,expected)=>assert.ok(Math.abs(actual-expected)<1e-8,`${actual} ≠ ${expected}`)

test('FK reference pose and scene coordinate mapping',()=>{
  const p=fk({...HOME,j1:90,j2:0,j3:0,wrist:0})
  near(p.x,0)
  near(p.y,ARM.upper+ARM.fore+ARM.wrist+ARM.hand)
  near(p.z,ARM.baseHeight+ARM.shoulder)
  assert.deepEqual(toScene({x:1,y:2,z:3}),[1,3,-2])
})
test('IK round trips at limits and rejects unreachable or nonfinite targets',()=>{
  for (const j1 of [-180,0,90,180]) for(const j2 of [-65,0,120])
    for(const j3 of [-150,0,150]) for(const wrist of [-90,0,90]){
      const pose={...HOME,j1,j2,j3,wrist}
      const target=fk(pose), solution=ik(target,pose)
      assert.ok(solution)
      const point=fk(solution)
      near(point.x,target.x);near(point.y,target.y);near(point.z,target.z)
    }
  assert.equal(ik({x:2,y:0,z:0}),null)
  assert.equal(ik({x:NaN,y:0,z:0}),null)
})
test('Differential drive integrates straight, spin, and circular paths',()=>{
  const origin={x:0,y:0,theta:0}
  assert.deepEqual(stepDifferential(origin,.3,.3,.32,2),{x:.6,y:0,theta:0})
  const spin=stepDifferential(origin,-.16,.16,.32,2)
  near(spin.x,0);near(spin.y,0);near(spin.theta,2)
  const orbit=stepDifferential(origin,.2,.4,.32,2*Math.PI*.32/.2)
  near(orbit.x,0);near(orbit.y,0)
  assert.equal(turningRadius(.2,.2,.32),null)
})
test('PID actuator saturates without integrating windup and samples stay finite',()=>{
  let state={integral:0,prevError:0}
  let output=0
  for(let i=0;i<1000;i++){
    const result=pidStep(2,output,{kp:4,ki:8,kd:.1},state,.02,.24,.8)
    output=result.output;state=result.state
    assert.ok(Math.abs(output)<=.8)
  }
  near(output,.8);near(state.integral,0)
  assert.ok(simulateResponse({kp:20,ki:5,kd:.5},100,8).every(({y})=>Number.isFinite(y)&&Math.abs(y)<=200))
  assert.equal(settlingTime([{t:0,y:99},{t:1,y:105},{t:2,y:101}],100,2),2)
})
test('Sensors use range and bounded error, and collision rejects motion',()=>{
  const pose={x:0,y:0,theta:0}
  const obstacle={x:.8,y:0,r:.1,id:'crate',kind:'crate'}
  near(sense(pose,[obstacle])[5].distance,.47)
  assert.equal(sense(pose,[obstacle],{range:.3})[5].hit,null)
  assert.ok(sense(pose,[obstacle],{range:.5,noise:.2,sample:5}).every(r=>r.distance>=0&&r.distance<=.5))
  assert.equal(applyCommand(pose,{v:1,omega:0},.32,1,[obstacle]).blocked,true)
})
test('Autonomy reaches the goal and rejects occupied endpoints',()=>{
  let pose=START,route=plan(pose,GOAL,OBSTACLES)
  assert.ok(route.length>1)
  assert.deepEqual(plan(OBSTACLES[0],GOAL,OBSTACLES),[])
  for(let i=0;i<1500&&distance(pose,GOAL)>=.075;i++){
    if(route.length>1&&distance(pose,route[0])<.041)route.shift()
    const next=applyCommand(pose,navigate(pose,GOAL,route[0],sense(pose,OBSTACLES)),.32,.02,OBSTACLES)
    assert.equal(next.blocked,false)
    pose=next.pose
  }
  assert.ok(distance(pose,GOAL)<.075)
})
test('Programming parses only bounded commands and reports source lines',()=>{
  assert.equal(parseProgram(EXAMPLE).length,4)
  assert.deepEqual(parseProgram('# note\nWAIT .02'),[{line:2,left:0,right:0,seconds:.02}])
  for(const program of ['alert(1)','DRIVE .7 0 1','WAIT Infinity','WAIT 0','WAIT 1;','WAIT 20\n'.repeat(7)])
    assert.throws(()=>parseProgram(program),/Line /)
})
test('Saved-run validation tolerates corrupt data and restores valid records',()=>{
  const run={configuration:{left:.2,right:.3,track:.32,speed:1,program:EXAMPLE,motor:'PID',kp:2,ki:4,kd:.04},result:{distance:1,x:0,y:0,heading:0}}
  assert.deepEqual(readRuns('garbage'),[])
  assert.deepEqual(readRuns(JSON.stringify([null,run,{...run,configuration:{...run.configuration,track:0}}])),[run])
})

test('Narrow ultrasonic fan measures from the transducer and ignores virtual walls',()=>{
  const pose={x:0,y:0,theta:0}
  const options={offset:.202,range:4,halfAngle:Math.PI/24,includeBoundary:false}
  const readings=sense(pose,[{x:1,y:0,r:.1,id:'target',kind:'crate'}],options)
  near(readings[0].angle,-Math.PI/24)
  near(readings[5].distance,.698)
  assert.equal(readings[5].hit,'target')
  const outside=sense({x:4,y:0,theta:0},[],options)
  assert.ok(outside.every(reading=>reading.hit===null&&reading.distance===4))
})

test('PID reports the same signed actuator command that drives the plant',()=>{
  const result=pidStep(-2,0,{kp:4,ki:8,kd:0},{integral:0,prevError:0},.02,.24,.8)
  near(result.command,-.8)
  near(result.output,result.command*(-Math.expm1(-.02/.24)))
})

const {PUPPER, legPose, linkagePin}=await import(asModule(compile('src/lib/pupper.ts')))

test('Pupper stance reaches the floor and remote knee rod preserves length',()=>{
  for (const gait of ['Walk','Trot']) for(let leg=0;leg<4;leg++){
    const {pitch,knee}=legPose(leg,0,gait,false,0,0,0)
    near(PUPPER.upper*Math.sin(pitch)+PUPPER.lower*Math.sin(pitch+knee),0)
    near(PUPPER.upper*Math.cos(pitch)+PUPPER.lower*Math.cos(pitch+knee),PUPPER.height-PUPPER.pad)
    for (let t=0;t<1;t+=.013){
      const q=legPose(leg,t,gait,true,24,-.32,1.4)
      assert.ok(Object.values(q).slice(0,3).every(Number.isFinite))
      const [x,y]=linkagePin(q.pitch+q.knee)
      const b=[x+PUPPER.upper*Math.sin(q.pitch),y-PUPPER.upper*Math.cos(q.pitch)]
      near(Math.hypot(b[0]-x,b[1]-y),.1235)
    }
  }
})
