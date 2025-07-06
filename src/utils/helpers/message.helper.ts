import { format, toFormattedPercentage } from "./tgbot.helper";
import { ChainConfig, chainConfigs } from "../constants/tgbot.constant";
import { EulerSwapHook, Pool, SigmaVaultBalance, Token } from "../../model";
import { convertTokenToDecimal } from "./global.helper";
import { Log } from "../../processor";

export const getLinkMessage = (link: string, text: string) => {
  return `<a href="${link}">${text}</a>`;
};

export const getEulerSwapHookMessage = (
  eulerSwapHook: EulerSwapHook,
  token0: Token,
  token1: Token,
  pool: Pool
) => {
  const chainConfig = chainConfigs[eulerSwapHook.chainId] as ChainConfig;

  const {
    hookId,
    reserve0,
    reserve1,
    amount0In,
    amount1In,
    amount0Out,
    amount1Out,
    to,
    hash,
    txAtTimestamp,
    txAtBlockNumber,
  } = eulerSwapHook;

  const token0Link = getLinkMessage(
    `${chainConfig.tokenLink}${token0.tokenAddress}`,
    token0.symbol
  );
  const token1Link = getLinkMessage(
    `${chainConfig.tokenLink}${token1.tokenAddress}`,
    token1.symbol
  );
  const poolLink = getLinkMessage(
    `https://maglev.euler.finance/euler-swap/`,
    "Interface"
  );
  const transactionLink = getLinkMessage(
    `${chainConfig.txLink}${hash}`,
    "Transaction"
  );

  const sqdLink = getLinkMessage("https://sqd.dev", "SQD");

  const hookLink = getLinkMessage(
    `${chainConfig.tokenLink}${hookId.split("-")[1]}`,
    "Hook"
  );

  const creatorLink = getLinkMessage(
    "https://t.me/marcopoloo33",
    "Marcopoloo33"
  );

  return `
  ⚡  Euler Protocol <b>New Swap</b> - ${chainConfig.name} 

<b>Pool:</b> <code>${pool.id.split("-")[1]}</code>

<b>Pool balances:</b>
${format(Number(pool.amount0D), 3)} ${token0.symbol} | ${format(
    Number(pool.amount1D),
    3
  )} ${token1.symbol} 

💰 <b>Reserves:</b> ${format(Number(pool.amount0D), 3)} ${
    token0.symbol
  } | ${format(Number(pool.amount1D), 3)} ${token1.symbol}

🗓️ <b>Date:</b> ${new Date(
    Number(pool.createdAtTimestamp)
  ).toLocaleDateString()}
🧱 <b>Block:</b> ${pool.createdAtBlockNumber}

<b>EulerSwapHook Details:</b>

📥 <b>Amount In:</b> ${
    Number(amount0In) > 0
      ? `${format(
          Number(convertTokenToDecimal(amount0In, token0.decimals)),
          3
        )} ${token0.symbol}`
      : ""
  }${Number(amount0In) > 0 && Number(amount1In) > 0 ? " | " : ""}${
    Number(amount1In) > 0
      ? `${format(
          Number(convertTokenToDecimal(amount1In, token1.decimals)),
          3
        )} ${token1.symbol}`
      : ""
  }
📤 <b>Amount Out:</b> ${
    Number(amount0Out) > 0
      ? `${format(
          Number(convertTokenToDecimal(amount0Out, token0.decimals)),
          3
        )} ${token0.symbol}`
      : ""
  }${Number(amount0Out) > 0 && Number(amount1Out) > 0 ? " | " : ""}${
    Number(amount1Out) > 0
      ? `${format(
          Number(convertTokenToDecimal(amount1Out, token1.decimals)),
          3
        )} ${token1.symbol}`
      : ""
  }
👤 <b>To:</b> <code>${to}</code>

⏰ <b>Hook TX Date:</b> ${new Date(Number(txAtTimestamp)).toLocaleDateString()}
🧱 <b>Hook TX Block:</b> ${txAtBlockNumber}

⚡ <b>Euler Maglev</b>: ${poolLink}
↗️ <b>Scanner:</b> ${hookLink} | ${token0Link} | ${token1Link} | ${transactionLink}

Powered by ${sqdLink} 🦑
Created by ${creatorLink} 👨‍💻
`;
};

