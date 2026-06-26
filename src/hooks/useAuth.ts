import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "@/lib/api";
import { useCallback, useMemo } from "react";

const ME_KEY = ["auth", "me"] as const;

export function useAuth() {
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ME_KEY,
    queryFn: () => authApi.me(),
    staleTime: 1000 * 60 * 5,
    retry: false,
  });

  const logoutMutation = useMutation({
    mutationFn: () => authApi.logout(),
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      window.location.href = "/";
    },
  });

  const logout = useCallback(() => logoutMutation.mutate(), [logoutMutation]);

  const isAdmin = user?.role === "admin";
  const isBrand = user?.role === "brand";
  const isInfluencer = user?.role === "influencer";
  const isOnboardingComplete = user?.onboardingComplete ?? false;

  const dashboardPath = useMemo(() => {
    if (isAdmin) return "/admin/dashboard";
    if (isBrand) return isOnboardingComplete ? "/brand/dashboard" : "/onboarding/brand";
    if (isInfluencer) return isOnboardingComplete ? "/influencer/dashboard" : "/onboarding/influencer";
    return "/onboarding";
  }, [isAdmin, isBrand, isInfluencer, isOnboardingComplete]);

  return useMemo(
    () => ({
      user: user ?? null,
      isAuthenticated: !!user,
      isLoading: isLoading || logoutMutation.isPending,
      isAdmin,
      isBrand,
      isInfluencer,
      isOnboardingComplete,
      dashboardPath,
      error,
      logout,
      refresh: refetch,
    }),
    [
      user,
      isLoading,
      logoutMutation.isPending,
      isAdmin,
      isBrand,
      isInfluencer,
      isOnboardingComplete,
      dashboardPath,
      error,
      logout,
      refetch,
    ]
  );
}
