/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reducers/global.js 
 * 
 * Reducer for global redux object
 * 
 * GLOBAL_SET_STATE: Updates global variable(s) using names/values in object
 * SET_TIME_RANGE: Updates time-specific variables
 * SET_AREA_SCALE: Updates areascale property
 */ 

import { initialStateGlobal } from "./initializers"

export default function selector(state=initialStateGlobal, action) {

    let newState = {...state};

    switch (action.type) {
  
        case 'GLOBAL_SET_STATE':
            Object.keys(action.object).forEach((key) => newState[key] = action.object[key]);                
            return newState;

        case 'SET_TIME_RANGE':
            newState.periodstart = action.periodstart;
            newState.periodend = action.periodend;            
            return newState;

        case 'SET_AREA_SCALE':
            newState.areascale = action.areascale;
            return newState;
    
        default:
            return state;
    }
}
