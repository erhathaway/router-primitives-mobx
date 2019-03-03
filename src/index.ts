import { Manager, Router } from 'recursive-router';
// import { IRouterInitParams, RouterT } from 'recursive-router';
 
import { decorate, observable } from 'mobx';

class MobxManager extends Manager {

  // remove getState and subscribe 
  public createNewRouterInitArgs({ name, config, type, parentName}: { [key: string]: any }): any {
    const parent = (this as Manager).routers[parentName];

    return {
      name,
      config: { ...config },
      type: type || 'scene', // TODO make root router an empty router
      parent,
      routers: {},
      manager: this,
      root: (this as Manager).rootRouter,
    };
  }

  public createRouterFromInitArgs(initalArgs: ReturnType<Manager['createNewRouterInitArgs']>): any {
    const routerClass = (this as Manager).routerTypes[initalArgs.type];
    const mobxRouter = new (routerClass as any)(initalArgs);

    decorate(mobxRouter, {
      state: observable,
      history: observable,
    });

    if (mobxRouter.parent && mobxRouter.parent.state.visible === true) {
      mobxRouter.state = { visible: ((this as Manager).config || {}).defaultShow };
    } else if (mobxRouter.isRootRouter) {
      mobxRouter.state = { visible: true };
    } else {
      mobxRouter.state = {};
    }

    mobxRouter.history = [];

    return mobxRouter;
  }

  // location -> newState
  // newState -> routerStates :specify
  public setNewRouterState(location: any) {
    const newState = (this).calcNewRouterState(location, (this as Manager).rootRouter);
    const routers = (this as Manager).routers as { [key: string]: any }
    Object.values(routers).forEach((r: any): any => {
      const routerSpecificState = newState[r.name];

      // only update state if it is defined for this router
      if (routerSpecificState !== undefined) {
        let newHistory = [{...r.state}, ...r.history].filter(s => s !== undefined && s.visible !== undefined)
        if (newHistory.length > 5) { newHistory = newHistory.slice(0, 5); }
  
        r.state = routerSpecificState;
        r.history = newHistory;
      }
    });
  }
}


class MobxRouter extends Manager {

}

export { 
  MobxManager, 
  MobxRouter 
};