export const computeProxyAbi = [
    {
        "inputs": [],
        "name": "ECDSAInvalidSignature",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "length",
                "type": "uint256"
            }
        ],
        "name": "ECDSAInvalidSignatureLength",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "bytes32",
                "name": "s",
                "type": "bytes32"
            }
        ],
        "name": "ECDSAInvalidSignatureS",
        "type": "error"
    },
    {
        "inputs": [],
        "name": "InvalidShortString",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "string",
                "name": "str",
                "type": "string"
            }
        ],
        "name": "StringTooLong",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [],
        "name": "EIP712DomainChanged",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "id",
                "type": "bytes32"
            },
            {
                "indexed": false,
                "internalType": "bytes",
                "name": "results",
                "type": "bytes"
            }
        ],
        "name": "ReencryptRequestResolved",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": false,
                "internalType": "bytes32",
                "name": "id",
                "type": "bytes32"
            },
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "data",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint8",
                        "name": "valueType",
                        "type": "uint8"
                    }
                ],
                "indexed": false,
                "internalType": "struct ComputeProxy_Demo27.CapsulatedValue[]",
                "name": "results",
                "type": "tuple[]"
            }
        ],
        "name": "RequestResolved",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "eip712Domain",
        "outputs": [
            {
                "internalType": "bytes1",
                "name": "fields",
                "type": "bytes1"
            },
            {
                "internalType": "string",
                "name": "name",
                "type": "string"
            },
            {
                "internalType": "string",
                "name": "version",
                "type": "string"
            },
            {
                "internalType": "uint256",
                "name": "chainId",
                "type": "uint256"
            },
            {
                "internalType": "address",
                "name": "verifyingContract",
                "type": "address"
            },
            {
                "internalType": "bytes32",
                "name": "salt",
                "type": "bytes32"
            },
            {
                "internalType": "uint256[]",
                "name": "extensions",
                "type": "uint256[]"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "bytes32",
                        "name": "id",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "address",
                        "name": "requester",
                        "type": "address"
                    },
                    {
                        "components": [
                            {
                                "internalType": "uint8",
                                "name": "opcode",
                                "type": "uint8"
                            },
                            {
                                "internalType": "uint256[]",
                                "name": "operands",
                                "type": "uint256[]"
                            },
                            {
                                "internalType": "uint64",
                                "name": "value",
                                "type": "uint64"
                            }
                        ],
                        "internalType": "struct ComputeProxy_Demo27.Operation[]",
                        "name": "ops",
                        "type": "tuple[]"
                    },
                    {
                        "internalType": "uint256",
                        "name": "opsCursor",
                        "type": "uint256"
                    },
                    {
                        "internalType": "address",
                        "name": "callbackAddr",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes4",
                        "name": "callbackFunc",
                        "type": "bytes4"
                    },
                    {
                        "internalType": "bytes",
                        "name": "extraData",
                        "type": "bytes"
                    }
                ],
                "internalType": "struct ComputeProxy_Demo27.Request",
                "name": "r",
                "type": "tuple"
            }
        ],
        "name": "executeRequest",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "data",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint8",
                        "name": "valueType",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct ComputeProxy_Demo27.CapsulatedValue[]",
                "name": "results",
                "type": "tuple[]"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "getEbool",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "data",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint8",
                        "name": "valueType",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct ComputeProxy_Demo27.CapsulatedValue",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "uint256",
                "name": "index",
                "type": "uint256"
            }
        ],
        "name": "getEuint64",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "data",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint8",
                        "name": "valueType",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct ComputeProxy_Demo27.CapsulatedValue",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "randEuint64",
        "outputs": [
            {
                "components": [
                    {
                        "internalType": "uint256",
                        "name": "data",
                        "type": "uint256"
                    },
                    {
                        "internalType": "uint8",
                        "name": "valueType",
                        "type": "uint8"
                    }
                ],
                "internalType": "struct ComputeProxy_Demo27.CapsulatedValue",
                "name": "",
                "type": "tuple"
            }
        ],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "components": [
                    {
                        "internalType": "bytes32",
                        "name": "id",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "address",
                        "name": "requester",
                        "type": "address"
                    },
                    {
                        "components": [
                            {
                                "internalType": "uint256",
                                "name": "data",
                                "type": "uint256"
                            },
                            {
                                "internalType": "uint8",
                                "name": "valueType",
                                "type": "uint8"
                            }
                        ],
                        "internalType": "struct ComputeProxy_Demo27.CapsulatedValue",
                        "name": "target",
                        "type": "tuple"
                    },
                    {
                        "internalType": "bytes32",
                        "name": "publicKey",
                        "type": "bytes32"
                    },
                    {
                        "internalType": "bytes",
                        "name": "signature",
                        "type": "bytes"
                    },
                    {
                        "internalType": "address",
                        "name": "callbackAddr",
                        "type": "address"
                    },
                    {
                        "internalType": "bytes4",
                        "name": "callbackFunc",
                        "type": "bytes4"
                    }
                ],
                "internalType": "struct ComputeProxy_Demo27.ReencryptRequest",
                "name": "reen_req",
                "type": "tuple"
            }
        ],
        "name": "reencrypt",
        "outputs": [
            {
                "internalType": "bytes",
                "name": "",
                "type": "bytes"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    }
];