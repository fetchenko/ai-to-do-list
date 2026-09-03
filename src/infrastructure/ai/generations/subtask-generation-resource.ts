import { AiGeneration } from '@/infrastructure/ai/generations/ai-generation';
import { taskDecomposerStreamPrompt } from '@/infrastructure/ai/prompts/task-decomposer-stream';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { normalizeCancelReason } from '@/infrastructure/ai/utils/normalize-abort-error';
import { normalizeAiError } from '@/infrastructure/ai/utils/normalize-ai-error';
import { toClientEvent } from '@/infrastructure/ai/utils/normalize-event';
import {
  AiGenerationServerShutdown,
  AiGenerationTimeout,
} from '@/shared/errors/app-error';
import { TaskPreview } from '@/shared/types/database.types';
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
            await this.handleFailure(controller, event.error);
            return;
        }
      }

      // Defensive: provider ended without a terminal event.
      await this.options.generation.fail({
        code: 'STREAM_ENDED_WITHOUT_TERMINAL_EVENT',
      });

      controller.close();
    } catch (error) {
      await this.handleFailure(controller, error);
    }
  }

  private async handleAbort(
    controller: ReadableStreamDefaultController<Uint8Array>
  ) {
    const reason = normalizeCancelReason(this.options.signal.reason);

    await this.options.generation.cancel(reason);

    switch (reason) {
      case 'timeout':
        controller.enqueue(
          encodeEvent({
            type: 'cancelled',
            error: normalizeAiError(new AiGenerationTimeout()),
          })
        );
        break;

      case 'server_shutdown':
        controller.enqueue(
          encodeEvent({
            type: 'cancelled',
            error: normalizeAiError(new AiGenerationServerShutdown()),
          })
        );
        break;
    }

    controller.close();
    return;
  }

  private async handleFailure(
    controller: ReadableStreamDefaultController<Uint8Array>,
    error: unknown
  ) {
    if (this.options.signal.aborted) {
      await this.handleAbort(controller);
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
