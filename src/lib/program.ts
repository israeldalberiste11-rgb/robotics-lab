// Wheel speeds are metres per second. Durations are simulation seconds.
export interface Instruction { line:number; left:number; right:number; seconds:number }
export const EXAMPLE = 'DRIVE 0.30 0.30 2\nDRIVE -0.20 0.20 1\nWAIT 0.5\nDRIVE 0.30 0.45 2'
const decimal = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)$/

export function parseProgram(source:string): Instruction[] {
  if (source.length>12000) throw new Error('Program exceeds 12,000 characters.')
  const result:Instruction[]=[]
  let elapsed=0
  source.split(/\r?\n/).forEach((text,index)=>{
    const body=text.split('#',1)[0].trim()
    if (!body) return
    const [opcode,...args]=body.split(/\s+/)
    const line=index+1
    const fail=(message:string):never=>{throw new Error(`Line ${line}: ${message}`)}
    const count=opcode==='DRIVE'?3:opcode==='WAIT'?1:0
    if (!count || args.length!==count || args.some(value=>!decimal.test(value))) fail('Use DRIVE left right seconds or WAIT seconds.')
    const [left,right,seconds]=opcode==='DRIVE'?args.map(Number):[0,0,Number(args[0])]
    if (Math.abs(left)>.65 || Math.abs(right)>.65) fail('Wheel speed must be between −0.65 and 0.65 m/s.')
    if (seconds<.02 || seconds>20) fail('Duration must be between 0.02 and 20 seconds.')
    if (Math.abs(seconds/.02-Math.round(seconds/.02))>1e-8) fail('Duration must be a multiple of 0.02 seconds.')
    elapsed+=seconds
    if (result.length>=100 || elapsed>120) fail('Limit: 100 commands and 120 seconds.')
    result.push({line,left,right,seconds})
  })
  if (!result.length) throw new Error('Add at least one command.')
  return result
}
