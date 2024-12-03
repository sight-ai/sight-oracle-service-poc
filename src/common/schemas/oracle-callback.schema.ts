import { z } from 'zod';

const CapsulatedValueSchema = z.object({
  data: z.string(),
  valueType: z.number().int(),
});

const OracleCallbackRequestSchema = z.object({
  chainId: z.number().int(), // Check to avoid mis-config
  requestId: z.string().length(66, 'Expected a 32-byte hexadecimal string'), // bytes32
  callbackAddr: z
    .string()
    .regex(
      /^0x[0-9a-fA-F]{40}$/,
      'Expected a valid Ethereum address starting with 0x',
    ),
  callbackFunc: z
    .string()
    .regex(/^0x[0-9a-fA-F]{8}$/, 'Expected a 4-byte hexadecimal string'), // bytes4
  responseResults: z
    .array(CapsulatedValueSchema)
    .or(CapsulatedValueSchema)
    .or(z.string()),
});

type OracleCallbackRequest = z.infer<typeof OracleCallbackRequestSchema>;

export {
  OracleCallbackRequestSchema,
  CapsulatedValueSchema,
  OracleCallbackRequest,
};
