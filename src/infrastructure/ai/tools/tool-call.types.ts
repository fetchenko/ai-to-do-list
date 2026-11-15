export type AiTool = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  };
};

export type ToolCallDelta = {
  index: number;
  id?: string;
  function?: {
    name?: string;
    arguments?: string;
  };
};

export type PendingToolCall = {
  index: number;
  id: string;
  name: string;
  arguments: string;
};

export type ToolCallAccumulatorResult =
  | { type: 'accumulating' }
  | { type: 'completed'; toolCall: PendingToolCall };
