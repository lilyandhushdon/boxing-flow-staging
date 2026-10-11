# Boxing Flow

Boxing round timer and coach.

- `index.html`: home page
- `app.html`: the workout app
- `models/`: the 3D coaches (`coach.glb`, black and gold; `coach-her.glb`, black and gold, picked with the coach button in interactive mode; `coach-lite.glb`, a lighter copy for the landing page preview) and their moves (Mixamo, all orthodox)
- `music/` and `crowd/`: audio the app plays

## What the coach shows (single source of truth)

Two tables in `app.html` decide everything, and nothing else picks files:

1. **The drill list (`FOCUS`)**: every drill lists its own moves, in order, plus an optional speed. Example: `['Jab, Jab, Cross', '...', ['jab','jab','cross']]`.
2. **The move library (`MOVE_LIBRARY`)**: every move names the one file that shows it (below).

To change a drill, edit its moves in the drill list. To change how a move looks, edit its file in the move library. Nothing is ever mirrored (a mirrored clip would be southpaw).

| Move | File in `models/` |
|---|---|
| Stance between moves | `stance.fbx` |
| Jab | `jab.fbx` |
| Cross (straight right) | `cross-straight-right.fbx` |
| Lead hook (the 3) | `hook-lead.fbx` |
| Lead uppercut | `uppercut-lead.fbx` |
| Rear hook | `body-hook-rear.fbx` (no rear head-hook file yet) |
| Rear uppercut | `body-uppercut-rear.fbx` (no rear head-uppercut file yet) |
| Jab to the body | `jab.fbx`, knees bent so it lands low |
| Cross to the body | `cross-straight-right.fbx`, knees bent |
| Lead hook to the body | `body-hook-lead.fbx` |
| Rear hook to the body | `body-hook-rear.fbx` |
| Uppercut to the body | `body-uppercut-rear.fbx` |
| 1-2 | `combo-1-2.fbx` (whole) |
| 1-2-1-2 | `combo-1-2-1-2.fbx` (whole) |
| Body jab-cross | `body-jab-cross.fbx` (whole) |
| Slip left | `slip-left.fbx` |
| Step back / step out / pull back | `step-back.fbx` |
| Pivot | `pivot-right.fbx` |
| Switch | `pivot-left.fbx` |
| Slip right, roll, high guard, catch, parry, lateral shuffle, squat | built in code (no file) |

## Publish on GitHub Pages

1. Upload everything in this folder to the root of a GitHub repository.
2. In the repository, open **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, pick `main` and `/ (root)`, then **Save**.
4. After a minute or two the site is live at `https://<your-username>.github.io/<repository-name>/`.

3D coach animations from Mixamo. Music: "No Turning Back" by BearStockMusic, "Not My First Rodeo" by 331music, "Gym Music" by Gr0za. Crowd sound by u_xg7ssi08yr.
