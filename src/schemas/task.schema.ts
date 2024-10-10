// schemas/task.schema.ts
import { z } from 'zod';
import { Bytes32, Address, Bytes4 } from './request.schema';

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

export { TaskSchema, Task };
