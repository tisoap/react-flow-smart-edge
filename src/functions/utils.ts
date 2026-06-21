export const round = (value: number, multiple = 10) =>
  Math.round(value / multiple) * multiple;

export const roundDown = (value: number, multiple = 10) =>
  Math.floor(value / multiple) * multiple;

export const roundUp = (value: number, multiple = 10) =>
  Math.ceil(value / multiple) * multiple;

export const toInteger = (value: number, min = 0) => {
  let result = Math.max(Math.round(value), min);
  result = Number.isInteger(result) ? result : min;
  result = result >= min ? result : min;
  return result;
};
