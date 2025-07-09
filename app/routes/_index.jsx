import { useLoaderData, useFetcher } from "@remix-run/react";
import { json } from "@remix-run/node";
import { connectToDB } from "../utils/db.server";
import { Task } from "../models/task";
import { useEffect, useRef } from "react";

// ✅ Loader: fetch all tasks
export async function loader() {
  await connectToDB();
  const tasks = await Task.find().lean();
  return json({ tasks });
}

// ✅ Action: handle add + toggle
export async function action({ request }) {
  await connectToDB();
  const formData = await request.formData();

  // Debug log incoming data
  for (const [key, value] of formData.entries()) {
    console.log(`${key}: ${value}`);
  }

  const toggleId = formData.get("toggle");
  if (toggleId) {
    const task = await Task.findById(toggleId);
    if (task) {
      task.completed = !task.completed;
      await task.save();
    }
    return json({ success: true });
  }

  const title = formData.get("title");
  if (!title || typeof title !== "string") {
    console.log("❌ Title missing or invalid:", title);
    return json({ error: "Title is required" }, { status: 400 });
  }

  await Task.create({ title });
  return json({ success: true });
}

export default function Index() {
  const { tasks } = useLoaderData();
  const fetcher = useFetcher();
  const formRef = useRef(null);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.success) {
      formRef.current?.reset();
    }
  }, [fetcher.state, fetcher.data]);

  return (
    <div className="max-w-xl mx-auto mt-10">
      <h1 className="text-3xl font-bold mb-4 text-center">Task Manager</h1>

      {/* ✅ Add Task */}
      <fetcher.Form
        method="post"
        ref={formRef}
        className="flex gap-2 mb-6"
      >
        <input
          type="text"
          name="title"
          placeholder="Enter a task"
          required
          className="border border-gray-300 p-2 flex-1 rounded"
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add
        </button>
      </fetcher.Form>

      {/* ✅ Task List */}
      <ul className="space-y-2">
        {tasks.map((task) => (
          <li
            key={task._id}
            className="p-3 border rounded bg-white flex justify-between items-center"
          >
            <fetcher.Form method="post">
              <input type="hidden" name="toggle" value={task._id} />
              <button type="submit" className="text-left text-black">
                {task.title}
              </button>
            </fetcher.Form>

            <span className="text-sm text-gray-500">
              {task.completed ? "✅ Done" : "⏳ Pending"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
