# Swapr Subgraph

[Swapr](https://swapr.eth.limo) is a decentralized protocol for automated token exchange on Ethereum.

This subgraph dynamically tracks any pair created by the swapr factory. It tracks the current state of Swapr contracts, and contains derived stats for things like historical data and USD prices.

- aggregated data across pairs and tokens,
- data on individual pairs and tokens,
- data on transactions
- data on liquidity providers
- historical data on Swapr, pairs or tokens, aggregated by day

## Running Locally

A local graph node can be run using the preconfigured Docker image provided by the `graphprotocol` [repository](https://github.com/graphprotocol/graph-node/tree/master/docker).

Once the graph node is up and running:

```sh
# create a local subgraph
yarn create-local
```

```sh
# deploy the subgraph on the local node
yarn deploy-local:<network_name>
```

## Queries

Below are a few ways to show how to query the swapr-subgraph for data. The queries show most of the information that is queryable, but there are many other filtering options that can be used, just check out the [querying api](https://thegraph.com/docs/en/querying/querying-the-graph). These queries can be used locally or in The Graph Explorer playground.

## Key Entity Overviews

#### SwaprFactory

Contains data across all of Swapr. This entity tracks important things like total liquidity (in ETH and USD, see below), all time volume, transaction count, number of pairs and more.

#### Token

Contains data on a specific token. This token specific data is aggregated across all pairs, and is updated whenever there is a transaction involving that token.

#### Pair

Contains data on a specific pair.

#### Transaction

Every transaction on Swapr is stored. Each transaction contains an array of mints, burns, and swaps that occured within it.

#### Mint, Burn, Swap

These contain specifc information about a transaction. Things like which pair triggered the transaction, amounts, sender, recipient, and more. Each is linked to a parent Transaction entity.

#### LiquidtyMiningCampaign

Contains data about a specific liquidity mining campaing, such as the start/end time, stakable pair, current stacked value, rewards and much more.

## Example Queries

### Querying Aggregated Swapr Data

This query fetches aggredated data from all swapr pairs and tokens, to give a view into how much activity is happening within the whole protocol.

```graphql
{
  swaprFactories(first: 1) {
    id
    pairCount
    totalVolumeUSD
    totalLiquidityUSD
  }
}
```

### Querying Top Pairs by Liquidity

This query fetches the top 10 pairs sorted by liquidity.

```graphql
{
  pairs(first: 10, orderBy: reserveUSD, orderDirection: desc) {
    id
    token0 {
      id
      symbol
    }
    token1 {
      id
      symbol
    }
    reserveUSD
  }
}
```

### Querying Recent Daily Activities

This query fetches the last 30 days of daily activities and interactions on swapr.

```graphql
{
  swaprDayDatas(first: 30, orderBy: date, orderDirection: desc) {
    id
    date
    dailySwaps
    dailyMints
    dailyBurns
    txCount
    dailyVolumeUSD
  }
}
```

### Querying Active Liquidity Mining Campaings

This query fetches the first 10 active liquidity mining campaings, sorted by the staked amount.

```graphql
{
  liquidityMiningCampaigns(
    first: 10
    where: { initialized: true, endsAt_gt: <unix_seconds> }
    orderBy: stakedAmount
    orderDirection: desc
  ) {
    id
    endsAt
    stakedAmount
    rewards {
      id
      token {
        id
        symbol
      }
      amount
    }
  }
}
```
