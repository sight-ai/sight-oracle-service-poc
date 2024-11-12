export const bigintToJSON = (key, value) =>
  typeof value === 'bigint' ? value.toString() + 'n' : value;

export const bigintFromJSON = (key, value) => {
  if (typeof value === 'string' && /^\d+n$/.test(value)) {
    return BigInt(value.slice(0, value.length - 1));
  }
  return value;
};
