# Parkour smart trigger setup

The scene uses the two Trigger Area smart items already placed in Creator Hub.

- Start entity: `PARKOUR_START`
- Finish entity: `PARKOUr_FINISH`

The code also supports the corrected finish spelling `PARKOUR_FINISH`.

Both items must include a `Player Enters Area` trigger. Assigned Actions may remain empty.

During a run, the timer HUD includes an `END RUN` button. Ending a run cancels the active server attempt and does not submit a leaderboard score.
