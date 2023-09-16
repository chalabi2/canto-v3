import Button from "@/components/button/button";
import Input from "@/components/input/input";
import Modal from "@/components/modal/modal";
import { CTokenLendingTxTypes } from "@/hooks/lending/interfaces/lendingTxTypes";
import useLending from "@/hooks/lending/useLending";
import useTransactionStore from "@/stores/transactionStore";
import useStore from "@/stores/useStore";
import {
  cTokenBorrowLimit,
  cTokenWithdrawLimit,
} from "@/utils/clm/positions.utils";
import { convertToBigNumber, formatBalance } from "@/utils/tokenBalances.utils";
import { useEffect, useMemo, useState } from "react";
import { useWalletClient } from "wagmi";

export default function TestLending() {
  const { data: signer } = useWalletClient();
  const txStore = useStore(useTransactionStore, (state) => state);

  const [amount, setAmount] = useState("");
  const { tokens, position, loading, transaction } = useLending({
    chainId: signer?.chain.id === 7701 ? 7701 : 7700,
    userEthAddress: signer?.account.address,
  });
  const sortedTokens = useMemo(() => {
    return tokens.sort((a, b) =>
      a.underlying.symbol.localeCompare(b.underlying.symbol)
    );
  }, [tokens]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedToken, setSelectedToken] = useState<any | null>(null);

  function lendingTx(txType: CTokenLendingTxTypes) {
    const { data, error } = transaction.createNewLendingFlow({
      chainId: signer?.chain.id === 7701 ? 7701 : 7700,
      ethAccount: signer!.account.address,
      cToken: selectedToken,
      amount: convertToBigNumber(
        amount,
        selectedToken.underlying.decimals
      ).data.toString(),
      txType,
    });
    if (error) {
      console.log(error);
      return;
    }
    txStore?.addNewFlow({ txFlow: data, signer });
  }

  const canPerformTx = (txType: CTokenLendingTxTypes) =>
    transaction.canPerformLendingTx({
      chainId: signer?.chain.id ?? 7700,
      ethAccount: signer?.account.address ?? "",
      cToken: selectedToken,
      amount: convertToBigNumber(
        amount,
        selectedToken.underlying.decimals
      ).data.toString(),
      txType,
    }).data;

  function onMax(txType: CTokenLendingTxTypes) {
    let maxAmount: string;
    switch (txType) {
      case CTokenLendingTxTypes.SUPPLY:
        maxAmount = selectedToken.userDetails?.balanceOfUnderlying;
        break;
      case CTokenLendingTxTypes.WITHDRAW:
        maxAmount = cTokenWithdrawLimit(
          selectedToken,
          position.liquidity,
          100
        ).data.toString();
        break;
      case CTokenLendingTxTypes.BORROW:
        maxAmount = cTokenBorrowLimit(
          selectedToken,
          position.liquidity,
          80
        ).data.toString();
        break;
      case CTokenLendingTxTypes.REPAY:
        maxAmount = Math.min(
          Number(selectedToken.userDetails?.borrowBalance),
          Number(selectedToken.userDetails?.balanceOfUnderlying)
        ).toString();
        break;
      default:
        maxAmount = "0";
    }
    setAmount(
      formatBalance(maxAmount, selectedToken.underlying.decimals, {
        precision: selectedToken.underlying.decimals,
      })
    );
  }

  return (
    <div>
      <h1>Test Lending</h1>
      <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
        <>
          {selectedToken && (
            <>
              <h2>{selectedToken.symbol}</h2>
              <h3>name: {selectedToken.name}</h3>
              <h3>Address: {selectedToken.address}</h3>
              <h3>BorrowApy: {selectedToken.borrowApy}</h3>
              <h3>BorrowCap: {selectedToken.borrowCap}</h3>
              <h3>Cash: {selectedToken.cash}</h3>
              <h3>CollateralFactor: {selectedToken.collateralFactor}</h3>
              <h3>Decimals: {selectedToken.decimals}</h3>
              <h3>DistApy: {selectedToken.distApy}</h3>
              <h3>Exchange Rate: {selectedToken.exchangeRate}</h3>
              <h3>IsListed: {selectedToken.isListed ? "yes" : "no"}</h3>
              <h3>Liquidity: {selectedToken.liquidity}</h3>
              <h3>Underlying Price: {selectedToken.price}</h3>
              <h3>Supply Apy: {selectedToken.supplyApy}</h3>
              <h1>----</h1>
              <h2>Underlying:</h2>
              <h3>Address: {selectedToken.underlying.address}</h3>
              <h3>Decimals: {selectedToken.underlying.decimals}</h3>
              <h3>Symbol: {selectedToken.underlying.symbol}</h3>
              <h3>Name: {selectedToken.underlying.name}</h3>
              <h1>----</h1>
              <h2>User Data:</h2>
              <h2>
                CToken Balance: {selectedToken.userDetails?.balanceOfCToken}
              </h2>
              <h2>
                Underlying Balance:{" "}
                {selectedToken.userDetails?.balanceOfUnderlying}
              </h2>
              <h2>
                Borrow Balance: {selectedToken.userDetails?.borrowBalance}
              </h2>
              <h2>Rewards: {selectedToken.userDetails?.rewards}</h2>
              <h2>
                Is Collateral:{" "}
                {selectedToken.userDetails?.isCollateral ? "yes" : "no"}
              </h2>
              <h2>
                Supply Balance In Underlying:{" "}
                {selectedToken.userDetails?.supplyBalanceInUnderlying}
              </h2>
              <h2>
                Allowance Underlying:{" "}
                {selectedToken.userDetails?.underlyingAllowance}
              </h2>
              <Input
                type="amount"
                balance={
                  selectedToken.userDetails.balanceOfUnderlying
                    ? selectedToken.userDetails.balanceOfUnderlying
                    : "0"
                }
                decimals={
                  selectedToken.underlying.decimals
                    ? selectedToken.underlying.decimals
                    : 0
                }
                value={amount}
                onChange={(val) => {
                  setAmount(val.target.value);
                }}
              />
              <div style={{ display: "flex", flexDirection: "row" }}>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  {" "}
                  <Button
                    color="accent"
                    disabled={!canPerformTx(CTokenLendingTxTypes.SUPPLY)}
                    onClick={() => lendingTx(CTokenLendingTxTypes.SUPPLY)}
                  >
                    SUPPLY
                  </Button>
                  <Button onClick={() => onMax(CTokenLendingTxTypes.SUPPLY)}>
                    MAX
                  </Button>
                </div>
                <div>
                  <Button
                    color="accent"
                    disabled={!canPerformTx(CTokenLendingTxTypes.WITHDRAW)}
                    onClick={() => lendingTx(CTokenLendingTxTypes.WITHDRAW)}
                  >
                    WITHDRAW
                  </Button>
                  <Button onClick={() => onMax(CTokenLendingTxTypes.WITHDRAW)}>
                    MAX
                  </Button>
                </div>
                <div>
                  <Button
                    color="accent"
                    disabled={!canPerformTx(CTokenLendingTxTypes.BORROW)}
                    onClick={() => lendingTx(CTokenLendingTxTypes.BORROW)}
                  >
                    BORROW
                  </Button>
                  <Button onClick={() => onMax(CTokenLendingTxTypes.BORROW)}>
                    MAX
                  </Button>
                </div>
                <div>
                  <Button
                    color="accent"
                    disabled={!canPerformTx(CTokenLendingTxTypes.REPAY)}
                    onClick={() => lendingTx(CTokenLendingTxTypes.REPAY)}
                  >
                    REPAY
                  </Button>
                  <Button onClick={() => onMax(CTokenLendingTxTypes.REPAY)}>
                    MAX
                  </Button>
                </div>
                <Button
                  onClick={() => {
                    lendingTx(
                      selectedToken.userDetails.isCollateral
                        ? CTokenLendingTxTypes.DECOLLATERALIZE
                        : CTokenLendingTxTypes.COLLATERALIZE
                    );
                  }}
                  disabled={
                    !canPerformTx(
                      selectedToken.userDetails.isCollateral
                        ? CTokenLendingTxTypes.DECOLLATERALIZE
                        : CTokenLendingTxTypes.COLLATERALIZE
                    )
                  }
                >{`${
                  selectedToken.userDetails.isCollateral
                    ? "DECOLLATERALIZE"
                    : "COLLATERLIAZE"
                }`}</Button>
              </div>
            </>
          )}
        </>
      </Modal>
      <h1>USER POSITION</h1>
      {position && (
        <>
          <h2>
            Total Borrow:{" "}
            {formatBalance(position.totalBorrow, 18, {
              commify: true,
              precision: 2,
            })}
          </h2>
          <h2>
            Total Supply:{" "}
            {formatBalance(position.totalSupply, 18, {
              commify: true,
              precision: 2,
            })}
          </h2>
          <h2>Total Liquidity: {formatBalance(position.liquidity, 18)}</h2>
          <h2>Total Shortfall: {formatBalance(position.shortfall, 18)}</h2>
          <h2>Total Rewards: {formatBalance(position.totalRewards, 18)}</h2>
          <h2>Average Apr: {position.avgApr}</h2>
        </>
      )}
      <h1>CTOKENS: </h1>
      {sortedTokens.map((cToken) => (
        <div key={cToken.address}>
          <h1>-------------------</h1>
          <h2>
            {cToken.underlying.symbol}{" "}
            <Button
              color="accent"
              onClick={() => {
                setSelectedToken(cToken);
                setModalOpen(true);
              }}
            >
              SELECT TOKEN
            </Button>
          </h2>
          <h1>-------------------</h1>
        </div>
      ))}
    </div>
  );
}
