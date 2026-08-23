export type PendingToolCall = {
  index: number;
  id: string;
  name: string;
  arguments: string;
};

export type DeepSeekStreamChunk = {
  choices?: Array<{
    delta?: {
      content?: string | null;
      reasoning_content?: string | null;
      tool_calls?: DeepSeekToolCall[];
    };
    finish_reason?: string | null;
  }>;
};

export type DeepSeekToolCall = {
  index: number;
  id?: string;
  type?: 'function';
  function?: {
    name?: string;
    arguments?: string;
  };
};
