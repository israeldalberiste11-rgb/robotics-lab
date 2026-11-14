# Robotics Lab

Open `Robotics-Lab.html` in a WebGL-capable browser for the full six-module app. For source development, run `npm ci`, `npm test`, and `npm run dev`. Use **3D Builds** to switch between Stanford Pupper and the 2WD Rover. Open **Engineering Inspector → Mechanical Breakdown** to separate either assembly. In **Differential Drive**, select a wheel or electronic component for live rover readouts.

## Mechanical model revision

| Robot | Before | Current |
| --- | --- | --- |
| Stanford Pupper | Solid rectangular body and two planar joints with an apparent motor at the knee | Two thin routed decks, cutout side rails, standoffs, exposed controller tray, three hip-mounted servo representations per leg, separate carbon links, and a driven knee rod |
| Arduino 2WD Rover | Rounded stacked plates, independent bar spokes, and full-width bumper | Contoured upper and lower plates with through-openings, one-piece pocketed hubs, separate shaft-clearance brackets and split bumper, with the Uno, L298N, ultrasonic module, wiring and battery retained |

Stanford Pupper v1 is the reference. Stanford’s [assembly guide](https://pupper.readthedocs.io/en/latest/guide/assembly.html) gives the upper link and extension rod’s **123.5 mm center spacing** and describes the parallel linkage. The [mechanical design page](https://pupper.readthedocs.io/en/latest/reference/design.html) links the Fusion assembly, and the [controller repository](https://github.com/stanfordroboticsclub/StanfordQuadruped) documents the 12-servo platform. The linked Fusion model could not be retrieved for conversion, and its redistribution terms were not established. No official STEP, STL, or URDF is bundled. The lower link length, lateral offset, deck contours, servo bodies, pitch limits, and gait are educational approximations. There is no contact or torque solver.

See [ROVER-RESEARCH.md](ROVER-RESEARCH.md) for the Arduino mechanical references. The rover uses [Adafruit’s 70 × 22 × 18 mm TT reference](https://www.adafruit.com/product/3777) and modeled Uno, L298N and HC-SR04 board footprints. The chassis and wheel dimensions retain the teaching simulator’s original 164 mm tires and 320 mm nominal track. That keeps the simulator’s wheel speeds and prior experiment configurations consistent. These dimensions are for this lab model and should not be used as kit specifications.

## Parametric parts and integration

- `cad/profiles.mjs` defines the millimetre profiles, holes, pockets, material colors and thicknesses. Run `node cad/export.mjs` after changing a profile. This creates `src/assets/mechanical-parts.glb` with individual named, indexed meshes in metres. Circular holes are tessellated in GLB.
- `cad/export_step.py` uses the same profiles and true circular holes to build separate solid bodies. With CadQuery installed, run `python cad/export_step.py`. Only the profiled structural components have CAD solids.
- `src/lib/pupper.ts` provides the Pupper pivot locations, leg lengths and gait angles. The React hierarchy is body → roll pivot (+X) → lateral offset → hip pitch (+Z) → knee pitch (+Z) → foot. The servo horn and knee link share the absolute pitch-plus-knee angle to maintain a constant-length drive rod.
- `src/modules/models/PupperAssembly.tsx` assembles the named components and binds motion and picking. `src/sim/Rover.tsx` assembles the rover and retains separate wheel axes, sensor geometry, and component selection. The runtime hierarchy lives in the React components. The GLB contains reusable solids, rather than a baked animated robot.
- Preserve the `src/assets` folder when integrating into MEL or another Vite project. `npm run build` produces `dist/`. The bundled HTML embeds the GLB and requires no external model download.

## Verification

The production build and twelve automated tests passed. The mesh test loads every GLB part with Three.js, checks dimensions, and checks that each geometric edge has two incident faces. The linkage test checks neutral ground reach and constant rod length across both gaits. CadQuery 2.8 exported eight individual STEP solids after checking their validity. Browser startup failed in the execution environment. Front, side, top and isometric browser renders, interactive camera checks and frame-rate measurements remain unverified.
