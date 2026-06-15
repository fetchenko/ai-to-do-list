export interface AIProvider {
  generate(prompt: string, signal?: AbortSignal): Promise<Response>;
}
