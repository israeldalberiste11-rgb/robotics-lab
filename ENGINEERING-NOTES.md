# Robotics Lab engineering notes

## Phase 1 · Audit and numerical fixes

| Priority | Confirmed in source | Change |
| --- | --- | --- |
| P0 | PID was excluded from the module selector. | Restored the sixth module and applied the lab theme to its controls and chart. |
| P0 | The PID controller could wind up while rover speed was clamped after integration. Its settling metric reported the first entry into tolerance. | Bound actuator effort before stepping the plant, added conditional integration and derivative on measurement, and report sustained settling within the recorded window. |
| P1 | A* checked the goal but did not explicitly reject an occupied start. Sensor range was fixed. | Reject invalid endpoints and expose range and bounded distance error in Sense–Think–Act. |
| P1 | No repeatable regression command. | Added `npm test` for FK, IK, differential drive, PID, navigation, sensor behavior, program parsing, and saved-run validation. |

## Phase 2 · Experiments

Differential Drive now has a prediction check, local saved configurations with results, and CSV export. Restore loads the selected configuration at the start. Saved comparisons use distance and endpoint; CSV includes heading in radians. The library retains five snapshots in the current browser profile.

The Programming panel interprets a line-based wheel command API. There is no JavaScript evaluation, network command, loop, or filesystem command. `DRIVE left right seconds` sets wheel-speed goals in m/s, `WAIT seconds` commands zero wheel speed, and `#` starts a comment. Timing uses 20 ms increments. Commands go through the selected motor model, so measured velocity may lag the setpoint. The example, active line, and parser errors are shown in the panel.

## Verification and limits

Run `npm ci`, `npm test`, and `npm run build` in the project directory. The standalone HTML also runs directly in a WebGL-capable browser.

Engineering positions are metres with Z up, mapped to Three.js as (x, z, −y). Arm controls display degrees. Differential-drive integration and rates use radians, metres, and seconds. Existing fixed-step playback, camera controls, and robot hierarchies remain shared where already implemented.

Navigation uses a known map with circular obstacle envelopes and a planar rover. Simulated rays have no false detections or material effects. Range error is deterministic and bounded. Physical models are procedural educational approximations. The existing component references are retained; external dimensions and hardware specifications were not revalidated.

Browser QA for all six modules, including rendering, cameras, keyboard and pointer input, responsiveness, accessibility, and performance, remains pending. Broader mechanical reconstruction, a unified engine across all modules, and guided labs and saved experiments outside Differential Drive remain follow-up work.

## Integrated Rover Pro

Open `Robotics-Lab.html` for all six modules. In Differential Drive, open Engineering Inspector to inspect the electronics or use Mechanical Breakdown to explode the assembly. 3D Builds → 2WD Rover and Sense–Think–Act use the same updated model. See ROVER-RESEARCH.md for hardware sources and approximations. Install with `npm ci`, then use `npm run dev` for source development.
