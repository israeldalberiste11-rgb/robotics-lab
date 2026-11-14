export interface DriveExperiment {
  left:number; right:number; track:number; speed:number; program:string
  motor:'Ideal'|'Open loop'|'PID'; kp:number; ki:number; kd:number
}
export interface Result { distance:number; x:number; y:number; heading:number }
export interface SavedRun { configuration:DriveExperiment; result:Result }
export const RUN_KEY='robotics-lab.drive-runs.v1'

export function readRuns(raw:string|null):SavedRun[] {
  if (!raw) return []
  try {
    const data:unknown=JSON.parse(raw)
    if (!Array.isArray(data)) return []
    return data.filter((entry):entry is SavedRun=>{
      const c=entry?.configuration, r=entry?.result
      return Boolean(c&&r&&[c.left,c.right,c.track,c.speed,c.kp,c.ki,c.kd,r.distance,r.x,r.y,r.heading].every(Number.isFinite)
        && Math.abs(c.left)<=.65 && Math.abs(c.right)<=.65 && c.track>=.25 && c.track<=.49
        && [.25,.5,1,1.5,2].includes(c.speed) && ['Ideal','Open loop','PID'].includes(c.motor)
        && c.kp>=0&&c.kp<=4&&c.ki>=0&&c.ki<=9&&c.kd>=0&&c.kd<=.14
        && typeof c.program==='string' && c.program.length<=12000 && r.distance>=0)
    }).slice(0,5)
  } catch { return [] }
}
