import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

export function useAssistantChat() {
  return useMutation({
    mutationFn: (message: string) =>
      api.post("/assistant/chat", { message }).then((r) => r.data),
  });
}
