import { apiRequest } from "./queryClient";

export async function sendMessage(prompt: string) {
  const res = await apiRequest("POST", "/api/chat", { prompt });
  return res.json();
}
