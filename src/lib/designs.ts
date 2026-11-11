// Open-source robot builds referenced by the 3D viewer.
// Each entry cites a real community project (name, source URL, license).
// Models are procedural approximations of these designs, for learning.

export interface RobotDesign {
  id: 'pupper' | 'inmoov' | 'rover'
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
    source: 'https://github.com/StanfordPL/StanfordQuadruped',
    license: 'MIT',
    licenseUrl: 'https://github.com/StanfordPL/StanfordQuadruped/blob/master/LICENSE',
    blurb:
      'A 3D-printed, Raspberry Pi–powered quadruped walking robot. Twelve servos drive four 3-DoF legs; a trot gait keeps it stable by alternating diagonal pairs of legs.',
    principle: 'Legged locomotion & gait coordination',
    specs: [
      { label: 'Actuators', value: '12× servo (3 per leg)' },
      { label: 'Controller', value: 'Raspberry Pi + servo driver' },
      { label: 'Gait', value: 'Trot (diagonal pairs)' },
      { label: 'Frame', value: '3D-printed PLA' },
    ],
  },
  {
    id: 'inmoov',
    name: 'InMoov Arm',
    project: 'InMoov',
    source: 'https://github.com/InMoov/InMoov',
    license: 'CC BY-SA 4.0',
    licenseUrl: 'https://github.com/InMoov/InMoov/blob/master/LICENSE',
    blurb:
      'The world’s first open-source 3D-printed humanoid. The arm uses Dynamixel-style smart servos at each joint; this model shows the shoulder–elbow–wrist chain with a two-finger gripper.',
    principle: 'Serial manipulator kinematics',
    specs: [
      { label: 'Actuators', value: '6× smart servo (arm)' },
      { label: 'Frame', value: '3D-printed PLA' },
      { label: 'Control', value: 'Arduino Mega + MyRobotLab' },
      { label: 'End effector', value: '2-finger gripper' },
    ],
  },
  {
    id: 'rover',
    name: '2WD Rover',
    project: 'Open-hardware Arduino rover',
    source: 'https://github.com/arduino/arduino-examples',
    license: 'Open Hardware / CC0',
    licenseUrl: 'https://www.arduino.cc/en/Main/Policy',
    blurb:
      'The classic two-wheel-drive learning platform: two DC gear motors driven by an L298N H-bridge, a caster for balance, and an HC-SR04 ultrasonic sensor. This is the same class of robot as your physical build guide.',
    principle: 'Differential drive & sense-act feedback',
    specs: [
      { label: 'Actuators', value: '2× TT gear motor' },
      { label: 'Driver', value: 'L298N H-bridge' },
      { label: 'Sensor', value: 'HC-SR04 ultrasonic' },
      { label: 'Brain', value: 'Arduino Uno' },
    ],
  },
]
