// schemas/task.schema.ts
import { z } from 'zod';
import { Bytes32, Address, Bytes4 } from './request.schema';

const TaskStatus = {
    CREATED: 'created',
    COMPUTE_EXECUTING: 'compute-executing', // executing the computation
    COMPUTE_EXECUTED: 'compute-executed', // successfully execute the computation
    COMPUTE_RESPONSE_CAPTURED: 'compute-response-captured', // successfully execute the computation
    CALLBACK_STARTED: 'callback-started',
    CALLBACK_COMPLETE: 'callback-complete'
}

const TaskSchema = z.object({
    requestId: Bytes32,
    requester: Address,
    transactionHash: z.string(),
    blockHash: z.string(),
    chainId: z.number(),
    status: z.string().default('pending'),
    callbackAddr: Address,
    callbackFunc: Bytes4,
    payload: z.string(),
});

type Task = z.infer<typeof TaskSchema>;

export { TaskSchema, Task, TaskStatus };
