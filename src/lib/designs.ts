// Open-source robot builds referenced by the 3D viewer.
// Each entry cites a real community project (name, source URL, license).
// Models are procedural approximations of these designs, for learning.

export interface RobotDesign {
  id: 'pupper' | 'rover'
  name: string
  project: string
  source: string
  license: string
  licenseUrl: string
  blurb: string
  principle: string
  specs: { label: string; value: string }[]
}

export const DESIGNS: RobotDesign[] = [
  {
    id: 'pupper',
    name: 'Stanford Pupper',
    project: 'Stanford Quadruped',
    source: 'https://github.com/stanfordroboticsclub/StanfordQuadruped',
    license: 'MIT',
    licenseUrl: 'https://github.com/stanfordroboticsclub/StanfordQuadruped/blob/master/LICENSE',
    blurb:
      'A 3D-printed, Raspberry Pi–powered quadruped walking robot. Twelve servos drive four 3-DoF legs; a trot gait keeps it stable by alternating diagonal pairs of legs.',
    principle: 'Legged locomotion & gait coordination',
    specs: [
      { label: 'Actuators', value: '12× servo (3 per leg)' },
      { label: 'Controller', value: 'Raspberry Pi + servo driver' },
      { label: 'Gait', value: 'Trot (diagonal pairs)' },
      { label: 'Frame', value: 'Carbon plates and printed mounts' },
    ],
  },
  {
    id: 'rover',
    name: '2WD Rover',
    project: 'Arduino 2WD educational platform',
    source: 'https://docs.arduino.cc/hardware/uno-rev3/',
    license: 'Arduino hardware reference',
    licenseUrl: 'https://www.arduino.cc/en/Main/Policy',
    blurb:
      'The classic two-wheel-drive learning platform: two DC gear motors driven by an L298N H-bridge, a caster for balance, and an HC-SR04 ultrasonic sensor. This example illustrates how the components fit together.',
    principle: 'Differential drive & sense-act feedback',
    specs: [
      { label: 'Actuators', value: '2× TT gear motor' },
      { label: 'Driver', value: 'L298N H-bridge' },
      { label: 'Sensor', value: 'HC-SR04 ultrasonic' },
      { label: 'Brain', value: 'Arduino Uno' },
    ],
  },
]
