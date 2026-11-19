import {
  keepPreviousData,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { ApiError, authApi, communityApi, signalApi } from "./client";
import type { Community, SignalFilters } from "./types";

export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return (await authApi.me()).data;
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) return null;
        throw error;
      }
    },
    staleTime: 60_000,
    retry: false,
  });
}

export function useLogin() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ user }) => {
      client.clear();
      client.setQueryData(["me"], user);
    },
  });
}

export function useRegister() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: authApi.register,
    onSuccess: ({ user }) => {
      client.clear();
      client.setQueryData(["me"], user);
    },
  });
}

export function useLogout() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      client.clear();
      client.setQueryData(["me"], null);
    },
  });
}

export function useCommunities() {
  return useQuery({
    queryKey: ["communities"],
    queryFn: async () => (await communityApi.list()).data,
  });
}

export function useCreateCommunity() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (name: string) =>
      (await communityApi.create(name)).data,
    onSuccess: (community) => {
      client.setQueryData<Community[]>(["communities"], (current) =>
        current ? [...current, community] : [community],
      );
    },
  });
}

export function useJoinCommunity() {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (inviteCode: string) =>
      (await communityApi.join(inviteCode)).data,
    onSuccess: (community) => {
      client.setQueryData<Community[]>(["communities"], (current) => {
        if (!current) return [community];
        return current.some((item) => item.id === community.id)
          ? current.map((item) => (item.id === community.id ? community : item))
          : [...current, community];
      });
    },
  });
}

export function useSignals(
  communityId: number | undefined,
  filters: SignalFilters,
) {
  return useQuery({
    queryKey: ["signals", communityId, filters],
    queryFn: () => signalApi.list(communityId as number, filters),
    enabled: Number.isFinite(communityId),
    placeholderData: keepPreviousData,
  });
}

export function useSignal(signalId: number) {
  return useQuery({
    queryKey: ["signal", signalId],
    queryFn: async () => (await signalApi.show(signalId)).data,
    enabled: Number.isFinite(signalId),
  });
}

export function useCreateSignal(communityId: number) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (body: {
      title: string;
      description: string;
      category: string;
      zone: string;
      impact: number;
    }) => (await signalApi.create(communityId, body)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["signals"] });
    },
  });
}

export function useConfirmSignal(signalId: number) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: (confirmed: boolean) => signalApi.confirm(signalId, confirmed),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["signal", signalId] });
      client.invalidateQueries({ queryKey: ["signals"] });
    },
  });
}

export function useTransitionSignal(signalId: number) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async ({ to, note }: { to: string; note?: string }) =>
      (await signalApi.transition(signalId, to, note)).data,
    onSuccess: (signal) => {
      client.setQueryData(["signal", signalId], signal);
      client.invalidateQueries({ queryKey: ["signals"] });
    },
  });
}

export function useComments(signalId: number) {
  return useInfiniteQuery({
    queryKey: ["comments", signalId],
    queryFn: ({ pageParam }) => signalApi.comments(signalId, pageParam),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.meta.current_page < last.meta.last_page
        ? last.meta.current_page + 1
        : undefined,
  });
}

export function useAddComment(signalId: number) {
  const client = useQueryClient();

  return useMutation({
    mutationFn: async (body: string) =>
      (await signalApi.addComment(signalId, body)).data,
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["comments", signalId] });
    },
  });
}
