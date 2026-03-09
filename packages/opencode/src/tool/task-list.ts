import z from "zod"
import { Tool } from "./tool"
import DESCRIPTION_WRITE from "./taskwrite.txt"
import { TaskList } from "../session/task-list"

export const TaskWriteTool = Tool.define("taskwrite", {
  description: DESCRIPTION_WRITE,
  parameters: z.object({
    tasks: z.array(z.object(TaskList.Info.shape)).describe("The updated task list"),
  }),
  async execute(params, ctx) {
    await ctx.ask({
      permission: "taskwrite",
      patterns: ["*"],
      always: ["*"],
      metadata: {},
    })

    await TaskList.update({
      sessionID: ctx.sessionID,
      tasks: params.tasks,
    })
    return {
      title: `${params.tasks.filter((x) => x.status !== "completed").length} tasks`,
      output: JSON.stringify(params.tasks, null, 2),
      metadata: {
        tasks: params.tasks,
      },
    }
  },
})

export const TaskReadTool = Tool.define("taskread", {
  description: "Use this tool to read your task list",
  parameters: z.object({}),
  async execute(_params, ctx) {
    await ctx.ask({
      permission: "taskread",
      patterns: ["*"],
      always: ["*"],
      metadata: {},
    })

    const tasks = await TaskList.get(ctx.sessionID)
    return {
      title: `${tasks.filter((x) => x.status !== "completed").length} tasks`,
      metadata: {
        tasks,
      },
      output: JSON.stringify(tasks, null, 2),
    }
  },
})
