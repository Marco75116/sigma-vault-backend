import { config, MappingContext } from "../main";
import * as eulerSwapHookAbi from "../abi/eulerswaphook";
import { EulerSwapHook, Pool, Token } from "../model";
import { getHookId, getSwapReccordId } from "../utils/helpers/ids.helper";
import { Log } from "../processor";
import { convertTokenToDecimal } from "../utils/helpers/global.helper";
import { ONE_BI } from "../utils/constants/global.contant";
import { getEulerSwapHookMessage } from "../utils/helpers/message.helper";
import { sendMessageToSigmaVaultChannel } from "../utils/helpers/tgbot.helper";

export const eulerSwapHook = async (mctx: MappingContext, log: Log) => {
  const {
    sender,
    amount0In,
    amount1In,
    amount0Out,
    amount1Out,
    reserve0,
    reserve1,
    to,
  } = eulerSwapHookAbi.events.Swap.decode(log);

  mctx.queue.add(async () => {
    const eulerSwapHook = new EulerSwapHook({
      id: getSwapReccordId(log.id),
      hookId: getHookId(log.address),
      reserve0: reserve0,
      reserve1: reserve1,
      amount0In: amount0In,
      amount1In: amount1In,
      amount0Out: amount0Out,
      amount1Out: amount1Out,
      to: to,
      chainId: config.chainId,
      hash: log.transactionHash,
      txAtTimestamp: BigInt(log.block.timestamp),
      txAtBlockNumber: BigInt(log.block.height),
    });
    await mctx.store.insert(eulerSwapHook);

    const pool = await mctx.store.findOne(Pool, {
      where: {
        hookId: getHookId(log.address),
      },
    });
    if (!pool) {
      console.log("Pool not found", log.address);
      return;
    }
    pool.amount0 = reserve0;
    pool.amount1 = reserve1;

    pool.amount0D = convertTokenToDecimal(pool.amount0, pool.token0Decimals);
    pool.amount1D = convertTokenToDecimal(pool.amount1, pool.token1Decimals);

    pool.swapCount += ONE_BI;

    pool.volumeToken0 += amount0In;
    pool.volumeToken1 += amount1In;

    pool.volumeToken0D = convertTokenToDecimal(
      pool.volumeToken0,
      pool.token0Decimals
    );
    pool.volumeToken1D = convertTokenToDecimal(
      pool.volumeToken1,
      pool.token1Decimals
    );

    await mctx.store.upsert(pool);

    const token0 = await mctx.store.getOrFail(Token, pool.token0Id);
    const token1 = await mctx.store.getOrFail(Token, pool.token1Id);
    const message = getEulerSwapHookMessage(
      eulerSwapHook,
      token0,
      token1,
      pool
    );
    sendMessageToSigmaVaultChannel(message);
  });
};
