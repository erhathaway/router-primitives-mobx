import { Manager, Types } from 'router-primitives';
import { decorate, observable } from 'mobx';

/**
 * Extends the manager and changes how routers are initialized.
 * Overrides router instantiation to turn routers in Mobx observables.
 */
class MobxManager extends Manager {
  // remove getState and subscribe 
  public createNewRouterInitArgs({ name, config, type, parentName }: Types.IRouterCreationInfo): Types.IRouterInitArgs {
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
    const mobxRouter = (new (routerClass as any)({ ...initalArgs }) as Types.IRouter);

    decorate(mobxRouter, {
      state: observable,
      history: observable,
      // _EXPERIMENTAL_internal_state: observable
    });

    if (mobxRouter.parent && mobxRouter.parent.state.visible === true) {
      const defaultAction = (mobxRouter.config).defaultAction || [];
      (mobxRouter as any).state = { visible: defaultAction.includes('show') };
    } else if (mobxRouter.isRootRouter) {
      (mobxRouter as any).state = { visible: true };
    } else {
      (mobxRouter as any).state = {};
    }

    (mobxRouter as any).history = [];

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
    const routers = this.routers

    Object.values(routers).forEach((r) => {
      const routerSpecificState = newState[r.name];

      // Only update state if it is defined for this router
      // TODO remove the history length limitation and use config option
      if (routerSpecificState !== undefined) {
        let newHistory = [{ ...r.state }, ...r.history].filter(s => s !== undefined && s.visible !== undefined)
        if (newHistory.length > 5) { newHistory = newHistory.slice(0, 5); }

        (r as any).state = { ...routerSpecificState, ...r._EXPERIMENTAL_internal_state };
        (r as any).history = newHistory;
      }
    });
  }
}

export {
  MobxManager,
};