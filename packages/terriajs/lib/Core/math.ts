export function getMax(nums: number[]) {
  let len = nums.length;
  if (len === 0) return undefined;

  let max = -Infinity;

  while (len--) {
    max = nums[len] > max ? nums[len] : max;
  }
  return max;
}

export function getMin(nums: number[]) {
  let len = nums.length;
  if (len === 0) return undefined;

  let min = Infinity;

  while (len--) {
    min = nums[len] < min ? nums[len] : min;
  }
  return min;
}
