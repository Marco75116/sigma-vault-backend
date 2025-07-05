import { config, MappingContext } from "../main";
import * as eulerSwapHookAbi from "../abi/eulerswaphook";
import { EulerSwapHook, SwapReccord } from "../model";
import { getHookId, getSwapReccordId } from "../utils/helpers/ids.helper";
import { Log } from "../processor";

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
  });
};
