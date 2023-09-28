import {
  NEW_ERROR,
  NO_ERROR,
  ReturnWithError,
  errMsg,
} from "@/config/interfaces";
import BigNumber from "bignumber.js";

/**
 * @notice converts a string amount to a big number
 * @dev truncates the amount to the number of decimals
 * @param {string} amount amount to convert
 * @param {number} decimals number of decimals to convert to
 * @returns {ReturnWithError<BigNumber>} converted amount or error
 */
export function convertToBigNumber(
  amount: string,
  decimals: number = 0
): ReturnWithError<BigNumber> {
  try {
    // set this to avoid scientific notation
    BigNumber.set({ EXPONENTIAL_AT: 35 });
    if (isNaN(Number(amount)) || !amount) throw new Error("Invalid amount");
    // truncate the amount to the number of decimals
    const decimalIndex = amount.indexOf(".");
    const truncatedAmount =
      decimalIndex === -1
        ? amount
        : amount.slice(0, decimalIndex + decimals + 1);
    const bigNumber = new BigNumber(truncatedAmount);
    const multiplier = new BigNumber(10).pow(decimals);
    const convertedAmount = bigNumber.multipliedBy(multiplier);
    return NO_ERROR(convertedAmount);
  } catch (err) {
    return NEW_ERROR("convertToBigNuber:" + errMsg(err));
  }
}

/**
 * @notice formats a balance to a string
 * @param {string | BigNumber} amount amount to format
 * @param {number} decimals number of decimals to format to
 * @param {object} options options to format with
 */
export function formatBalance(
  amount: string | BigNumber,
  decimals: number,
  options?: {
    symbol?: string;
    precision?: number;
    commify?: boolean;
  }
): string {
  // set this to avoid scientific notation
  BigNumber.set({ EXPONENTIAL_AT: 35 });
  const {
    symbol = undefined,
    precision = undefined,
    commify = false,
  } = options || {};
  const bnAmount = new BigNumber(amount);
  // make sure greater than zero
  if (bnAmount.isLessThanOrEqualTo(0)) return "0";
  // divide by 10^decimals
  const formattedAmount = bnAmount.dividedBy(new BigNumber(10).pow(decimals));
  // if precision is undefined, ret2 places after the first non-zero decimal
  let truncateAt =
    precision ??
    2 - Math.floor(Math.log(formattedAmount.toNumber()) / Math.log(10));
  // make sure tuncation is not negative or greater than decimals
  truncateAt = Math.max(0, Math.min(truncateAt, decimals));
  // convert amount to string
  const stringAmount = formattedAmount.toString();
  // get index of the decimal in the string
  const decimalIndex = stringAmount.indexOf(".");

  // if decimal index is -1, there is no decimals, else truncate at the decimal index + truncateAt + 1
  // if truncateAt is 0, then we want to only take the whole number
  const truncatedAmount =
    decimalIndex === -1
      ? stringAmount
      : stringAmount.slice(
          0,
          decimalIndex + truncateAt + (truncateAt === 0 ? 0 : 1)
        );

  // // create regex to truncate at the correct number of decimals
  // const regex = new RegExp("^-?\\d+(?:.\\d{0," + truncateAt + "})?");
  // const truncatedAmount = formattedAmount.toString().match(regex)?.[0] ?? "0";
  return `${
    commify
      ? truncatedAmount.replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",")
      : truncatedAmount
  }${symbol ? " " + symbol : ""}`;
}

/**
 * @notice adds two token balances
 * @dev must be from the same token to keep decimals
 * @param {string} amount1 first amount to add
 * @param {string} amount2 second amount to add
 * @returns {string} sum of the two amounts
 */
export function addTokenBalances(amount1: string, amount2: string): string {
  const [amount1BN, amount2BN] = [
    convertToBigNumber(amount1),
    convertToBigNumber(amount2),
  ];
  if (amount1BN.error || amount2BN.error) return "0";
  return amount1BN.data.plus(amount2BN.data).toString();
}
