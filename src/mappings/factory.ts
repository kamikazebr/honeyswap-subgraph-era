/* eslint-disable prefer-const */
import { BigInt, log } from '@graphprotocol/graph-ts'
import { HoneyswapFactory, Pair, Token, Bundle } from '../types/schema'
import { PairCreated } from '../types/Factory/Factory'
import { Pair as PairTemplate } from '../types/templates'
import { Pair as PairContract } from '../types/templates/Pair/Pair'
import {
  ZERO_BD,
  ZERO_BI,
  fetchTokenSymbol,
  fetchTokenName,
  fetchTokenDecimals,
  fetchTokenTotalSupply
} from './helpers'
import { getFactoryAddress, getLiquidityTrackingTokenAddresses } from '../commons/addresses'

/**
 * Returns the HoneyswapFactory entity. Creates a new entity if it doesn't exist.
 * @returns {HoneyswapFactory} the HoneyswapFactory entity
 */
export function getHoneyswapFactory(): HoneyswapFactory {
  // load factory (create if first exchange)
  let factoryAddress = getFactoryAddress()
  let factory = HoneyswapFactory.load(factoryAddress)
  if (factory === null) {
    factory = new HoneyswapFactory(factoryAddress)
    factory.pairCount = 0
    factory.totalVolumeNativeCurrency = ZERO_BD
    factory.totalLiquidityNativeCurrency = ZERO_BD
    factory.totalVolumeUSD = ZERO_BD
    factory.untrackedVolumeUSD = ZERO_BD
    factory.totalLiquidityUSD = ZERO_BD
    factory.txCount = ZERO_BI

    // create new bundle
    let bundle = new Bundle('1')
    bundle.nativeCurrencyPrice = ZERO_BD
    bundle.save()
  }

  factory.save()

  return factory
}

/**
 *
 * @param event
 * @returns
 */
export function getBundle(): Bundle {
  // create new bundle
  let bundle = Bundle.load('1')

  if (bundle === null) {
    // create new bundle
    bundle = new Bundle('1')
    bundle.nativeCurrencyPrice = ZERO_BD
  }

  bundle.save()

  return bundle
}

export function handleNewPair(event: PairCreated): void {
  let factory = getHoneyswapFactory()
  factory.pairCount = factory.pairCount + 1
  factory.save()

  // create the tokens
  let token0 = Token.load(event.params.token0.toHexString())
  let token1 = Token.load(event.params.token1.toHexString())

  // fetch info if null
  if (token0 === null) {
    token0 = new Token(event.params.token0.toHexString())
    token0.symbol = fetchTokenSymbol(event.params.token0)
    token0.name = fetchTokenName(event.params.token0)
    token0.totalSupply = fetchTokenTotalSupply(event.params.token0)
    let decimals = fetchTokenDecimals(event.params.token0)
    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      log.debug('mybug the decimal on token 0 was null', [])
      return
    }

    token0.decimals = decimals
    token0.derivedNativeCurrency = ZERO_BD
    token0.tradeVolume = ZERO_BD
    token0.tradeVolumeUSD = ZERO_BD
    token0.untrackedVolumeUSD = ZERO_BD
    token0.totalLiquidity = ZERO_BD
    // token0.allPairs = []
    token0.txCount = ZERO_BI
    token0.whitelistPairs = []
  }

  // fetch info if null
  if (token1 === null) {
    token1 = new Token(event.params.token1.toHexString())
    token1.symbol = fetchTokenSymbol(event.params.token1)
    token1.name = fetchTokenName(event.params.token1)
    token1.totalSupply = fetchTokenTotalSupply(event.params.token1)
    let decimals = fetchTokenDecimals(event.params.token1)

    // bail if we couldn't figure out the decimals
    if (decimals === null) {
      return
    }
    token1.decimals = decimals
    token1.derivedNativeCurrency = ZERO_BD
    token1.tradeVolume = ZERO_BD
    token1.tradeVolumeUSD = ZERO_BD
    token1.untrackedVolumeUSD = ZERO_BD
    token1.totalLiquidity = ZERO_BD
    // token1.allPairs = []
    token1.txCount = ZERO_BI
    token1.whitelistPairs = []
  }
  // create the tracked contract based on the template
  PairTemplate.create(event.params.pair)

  let pairContract = PairContract.bind(event.params.pair)

  let pair = new Pair(event.params.pair.toHexString()) as Pair
  pair.token0 = token0.id
  pair.token1 = token1.id
  pair.liquidityProviderCount = ZERO_BI
  pair.createdAtTimestamp = event.block.timestamp
  pair.createdAtBlockNumber = event.block.number
  pair.txCount = ZERO_BI
  pair.reserve0 = ZERO_BD
  pair.reserve1 = ZERO_BD
  pair.trackedReserveNativeCurrency = ZERO_BD
  pair.reserveNativeCurrency = ZERO_BD
  pair.reserveUSD = ZERO_BD
  pair.totalSupply = ZERO_BD
  pair.volumeToken0 = ZERO_BD
  pair.volumeToken1 = ZERO_BD
  pair.volumeUSD = ZERO_BD
  pair.untrackedVolumeUSD = ZERO_BD
  pair.token0Price = ZERO_BD
  pair.token1Price = ZERO_BD
  pair.swapFee = pairContract.try_swapFee().value || new BigInt(0)

  // save liquidity tracking pairs
  let whitelist = getLiquidityTrackingTokenAddresses()
  if (whitelist.includes(token0.id)) {
    let newPairs = token1.whitelistPairs
    newPairs.push(pair.id)
    token1.whitelistPairs = newPairs
  }
  if (whitelist.includes(token1.id)) {
    let newPairs = token0.whitelistPairs
    newPairs.push(pair.id)
    token0.whitelistPairs = newPairs
  }

  // save updated values
  token0.save()
  token1.save()
  pair.save()
  factory.save()
}
