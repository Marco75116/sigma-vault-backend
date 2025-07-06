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
    let wallet = await mctx.store.get(Wallet, getWalletId(user));
    if (!wallet) {
      wallet = createWallet(user);
      await mctx.store.insert(wallet);
    }

    let sigmaVaultBalance = await mctx.store.get(
      SigmaVaultBalance,
      getSigmaVaultBalanceId(user, token0, token1)
    );
    if (!sigmaVaultBalance) {
      sigmaVaultBalance = new SigmaVaultBalance({
        id: getSigmaVaultBalanceId(user, token0, token1),
        token0Id: getTokenId(token0),
        token1Id: getTokenId(token1),
        amount0: ZERO_BI,
        amount1: ZERO_BI,
        chainId: config.chainId,
        userId: wallet.id,
      });
    }
    sigmaVaultBalance.depositId = depositId;
    sigmaVaultBalance.amount0 += amount0;
    sigmaVaultBalance.amount1 += amount1;

    await mctx.store.upsert(sigmaVaultBalance);

    const token0Entity = await mctx.store.getOrFail(
      Token,
      sigmaVaultBalance.token0Id
    );
    const token1Entity = await mctx.store.getOrFail(
      Token,
      sigmaVaultBalance.token1Id
    );
    const message = getSigmaVaultMessageDeposit(
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
    sigmaVaultBalance.amount0 -= amount0;
    sigmaVaultBalance.amount1 -= amount1;

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
