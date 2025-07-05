export const SIGMA_VAULT_CHANNEL = "@sigmavaulteuler";

// Rate limiting configuration
export const TELEGRAM_MESSAGE_INTERVAL = 800;
export const TELEGRAM_MAX_RETRIES = 3;

export type ChainConfig = {
  name: string;
  tokenLink: string;
  txLink: string;
  uniLink: string;
};

export const chainConfigs: Record<number, ChainConfig> = {
  1: {
    name: "Ethereum",
    tokenLink: "https://etherscan.io/address/",
    txLink: "https://etherscan.io/tx/",
    uniLink: "https://app.uniswap.org/explore/pools/ethereum/",
  },
  8453: {
    name: "Base",
    tokenLink: "https://basescan.org/address/",
    txLink: "https://basescan.org/tx/",
    uniLink: "https://app.uniswap.org/explore/pools/base/",
  },
  130: {
    name: "Unichain",
    tokenLink: "https://unichain.blockscout.com/address/",
    txLink: "https://unichain.blockscout.com/tx/",
    uniLink: "https://app.uniswap.org/explore/pools/unichain/",
  },
};
