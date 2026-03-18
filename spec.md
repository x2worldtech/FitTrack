# FitTrack

## Current State
FitTrack is a fitness tracker with calendar, hydration tracking, supplement tracking (creatine/protein), and statistics. Two bugs are reported:
1. Supplement gram values (creatine/protein) not appearing in statistics dashboard
2. Hydration menu always shows "Loading-Failed" error

## Requested Changes (Diff)

### Add
- Graceful error handling in hydration goal query (return 0 instead of error state)

### Modify
- `useHydrationGoal` query: catch backend errors, return `BigInt(0)` as fallback so goal-setting form shows instead of error
- `useHydrationHistory`, `useWaterIntake`: use direct actor calls (not HydrationActor cast)
- `StatisticsScreen`: count creatineGrams/proteinGrams from ALL entries where value > 0, not just those with creatine/protein boolean = true; add explicit BigInt-to-number conversion
- `DaySheet`: always save creatineGrams/proteinGrams even when boolean is false, so data is preserved

### Remove
- `staleTime: Number.POSITIVE_INFINITY` from hydration goal query (replace with 60_000)

## Implementation Plan
1. Fix `useHydrationGoal` queryFn: wrap backend call in try/catch, return 0 on any error
2. Remove `staleTime: POSITIVE_INFINITY`, set to 60_000
3. Fix supplement stats: sum creatineGrams/proteinGrams from entries where the respective gram value > 0
4. Ensure all BigInt conversions are explicit in statistics
