import type { FC, Context, ReactNode } from "react";
import { createContext, createElement, useContext } from "react";
import makeInspectable from "mobx-devtools-mst";
import { IAnyModelType, Instance } from "mobx-state-tree";

/*
 * Generic Types:
 *  - first generic is GenRootStoreModel, which extends Instance type from MST. This
 *  is needed for methods, that Instance provides.
 *  - second generic is GenStoreEnv, which extends object for now. This is needed for TS to recognize
 *  stores that exist on the store bus
 *  - third generic is GenInstantiatedStoresBox, which represents instantiated stores
 *  that are loaded into the RootStore.
 *  - fourth generic is GenBus, which represent instantiated stores
 *  that must be accessible through the store bus
 */
export const configureStore = <
  GenRootStoreModel extends Instance<IAnyModelType>,
  GenInstantiatedStoresBox extends Record<string, unknown>,
  GenBus extends Record<string, unknown>
>({
  RootStore,
  InstantiatedStoresBox,
  Bus,
  ExecutionEnv = "production",
}: {
  RootStore: IAnyModelType;
  InstantiatedStoresBox: GenInstantiatedStoresBox;
  Bus: GenBus;
  ExecutionEnv?: "development" | "production";
}): {
  rootStore: GenRootStoreModel;
  StoreContext: Context<GenRootStoreModel | null>;
  StoreProvider: FC<{ children: ReactNode, customStore?: GenRootStoreModel }>;
  useStore: () => GenRootStoreModel | null;
} => {
  // for now it will be a function with its own scope
  const createStore = (): GenRootStoreModel => {
    const env = {
      ...Bus,
    };

    const rootStore: GenRootStoreModel = RootStore.create(
      {
        ...InstantiatedStoresBox,
      },
      env
    );

    return rootStore;
  };
  const rootStore = createStore();

  // React utils
  const StoreContext = createContext<GenRootStoreModel | null>(null);

  const StoreProvider = ({ children, customStore }: { children: ReactNode, customStore?: GenRootStoreModel }) => {
    if (!children) {
      throw new Error("Provider cannot be mounted without React Element inside");
    }
    if (ExecutionEnv === "development") {
      makeInspectable(rootStore as Record<string, unknown>);
    }
    return createElement(
      StoreContext.Provider,
      {
        value: customStore || rootStore,
      },
      children
    );
  };

  const useStore = (): GenRootStoreModel => {
    const value = useContext(StoreContext);
    if (!value) {
      throw new Error("useStore must be used within a StoreProvider. Please, add context!");
    }
    return value;
  };

  const storeStruct = {
    rootStore,
    StoreContext,
    StoreProvider,
    useStore,
  };

  return storeStruct;
};
