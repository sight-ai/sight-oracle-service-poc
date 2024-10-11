export const computeProxyAbi = [
  {
    inputs: [],
    name: 'ECDSAInvalidSignature',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'length',
        type: 'uint256',
      },
    ],
    name: 'ECDSAInvalidSignatureLength',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 's',
        type: 'bytes32',
      },
    ],
    name: 'ECDSAInvalidSignatureS',
    type: 'error',
  },
  {
    inputs: [],
    name: 'InvalidInitialization',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NotInitializing',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'owner',
        type: 'address',
      },
    ],
    name: 'OwnableInvalidOwner',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'account',
        type: 'address',
      },
    ],
    name: 'OwnableUnauthorizedAccount',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint256',
        name: 'reqId',
        type: 'uint256',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'data',
            type: 'uint256',
          },
          {
            internalType: 'uint8',
            name: 'valueType',
            type: 'uint8',
          },
        ],
        indexed: false,
        internalType: 'struct CapsulatedValue[]',
        name: 'results',
        type: 'tuple[]',
      },
    ],
    name: 'DecryptAsyncResolved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'EIP712DomainChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'uint64',
        name: 'version',
        type: 'uint64',
      },
    ],
    name: 'Initialized',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferStarted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'address',
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'oracleSvcId',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'id',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'results',
        type: 'bytes',
      },
    ],
    name: 'ReencryptRequestResolved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'oracleSvcId',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'id',
        type: 'bytes32',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'data',
            type: 'uint256',
          },
          {
            internalType: 'uint8',
            name: 'valueType',
            type: 'uint8',
          },
        ],
        indexed: false,
        internalType: 'struct CapsulatedValue[]',
        name: 'results',
        type: 'tuple[]',
      },
    ],
    name: 'RequestResolved',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'oracleSvcId',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes32',
        name: 'reqId',
        type: 'bytes32',
      },
      {
        components: [
          {
            internalType: 'uint256',
            name: 'data',
            type: 'uint256',
          },
          {
            internalType: 'uint8',
            name: 'valueType',
            type: 'uint8',
          },
        ],
        indexed: false,
        internalType: 'struct CapsulatedValue',
        name: 'result',
        type: 'tuple',
      },
    ],
    name: 'SaveCiphertextResolved',
    type: 'event',
  },
  {
    inputs: [],
    name: 'acceptOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'reqId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'decryptedInput',
        type: 'address',
      },
    ],
    name: 'decryptEaddressAsyncCallback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'reqId',
        type: 'uint256',
      },
      {
        internalType: 'bool',
        name: 'decryptedInput',
        type: 'bool',
      },
    ],
    name: 'decryptEboolAsyncCallback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'uint256',
        name: 'reqId',
        type: 'uint256',
      },
      {
        internalType: 'uint64',
        name: 'decryptedInput',
        type: 'uint64',
      },
    ],
    name: 'decryptEuint64AsyncCallback',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      {
        internalType: 'bytes1',
        name: 'fields',
        type: 'bytes1',
      },
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'version',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'chainId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'verifyingContract',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'salt',
        type: 'bytes32',
      },
      {
        internalType: 'uint256[]',
        name: 'extensions',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'id',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'requester',
            type: 'address',
          },
          {
            components: [
              {
                internalType: 'uint256',
                name: 'data',
                type: 'uint256',
              },
              {
                internalType: 'uint8',
                name: 'valueType',
                type: 'uint8',
              },
            ],
            internalType: 'struct CapsulatedValue',
            name: 'target',
            type: 'tuple',
          },
          {
            internalType: 'bytes32',
            name: 'publicKey',
            type: 'bytes32',
          },
          {
            internalType: 'bytes',
            name: 'signature',
            type: 'bytes',
          },
          {
            internalType: 'address',
            name: 'callbackAddr',
            type: 'address',
          },
          {
            internalType: 'bytes4',
            name: 'callbackFunc',
            type: 'bytes4',
          },
        ],
        internalType: 'struct ReencryptRequest',
        name: 'req',
        type: 'tuple',
      },
    ],
    name: 'executeReencryptRequest',
    outputs: [
      {
        internalType: 'bytes',
        name: '',
        type: 'bytes',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'oracleSvcId',
        type: 'bytes32',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'id',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'requester',
            type: 'address',
          },
          {
            components: [
              {
                internalType: 'uint8',
                name: 'opcode',
                type: 'uint8',
              },
              {
                internalType: 'uint256[]',
                name: 'operands',
                type: 'uint256[]',
              },
              {
                internalType: 'uint64',
                name: 'value',
                type: 'uint64',
              },
            ],
            internalType: 'struct Operation[]',
            name: 'ops',
            type: 'tuple[]',
          },
          {
            internalType: 'uint256',
            name: 'opsCursor',
            type: 'uint256',
          },
          {
            internalType: 'address',
            name: 'callbackAddr',
            type: 'address',
          },
          {
            internalType: 'bytes4',
            name: 'callbackFunc',
            type: 'bytes4',
          },
          {
            internalType: 'bytes',
            name: 'payload',
            type: 'bytes',
          },
        ],
        internalType: 'struct Request',
        name: 'r',
        type: 'tuple',
      },
    ],
    name: 'executeRequest',
    outputs: [
      {
        components: [
          {
            internalType: 'uint256',
            name: 'data',
            type: 'uint256',
          },
          {
            internalType: 'uint8',
            name: 'valueType',
            type: 'uint8',
          },
        ],
        internalType: 'struct CapsulatedValue[]',
        name: 'results',
        type: 'tuple[]',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'oracleSvcId',
        type: 'bytes32',
      },
      {
        components: [
          {
            internalType: 'bytes32',
            name: 'id',
            type: 'bytes32',
          },
          {
            internalType: 'address',
            name: 'requester',
            type: 'address',
          },
          {
            internalType: 'bytes',
            name: 'ciphertext',
            type: 'bytes',
          },
          {
            internalType: 'uint8',
            name: 'ciphertextType',
            type: 'uint8',
          },
          {
            internalType: 'address',
            name: 'callbackAddr',
            type: 'address',
          },
          {
            internalType: 'bytes4',
            name: 'callbackFunc',
            type: 'bytes4',
          },
        ],
        internalType: 'struct SaveCiphertextRequest',
        name: 'req',
        type: 'tuple',
      },
    ],
    name: 'executeSaveCiphertextRequest',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'initialize',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'name',
    outputs: [
      {
        internalType: 'string',
        name: '',
        type: 'string',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'owner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'pendingOwner',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name_',
        type: 'string',
      },
    ],
    name: 'setName',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
