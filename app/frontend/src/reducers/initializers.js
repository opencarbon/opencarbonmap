/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reducers/initializers.js 
 * 
 * react-redux reducer initializers
 */ 

import { periodstart, periodend, areascale } from "../constants";

// Set up initial state of some global variables using constants
export const initialStateGlobal = {
    geometry: 1,
    map: null,
    periodstart: periodstart,
    periodend: periodend,
    areascale: areascale,
    activegeometry: null,
};

export const initialStateMap = {
    areaproperties: null,
    geometries: null,
    geojsoncounter: 0,
};

export const initialStateAreas = {
    areas: {},
    maxvalue: 0,
};
