export const deepseekResponse = {
  id: "43f08761-8160-4580-95e7-829fb8ec21cc",
  model: "deepseek-v4-flash",
  choices: [
    {
      finish_reason: "stop",
      message: {
        content: JSON.stringify({
          task_summary:
            "Prompt the user to enter input through a user interface",
          subtasks: [
            {
              title: "Build input form UI",
              description:
                "Create an HTML form with a text input field and a submit button, styled appropriately for the application context.",
            },
            {
              title: "Implement input capture and validation",
              description:
                "Write JavaScript to attach a submit event listener, capture the input value, perform basic validation (e.g., non-empty), and output the result (e.g., console.log or display on the page).",
            },
          ],
        }),
      },
    },
  ],
  usage: {
    prompt_tokens: 292,
    completion_tokens: 387,
    total_tokens: 679,
    prompt_cache_hit_tokens: 256,
    prompt_cache_miss_tokens: 36,
    completion_tokens_details: {
      reasoning_tokens: 257,
    },
  },
};
