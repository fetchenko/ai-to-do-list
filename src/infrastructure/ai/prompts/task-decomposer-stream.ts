export const taskDecomposerStreamPrompt = (task: string) => `
Break down the following task into 1 or 5 clear, actionable subtasks.

Rules:
- Each subtask must represent a single actionable step.
- Subtasks must be logically ordered.
- Be specific and concise.
- If the task is vague, make reasonable assumptions.
- Do not create unnecessary subtasks.
- Do not answer the user with text.
- Do not output JSON.
- Do not explain your reasoning.
- You MUST use the create_subtask tool for each subtask.

Task:
"""
${task}
"""
`;
