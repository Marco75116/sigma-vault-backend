import {
  BlockHeader,
  DataHandlerContext,
  EvmBatchProcessor,
  EvmBatchProcessorFields,
  Log as _Log,
  Transaction as _Transaction,
  BlockData as _BlockData,
  assertNotNull,
  FieldSelection,
} from "@subsquid/evm-processor";
import * as poolManagerAbi from "./abi/poolManager";
import * as nftPositionAbi from "./abi/nftPosition";
import * as eulerSwapFactoryAbi from "./abi/eulerswapfactory";
import * as eulerSwapHookAbi from "./abi/eulerswaphook";
import * as sigmaVaultAbi from "./abi/sigmavault";
import { NetworkConfig } from "./utils/constants/network.constant";

const fields = {
  log: {
    transactionHash: true,
  },
} satisfies FieldSelection;

export type Fields = typeof fields;
export type Block = BlockHeader<Fields>;
export type BlockData = _BlockData<Fields>;
export type Log = _Log<Fields>;
export type Transaction = _Transaction<Fields>;
export type ProcessorContext<Store> = DataHandlerContext<Store, Fields>;

export const makeProcessor = (config: NetworkConfig) => {
  return (
    new EvmBatchProcessor()
      .setGateway(config.gatewaySqdUrl)
      .setRpcEndpoint({
        url: assertNotNull(
          config.rpcUrl,
          "Required env variable RPC_HTTP is missing"
        ),
      })
      .setFinalityConfirmation(75)
      .addLog({
        address: [config.eulerSwapFactory],
        range: { from: config.eulerSwapFactoryFirstBlock },
        topic0: [eulerSwapFactoryAbi.events.PoolDeployed.topic],
        transactionLogs: true,
        transaction: true,
      })
      .addLog({
        range: { from: config.eulerSwapFactoryFirstBlock },
        topic0: [eulerSwapHookAbi.events.Swap.topic],
      })
      // .addLog({
      //   address: [config.nftPositionManager],
      //   range: { from: config.nftPositionManagerFirstBlock },
      //   topic0: [nftPositionAbi.events.Transfer.topic],
      // })
      .addLog({
        address: [config.poolManager],
        range: { from: config.poolManagerFirstBlock },
        topic0: [
          poolManagerAbi.events.Initialize.topic,
          // poolManagerAbi.events.ModifyLiquidity.topic,
          // poolManagerAbi.events.Swap.topic,
          // poolManagerAbi.events.Donate.topic,
        ],
        transaction: true,
      })
      .addLog({
        address: [config.sigmaVault],
        range: { from: config.sigmaVaultFirstBlock },
        topic0: [
          sigmaVaultAbi.events.TokensDeposited.topic,
          sigmaVaultAbi.events.TokensWithdrawn.topic,
        ],
      })
      .setFields({
        log: {
          transactionHash: true,
        },
      })
  );
};
