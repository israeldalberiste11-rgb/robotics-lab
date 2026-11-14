import { useEffect, useMemo } from 'react'
import { CanvasTexture, SRGBColorSpace } from 'three'

export function UnoSilkscreen({chip=false}:{chip?:boolean}) {
  const texture = useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 1024
    canvas.height = 768
    const ctx = canvas.getContext('2d')!
    ctx.scale(1024/68.6,768/53.4)
    ctx.lineWidth = .13
    ctx.strokeStyle = '#459ace'
    for (let i=0;i<26;i++) {
      const x=16+i*1.57, y=14+(i%6)*2
      ctx.beginPath()
      ctx.moveTo(x, i%2 ? 5 : 48)
      ctx.lineTo(x,y+3)
      ctx.lineTo(x+3,y)
      ctx.lineTo(x+5,y)
      ctx.stroke()
      ctx.beginPath()
      ctx.arc(x+5,y,.28,0,Math.PI*2)
      ctx.stroke()
    }
    ctx.fillStyle = '#e6f4f5'
    const label = (value:string,x:number,y:number,size=1.25) => {
      ctx.font = '600 '+size+'px monospace'
      ctx.fillText(value,x,y)
    }
    label('UNO',45,16,5)
    label('ARDUINO',31,20,2.8)
    label('DIGITAL (PWM~)',36,10)
    label('POWER',29,45)
    label('ANALOG IN',50,45)
    label('RESET',4,10)
    label('TX  RX',20,17)
    label('ON',59,21)
    label('ICSP',62,28)
    label('R3',61,41)
    const pins = (names:string[], x:number, y:number) => names.forEach((name,i)=>{
      ctx.save()
      ctx.translate(x+i*2.54,y)
      ctx.rotate(-Math.PI/2)
      label(name,0,0,1.07)
      ctx.restore()
    })
    pins(['AREF','GND','13','12','~11','~10','~9','8'],24.4,9)
    pins(['7','~6','~5','4','~3','2','TX1','RX0'],46.3,8.3)
    pins(['IOREF','RESET','3.3V','5V','GND','GND','VIN'],25.84,48)
    pins(['A0','A1','A2','A3','A4','A5'],46.3,48)
    if (chip) {
      ctx.clearRect(0,0,68.6,53.4)
      ctx.fillStyle='#adb0b4'
      label('MICROCHIP',8,23,8)
      label('ATMEGA328P-PU',8,36,5.4)
    }
    const map = new CanvasTexture(canvas)
    map.colorSpace = SRGBColorSpace
    map.anisotropy = 8
    return map
  }, [chip])
  useEffect(() => () => texture.dispose(),[texture])
  return <mesh position={chip?[.011,.00774,.008]:[0,.00166,0]} rotation-x={-Math.PI/2} raycast={()=>null}>
    <planeGeometry args={chip?[.032,.007]:[.0686,.0534]}/>
    <meshStandardMaterial map={texture} alphaTest={.15} roughness={.59} polygonOffset polygonOffsetFactor={-1}/>
  </mesh>
}
