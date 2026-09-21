"""Strip the flat navy studio background from the 3D brand renders.

    python3 scripts/strip-bg.py public/assets/icon-shield.png
    python3 scripts/strip-bg.py --clear-holes public/assets/icon-lock.png

Flood-fills inward from the image border, so navy shapes *inside* an object are
left alone — several icons use navy as a design colour, such as the engraved
check on the verified coin. Pass --clear-holes for renders where an enclosed
navy region is a genuine see-through gap, like the padlock shackle arch. Either
way each anti-aliased rim is un-blended so no navy fringe survives.
"""

import sys
from pathlib import Path

import numpy as np
from PIL import Image

# Colour distance (0-255 RGB space) treated as pure backdrop vs. object edge.
HARD_TOL = 42.0
SOFT_TOL = 82.0


def backdrop_colour(rgb: np.ndarray) -> np.ndarray:
    edges = np.concatenate([rgb[0], rgb[-1], rgb[:, 0], rgb[:, -1]], axis=0)
    return np.median(edges, axis=0)


def flood(candidate: np.ndarray, seed: np.ndarray) -> np.ndarray:
    """Pixels of `candidate` 4-connected to `seed`."""
    region = seed & candidate
    while True:
        grown = region.copy()
        grown[1:] |= region[:-1]
        grown[:-1] |= region[1:]
        grown[:, 1:] |= region[:, :-1]
        grown[:, :-1] |= region[:, 1:]
        grown &= candidate
        if np.array_equal(grown, region):
            return region
        region = grown


def border_seed(shape: tuple[int, int]) -> np.ndarray:
    seed = np.zeros(shape, dtype=bool)
    seed[0] = seed[-1] = True
    seed[:, 0] = seed[:, -1] = True
    return seed


def strip(path: Path, clear_holes: bool) -> str:
    source = Image.open(path).convert("RGBA")
    data = np.asarray(source).astype(np.float64)
    rgb, alpha = data[..., :3], data[..., 3]

    backdrop = backdrop_colour(rgb)
    distance = np.sqrt(((rgb - backdrop) ** 2).sum(axis=2))

    near = distance <= SOFT_TOL
    flat = distance <= HARD_TOL

    removable = flood(near, border_seed(distance.shape))
    holes = np.zeros_like(removable)
    if clear_holes:
        holes = flood(near, flat & ~removable)
        removable = removable | holes

    coverage = np.clip((distance - HARD_TOL) / (SOFT_TOL - HARD_TOL), 0.0, 1.0)
    coverage = np.where(removable, coverage, 1.0)

    # Un-blend the rim: observed = c*fg + (1-c)*backdrop, so recover fg.
    rim = removable & (coverage > 0.0)
    weight = np.where(rim, coverage, 1.0)[..., None]
    recovered = (rgb - (1.0 - weight) * backdrop) / weight
    rgb = np.where(rim[..., None], np.clip(recovered, 0.0, 255.0), rgb)

    out = np.dstack([rgb, alpha * coverage]).round().astype(np.uint8)
    Image.fromarray(out, "RGBA").save(path, "PNG", optimize=True)

    return (
        f"{path.name:24s} backdrop={tuple(int(v) for v in backdrop)} "
        f"cleared={float((coverage == 0.0).mean() * 100.0):.1f}% "
        f"holes={int(holes.sum())}px"
    )


def main() -> None:
    args = sys.argv[1:]
    clear_holes = "--clear-holes" in args
    targets = [Path(arg) for arg in args if not arg.startswith("--")]
    if not targets:
        raise SystemExit("usage: strip-bg.py [--clear-holes] <image.png> [...]")
    for target in targets:
        print(strip(target, clear_holes))


if __name__ == "__main__":
    main()
