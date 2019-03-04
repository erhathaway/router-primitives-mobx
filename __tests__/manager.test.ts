import { MobxManager } from "../src/index";

describe('Manager', () => {
  // describe('Can be initialized', () => {
  //   it('Has router state store related methods removed', () => {
  //     const manager = new MobxManager();
  //     const initArgs = manager.createNewRouterInitArgs({ name: 'AwesomeRouter', config: {}, type: 'scene' })
  //     expect(initArgs.name).toBe('AwesomeRouter')
  //     expect(initArgs.getState).toBeUndefined();
  //     expect(initArgs.subscribe).toBeUndefined();
  //   });
  // });

  // it('Can create a mobx router', () => {
  //   const manager = new MobxManager();
  //   const initArgs = manager.createNewRouterInitArgs({ name: 'MegaRouter', config: {}, type: 'scene' })
  //   const mobxRouter = manager.createRouterFromInitArgs(initArgs);
  //   mobxRouter.state = 'some new state';
  //   mobxRouter.history = 'historyy';

  //   expect(mobxRouter.name).toBe('MegaRouter');
  //   expect(mobxRouter.state).toBe('some new state');
  //   expect(mobxRouter.history).toBe('historyy');
  // });

  const routerTree = {
    name: 'WholesomeRouter',
    routers: {
      stack: [{
        name: 'SaneRouter',
        routeKey: 'aKey',
      }],
      scene: [{
        name: 'users'
      }]
    }
  }
  it('Manages history and state during state changes', () => {
    const manager = new MobxManager({ routerTree });
    const firstLocation = {
      pathname: ['users', '22'],
      search: {
        aKey: 1,
        anotherKey: true
      },
      options: {}
    };

    const secondLocation = {
      pathname: [],
      search: {
        aKey: 1,
        anotherKey: true
      },
      options: {}
    };

    manager.serializedStateStore.setState(firstLocation)

    expect(manager.routers['SaneRouter'].state).toEqual({ order: "1", visible: true });
    expect(manager.routers['users'].state).toEqual({ visible: true });

    manager.serializedStateStore.setState(secondLocation);

    expect(manager.routers['users'].state).toEqual({ visible: false });
    expect(manager.routers['users'].history).toEqual([{ visible: true }]);
  })
})