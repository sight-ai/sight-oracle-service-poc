// schemas/request.schema.ts
import { z } from 'zod';
import { CapsulatedValueSchema } from './oracle-callback.schema';

// Define meaningful schemas
const Bytes = z.string();
const Bytes32 = z.string().length(66, 'Expected a 32-byte hexadecimal string');
const Address = z.string().length(42, 'Expected an Ethereum address');
const Bytes4 = z.string().length(10, 'Expected a 4-byte hexadecimal string');

const OperationSchema = z.object({
  opcode: z.number().int(),
  operands: z.array(CapsulatedValueSchema),
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

const ReencryptRequestSchema = z.object({
  requester: Address,
  target: CapsulatedValueSchema,
  publicKey: Bytes32,
  signature: Bytes,
  callbackAddr: Address,
  callbackFunc: Bytes4,
});

type CapsulatedValue = z.infer<typeof CapsulatedValueSchema>;
type ReencryptRequest = z.infer<typeof ReencryptRequestSchema>;

const SaveCiphertextRequestSchema = z.object({
  requester: Address,
  ciphertext: Bytes,
  ciphertextType: z.number().int(),
  callbackAddr: Address,
  callbackFunc: Bytes4,
});

type SaveCiphertextRequest = z.infer<typeof SaveCiphertextRequestSchema>;

export {
  RequestSchema,
  OperationSchema,
  Request,
  Operation,
  Bytes32,
  Address,
  Bytes4,
  Bytes,
  CapsulatedValue,
  ReencryptRequest,
  CapsulatedValueSchema,
  ReencryptRequestSchema,
  SaveCiphertextRequest,
  SaveCiphertextRequestSchema,
};
