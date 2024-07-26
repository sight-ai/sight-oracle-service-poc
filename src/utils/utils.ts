export const stringifyBigInt = (key, value) => {
    return typeof value === 'bigint' ? value.toString() : value;
};

