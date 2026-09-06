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
  | {
      type: 'accumulating';
    }
  | {
      type: 'completed';
      toolCall: PendingToolCall;
    };
