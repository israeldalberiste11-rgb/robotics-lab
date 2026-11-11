// Discrete PID controller simulation: regulates a first-order plant toward a setpoint.
// This mirrors how a robot's control loop runs at a fixed tick rate.

export interface PIDState {
  integral: number
  prevError: number
}

export interface PIDGains {
  kp: number
  ki: number
  kd: number
}

// One control tick. plantTau = plant time constant (lower = faster plant).
export function pidStep(
  setpoint: number,
  measurement: number,
  gains: PIDGains,
  state: PIDState,
  dt: number,
  plantTau: number,
  prevOutput: number,
): { output: number; state: PIDState } {
  const error = setpoint - measurement
  const integral = state.integral + error * dt
  const derivative = (error - state.prevError) / dt
  const output = gains.kp * error + gains.ki * integral + gains.kd * derivative
  // First-order plant: output drives the measurement with lag tau.
  const nextMeasurement = measurement + ((output - measurement) / plantTau) * dt
  return {
    output: nextMeasurement,
    state: { integral, prevError: error },
  }
}

// Simulate N seconds of step response; return the value curve over time.
export function simulateResponse(
  gains: PIDGains,
  setpoint: number,
  seconds: number,
  dt = 0.02,
  plantTau = 0.5,
): { t: number; y: number }[] {
  let measurement = 0
  let output = 0
  let state: PIDState = { integral: 0, prevError: 0 }
  const out: { t: number; y: number }[] = []
  for (let i = 0; i <= Math.floor(seconds / dt); i++) {
    out.push({ t: i * dt, y: measurement })
    const r = pidStep(setpoint, measurement, gains, state, dt, plantTau, output)
    output = r.output
    state = r.state
    // anti-windup-ish clamp
    if (Math.abs(r.state.integral) > 50) state.integral = Math.sign(r.state.integral) * 50
  }
  return out
}
