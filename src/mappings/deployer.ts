import { BigInt, ByteArray, log } from '@graphprotocol/graph-ts'
import {
  PairFactoryDeployed,
  FeeSetterDeployed,
  FeeReceiverDeployed,
  TransferFailure,
  TransferSuccess
} from '../types/Deployer/Deployer'
import { Deployer } from '../types/schema'
import { getHoneyswapFactory } from './factory'

function getDeployer(deployerId: string): Deployer {
  let deployer = Deployer.load(deployerId)

  if (deployer == null) {
    deployer = new Deployer(deployerId)
    deployer.factoryDeployedAddress = []
    deployer.feeSetterDeployed = []
    deployer.feeReceiverDeployed = []
    deployer.transferFailureCount = 0
    deployer.transferSuccessCount = 0
  }

  return deployer
}
export function handlePairFactoryDeployed(event: PairFactoryDeployed): void {
  const factoryAddress = event.params.factory.toHex()
  log.warning('handlePairFactoryDeployed called: {} address: {}', [factoryAddress, event.address.toHex()])
  const deployer = getDeployer(event.address.toHex())

  getHoneyswapFactory(factoryAddress) // create factory if not exist

  deployer.factoryDeployedAddress = deployer.factoryDeployedAddress.concat([factoryAddress])

  deployer.save()
}

export function handleFeeSetterDeployed(event: FeeSetterDeployed): void {
  log.warning('handleFeeSetterDeployed called: {} address: {}', [event.params.feeSetter.toHex(), event.address.toHex()])
  const deployer = getDeployer(event.address.toHex())

  deployer.feeSetterDeployed = deployer.feeSetterDeployed.concat([event.params.feeSetter.toHex()])

  deployer.save()
}

export function handleFeeReceiverDeployed(event: FeeReceiverDeployed): void {
  log.warning('handleFeeReceiverDeployed called: {} address: {}', [
    event.params.feeReceiver.toHex(),
    event.address.toHex()
  ])

  const deployer = getDeployer(event.address.toHex())

  deployer.feeReceiverDeployed = deployer.feeReceiverDeployed.concat([event.params.feeReceiver.toHex()])

  deployer.save()
}

export function handleTransferFailure(event: TransferFailure): void {
  const deployer = getDeployer(event.address.toHex())

  log.warning('handleTransferFailure called: {} address: {}', [
    BigInt.fromI32(deployer.transferFailureCount + 1).toString(),
    event.address.toHex()
  ])

  deployer.transferFailureCount = deployer.transferFailureCount += 1

  deployer.save()
}

export function handleTransferSuccess(event: TransferSuccess): void {
  const deployer = getDeployer(event.address.toHex())

  log.warning('handleTransferSuccess called: {} address: {}', [
    BigInt.fromI32(deployer.transferSuccessCount + 1).toString(),
    event.address.toHex()
  ])

  deployer.transferSuccessCount = deployer.transferSuccessCount += 1

  deployer.save()
}