export const getSigmaVaultMessageDeposit = (
  sigmaVault: SigmaVaultBalance,
  token0: Token,
  token1: Token,
  log: Log,
  amount0Added: bigint,
  amount1Added: bigint
) => {
  const chainConfig = chainConfigs[sigmaVault.chainId] as ChainConfig;

  const poolLink = getLinkMessage(
    `https://maglev.euler.finance/euler-swap/`,
    "Interface"
  );

  const token0Link = getLinkMessage(
    `${chainConfig.tokenLink}${token0.tokenAddress}`,
    token0.symbol
  );
  const token1Link = getLinkMessage(
    `${chainConfig.tokenLink}${token1.tokenAddress}`,
    token1.symbol
  );
  const transactionLink = getLinkMessage(
    `${chainConfig.txLink}${log.transactionHash}`,
    "Transaction"
  );

  const userLink = getLinkMessage(
    `${chainConfig.txLink}${sigmaVault.userId.split("-")[1]}`,
    "User"
  );

  const sqdLink = getLinkMessage("https://sqd.dev", "SQD");

  const creatorLink = getLinkMessage(
    "https://t.me/marcopoloo33",
    "Marcopoloo33"
  );

  return `
⬇️ <b>Sigma Vault</b> - DEPOSIT - ${chainConfig.name}

<b>User:</b> <code>${sigmaVault.userId.split("-")[1]}</code>

<b>Current balances:</b>
${format(
  Number(convertTokenToDecimal(sigmaVault.amount0, token0.decimals)),
  3
)} ${token0.symbol} (+${format(
    Number(convertTokenToDecimal(amount0Added, token0.decimals)),
    3
  )} ${token0.symbol})

${format(
  Number(convertTokenToDecimal(sigmaVault.amount1, token1.decimals)),
  3
)} ${token1.symbol} (+${format(
    Number(convertTokenToDecimal(amount1Added, token1.decimals)),
    3
  )} ${token1.symbol})

⚡ <b>Euler Maglev</b>: ${poolLink}
↗️ <b>Scanner:</b> ${token0Link} | ${token1Link} | ${transactionLink} | ${userLink}

Powered by ${sqdLink} 🦑
Created by ${creatorLink} 👨‍💻
`;
};

export const getSigmaVaultMessageWithdraw = (
  sigmaVault: SigmaVaultBalance,
  token0: Token,
  token1: Token,
  log: Log,
  amount0Withdrawn: bigint,
  amount1Withdrawn: bigint
) => {
  const chainConfig = chainConfigs[sigmaVault.chainId] as ChainConfig;

  const poolLink = getLinkMessage(
    `https://maglev.euler.finance/euler-swap/`,
    "Interface"
  );

  const token0Link = getLinkMessage(
    `${chainConfig.tokenLink}${token0.tokenAddress}`,
    token0.symbol
  );
  const token1Link = getLinkMessage(
    `${chainConfig.tokenLink}${token1.tokenAddress}`,
    token1.symbol
  );
  const transactionLink = getLinkMessage(
    `${chainConfig.txLink}${log.transactionHash}`,
    "Transaction"
  );

  const userLink = getLinkMessage(
    `${chainConfig.txLink}${sigmaVault.userId.split("-")[1]}`,
    "User"
  );

  const sqdLink = getLinkMessage("https://sqd.dev", "SQD");

  const creatorLink = getLinkMessage(
    "https://t.me/marcopoloo33",
    "Marcopoloo33"
  );

  return `
⬆️ <b>Sigma Vault</b> - WITHDRAW - ${chainConfig.name}

<b>User:</b> <code>${sigmaVault.userId.split("-")[1]}</code>

<b>Current balances:</b>
${format(
  Number(convertTokenToDecimal(sigmaVault.amount0, token0.decimals)),
  3
)} ${token0.symbol} (-${format(
    Number(convertTokenToDecimal(amount0Withdrawn, token0.decimals)),
    3
  )} ${token0.symbol})

${format(
  Number(convertTokenToDecimal(sigmaVault.amount1, token1.decimals)),
  3
)} ${token1.symbol} (-${format(
    Number(convertTokenToDecimal(amount1Withdrawn, token1.decimals)),
    3
  )} ${token1.symbol})

⚡ <b>Euler Maglev</b>: ${poolLink}
↗️ <b>Scanner:</b> ${token0Link} | ${token1Link} | ${transactionLink} | ${userLink}

Powered by ${sqdLink} 🦑
Created by ${creatorLink} 👨‍💻
`;
};
