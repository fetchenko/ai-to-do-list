import { taskDecomposerPrompt } from '@/lib/prompts/task-decomposer';
import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { task } = await req.json();

    const completion = await openai.responses.create({
      model: 'gpt-5',
      input: [
        {
          role: 'system',
          content: 'You are a project planning assistant. Divide tasks into actionable subtasks.',
        },
        {
          role: 'user',
          content: taskDecomposerPrompt(task),
        },
      ],
      text: {
        format: {
          type: 'json_schema',
          name: 'task_breakdown',
          schema: {
            type: 'object',
            properties: {
              subtasks: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                    },
                    description: {
                      type: 'string',
                    },
                  },
                  required: ['title', 'description'],
                  additionalProperties: false,
                },
              },
            },
            required: ['subtasks'],
            additionalProperties: false,
          },
        },
      },
    });

    let result;

    try {
      result = JSON.parse(completion.output_text);
    } catch {
      result = {
        subtasks: [
          {
            title: 'Parsing Error',
            description: completion.output_text,
          },
        ],
      };
    }

    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: `Failed to generate subtasks: ${err} ` }, { status: 500 });
  }
}
