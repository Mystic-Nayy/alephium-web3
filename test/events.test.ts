/*
Copyright 2018 - 2022 The Alephium Authors
This file is part of the alephium project.

The library is free software: you can redistribute it and/or modify
it under the terms of the GNU Lesser General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

The library is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Lesser General Public License for more details.

You should have received a copy of the GNU Lesser General Public License
along with the library. If not, see <http://www.gnu.org/licenses/>.
*/

import { NodeProvider } from '../src/api'
import { subscribe, Subscription } from '../src/contract/events'
import { Contract, Script } from '../src/contract'
import { NodeWallet, SignExecuteScriptTxParams } from '../src/signer'
import { node } from '../src/api'
import { testWallet } from './wallet'

describe('events', function () {
  async function deployContract(provider: NodeProvider, signer: NodeWallet): Promise<[string, string]> {
    const sub = await Contract.fromSource(provider, 'sub.ral')
    const subDeployTx = await sub.transactionForDeployment(signer, { initialFields: { result: 0 } })
    const subContractId = subDeployTx.contractId
    const subSubmitResult = await signer.submitTransaction(subDeployTx.unsignedTx, subDeployTx.txId)
    expect(subSubmitResult.txId).toEqual(subDeployTx.txId)

    const add = await Contract.fromSource(provider, 'add.ral')
    const addDeployTx = await add.transactionForDeployment(signer, {
      initialFields: { subContractId: subContractId, result: 0 }
    })
    const addSubmitResult = await signer.submitTransaction(addDeployTx.unsignedTx, addDeployTx.txId)
    expect(addSubmitResult.txId).toEqual(addDeployTx.txId)
    return [addDeployTx.contractAddress, addDeployTx.contractId]
  }

  async function executeScript(params: SignExecuteScriptTxParams, signer: NodeWallet, times: number) {
    for (let i = 0; i < times; i++) {
      const scriptTx = await signer.buildScriptTx(params)
      await signer.submitTransaction(scriptTx.unsignedTx, scriptTx.txId)
    }
  }

  it('should subscribe contract events', async () => {
    const provider = new NodeProvider('http://127.0.0.1:22973')
    const signer = await testWallet(provider)

    const [contractAddress, contractId] = await deployContract(provider, signer)
    const events: Array<node.ContractEvent> = []
    const subscriptOptions = {
      provider: provider,
      contractAddress: contractAddress,
      pollingInterval: 500,
      eventCallback: (event: node.ContractEvent): Promise<void> => {
        events.push(event)
        return Promise.resolve()
      },
      errorCallback: (error: any, subscription: Subscription): Promise<void> => {
        console.log(error)
        subscription.unsubscribe()
        return Promise.resolve()
      }
    }
    const subscription = subscribe(subscriptOptions)
    const script = await Script.fromSource(provider, 'main.ral')
    const scriptTxParams = await script.paramsForDeployment({
      initialFields: { addContractId: contractId },
      signerAddress: (await signer.getAccounts())[0].address
    })
    await executeScript(scriptTxParams, signer, 3)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    expect(events.length).toEqual(3)
    events.forEach((event) => {
      expect(event.contractAddress).toEqual(contractAddress)
      expect(event.fields).toEqual([
        { type: 'U256', value: '2' },
        { type: 'U256', value: '1' }
      ])
    })
    expect(subscription.currentEventCount()).toEqual(events.length)

    subscription.unsubscribe()
  })

  it('should cancel event subscription', async () => {
    const provider = new NodeProvider('http://127.0.0.1:22973')
    const signer = await testWallet(provider)

    const [contractAddress, contractId] = await deployContract(provider, signer)
    const events: Array<node.ContractEvent> = []
    const subscriptOptions = {
      provider: provider,
      contractAddress: contractAddress,
      pollingInterval: 500,
      eventCallback: (event: node.ContractEvent): Promise<void> => {
        events.push(event)
        return Promise.resolve()
      },
      errorCallback: (error: any, subscription: Subscription): Promise<void> => {
        console.log(error)
        subscription.unsubscribe()
        return Promise.resolve()
      }
    }
    const subscription = subscribe(subscriptOptions)
    const script = await Script.fromSource(provider, 'main.ral')
    const scriptTx0 = await script.transactionForDeployment(signer, {
      initialFields: { addContractId: contractId }
    })
    await signer.submitTransaction(scriptTx0.unsignedTx, scriptTx0.txId)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    subscription.unsubscribe()

    expect(events.length).toEqual(1)
    expect(events[0].contractAddress).toEqual(contractAddress)
    expect(events[0].fields).toEqual([
      { type: 'U256', value: '2' },
      { type: 'U256', value: '1' }
    ])
    expect(subscription.currentEventCount()).toEqual(events.length)

    const scriptTx1 = await script.transactionForDeployment(signer, {
      initialFields: { addContractId: contractId }
    })
    await signer.submitTransaction(scriptTx1.unsignedTx, scriptTx1.txId)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    expect(events.length).toEqual(1)
  })
})
