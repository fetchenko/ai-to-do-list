export const mockOllamaResponse = {
  model: 'qwen2.5-coder:1.5b',
  created_at: '2026-06-19T15:02:00.219075871Z',
  response: JSON.stringify({
    subtasks: [
      {
        title: 'Create a prompt user interface',
        description: 'Design a user-friendly interface to allow users to input text.',
      },
      {
        title: 'Implement the prompt functionality',
        description: 'Develop code to handle user input and provide prompts accordingly.',
      },
      {
        title: 'Test the prompt functionality',
        description: 'Validate that the prompt function works as expected with various inputs.',
      },
    ],
  }),
  done: true,
  done_reason: 'stop',
  total_duration: 3305899888,
  load_duration: 115511014,
  prompt_eval_count: 292,
  prompt_eval_duration: 33325369,
  eval_count: 104,
  eval_duration: 1291589772,
};
