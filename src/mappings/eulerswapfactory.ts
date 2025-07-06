import { config, MappingContext } from "../main";
import { Log } from "../processor";
import * as eulerSwapFactoryAbi from "../abi/eulerswapfactory";
import * as poolManagerAbi from "../abi/poolManager";
import { Pool } from "../model";
import { getPoolId } from "../utils/helpers/ids.helper";

export const flagPool = async (mctx: MappingContext, log: Log) => {
  const { currency0, currency1, hooks, id } =
    poolManagerAbi.events.Initialize.decode(log);

  const pool = await mctx.store.get(Pool, getPoolId(id));
  if (!pool) {
    return;
  }
  pool.eulerpoolflag = true;

  mctx.store.upsert(pool);
};

export const handlePoolDeployed = (mctx: MappingContext, log: Log) => {
  const { asset0, asset1, eulerAccount, pool } =
    eulerSwapFactoryAbi.events.PoolDeployed.decode(log);

  mctx.queue.add(async () => {
    for (let txLog of log.transaction?.logs ?? []) {
      if (txLog.address === config.poolManager) {
        switch (txLog.topics[0]) {
          case poolManagerAbi.events.Initialize.topic:
            await flagPool(mctx, txLog);
            break;
        }
      }
    }
  });
};
