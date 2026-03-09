import { BusEvent } from "@/bus/bus-event"
import { Bus } from "@/bus"
import z from "zod"
import { Storage } from "../storage/storage"

export namespace TaskList {
  export const Info = z
    .object({
      content: z.string().describe("Brief description of the task"),
      status: z.string().describe("Current status of the task: pending, in_progress, completed, cancelled"),
      priority: z.string().describe("Priority level of the task: high, medium, low"),
      id: z.string().describe("Unique identifier for the task item"),
    })
    .meta({ ref: "Task" })
  export type Info = z.infer<typeof Info>

  export const Event = {
    Updated: BusEvent.define(
      "task.updated",
      z.object({
        sessionID: z.string(),
        tasks: z.array(Info),
      }),
    ),
    /** @deprecated Use Event.Updated - for backward compat with legacy clients */
    TodoUpdated: BusEvent.define(
      "todo.updated",
      z.object({
        sessionID: z.string(),
        todos: z.array(Info),
      }),
    ),
  }

  export async function update(input: { sessionID: string; tasks: Info[] }) {
    await Storage.write(["task", input.sessionID], input.tasks)
    Bus.publish(Event.Updated, { sessionID: input.sessionID, tasks: input.tasks })
    Bus.publish(Event.TodoUpdated, { sessionID: input.sessionID, todos: input.tasks })
  }

  export async function get(sessionID: string) {
    const tasks = await Storage.read<Info[]>(["task", sessionID]).catch(() => [])
    if (tasks && tasks.length > 0) return tasks
    // Migrate from legacy "todo" storage
    const legacy = await Storage.read<Info[]>(["todo", sessionID]).catch(() => [])
    if (legacy && legacy.length > 0) {
      await Storage.write(["task", sessionID], legacy)
      return legacy
    }
    return []
  }
}
