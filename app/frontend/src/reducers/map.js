/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reducers/map.js 
 * 
 * Reducer for map redux object
 * 
 * FETCH_GEOMETRIES: Updates state with data from backend and triggers redraw of GeoJSON layer by incrementing 'geojsoncounter'
 * REDRAW_GEOJSON: Trigger redraw of GeoJSON layer by incrementing 'geojsoncounter'
 */ 

import { initialStateMap } from "./initializers"
  
export default function map(state=initialStateMap, action) {

    let newState = { ...state};    

    switch (action.type) {

        case 'FETCH_GEOMETRIES':
            // console.log("Downloaded area count:", action.geometries.features.length);
            newState = {...newState, geojsoncounter: (1 + state.geojsoncounter), areaproperties: action.areaproperties, geometries: action.geometries};
            return newState;

        case 'REDRAW_GEOJSON':
            newState = {...newState, geojsoncounter: (1 + state.geojsoncounter)};
            return newState;

        default:
            return state;
    }
}
