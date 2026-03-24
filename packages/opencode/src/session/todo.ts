import { BusEvent } from "@/bus/bus-event"
import { Bus } from "@/bus"
import z from "zod"
import { Storage } from "../storage/storage"

export namespace Todo {
  export const Info = z
    .object({
      id: z.string().describe("Unique identifier for the item"),
      content: z.string().describe("Brief description of the subagent task"),
      status: z
        .enum(["pending", "in_progress", "completed", "cancelled"])
        .describe("Current status: pending, in_progress, completed, cancelled"),
      priority: z.string().describe("Priority level: high, medium, low"),
      subagent_type: z.string().optional().describe("The type of specialized subagent to use for this task (e.g. explore, generalPurpose)"),
      prompt: z.string().optional().describe("The detailed prompt for the subagent to execute"),
    })
    .meta({ ref: "Todo" })
  export type Info = z.infer<typeof Info>

  export const Event = {
    Updated: BusEvent.define(
      "todo.updated",
      z.object({
        sessionID: z.string(),
        todos: z.array(Info),
      }),
    ),
  }

  export async function update(input: { sessionID: string; todos: Info[] }) {
    await Storage.write(["todo", input.sessionID], input.todos)
    Bus.publish(Event.Updated, input)
  }

  export async function get(sessionID: string) {
    return Storage.read<Info[]>(["todo", sessionID])
      .then((x) => x || [])
      .catch(() => [])
  }
}
