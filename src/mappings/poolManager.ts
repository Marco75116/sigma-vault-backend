import { config, MappingContext } from "../main";
import { Log } from "../processor";
import * as poolManagerAbi from "../abi/poolManager";
import {
  createToken,
  incrementTokensSwapCount,
  updateTokenPrice,
} from "../utils/entities/token";
import {
  Hook,
  Pool,
  PoolDayData,
  PoolHourData,
  PoolManager,
  Token,
  Wallet,
} from "../model";
import {
  getHookId,
  getPoolDayDataId,
  getPoolHourDataId,
  getPoolId,
  getPoolManagerId,
  getTokenId,
  getWalletId,
} from "../utils/helpers/ids.helper";
import { createHook } from "../utils/entities/hook";
import { createPool, updatePoolStates } from "../utils/entities/pool";
import { getPricesFromSqrtPriceX96 } from "../utils/helpers/global.helper";
import { updatePositionAndPool } from "../utils/entities/position";
import { updatePoolDayData } from "../utils/entities/poolDayData";
import { updatePoolHourData } from "../utils/entities/poolHourData";
import { createModifyLiquidityReccord } from "../utils/entities/modifyLiquidityReccord";
import { createWallet } from "../utils/entities/wallet";
import { createSwapReccord } from "../utils/entities/swapReccord";
import { createDonateReccord } from "../utils/entities/donateReccord";
import { updateBundlePrice } from "../utils/entities/bundle";
import {
  incrementTokensDayDataSwapCount,
  updateTokenDayData,
} from "../utils/entities/tokenDayData";
import {
  incrementTokensHourDataSwapCount,
  updateTokenHourData,
} from "../utils/entities/tokenHourData";
import { addFeeVolumePoolManager } from "../utils/entities/poolManager";
import { ZERO_ADDRESS } from "../utils/constants/global.contant";

export const handleInitialize = (mctx: MappingContext, log: Log) => {
  let {
    currency0,
    currency1,
    hooks,
    tick,
    id,
    sqrtPriceX96,
    fee,
    tickSpacing,
  } = poolManagerAbi.events.Initialize.decode(log);

  mctx.store.defer(Token, getTokenId(currency0));
  mctx.store.defer(Token, getTokenId(currency1));
  mctx.store.defer(Hook, getHookId(hooks));

  mctx.queue.add(async () => {
    let token0;
    let token1;

    let token0Id = getTokenId(currency0);
    let token1Id = getTokenId(currency1);
    let hookId = getHookId(hooks);

    token0 = await mctx.store.get(Token, token0Id);
    if (!token0) {
      token0 = await createToken(mctx, currency0);
    }
    token0.poolCount += 1;

    token1 = await mctx.store.get(Token, token1Id);
    if (!token1) {
      token1 = await createToken(mctx, currency1);
    }
    token1.poolCount += 1;

    await mctx.store.upsert([token0, token1]);

    let hook = await mctx.store.get(Hook, hookId);
    if (!hook) {
      hook = createHook(hooks);
      await mctx.store.insert(hook);
    }

    let token0Decimals = token0?.decimals ?? 18;
    let token1Decimals = token1?.decimals ?? 18;

    const { token0Price, token1Price } = getPricesFromSqrtPriceX96(
      sqrtPriceX96,
      token0Decimals,
      token1Decimals
    );
    const pool = createPool(
      id,
      tick,
      sqrtPriceX96,
      fee,
      token0Id,
      token1Id,
      hookId,
      token0Price,
      token1Price,
      token0Decimals,
      token1Decimals,
      tickSpacing,
      log
    );
    await mctx.store.insert(pool);
  });
};

