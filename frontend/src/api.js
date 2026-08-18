import axios from "axios";

// Single axios instance used by every page to talk to the Node backend.
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

export default api;

// Used for the streaming endpoints (summary generation, ask question). axios
// doesn't give easy access to a response body as it arrives, so this uses the
// plain fetch API instead and calls onChunk with each piece of text as it's read.
export async function streamPost(path, body, onChunk) {
  const response = await fetch(`${import.meta.env.VITE_API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data.error || "Request failed");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    onChunk(decoder.decode(value, { stream: true }));
  }
}
