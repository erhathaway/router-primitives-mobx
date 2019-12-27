import { Manager, Router, Types, IManagerInit } from "router-primitives";
import {
  decorate,
  observable,
  runInAction,
  extendObservable,
  set,
  computed
} from "mobx";
import {
  IRouter,
  IRouterInitArgs,
  IRouterCurrentState,
  RouterHistoryState
} from "router-primitives/dist/types";

decorate(Router, {
  parent: observable,
  routers: observable,
  root: observable,
  config: observable,
  isPathRouter: computed,
  isRootRouter: computed,
  pathLocation: computed,
  siblings: computed,
  routeKey: computed,
  lastDefinedParentsDisableChildCacheState: computed
});

class MobxRouter extends Router {
  public __state = observable.object<IRouterCurrentState>({});
  public __history = observable.array<IRouterCurrentState>([]);

  constructor(init: IRouterInitArgs) {
    super(init);
  }

  get state() {
    return this.__state;
  }

  get history() {
    return this.__history;
  }
}

decorate(MobxRouter, {
  __state: observable,
  state: computed,
  __history: observable,
  history: computed
  // _EXPERIMENTAL_internal_state: observable
});

/**
 * Extends the manager and changes how routers are initialized.
 * Overrides router instantiation to turn routers in Mobx observables.
 */
class MobxManager extends Manager {
  constructor(init: IManagerInit) {
    const router = MobxRouter;
    super({ ...init, router });
  }
  // remove getState and subscribe
  public createNewRouterInitArgs({
    name,
    config,
    type,
    parentName
  }: Types.IRouterCreationInfo): Types.IRouterInitArgs {
    const parent = this.routers[parentName];

    const actions = Object.keys(this.templates[type].actions);

    return {
      name,
      config: { ...config },
      type,
      parent,
      routers: {},
      manager: this,
      root: this.rootRouter,
      actions
    };
  }

  public createRouterFromInitArgs(initalArgs: Types.IRouterInitArgs) {
    const routerClass = this.routerTypes[initalArgs.type];

    const mobxRouter = new (routerClass as any)({
      ...initalArgs
    }) as Types.IRouter;

    runInAction(() => {
      // check if parent is visible
      if (mobxRouter.parent && mobxRouter.parent.state.visible === true) {
        const defaultAction = mobxRouter.config.defaultAction || [];
        set(((mobxRouter as unknown) as MobxRouter).__state, {
          visible: defaultAction.includes("show")
        });
        // check if root router
      } else if (mobxRouter.isRootRouter) {
        set(((mobxRouter as unknown) as MobxRouter).__state, {
          visible: true
        });
      } else {
        set(((mobxRouter as unknown) as MobxRouter).__state, {
          visible: false
        });
      }
    });

    return mobxRouter;
  }

  /**
   * Given a location change, set the new router state tree state
   * AKA:new location -> new state
   *
   * The method `calcNewRouterState` will recursively walk down the tree calling each
   * routers reducer to calculate the state
   *
   * This library avoids setting router state in a central state store.
   * Instead, state is set on each router.
   * Here we map over each state and set it on its respective router
   */
  public setNewRouterState(location: Types.IInputLocation) {
    const newState = this.calcNewRouterState(location, this.rootRouter);
    const routers = this.routers;

    Object.values(routers).forEach(r => {
      const routerSpecificState = newState[r.name];

      // Only update state if it is defined for this router
      // TODO remove the history length limitation and use config option
      if (routerSpecificState !== undefined) {
        let newHistory = [{ ...r.state }, ...r.history].filter(
          s => s !== undefined && s.visible !== undefined
        );
        if (newHistory.length > 5) {
          newHistory = newHistory.slice(0, 5);
        }
        runInAction(() => {
          set(((r as unknown) as MobxRouter).__state, {
            ...routerSpecificState,
            ...r._EXPERIMENTAL_internal_state
          });
          set(((r as unknown) as MobxRouter).__history, newHistory);
        });
      }
    });
  }
}

export { MobxManager };
