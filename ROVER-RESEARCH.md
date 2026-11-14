# Mechanical research and asset decisions

## Audit before edits

| Priority | Confirmed in Rover Pro | Change |
| --- | --- | --- |
| 1 | The controller proxy was 98 × 130 mm, and the front sensor housing was 118 mm wide. The driver had no independent component. | Replaced the proxies with separate dimensioned boards and visible electrical components. |
| 2 | Breakdown moved a wheel and tire immediately. The exposed shaft was a separate visual proxy and the gearbox was not distinct. | Animated offsets for the actual modeled tire, hub assembly, shaft, bearing, gearbox, motor, bracket, upper deck and electronics. |
| 3 | Wheel selection paused playback and the inspector had no electronics readouts. | Wheel inspection can follow the rover during playback. The driver displays the active motor model’s signed command as an equivalent duty cycle. The ultrasonic inspector uses its own transducer-positioned range fan. |
| 4 | The package only contains the Differential Drive module. | The other robots were researched for later model integration. |

## Hardware references

| Component | Reference and use |
| --- | --- |
| Uno R3 | [Arduino Uno Rev3 documentation and CAD links](https://docs.arduino.cc/hardware/uno-rev3/). The board footprint is 68.6 × 53.4 mm. The procedural board includes the clipped outline, mounting holes, USB-B socket, barrel jack, DIP microcontroller, pin banks and passives. Exact pad and component placements are approximations. |
| TT motor | [Adafruit 3777 TT gearbox motor](https://www.adafruit.com/product/3777). Approximate envelope 70 × 22 × 18 mm, 1:48 ratio and 3–6 V rating. Used for the yellow split housing, can and proportion reference. Modeled shaft, extension and bracket are custom to the larger teaching chassis. No internal gear tooth simulation. |
| Wheel, chassis and caster | [Adafruit two-motor chassis build](https://cdn-learn.adafruit.com/downloads/pdf/circuitpython-ble-crickit-rover.pdf) and [Pololu 19.05 mm ball caster](https://www.pololu.com/product/955). Reference for a two-drive-wheel layout with passive support and a four-cell holder. Rover Pro retains its original 164 mm wheel diameter, 320 mm nominal track and oversized caster for saved experiments. This is a hybrid educational chassis with full-size electronics, not a kit CAD assembly or fabrication drawing. |
| Motor driver | [ST L298 dual full bridge](https://www.st.com/en/motor-drivers/l298.html) and [HandsOn Technology module drawing](https://handsontec.com/dataspecs/module/L298N%20Motor%20Driver.pdf). Uses that module’s 43 × 43 mm PCB size, finned heat sink and power/motor terminals. Board vendors vary. PWM is normalized simulated demand, not a hardware timing or current measurement. |
| Ultrasound | [ITEAD HC-SR04 datasheet and mechanical drawing](https://www.edn.com/electroschematics/wp-content/uploads/2013/07/HC-SR04-datasheet-version-2.pdf). Uses the drawing’s 43 × 20 mm board footprint. The inspector samples circular course obstacles with a planar ±7.5° fan and 4 m cap. It models neither acoustic propagation nor the exact visible mesh surfaces. Autonomy retains the existing wider navigation range fan. |

## CAD and future models

- [Stanford Pupper v1 official mechanical design](https://pupper.readthedocs.io/en/latest/reference/design.html) links the Fusion 360 assembly and power board. The [controller repository](https://github.com/stanfordroboticsclub/StanfordQuadruped) is a separate source for the three actuated joints per leg and gait logic. Pin the mechanical generation and confirm the CAD redistribution terms before a web export.
- [InMoov assembly resources](https://inmoov.fr/assembly-help/) document the shoulder, bicep, wrist, hand, and tendons. The [official download resources](https://inmoov.fr/download/) identify original printable files with noncommercial terms. Verify each part and permission for the intended distribution before converting an STL set.
- [ABB IRB 120 product specification](https://library.e.abb.com/public/fa82ab8ad5af4afda717246ffe97fc78/3HAC035960%20PS%20IRB%20120-en.pdf) provides a six-axis, 580 mm reach, 3 kg payload reference. [ROS-Industrial support](https://index.ros.org/p/abb_irb120_support/) identifies the robot-description and mesh package to review. Use the actual joint origins and limits from a verified revision before binding the visual hierarchy to FK/IK.
- Official Arduino CAD and the open robot asset repositories were evaluated as candidates. No complete verified CAD assembly was retrieved and converted for this release. All shipped geometry is original procedural geometry. No third-party CAD, STL, GLB, or textures are bundled.
