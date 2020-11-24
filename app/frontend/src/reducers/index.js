/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reducers/index.js 
 * 
 * React redux reducers index
 */ 

import { combineReducers } from 'redux';
import global from "./global";
import map from "./map";
import areas from "./areas";

const CarbonMapApp = combineReducers({
  global,
  map,
  areas,
})

export default CarbonMapApp;