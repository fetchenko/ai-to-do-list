import { AiRequestLock } from '@/infrastructure/ai/generations/ai-generation-lock';
import { AiGenerationLog } from '@/infrastructure/ai/generations/ai-generation-log';
import { taskDecomposerStreamPrompt } from '@/infrastructure/ai/prompts/task-decomposer-stream';
import { AIProvider } from '@/infrastructure/ai/providers/ai-provider';
import { normalizeApiEventError } from '@/infrastructure/ai/utils/normalize-api-event-error';
import { normalizeCancelReason } from '@/infrastructure/ai/utils/normalize-cancel-reason';
import { toClientEvent } from '@/infrastructure/ai/utils/normalize-event';
import {
  AiGenerationServerShutdown,
  AiGenerationTimeout,
  AiInvalidResponseFormat,
} from '@/shared/errors/ai-app-error';
import { DbTaskForSubtaskGeneration } from '@/shared/types/database.types';
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
      generationLog: AiGenerationLog | null;
      generationLock: AiRequestLock;
      task: DbTaskForSubtaskGeneration;
      provider: AIProvider;
      signal: AbortSignal;
    }
  ) {}

  stream(): ReadableStream<Uint8Array> {
    const streamAbortController = new AbortController();
    const signal = AbortSignal.any([
      this.options.signal,
      streamAbortController.signal,
    ]);
    let outputStreamCancelled = false;

    return new ReadableStream<Uint8Array>({
      start: (controller) => {
        void this.run(controller, signal, () => outputStreamCancelled);
      },

      cancel: () => {
        outputStreamCancelled = true;
        streamAbortController.abort(
          new DOMException('Client disconnected', 'AbortError')
        );
      },
    });
  }

  private async run(
    controller: ReadableStreamDefaultController<Uint8Array>,
    signal: AbortSignal,
    isOutputStreamCancelled: () => boolean
  ) {
    if (signal.aborted) {
      await this.handleAbort(controller, signal, isOutputStreamCancelled);
      return;
    }

    const events = this.options.provider.stream(
      taskDecomposerStreamPrompt(this.options.task.title),
      signal
    );

    try {
      for await (const event of events) {
        if (signal.aborted) {
          await this.handleAbort(controller, signal, isOutputStreamCancelled);
          return;
        }

        switch (event.type) {
          case 'subtask':
            controller.enqueue(encodeEvent(toClientEvent(event)));
            break;

          case 'done':
            await this.options.generationLog?.complete({
              metadata: event.metadata,
            });
            await this.options.generationLock.release();

            controller.enqueue(encodeEvent(toClientEvent(event)));
            controller.close();
            return;

          case 'error':
            await this.handleFailure(
              controller,
              event.error,
              signal,
              isOutputStreamCancelled
            );
            return;
        }
      }

      const error = normalizeApiEventError(
        new AiInvalidResponseFormat('AI stream ended unexpectedly')
      );

      await this.options.generationLog?.fail({
        code: error.code,
      });
      await this.options.generationLock.release();

      controller.enqueue(
        encodeEvent({
          type: 'error',
          error,
        })
      );

      controller.close();
    } catch (error) {
      await this.handleFailure(
        controller,
        error,
        signal,
        isOutputStreamCancelled
      );
    }
  }

  private async handleAbort(
    controller: ReadableStreamDefaultController<Uint8Array>,
    signal: AbortSignal,
    isOutputStreamCancelled: () => boolean
  ) {
    const reason = normalizeCancelReason(signal.reason);

    await this.options.generationLog?.cancel(reason);
    await this.options.generationLock.release();

    switch (reason) {
      case 'timeout':
        controller.enqueue(
          encodeEvent({
            type: 'cancelled',
            error: normalizeApiEventError(new AiGenerationTimeout()),
          })
        );
        controller.close();
        return;

      case 'server_shutdown':
        controller.enqueue(
          encodeEvent({
            type: 'cancelled',
            error: normalizeApiEventError(new AiGenerationServerShutdown()),
          })
        );
        controller.close();
        return;

      case 'client_disconnect':
        if (!isOutputStreamCancelled()) {
          controller.close();
        }
        return;
    }
  }

  private async handleFailure(
    controller: ReadableStreamDefaultController<Uint8Array>,
    error: unknown,
    signal: AbortSignal,
    isOutputStreamCancelled: () => boolean
  ) {
    if (signal.aborted) {
      await this.handleAbort(controller, signal, isOutputStreamCancelled);
      return;
    }

    const normalized = normalizeApiEventError(error);

    await this.options.generationLog?.fail({
      code: normalized.code,
    });
    await this.options.generationLock.release();

    controller.enqueue(
      encodeEvent({
        type: 'error',
        error: normalized,
      })
    );

    controller.close();
  }
}
