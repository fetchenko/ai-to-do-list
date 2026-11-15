/**
 * @deprecated Task-specific generation prompts belong to the tasks feature.
 * Kept temporarily for callers outside the streaming flow.
 */
export const taskDecomposerStreamPrompt = (task: string) => `
Break down the following task into 1 or 3 clear, actionable subtasks.

Rules:
- Each subtask must represent a single actionable step.
- Subtasks must be logically ordered.
- Be specific and concise.
- If the task is vague, make reasonable assumptions.
- Do not create unnecessary subtasks.
- Do not answer the user with text.
- Do not output JSON.
- Do not explain your reasoning.
- Use the provided generation tool for each generated item.

Task:
"""
${task}
"""
`;
