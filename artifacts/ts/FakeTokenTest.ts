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
  subscribeContractEvent,
  subscribeContractEvents,
  testMethod,
  callMethod,
  multicallMethods,
  fetchContractState,
  ContractInstance,
  getContractEventsCurrentCount,
} from "@alephium/web3";
import { default as FakeTokenTestContractJson } from "../token/fake_token_test.ral.json";

// Custom types for the contract
export namespace FakeTokenTestTypes {
  export type Fields = {
    a: bigint;
  };

  export type State = ContractState<Fields>;

  export interface CallMethodTable {
    getSymbol: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    getName: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<HexString>;
    };
    getDecimals: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
    getTotalSupply: {
      params: Omit<CallContractParams<{}>, "args">;
      result: CallContractResult<bigint>;
    };
  }
  export type CallMethodParams<T extends keyof CallMethodTable> =
    CallMethodTable[T]["params"];
  export type CallMethodResult<T extends keyof CallMethodTable> =
    CallMethodTable[T]["result"];
  export type MultiCallParams = Partial<{
    [Name in keyof CallMethodTable]: CallMethodTable[Name]["params"];
  }>;
  export type MultiCallResults<T extends MultiCallParams> = {
    [MaybeName in keyof T]: MaybeName extends keyof CallMethodTable
      ? CallMethodTable[MaybeName]["result"]
      : undefined;
  };
}

class Factory extends ContractFactory<
  FakeTokenTestInstance,
  FakeTokenTestTypes.Fields
> {
  at(address: string): FakeTokenTestInstance {
    return new FakeTokenTestInstance(address);
  }

  tests = {
    getSymbol: async (
      params: Omit<
        TestContractParams<FakeTokenTestTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getSymbol", params);
    },
    getName: async (
      params: Omit<
        TestContractParams<FakeTokenTestTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<HexString>> => {
      return testMethod(this, "getName", params);
    },
    getDecimals: async (
      params: Omit<
        TestContractParams<FakeTokenTestTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "getDecimals", params);
    },
    getTotalSupply: async (
      params: Omit<
        TestContractParams<FakeTokenTestTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<bigint>> => {
      return testMethod(this, "getTotalSupply", params);
    },
    foo: async (
      params: Omit<
        TestContractParams<FakeTokenTestTypes.Fields, never>,
        "testArgs"
      >
    ): Promise<TestContractResult<null>> => {
      return testMethod(this, "foo", params);
    },
  };
}

// Use this object to test and deploy the contract
export const FakeTokenTest = new Factory(
  Contract.fromJson(
    FakeTokenTestContractJson,
    "",
    "88d74dcc19bfd075e97c90ab5f48d374f9ff982133d8257d4efc32305c5885b3"
  )
);

// Use this class to interact with the blockchain
export class FakeTokenTestInstance extends ContractInstance {
  constructor(address: Address) {
    super(address);
  }

  async fetchState(): Promise<FakeTokenTestTypes.State> {
    return fetchContractState(FakeTokenTest, this);
  }

  methods = {
    getSymbol: async (
      params?: FakeTokenTestTypes.CallMethodParams<"getSymbol">
    ): Promise<FakeTokenTestTypes.CallMethodResult<"getSymbol">> => {
      return callMethod(
        FakeTokenTest,
        this,
        "getSymbol",
        params === undefined ? {} : params
      );
    },
    getName: async (
      params?: FakeTokenTestTypes.CallMethodParams<"getName">
    ): Promise<FakeTokenTestTypes.CallMethodResult<"getName">> => {
      return callMethod(
        FakeTokenTest,
        this,
        "getName",
        params === undefined ? {} : params
      );
    },
    getDecimals: async (
      params?: FakeTokenTestTypes.CallMethodParams<"getDecimals">
    ): Promise<FakeTokenTestTypes.CallMethodResult<"getDecimals">> => {
      return callMethod(
        FakeTokenTest,
        this,
        "getDecimals",
        params === undefined ? {} : params
      );
    },
    getTotalSupply: async (
      params?: FakeTokenTestTypes.CallMethodParams<"getTotalSupply">
    ): Promise<FakeTokenTestTypes.CallMethodResult<"getTotalSupply">> => {
      return callMethod(
        FakeTokenTest,
        this,
        "getTotalSupply",
        params === undefined ? {} : params
      );
    },
  };

  async multicall<Calls extends FakeTokenTestTypes.MultiCallParams>(
    calls: Calls
  ): Promise<FakeTokenTestTypes.MultiCallResults<Calls>> {
    return (await multicallMethods(
      FakeTokenTest,
      this,
      calls
    )) as FakeTokenTestTypes.MultiCallResults<Calls>;
  }
}
