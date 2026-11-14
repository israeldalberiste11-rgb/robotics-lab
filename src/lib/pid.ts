// First-order plant with piecewise-constant actuator effort per simulation tick.
export interface PIDState { integral: number; prevError: number; measurement?: number }
export interface PIDGains { kp:number; ki:number; kd:number }

export function pidStep(setpoint:number, measurement:number, gains:PIDGains, state:PIDState,
  dt:number, plantTau:number, effortLimit = Infinity) {
  if (!(dt>0 && plantTau>0)) return { output:measurement,state,command:0 }
  const error = setpoint-measurement
  const derivative = state.measurement === undefined ? 0 : -(measurement-state.measurement)/dt
  const base = gains.kp*error+gains.kd*derivative
  const candidate = state.integral+error*dt
  const effort = base+gains.ki*candidate
  const saturated = Math.abs(effort)>effortLimit && Math.sign(effort)===Math.sign(error)
  const integral = gains.ki===0 ? 0 : saturated ? state.integral : candidate
  const command = Math.max(-effortLimit,Math.min(effortLimit,base+gains.ki*integral))
  return {
    output:measurement+(command-measurement)*(-Math.expm1(-dt/plantTau)),
    command,
    state:{integral,prevError:error,measurement},
  }
}

export function simulateResponse(gains:PIDGains,setpoint:number,seconds:number,dt=.02,plantTau=.5) {
  let measurement=0
  let state:PIDState={integral:0,prevError:0}
  const samples:{t:number;y:number}[]=[]
  if (!Number.isFinite(seconds) || seconds<0 || !Number.isFinite(dt) || dt<=0) return samples
  for(let i=0;i<=Math.min(100000,Math.floor(seconds/dt));i++){
    samples.push({t:i*dt,y:measurement})
    const next=pidStep(setpoint,measurement,gains,state,dt,plantTau,Math.max(1,2*Math.abs(setpoint)))
    measurement=next.output
    state=next.state
  }
  return samples
}

export function settlingTime(samples:{t:number;y:number}[],target:number,tolerance:number) {
  if (!samples.length) return null
  let lastOutside=-1
  samples.forEach(({y},i)=>{ if(Math.abs(y-target)>tolerance) lastOutside=i })
  return samples[lastOutside+1]?.t ?? null
}
