export const createSubtaskTool = {
  type: 'function',
  function: {
    name: 'create_subtask',
    description:
      'Create one actionable subtask. Call this tool once for each subtask you want to propose.',
    parameters: {
      type: 'object',
      properties: {
        title: {
          type: 'string',
          description: 'Short actionable title.',
        },
        description: {
          type: 'string',
          description: 'Clear explanation of what needs to be done.',
        },
      },
      required: ['title', 'description'],
      additionalProperties: false,
    },
  },
} as const;
