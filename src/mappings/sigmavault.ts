import { config, MappingContext } from "../main";
import { Log } from "../processor";
import * as sigmaVaultAbi from "../abi/sigmavault";
import { SigmaVaultBalance, Token, Wallet } from "../model";
import {
  getSigmaVaultBalanceId,
  getTokenId,
  getWalletId,
} from "../utils/helpers/ids.helper";
import { ZERO_BI } from "../utils/constants/global.contant";
import { createWallet } from "../utils/entities/wallet";
import {
  getSigmaVaultMessageDeposit,
  getSigmaVaultMessageWithdraw,
} from "../utils/helpers/message.helper";
import { sendMessageToSigmaVaultChannel } from "../utils/helpers/tgbot.helper";

export const handleTokensDeposited = async (mctx: MappingContext, log: Log) => {
  const { depositId, user, token0, amount0, token1, amount1 } =
    sigmaVaultAbi.events.TokensDeposited.decode(log);

  mctx.queue.add(async () => {
    console.log("TokensDeposited 0");
    let wallet = await mctx.store.get(Wallet, getWalletId(user));
    if (!wallet) {
      wallet = createWallet(user);
      await mctx.store.insert(wallet);
    }

    let sigmaVaultBalance = await mctx.store.get(
      SigmaVaultBalance,
      getSigmaVaultBalanceId(user, token0, token1)
    );
    console.log("TokensDeposited 0.1");
    if (!sigmaVaultBalance) {
      const sortedToken0 =
        token0.toLowerCase() < token1.toLowerCase() ? token0 : token1;
      const sortedToken1 =
        token0.toLowerCase() < token1.toLowerCase() ? token1 : token0;

      // Determine if tokens were swapped during sorting
      const tokensSwapped = token0.toLowerCase() > token1.toLowerCase();

      sigmaVaultBalance = new SigmaVaultBalance({
        id: getSigmaVaultBalanceId(user, token0, token1),
        token0Id: getTokenId(sortedToken0),
        token1Id: getTokenId(sortedToken1),
        amount0: ZERO_BI,
        amount1: ZERO_BI,
        chainId: config.chainId,
        userId: wallet.id,
      });
    }
    sigmaVaultBalance.depositId = depositId;

    // Determine if tokens were swapped during sorting for the existing balance
    const tokensSwapped =
      sigmaVaultBalance.token0Id.toLowerCase() !==
      getTokenId(token0).toLowerCase();

    // Add amounts based on whether tokens were swapped
    if (tokensSwapped) {
      sigmaVaultBalance.amount0 += amount1;
      sigmaVaultBalance.amount1 += amount0;
    } else {
      sigmaVaultBalance.amount0 += amount0;
      sigmaVaultBalance.amount1 += amount1;
    }

    await mctx.store.upsert(sigmaVaultBalance);

    console.log("TokensDeposited 0.2");

    const token0Entity = await mctx.store.getOrFail(
      Token,
      sigmaVaultBalance.token0Id
    );
    console.log("TokensDeposited 1");

    const token1Entity = await mctx.store.getOrFail(
      Token,
      sigmaVaultBalance.token1Id
    );
    console.log("TokensDeposited 2");

    const message = getSigmaVaultMessageDeposit(
      sigmaVaultBalance,
      token0Entity,
      token1Entity,
      log,
      amount0,
      amount1
    );
    console.log("TokensDeposited 1");
    sendMessageToSigmaVaultChannel(message);
  });
};

export const handleTokensWithdrawn = async (mctx: MappingContext, log: Log) => {
  const { depositId, user, token0, amount0, token1, amount1 } =
    sigmaVaultAbi.events.TokensWithdrawn.decode(log);

  mctx.queue.add(async () => {
    let sigmaVaultBalance = await mctx.store.get(
      SigmaVaultBalance,
      getSigmaVaultBalanceId(user, token0, token1)
    );
    if (!sigmaVaultBalance) {
      return;
    }

    // Determine if tokens were swapped during sorting for the existing balance
    const tokensSwapped =
      sigmaVaultBalance.token0Id.toLowerCase() !==
      getTokenId(token0).toLowerCase();

    // Subtract amounts based on whether tokens were swapped
    if (tokensSwapped) {
      sigmaVaultBalance.amount0 -= amount1;
      sigmaVaultBalance.amount1 -= amount0;
    } else {
      sigmaVaultBalance.amount0 -= amount0;
      sigmaVaultBalance.amount1 -= amount1;
    }

    await mctx.store.upsert(sigmaVaultBalance);

    const token0Entity = await mctx.store.getOrFail(
      Token,
      sigmaVaultBalance.token0Id
    );
    const token1Entity = await mctx.store.getOrFail(
      Token,
      sigmaVaultBalance.token1Id
    );
    const message = getSigmaVaultMessageWithdraw(
      sigmaVaultBalance,
      token0Entity,
      token1Entity,
      log,
      amount0,
      amount1
    );
    sendMessageToSigmaVaultChannel(message);
  });
};
