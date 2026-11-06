import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { useSettingsStore } from "../store/useSettingsStore";
import { useCartStore } from "../store/useCartStore";

/**
 * Runs once at app start: pulls the general settings from the backend so the
 * POS tax calculation and other preferences are consistent everywhere, not
 * just on the Settings page. Renders nothing.
 */
export default function SettingsSync() {
  const { data } = useQuery({
    queryKey: ["settings", "general"],
    queryFn: () => api.get("/settings/general"),
    staleTime: 60_000,
    retry: false,
  });

  useEffect(() => {
    const server = data?.data?.data?.settings;
    if (server) {
      useSettingsStore.getState().setSettings(server);
      useCartStore.getState().recomputeTotals();
    }
  }, [data]);

  return null;
}
