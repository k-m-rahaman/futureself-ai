export const branchColors = ["#a5a0ff", "#62d5f1", "#59dbad"];

export const pathNumber = (index: number) => String(index + 1).padStart(2, "0");

export function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}
