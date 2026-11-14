"""Optional CadQuery solid export. Run after installing CadQuery."""
import json
from pathlib import Path
import subprocess
import cadquery as cq

root = Path(__file__).resolve().parent
source = "import { profiles } from './profiles.mjs'; console.log(JSON.stringify(profiles))"
profiles = json.loads(subprocess.check_output(["node", "--input-type=module", "-e", source], cwd=root))
output = root / "step"
output.mkdir(exist_ok=True)
for name, spec in profiles.items():
    depth = spec["thickness"]
    solid = cq.Workplane("XY", origin=(0, 0, -depth / 2)).polyline(spec["outline"]).close().extrude(depth)
    for points in spec["cutouts"]:
        tool = cq.Workplane("XY", origin=(0, 0, -depth)).polyline(points).close().extrude(depth * 2)
        solid = solid.cut(tool)
    for hole in spec["holes"]:
        tool = cq.Workplane("XY", origin=(0, 0, -depth)).center(hole["x"], hole["y"]).circle(hole["r"]).extrude(depth * 2)
        solid = solid.cut(tool)
    assert len(solid.solids().vals()) == 1 and solid.val().isValid(), name
    cq.exporters.export(solid, str(output / f"{name}.step"))
