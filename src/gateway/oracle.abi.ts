export const oracleAbi =  [
    {
        "inputs": [],
        "stateMutability": "nonpayable",
        "type": "constructor"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "owner",
                "type": "address"
            }
        ],
        "name": "OwnableInvalidOwner",
        "type": "error"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "account",
                "type": "address"
            }
        ],
        "name": "OwnableUnauthorizedAccount",
        "type": "error"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferStarted",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "address",
                "name": "previousOwner",
                "type": "address"
            },
            {
                "indexed": true,
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "OwnershipTransferred",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "name": "ReencryptCallback",
        "type": "event"
    },
    {
        "anonymous": false,
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
                        "internalType": "struct CapsulatedValue",
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
                "indexed": false,
                "internalType": "struct ReencryptRequestBuilder.ReencryptRequest",
                "name": "",
                "type": "tuple"
            }
        ],
        "name": "ReencryptSent",
        "type": "event"
    },
    {
        "anonymous": false,
        "inputs": [
            {
                "indexed": true,
                "internalType": "bytes32",
                "name": "",
                "type": "bytes32"
            },
            {
                "indexed": true,
                "internalType": "bool",
                "name": "",
                "type": "bool"
            }
        ],
        "name": "RequestCallback",
        "type": "event"
    },
    {
        "anonymous": false,
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
                        "internalType": "struct RequestBuilder.Operation[]",
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
                "indexed": false,
                "internalType": "struct RequestBuilder.Request",
                "name": "",
                "type": "tuple"
            }
        ],
        "name": "RequestSent",
        "type": "event"
    },
    {
        "inputs": [],
        "name": "acceptOwnership",
        "outputs": [],
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
                        "internalType": "struct RequestBuilder.Operation[]",
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
                "internalType": "struct RequestBuilder.Request",
                "name": "request",
                "type": "tuple"
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
                "internalType": "struct CapsulatedValue[]",
                "name": "result",
                "type": "tuple[]"
            }
        ],
        "name": "callback",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "owner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
            }
        ],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "pendingOwner",
        "outputs": [
            {
                "internalType": "address",
                "name": "",
                "type": "address"
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
                        "internalType": "struct CapsulatedValue",
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
                "internalType": "struct ReencryptRequestBuilder.ReencryptRequest",
                "name": "reen_req",
                "type": "tuple"
            }
        ],
        "name": "reencrypt",
        "outputs": [],
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
                        "internalType": "struct CapsulatedValue",
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
                "internalType": "struct ReencryptRequestBuilder.ReencryptRequest",
                "name": "reen_req",
                "type": "tuple"
            },
            {
                "internalType": "bytes",
                "name": "result",
                "type": "bytes"
            }
        ],
        "name": "reencryptCallback",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "renounceOwnership",
        "outputs": [],
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
                        "internalType": "struct RequestBuilder.Operation[]",
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
                "internalType": "struct RequestBuilder.Request",
                "name": "request",
                "type": "tuple"
            }
        ],
        "name": "send",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {
                "internalType": "address",
                "name": "newOwner",
                "type": "address"
            }
        ],
        "name": "transferOwnership",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    }
];