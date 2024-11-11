// schemas/task.schema.ts
import { z } from 'zod';
import { Bytes32 } from './request.schema';

const TaskStatus = {
  CREATED: 'created',
  COMPUTE_EXECUTING: 'compute-executing', // executing the computation
  COMPUTE_EXECUTING_ASYNC: 'compute-executing-async', // executing the computation in async way
  COMPUTE_EXECUTED: 'compute-executed', // successfully execute the computation
  COMPUTE_RESPONSE_CAPTURED: 'compute-response-captured', // successfully execute the computation
  CALLBACK_STARTED: 'callback-started',
  CALLBACK_COMPLETE: 'callback-complete',
};

const TaskSchema = z.object({
  requestId: Bytes32,
  transactionHash: z.string(),
  blockHash: z.string(),
  chainId: z.number(),
  status: z.string().default('pending'),
});

type Task = z.infer<typeof TaskSchema>;

export { TaskSchema, Task, TaskStatus };
