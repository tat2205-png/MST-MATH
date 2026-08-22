# Camera Director

## Principle

Camera motion is a narrative system, not decoration.

## Shot states

- OVERVIEW: establish structure.
- TRAVEL: move between knowledge regions.
- FOCUS: center the target.
- PUSH_IN: enlarge the target.
- SETTLE: decelerate and stabilize.
- READ: hold camera for learner comprehension.
- PULL_OUT: restore context.

## Default sequence

`OVERVIEW -> TRAVEL -> FOCUS -> PUSH_IN -> SETTLE -> READ -> PULL_OUT`

## Implementation pattern

Centralize camera movement in a reusable helper. Do not scatter raw frame animations throughout lesson logic.

Example concept:

```python
class CameraDirector:
    def __init__(self, scene):
        self.scene = scene
        self.frame = scene.camera.frame

    def move_to(self, target, width, run_time=1.6, rate_func=None):
        anim = self.frame.animate.move_to(target).set(width=width)
        self.scene.play(anim, run_time=run_time, rate_func=rate_func)
```
