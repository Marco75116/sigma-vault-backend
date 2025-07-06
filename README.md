# Sigma Vault Backend

This [squid](https://docs.subsquid.io/sdk/overview/) indexer tracks events emitted by Sigma Vault and EulerSwap smart contracts across multiple chains. It provides comprehensive indexing of vault operations, swap events, and real-time Telegram notifications for the Sigma Vault ecosystem.

## 🚀 Quickstart

**Dependencies: Node.js, Git, Docker.**

Here are the commands to run the squid:

```bash
# Prerequisite - Install Squid CLI:
npm i -g @subsquid/cli

# 1. Clone the repository
git clone https://github.com/Marco75116/sigma-vault-backend
cd sigma-vault-backend

# 2. Install dependencies
npm ci

# 3. Generate entities class and types
sqd codegen
sqd typegen

# 4. Create a .env file with custom configuration
cp .env.example .env

# (Don't forget to add your RPC endpoints, and BOT_TOKEN to the .env file when running locally)

# 5. Start a Postgres database container
sqd up

# 6. Generate database migrations
sqd migration:generate

# 7. Run the squid
# For a specific chain:
sqd process:{CHAIN_TAG}  # e.g., sqd process:eth or sqd process:base

# For all configured chains:
sqd run .

# 8. (in a separate terminal) Start the GraphQL server (only needed for single-chain mode)
sqd serve
```

GraphiQL playground will be available at [localhost:{GQL_PORT}/graphql](http://localhost:{GQL_PORT}/graphql) once the database and the GraphQL server are started.

## 🏗️ Architecture Overview

### Core Components

The Sigma Vault Backend is built on a modern stack with the following key components:

- **Subsquid EVM Processor**: High-performance blockchain indexing
- **TypeORM**: Database ORM with caching capabilities
- **Telegram Bot Integration**: Real-time notifications via Telegraf
- **Multi-chain Support**: Ethereum and Unichain
- **EulerSwap Integration**: Specialized indexing for EulerSwap pools and hooks

### Smart Contract Integration

The indexer tracks events from several key smart contracts:

1. **Sigma Vault** (`0xdc5Fc954B1Ae78A9a134A21bEcC5A2477b2be848`)

   - `TokensDeposited`: Tracks user deposits into the vault
   - `TokensWithdrawn`: Tracks user withdrawals from the vault

2. **EulerSwap Factory**

   - `PoolDeployed`: Monitors new EulerSwap pool deployments
   - Chain-specific addresses for Ethereum, Base, and Unichain

3. **EulerSwap Hook**

   - `Swap`: Tracks swap events through EulerSwap hooks
   - Real-time swap monitoring and analytics

4. **Pool Manager**
   - `Initialize`: Pool initialization events
   - Configurable event tracking for performance optimization

### Supported Networks

| Network  | Chain ID | Chain Tag | Status    |
| -------- | -------- | --------- | --------- |
| Ethereum | 1        | `eth`     | ✅ Active |
| Unichain | 130      | `uni`     | ✅ Active |

## 🔧 Configuration

### Network Configuration

Each network is configured in `src/utils/constants/network.constant.ts` with:

- **Contract Addresses**: Factory, Pool Manager, Sigma Vault, and NFT Position Manager
- **Block Ranges**: First blocks for each contract deployment
- **RPC Endpoints**: Chain-specific RPC URLs
- **Stable Tokens**: USDC, USDT, and other stablecoin configurations
- **Performance Settings**: Block intervals and permission controls

### Permission Control System

The squid implements a fine-grained permission control system through `permissionRecordTx` configuration:

```typescript
permissionRecordTx: {
  modifyLiquidity: false,
  swap: false,
  donate: false,
  poolhourdata: false,
  pooldaydata: false,
  tokenhourdata: false,
  tokendaydata: false,
}
```

This system allows selective recording of transaction types for optimal performance.

### Block Intervals

Configurable block intervals for performance optimization:

```typescript
blockIntervals: {
  poolsTvlUSD: 10, // Update TVL every 10 blocks
  coreTotalUSD: 15, // Update core totals every 15 blocks
}
```

## 📱 Telegram Bot Integration

### Real-time Notifications

The backend includes a Telegram bot integration that provides real-time notifications for:

- **Sigma Vault Deposits**: User deposits with token amounts and USD values
- **Sigma Vault Withdrawals**: User withdrawals with detailed information
- **EulerSwap Events**: Swap events with pool and token information

### Configuration

Telegram bot settings are configured in `src/utils/constants/tgbot.constant.ts`:

- **Channel**: `@sigmavaulteuler`
- **Rate Limiting**: 800ms message intervals
- **Retry Logic**: Up to 3 retries for failed messages
- **Chain-specific Links**: Explorer links for each supported network

## 🗄️ Data Models

### Core Entities

The GraphQL schema includes comprehensive data models:

- **SigmaVaultBalance**: User vault balances and deposit tracking
- **Pool**: EulerSwap pool information with TVL and volume metrics
- **Token**: Token metadata and pricing information
- **EulerSwapHook**: Hook-specific swap event tracking
- **Wallet**: User wallet tracking and position management
- **Position**: NFT position management (currently disabled for performance)

### Analytics Entities

- **PoolDayData**: Daily pool statistics and metrics
- **PoolHourData**: Hourly pool analytics
- **TokenDayData**: Daily token price and volume data
- **TokenHourData**: Hourly token metrics

## 🛠️ Development

### Adding a New Network

To add support for a new network:

1. **Configure Network Constants**

   ```bash
   # Add new network configuration to src/utils/constants/network.constant.ts
   ```

2. **Update Chain Configurations**

   ```bash
   # Add chain-specific settings to src/utils/constants/tgbot.constant.ts
   ```

3. **Generate Files**

   ```bash
   npm run gen
   ```

4. **Prefetch Token States**

   ```bash
   sqd get-tokens:{CHAIN_TAG}
   ```

5. **Run the Squid**
   ```bash
   sqd process:{CHAIN_TAG}
   ```

### Environment Variables

Required environment variables:

```bash
# RPC Endpoints
RPC_ETH_HTTP=your_ethereum_rpc_url
RPC_BASE_HTTP=your_base_rpc_url
RPC_UNICHAIN_HTTP=your_unichain_rpc_url

# Telegram Bot (optional)
TELEGRAM_BOT_TOKEN=your_bot_token
```

## 📊 Performance Features

### Token State Caching

The squid implements efficient token state caching through the `tokensRetriever` tool:

- **Persistent Storage**: Token data stored in `./assets/{CHAIN_TAG}/tokens.json`
- **RPC Optimization**: Reduces blockchain calls during reindexing
- **Performance Benefits**: Faster reindexing and reduced network load

### Queue-based Processing

Asynchronous processing using a task queue system:

- **Non-blocking Operations**: Database operations don't block event processing
- **Batch Processing**: Efficient handling of multiple events
- **Error Handling**: Robust error recovery and retry mechanisms

## 🔍 Monitoring and Analytics

### Real-time Metrics

- **Vault Balances**: Track user deposits and withdrawals
- **Pool Analytics**: TVL, volume, and swap count metrics
- **Token Performance**: Price tracking and volume analysis
- **Network Activity**: Cross-chain activity monitoring

### GraphQL API

Comprehensive GraphQL API for data querying:

- **Vault Operations**: Query user balances and transaction history
- **Pool Data**: Access pool statistics and performance metrics
- **Token Information**: Get token metadata and pricing data
- **Analytics**: Historical data and trend analysis

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
