import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { DayEntry } from "../backend.d.ts";
import { useActor } from "./useActor";

interface HydrationRecord {
  date: string;
  totalMl: bigint;
}

interface HydrationActor {
  saveHydrationGoal(goalMl: bigint): Promise<void>;
  getHydrationGoal(): Promise<bigint>;
  addWaterIntake(date: string, amount: bigint): Promise<bigint>;
  getWaterIntake(date: string): Promise<bigint>;
  getHydrationHistory(): Promise<HydrationRecord[]>;
}

interface ExtendedDayEntry extends DayEntry {
  creatineGrams?: bigint;
  proteinGrams?: bigint;
}

export function useGetAllEntries() {
  const { actor, isFetching } = useActor();
  return useQuery<ExtendedDayEntry[]>({
    queryKey: ["entries"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllEntries() as Promise<ExtendedDayEntry[]>;
    },
    enabled: !!actor && !isFetching,
    staleTime: 30_000,
  });
}

export function useSaveDayEntry() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      date,
      trained,
      restDay,
      muscleGroups,
      creatine,
      protein,
      creatineGrams,
      proteinGrams,
    }: {
      date: string;
      trained: boolean;
      restDay: boolean;
      muscleGroups: string[];
      creatine: boolean;
      protein: boolean;
      creatineGrams: number;
      proteinGrams: number;
    }) => {
      if (!actor) throw new Error("No actor");
      await (actor as any).saveDayEntry(
        date,
        trained,
        restDay,
        muscleGroups,
        creatine,
        protein,
        BigInt(creatineGrams),
        BigInt(proteinGrams),
      );
    },
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey: ["entries"] });
      const previous = queryClient.getQueryData(["entries"]);
      queryClient.setQueryData<ExtendedDayEntry[]>(["entries"], (old) => {
        const entries = old ?? [];
        const updated: ExtendedDayEntry = {
          date: variables.date,
          trained: variables.trained,
          restDay: variables.restDay,
          muscleGroups: variables.muscleGroups,
          creatine: variables.creatine,
          protein: variables.protein,
          creatineGrams: BigInt(variables.creatineGrams),
          proteinGrams: BigInt(variables.proteinGrams),
        };
        const idx = entries.findIndex((e) => e.date === variables.date);
        if (idx >= 0)
          return entries.map((e) => (e.date === variables.date ? updated : e));
        return [...entries, updated];
      });
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous)
        queryClient.setQueryData(["entries"], context.previous);
    },
    onSuccess: (_data, variables) => {
      queryClient.setQueryData<ExtendedDayEntry[]>(["entries"], (old) => {
        const entries = old ?? [];
        const idx = entries.findIndex((e) => e.date === variables.date);
        const updated: ExtendedDayEntry = {
          date: variables.date,
          trained: variables.trained,
          restDay: variables.restDay,
          muscleGroups: variables.muscleGroups,
          creatine: variables.creatine,
          protein: variables.protein,
          creatineGrams: BigInt(variables.creatineGrams),
          proteinGrams: BigInt(variables.proteinGrams),
        };
        if (idx >= 0)
          return entries.map((e) => (e.date === variables.date ? updated : e));
        return [...entries, updated];
      });
    },
  });
}

export function useHydrationGoal() {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["hydrationGoal"],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return (actor as unknown as HydrationActor).getHydrationGoal();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useSaveHydrationGoal() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goalMl: number) => {
      if (!actor) throw new Error("No actor");
      await (actor as unknown as HydrationActor).saveHydrationGoal(
        BigInt(goalMl),
      );
    },
    onMutate: async (goalMl) => {
      await queryClient.cancelQueries({ queryKey: ["hydrationGoal"] });
      const previous = queryClient.getQueryData(["hydrationGoal"]);
      queryClient.setQueryData(["hydrationGoal"], BigInt(goalMl));
      return { previous };
    },
    onError: (_err, _vars, context: any) => {
      if (context?.previous !== undefined)
        queryClient.setQueryData(["hydrationGoal"], context.previous);
    },
    onSuccess: (_data, goalMl) => {
      queryClient.setQueryData(["hydrationGoal"], BigInt(goalMl));
    },
  });
}

export function useWaterIntake(date: string) {
  const { actor, isFetching } = useActor();
  return useQuery<bigint>({
    queryKey: ["waterIntake", date],
    queryFn: async () => {
      if (!actor) return BigInt(0);
      return (actor as unknown as HydrationActor).getWaterIntake(date);
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAddWaterIntake() {
  const { actor } = useActor();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ date, amount }: { date: string; amount: number }) => {
      if (!actor) throw new Error("No actor");
      return (actor as unknown as HydrationActor).addWaterIntake(
        date,
        BigInt(amount),
      );
    },
    onMutate: async ({ date, amount }) => {
      await queryClient.cancelQueries({ queryKey: ["waterIntake", date] });
      const previous = queryClient.getQueryData(["waterIntake", date]);
      queryClient.setQueryData<bigint>(
        ["waterIntake", date],
        (old) => (old ?? BigInt(0)) + BigInt(amount),
      );
      return { previous };
    },
    onError: (_err, { date }, context: any) => {
      if (context?.previous !== undefined)
        queryClient.setQueryData(["waterIntake", date], context.previous);
    },
    onSuccess: (newTotal, { date }) => {
      queryClient.setQueryData(["waterIntake", date], newTotal);
    },
  });
}

export function useHydrationHistory() {
  const { actor, isFetching } = useActor();
  return useQuery<HydrationRecord[]>({
    queryKey: ["hydrationHistory"],
    queryFn: async () => {
      if (!actor) return [];
      return (actor as unknown as HydrationActor).getHydrationHistory();
    },
    enabled: !!actor && !isFetching,
  });
}
