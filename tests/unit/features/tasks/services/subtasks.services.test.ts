import { describe, expect, it, vi } from 'vitest';

import { streamSubtasks } from '@/features/tasks/services/subtasks.service';

describe('streamSubtasks', () => {
  it('streams subtasks from the API', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          [
            JSON.stringify({
              type: 'subtask',
              subtask: {
                title: 'Research phones',
                description: 'Compare available options',
              },
            }),
            JSON.stringify({
              type: 'done',
            }),
          ].join('\n'),
          {
            headers: {
              'Content-Type': 'application/x-ndjson',
            },
          }
        )
      )
    );

    const chunks = [];

    for await (const chunk of streamSubtasks('task-1')) {
      chunks.push(chunk);
    }

    expect(chunks).toEqual([
      {
        type: 'subtask',
        subtask: {
          title: 'Research phones',
          description: 'Compare available options',
        },
      },
      {
        type: 'done',
      },
    ]);
  });
});
