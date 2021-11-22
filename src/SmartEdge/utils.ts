export const round = (x: number, multiple = 10) =>
  Math.round(x / multiple) * multiple;

export const roundDown = (x: number, multiple = 10) =>
  Math.floor(x / multiple) * multiple;

export const roundUp = (x: number, multiple = 10) =>
  Math.ceil(x / multiple) * multiple;

export const toInteger = (value: number, min = 0) => {
  let result = Math.max(Math.round(value), min);
  result = Number.isInteger(result) ? result : min;
  result = result >= min ? result : min;
  return result;
};
