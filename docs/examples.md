# Example Cursor AI Interactions

Here are some common interactions with Cursor AI when using LM-Tasker:

## Starting a new project

```
I've just initialized a new project with LM-Tasker. I have a PRD.md file in the project root.
Can you help me parse it and set up the initial tasks?
```

## Working on tasks

```
What's the next task I should work on? Please consider dependencies and priorities.
```

## Implementing a specific task

```
I'd like to implement task 4. Can you help me understand what needs to be done and how to approach it?
```

## Managing subtasks

```
I need to regenerate the subtasks for task 3 with a different approach. Can you help me clear and regenerate them?
```

## Handling changes

```
I've decided to use MongoDB instead of PostgreSQL. Can you update all future tasks to reflect this change?
```

## Completing work

```
I've finished implementing the authentication system described in task 2. All tests are passing.
Please mark it as complete and tell me what I should work on next.
```

## Reorganizing tasks

```
I think subtask 5.2 would fit better as part of task 7. Can you move it there?
```

(Agent runs: `lm-tasker move --from=5.2 --to=7.3`)

```
Task 8 should actually be a subtask of task 4. Can you reorganize this?
```

(Agent runs: `lm-tasker move --from=8 --to=4.1`)

```
I just merged the main branch and there's a conflict in tasks.json. My teammates created tasks 10-15 on their branch while I created tasks 10-12 on my branch. Can you help me resolve this by moving my tasks?
```

(Agent runs:

```bash
lm-tasker move --from=10 --to=16
lm-tasker move --from=11 --to=17
lm-tasker move --from=12 --to=18
```

)

## Managing complex tasks

```
Task 5 seems complex. Can you help me add some subtasks to break it down into smaller pieces?
```

(Agent runs:
`lm-tasker add-subtask --parent=5 --title="Setup authentication" --description="Implement user authentication system"`)

### Updating Tasks

```
We need to update task 15 based on the latest React Query v5 changes. Can you update the task?
```

(Agent runs: `lm-tasker update-task --id=15` and manually updates the task details)

### Adding Tasks

```
Please add a new task to implement user profile image uploads using Cloudinary.
```

(Agent runs:
`lm-tasker add-task --title="User Profile Images" --description="Implement user profile image uploads using Cloudinary"`)
