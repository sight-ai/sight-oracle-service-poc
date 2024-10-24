// schemas/request.schema.ts
import { z } from 'zod';

// Define meaningful schemas
const Bytes32 = z.string().length(66, 'Expected a 32-byte hexadecimal string');
const Address = z.string().length(42, 'Expected an Ethereum address');
const Bytes4 = z.string().length(10, 'Expected a 4-byte hexadecimal string');

const OperationSchema = z.object({
    opcode: z.number().int(),
    operands: z.array(z.bigint()),
    value: z.bigint(),
});

const RequestSchema = z.object({
    requester: Address,
    ops: z.array(OperationSchema),
    opsCursor: z.bigint(),
    callbackAddr: Address,
    callbackFunc: Bytes4,
    payload: z.string(),
});

type Operation = z.infer<typeof OperationSchema>;
type Request = z.infer<typeof RequestSchema>;

export { RequestSchema, OperationSchema, Request, Operation, Bytes32, Address, Bytes4 };
