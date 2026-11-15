import { AiTool } from '@/shared/types/ai-generation.types';

export const subtaskGenerationTool: AiTool = {
  name: 'generate_item',
  description: 'Return one actionable item with a title and a description.',
  parameters: {
    type: 'object',
    properties: {
      data: {
        type: 'string',
        description: 'A short, actionable title.',
      },
      description: {
        type: 'string',
        description: 'A clear explanation of what needs to be done.',
      },
    },
    required: ['data', 'description'],
    additionalProperties: false,
  },
};

export function createSubtaskGenerationPrompt(taskTitle: string): string {
  return `
Break down the following task into 1 to 3 clear, actionable items.

Rules:
- Each item must represent a single actionable step.
- Items must be logically ordered.
- Be specific and concise.
- If the task is vague, make reasonable assumptions.
- Do not create unnecessary items.
- Do not answer with explanatory text.
- Use the provided tool once for each item.

Task:
"""
${taskTitle}
"""
`;
}
