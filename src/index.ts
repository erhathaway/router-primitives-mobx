import {
  RouterCache,
  Manager,
  IManagerInit,
  IRouterInitArgs,
  RouterCurrentState,
  // RouterHistoryState,
  // ActionWraperFn,
  RouterInstance,
  IRouterTemplates,
  IInputLocation,
  AllTemplates,
  NarrowRouterTypeName,
  IRouterCreationInfo,
  IManager,
  Router,
  IInternalState
} from "router-primitives";
import {
  decorate,
  observable,
  runInAction,
  extendObservable,
  set,
  computed,
  action
} from "mobx";

decorate(RouterCache, {
  cache: observable,
  transactionCache: observable,
  startTransaction: action,
  saveTransaction: action,
  discardTransaction: action,
  removeCache: action,
  setCache: action,
  setCacheFromSerialized: action
});

// class MobxRouterCache extends RouterCache {
//   public __cacheStore: boolean | undefined = undefined;
//   constructor() {
//     super();
//   }
// }

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
  serialize: action,
  // state: computed,
  lastDefinedParentsDisableChildCacheState: computed
  // _EXPERIMENTAL_internal_state: observable
});

class MobxRouter<
  Templates extends IRouterTemplates,
  RouterTypeName extends NarrowRouterTypeName<keyof Templates>,
  InitArgs extends IRouterInitArgs<
    Templates,
    RouterTypeName,
    IManager
  > = IRouterInitArgs<Templates, RouterTypeName, IManager>
> extends Router<Templates, RouterTypeName, InitArgs> {
  public __state = observable.object<RouterCurrentState>({});
  public __history = observable.array<RouterCurrentState>([]);
  public __EXPERIMENTAL_internal_state = observable.object<IInternalState>({});

  constructor(init: InitArgs) {
    super(init);
  }

  get state() {
    // return observable({
    return this.__state as any;
    // return { ...this.__state, ...this.EXPERIMENTAL_internal_state };
  }

  get history() {
    return this.__history as any;
  }

  public EXPERIMENTAL_setInternalState(internalState: IInternalState) {
    runInAction(() => {
      set(this.__EXPERIMENTAL_internal_state, { ...internalState });
    });
  }

  get EXPERIMENTAL_internal_state(): IInternalState {
    return this.__EXPERIMENTAL_internal_state || {};
  }
}

decorate(MobxRouter, {
  __state: observable,
  state: computed,
  __history: observable,
  history: computed,
  __EXPERIMENTAL_internal_state: observable,
  EXPERIMENTAL_internal_state: computed
  // show: action,
  // hide: action
});

decorate(Manager, {
  // rootRouter: observable
  // routers: observable
  calcNewRouterState: action

  // setCacheAndHide: action
  // setChildrenDefaults: action
  // createActionWrapperFunction: action
});

const actionFnDecorator = (fn: any) => {
  return action(fn);
};
/**
 * Extends the manager and changes how routers are initialized.
 * Overrides router instantiation to turn routers in Mobx observables.
 */
class MobxManager<
  CustomTemplates extends IRouterTemplates = {}
> extends Manager<CustomTemplates> {
  public __routers = observable.object<{
    [routerName: string]: Record<
      string,
      RouterInstance<AllTemplates<CustomTemplates>>
    >;
  }>({});

  constructor(init: IManagerInit<CustomTemplates>) {
    // const router = MobxRouter;
    super({}, { shouldInitialize: false, actionFnDecorator });
    const initArgs = { ...init, router: MobxRouter } as IManagerInit<
      CustomTemplates
    >;
    runInAction(() => {
      this.__routers = observable.object<{
        [routerName: string]: Record<
          string,
          RouterInstance<AllTemplates<CustomTemplates>>
        >;
      }>({});
    });
    this.initializeManager(initArgs);
    // this.__routers = observable<{ [routerName: string]: RouterInstance }>({});
    // this.__routers = {};
  }
  // remove getState and subscribe
  public createNewRouterInitArgs<
    // Name extends NarrowRouterTypeName<
    //     NarrowRouterTypeName<keyof (AllTemplates<CustomTemplates>)>
    // >
    Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>

    // M extends Manager
  >({
    name,
    config,
    type,
    parentName
  }: IRouterCreationInfo<AllTemplates<CustomTemplates>, Name>): IRouterInitArgs<
    AllTemplates<CustomTemplates>,
    Name,
    IManager<CustomTemplates>
  > {
    const parent = this.routers[parentName];

    const actions = Object.keys(this.templates[type].actions);

    return {
      name,
      config: { ...config },
      type,
      parent,
      routers: {},
      manager: this as any,
      root: this.rootRouter,
      actions: actions as any
      // cache: this.routerCache as any // eslint-disable-line
    } as any;
  }

  public registerRouter(
    name: string,
    router: RouterInstance<AllTemplates<CustomTemplates>>
  ) {
    runInAction(() => {
      extendObservable(this.__routers, { [name]: router });
    });
  }

  public unregisterRouter(name: string) {
    // runInAction(() => {
    //   delete this.__routers[name];
    // });
  }

  get routers(): Record<string, RouterInstance<AllTemplates<CustomTemplates>>> {
    // console.log("getting routers");
    return this.__routers as any;
  }

  public createRouterFromInitArgs<
    Name extends NarrowRouterTypeName<keyof AllTemplates<CustomTemplates>>
  >(
    initalArgs: IRouterInitArgs<
      AllTemplates<CustomTemplates>,
      NarrowRouterTypeName<Name>,
      IManager<CustomTemplates>
    >
  ): RouterInstance<AllTemplates<CustomTemplates>, NarrowRouterTypeName<Name>> {
    const routerClass = this.routerTypes[initalArgs.type];

    const mobxRouter = new (routerClass as any)({
      ...initalArgs
    }) as RouterInstance<
      AllTemplates<CustomTemplates>,
      NarrowRouterTypeName<Name>
    >;

    runInAction(() => {
      // check if parent is visible
      if (mobxRouter.parent && mobxRouter.parent.state.visible === true) {
        const defaultAction = mobxRouter.config.defaultAction || [];
        set(((mobxRouter as unknown) as any).__state, {
          visible: defaultAction.includes("show")
        });
        // check if root router
      } else if (mobxRouter.isRootRouter) {
        set(((mobxRouter as unknown) as any).__state, {
          visible: true
        });
      } else {
        set(((mobxRouter as unknown) as any).__state, {
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
  public setNewRouterState(location: IInputLocation): void {
    this.setCacheFromLocation(location);

    const newState = this.calcNewRouterState(location, this.rootRouter as any);
    const routers = this.routers;

    Object.values(routers).forEach(r => {
      const routerSpecificState = newState[r.name];

      // Only update state if it is defined for this router
      // TODO remove the history length limitation and use config option
      if (routerSpecificState !== undefined) {
        let newHistory = [{ ...r.state }]
          .concat(r.history)
          .filter(s => s !== undefined && s.visible !== undefined);
        if (newHistory.length > 5) {
          newHistory = newHistory.slice(0, 5);
        }
        runInAction(() => {
          // console.log("setting new router state", r.name, routerSpecificState);
          set(((r as unknown) as any).__state, {
            ...routerSpecificState,
            ...r.EXPERIMENTAL_internal_state
          });
          set(((r as unknown) as any).__history, newHistory);
        });
      }
    });
  }
}

decorate(MobxManager, {
  // __routers: observable,
  routers: computed,
  setCacheFromLocation: action,
  setNewRouterState: action
});

export { MobxManager };
