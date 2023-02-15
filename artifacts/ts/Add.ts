/* Autogenerated file. Do not edit manually. */
/* tslint:disable */
/* eslint-disable */

import {
  Address,
  Contract,
  ContractState,
  TestContractResult,
  HexString,
  ContractFactory,
  SubscribeOptions,
  EventSubscription,
  CallContractParams,
  CallContractResult,
  TestContractParams,
  ContractEvent,
  subscribeContractCreatedEvent,
  subscribeContractDestroyedEvent,
  subscribeContractEvent,
  subscribeAllEvents,
  testMethod,
  callMethod,
  fetchContractState,
  ContractCreatedEvent,
  ContractDestroyedEvent,
  ContractInstance,
} from "@alephium/web3";
import { default as AddContractJson } from "../add/add.ral.json";

// Custom types for the contract
export namespace AddTypes {
  export type Fields = {
    sub: HexString;
    result: bigint;
  };

  export type State = ContractState<Fields>;

  export type AddEvent = ContractEvent<{ x: bigint; y: bigint }>;
  export type Add1Event = ContractEvent<{ a: bigint; b: bigint }>;
}

class Factory extends ContractFactory<AddInstance, AddTypes.Fields> {
  at(address: string): AddInstance {
    return new AddInstance(address);
  }

  async testAddMethod(
    params: TestContractParams<AddTypes.Fields, { array: [bigint, bigint] }>
  ): Promise<TestContractResult<[bigint, bigint]>> {
    return testMethod(this, "add", params);
  }

  async testAddPrivateMethod(
    params: TestContractParams<AddTypes.Fields, { array: [bigint, bigint] }>
  ): Promise<TestContractResult<[bigint, bigint]>> {
    return testMethod(this, "addPrivate", params);
  }
}

// Use this object to test and deploy the contract
export const Add = new Factory(
  Contract.fromJson(
    AddContractJson,
    "",
    "52d5893e97ce6b8d67d90fe1c51735e6e4f9946de732926fd160a0b50774f61b"
  )
);

// Use this class to interact with the blockchain
export class AddInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<AddTypes.State> {
    return fetchContractState(Add, this);
  }

  subscribeContractCreatedEvent(
    options: SubscribeOptions<ContractCreatedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractCreatedEvent(this, options, fromCount);
  }

  subscribeContractDestroyedEvent(
    options: SubscribeOptions<ContractDestroyedEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractDestroyedEvent(this, options, fromCount);
  }

  subscribeAddEvent(
    options: SubscribeOptions<AddTypes.AddEvent>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      Add.contract,
      this,
      options,
      "Add",
      fromCount
    );
  }

  subscribeAdd1Event(
    options: SubscribeOptions<AddTypes.Add1Event>,
    fromCount?: number
  ): EventSubscription {
    return subscribeContractEvent(
      Add.contract,
      this,
      options,
      "Add1",
      fromCount
    );
  }

  subscribeAllEvents(
    options: SubscribeOptions<
      | AddTypes.AddEvent
      | AddTypes.Add1Event
      | ContractCreatedEvent
      | ContractDestroyedEvent
    >,
    fromCount?: number
  ): EventSubscription {
    return subscribeAllEvents(Add.contract, this, options, fromCount);
  }

  async callAddMethod(
    params: CallContractParams<{ array: [bigint, bigint] }>
  ): Promise<CallContractResult<[bigint, bigint]>> {
    return callMethod(Add, this, "add", params);
  }
}