export const handleModifyLiquidity = (mctx: MappingContext, log: Log) => {
  let { id, liquidityDelta, salt, sender, tickLower, tickUpper } =
    poolManagerAbi.events.ModifyLiquidity.decode(log);

  mctx.store.defer(Pool, getPoolId(id));
  mctx.store.defer(Wallet, getWalletId(sender));

  mctx.queue.add(async () => {
    await updatePositionAndPool(
      mctx,
      log,
      id,
      liquidityDelta,
      salt,
      tickLower,
      tickUpper
    );
    const walletId = getWalletId(sender);
    let wallet = await mctx.store.get(Wallet, walletId);
    if (!wallet) {
      wallet = createWallet(sender);
      await mctx.store.insert(wallet);
    }

    if (config.permissionRecordTx.modifyLiquidity) {
      await createModifyLiquidityReccord(
        mctx,
        id,
        liquidityDelta,
        salt,
        walletId,
        tickLower,
        tickUpper,
        log
      );
    }
  });
};

export const handleSwap = (mctx: MappingContext, log: Log) => {
  let { id, amount0, amount1, fee, liquidity, sender, sqrtPriceX96, tick } =
    poolManagerAbi.events.Swap.decode(log);

  mctx.store.defer(Pool, getPoolId(id));
  mctx.store.defer(PoolDayData, getPoolDayDataId(id, log.block.timestamp));
  mctx.store.defer(PoolHourData, getPoolHourDataId(id, log.block.timestamp));
  mctx.store.defer(Wallet, getWalletId(sender));
  mctx.store.defer(PoolManager, getPoolManagerId());

  mctx.queue.add(async () => {
    await incrementTokensSwapCount(mctx, log, id);
    if (config.permissionRecordTx.tokendaydata) {
      await incrementTokensDayDataSwapCount(mctx, log, id);
    }
    if (config.permissionRecordTx.tokenhourdata) {
      await incrementTokensHourDataSwapCount(mctx, log, id);
    }
    const { volumeUSDAdded, feeUSDAdded } = await updatePoolStates(
      mctx,
      log,
      id,
      tick,
      liquidity,
      sqrtPriceX96,
      amount0,
      amount1,
      fee
    );

    await addFeeVolumePoolManager(mctx, volumeUSDAdded, feeUSDAdded);
    if (config.permissionRecordTx.pooldaydata) {
      await updatePoolDayData(
        mctx,
        log,
        id,
        liquidity,
        sqrtPriceX96,
        tick,
        amount0,
        amount1,
        fee
      );
    }
    if (config.permissionRecordTx.poolhourdata) {
      await updatePoolHourData(
        mctx,
        log,
        id,
        liquidity,
        sqrtPriceX96,
        tick,
        amount0,
        amount1,
        fee
      );
    }

    if (id === config.bundleSourcePoolId) {
      await updateBundlePrice(mctx);
    }
    const priceUpdate = await updateTokenPrice(mctx, id);
    if (priceUpdate) {
      if (config.permissionRecordTx.tokendaydata) {
        await updateTokenDayData(mctx, log, priceUpdate);
      }
      if (config.permissionRecordTx.tokenhourdata) {
        await updateTokenHourData(mctx, log, priceUpdate);
      }
    }

    const walletId = getWalletId(sender);
    let wallet = await mctx.store.get(Wallet, walletId);
    if (!wallet) {
      wallet = createWallet(sender);
      await mctx.store.insert(wallet);
    }

    if (config.permissionRecordTx.swap) {
      await createSwapReccord(
        mctx,
        id,
        walletId,
        log,
        amount0,
        amount1,
        fee,
        liquidity,
        sqrtPriceX96,
        tick
      );
    }
  });
};

export const handleDonate = (mctx: MappingContext, log: Log) => {
  let { id, amount0, amount1, sender } =
    poolManagerAbi.events.Donate.decode(log);

  mctx.store.defer(Wallet, getWalletId(sender));

  mctx.queue.add(async () => {
    const walletId = getWalletId(sender);
    let wallet = await mctx.store.get(Wallet, walletId);
    if (!wallet) {
      wallet = createWallet(sender);
      await mctx.store.insert(wallet);
    }

    if (config.permissionRecordTx.donate) {
      await createDonateReccord(mctx, id, walletId, log, amount0, amount1);
    }
  });
};
