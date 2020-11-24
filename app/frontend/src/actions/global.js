/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * action/global.js 
 * 
 * Actions for global redux object
 */ 

import { setURLState } from "../functions/urlstate";

/**
 * setGlobalState
 * 
 * Sets global state using a list of names/values represented by object
 * 
 * @param {*} object 
 */
export const setGlobalState = (object) => {
    return (dispatch, getState) => {
      dispatch({type: 'GLOBAL_SET_STATE', object: object});
      return Promise.resolve(true);
    }
}

/**
 * setTimeRange
 * 
 * Sets global yearstart/yearend  
 * 
 * @param {*} periodstart 
 * @param {*} periodend 
 * @param {*} history 
 * @param {*} location 
 */
export const setTimeRange = (periodstart, periodend, history, location) => {
  return setGlobalState({'periodstart': periodstart, 'periodend': periodend});
}

/**
 * setAreaScale
 * 
 * Sets global areascale 
 * 
 * @param {*} areascale 
 * @param {*} history 
 * @param {*} location 
 */
export const setAreaScale = (areascale, history, location) => {
  return setGlobalState({'areascale': areascale});
}

/**
 * setGeometry
 * 
 * Set global geometry including setting equivalent URL parameter
 * 
 * @param {*} geometry 
 * @param {*} history 
 * @param {*} location 
 */
export const setGeometry = (geometry, history, location) => {
  setURLState({'g': geometry}, history, location);
  return setGlobalState({'geometry': geometry});
}
