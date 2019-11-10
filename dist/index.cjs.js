'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var routerPrimitives = require('router-primitives');
var mobx = require('mobx');

/*! *****************************************************************************
Copyright (c) Microsoft Corporation. All rights reserved.
Licensed under the Apache License, Version 2.0 (the "License"); you may not use
this file except in compliance with the License. You may obtain a copy of the
License at http://www.apache.org/licenses/LICENSE-2.0

THIS CODE IS PROVIDED ON AN *AS IS* BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, EITHER EXPRESS OR IMPLIED, INCLUDING WITHOUT LIMITATION ANY IMPLIED
WARRANTIES OR CONDITIONS OF TITLE, FITNESS FOR A PARTICULAR PURPOSE,
MERCHANTABLITY OR NON-INFRINGEMENT.

See the Apache Version 2.0 License for specific language governing permissions
and limitations under the License.
***************************************************************************** */
/* global Reflect, Promise */

var extendStatics = function(d, b) {
    extendStatics = Object.setPrototypeOf ||
        ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
        function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
    return extendStatics(d, b);
};

function __extends(d, b) {
    extendStatics(d, b);
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
}

var __assign = function() {
    __assign = Object.assign || function __assign(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};

/**
 * Extends the manager and changes how routers are initialized.
 * Overrides router instantiation to turn routers in Mobx observables.
 */
var MobxManager = /** @class */ (function (_super) {
    __extends(MobxManager, _super);
    function MobxManager() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    // remove getState and subscribe 
    MobxManager.prototype.createNewRouterInitArgs = function (_a) {
        var name = _a.name, config = _a.config, type = _a.type, parentName = _a.parentName;
        var parent = this.routers[parentName];
        var actions = Object.keys(this.templates[type].actions);
        return {
            name: name,
            config: __assign({}, config),
            type: type,
            parent: parent,
            routers: {},
            manager: this,
            root: this.rootRouter,
            actions: actions
        };
    };
    MobxManager.prototype.createRouterFromInitArgs = function (initalArgs) {
        var routerClass = this.routerTypes[initalArgs.type];
        var mobxRouter = new routerClass(__assign({}, initalArgs));
        mobx.decorate(mobxRouter, {
            state: mobx.observable,
            history: mobx.observable,
        });
        if (mobxRouter.parent && mobxRouter.parent.state.visible === true) {
            var defaultAction = (mobxRouter.config).defaultAction || [];
            mobxRouter.state = { visible: defaultAction.includes('show') };
        }
        else if (mobxRouter.isRootRouter) {
            mobxRouter.state = { visible: true };
        }
        else {
            mobxRouter.state = {};
        }
        mobxRouter.history = [];
        return mobxRouter;
    };
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
    MobxManager.prototype.setNewRouterState = function (location) {
        var newState = this.calcNewRouterState(location, this.rootRouter);
        var routers = this.routers;
        Object.values(routers).forEach(function (r) {
            var routerSpecificState = newState[r.name];
            // Only update state if it is defined for this router
            // TODO remove the history length limitation and use config option
            if (routerSpecificState !== undefined) {
                var newHistory = [__assign({}, r.state)].concat(r.history).filter(function (s) { return s !== undefined && s.visible !== undefined; });
                if (newHistory.length > 5) {
                    newHistory = newHistory.slice(0, 5);
                }
                r.state = __assign({}, routerSpecificState, r._EXPERIMENTAL_internal_state);
                r.history = newHistory;
            }
        });
    };
    return MobxManager;
}(routerPrimitives.Manager));

exports.MobxManager = MobxManager;
