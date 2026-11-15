# Scarlet finale comparison

A static Three.js comparison of GPT 6.1 Sol, GPT 6.2 Sol and Claude Opus 5.5, using the same SCP:SL 15.0 Surface geometry and “Final Action” soundtrack.

Open the site, choose a model and press Play. The player supports seeking, human/cult outcomes and a free-camera inspection mode. The shared map, libraries, soundtrack and exact ground-height cache are reused across all three versions.

The two Sol candidates were one-shot Pi runs at high reasoning effort. Opus was a tool-assisted reference agent at high effort. This compares the supplied configurations rather than isolating model quality under identical harnesses.

The site needs no build step. GitHub Pages publishes the repository root from `main`; `.nojekyll` keeps it as plain static files. All URLs are relative so project-site subpaths work.

## Credits

- Game geometry: SCP: Secret Laboratory by Northwood Studios, SurfaceZone_ArtPass 15.0, from the published lightweight map export. Game assets retain their original rights.
- Music: “Final Action” by 西蒙Leonardo, used with attribution. See `shared/assets/music-credit.txt`.
- Three.js and its loaders: MIT; see `shared/lib/LICENSE`.

No licence for the repository as a whole is implied for the game assets or soundtrack.
