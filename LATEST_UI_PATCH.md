# Latest UI checkpoint

The matching complete build uses parkour focus mode. While a run is active, all fishing, inventory, tutorial, challenge and leaderboard UI is hidden. Only the timer and **END RUN** control remain visible.

The key renderer behavior is:

```tsx
export const uiMenu = () => {
  if (isParkourRunActive()) {
    return (
      <UiEntity uiTransform={{ width: '100%', height: '100%', positionType: 'absolute' }}>
        {parkourTimerHud()}
      </UiEntity>
    )
  }

  return (
    <UiEntity uiTransform={{ width: '100%', height: '100%', positionType: 'absolute' }}>
      {quickActionMenu()}
      {moreOptionsMenu()}
      {topStatusBar()}
      {catchPanel()}
      {inventoryBackdrop()}
      {inventoryPanel()}
      {levelUpNotification()}
      {outOfEnergyPopup()}
      {prototypeNotice()}
      {leaderboardPanel()}
      {parkourLeaderboardPanel()}
      {parkourResultPanel()}
      {dailyChallengePanel()}
      {tutorialPanel()}
      {dailyChallengeToastPanel()}
      {parkourToastPanel()}
    </UiEntity>
  )
}
```

The complete `src/ui.tsx` is preserved in the Builder ZIP identified in `BACKUP_MANIFEST.md`.
