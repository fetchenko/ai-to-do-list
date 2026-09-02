import { TaskPreview } from '@/features/tasks/types/database.types';
import { AiGeneration } from '@/infrastructure/ai/generations/ai-generation';
import { taskDecomposerStreamPrompt } from '@/infrastructure/ai/prompts/task-decomposer-stream';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { normalizeAiError } from '@/infrastructure/ai/utils/ai-error.utils';
import { toClientEvent } from '@/infrastructure/ai/utils/normalize-event';
import { SubtaskStreamEvent } from '@/shared/types/stream-event.types';

export type SubtaskGeneration = {
  stream(): ReadableStream<Uint8Array>;
};

const encoder = new TextEncoder();

function encodeEvent(event: SubtaskStreamEvent): Uint8Array {
  return encoder.encode(`${JSON.stringify(event)}\n`);
}

export class SubtaskGenerationResource implements SubtaskGeneration {
  constructor(
    private readonly options: {
      generation: AiGeneration;
      task: TaskPreview;
      provider: AIProvider;
      signal: AbortSignal;
    }
  ) {}

  stream() {
    return new ReadableStream<Uint8Array>({
      start: (controller) => this.run(controller),

      cancel: async () => {
        await this.options.generation.cancel('client_disconnect');
      },
    });
  }

  private async run(controller: ReadableStreamDefaultController<Uint8Array>) {
    const events = this.options.provider.stream(
      taskDecomposerStreamPrompt(this.options.task.title),
      this.options.signal
    );

    try {
      for await (const event of events) {
        if (this.options.signal.aborted) {
          await this.options.generation.cancel('client_disconnect');

          controller.close();
          return;
        }

        switch (event.type) {
          case 'subtask':
            controller.enqueue(encodeEvent(toClientEvent(event)));
            break;

          case 'done':
            await this.options.generation.complete({
              metadata: event.metadata,
              response: null,
            });

            controller.enqueue(encodeEvent(toClientEvent(event)));
            controller.close();
            return;

          case 'error':
            await this.options.generation.fail({
              code: event.error.code,
            });

            controller.enqueue(encodeEvent(toClientEvent(event)));
            controller.close();
            return;
        }
      }

      // Defensive: provider ended without a terminal event.
      await this.options.generation.fail({
        code: 'STREAM_ENDED_WITHOUT_TERMINAL_EVENT',
      });

      controller.close();
    } catch (error) {
      if (this.options.signal.aborted) {
        await this.options.generation.cancel('client_disconnect');
        controller.close();
        return;
      }

      await this.options.generation.fail({
        code: normalizeAiError(error).code,
      });

      controller.error(error);
    }
  }

  private async handleFailure(
    controller: ReadableStreamDefaultController<Uint8Array>,
    error: unknown
  ) {
    if (this.options.signal.aborted) {
      await this.options.generation.cancel('client_disconnect');

      controller.close();
      return;
    }

    const normalized = normalizeAiError(error);

    await this.options.generation.fail({
      code: normalized.code,
    });

    controller.enqueue(
      encodeEvent({
        type: 'error',
        error: normalized,
      })
    );

    controller.close();
  }
}
