/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * actions/areas.js 
 * 
 * Actions for areas redux object
 */ 
 
import { API_URL } from "../constants";
import { setURLState, deleteURLState } from "../functions/urlstate";

/**
 * addArea
 * 
 * Adds area to list of selected areas by retrieving data for that area
 * Data includes both area data (region name,...) and emissions data
 * Adding area will also modify URL state
 * 
 * @param {*} key 
 * @param {*} history 
 * @param {*} location 
 * @param {*} updateurl 
 */
export const addArea = (key, history, location, updateurl) => {
    return (dispatch, getState) => {

      // Update URL with added area

      if (updateurl) setURLState({'a': key}, history, location);

      // Retrieve data for area from server

      const headers = {"Content-Type": "application/json"};      
      const global = getState().global;
      const body = JSON.stringify({ periodstart: global.periodstart, periodend: global.periodend, area: key });

      return fetch(API_URL + "/data/", {headers, method: "POST", body})
        .then(res => {
          if (res.status < 500) {
            return res.json().then(data => {
              return {status: res.status, data};
            })
          } else {
            console.log("Server Error!");
            throw res;
          }
        })
        .then(res => {
          if (res.status === 200) {
            return dispatch({type: 'ADD_AREA', key: key, area: res.data.area, data: res.data.data});
          } else {
            throw res;
          }
        });
    }
}

/**
 * updateArea
 * 
 * Update data for specific area
 * 
 * @param {*} key 
 */
export const updateArea = (key) => {
  return (dispatch, getState) => {

    // Retrieve data for area from server

    const headers = {"Content-Type": "application/json"};      
    const global = getState().global;
    const body = JSON.stringify({ periodstart: global.periodstart, periodend: global.periodend, area: key });
    
    return fetch(API_URL + "/data/", {headers, method: "POST", body})
      .then(res => {
        if (res.status < 500) {
          return res.json().then(data => {
            return {status: res.status, data};
          })
        } else {
          console.log("Server Error!");
          throw res;
        }
      })
      .then(res => {
        if (res.status === 200) {
          return dispatch({type: 'UPDATE_AREA', key: key, data: res.data.data});
        } else {
          throw res;
        }
      });
  }
}

/**
 * deleteArea
 * 
 * Delete area from list of selected areas
 * This will involve remove area code from URL state
 * 
 * @param {*} key 
 * @param {*} history 
 * @param {*} location 
 */
export const deleteArea = (key, history, location) => {
    return (dispatch, getState) => {

      // Update URL with deleted area

      deleteURLState({'a': key}, history, location);

      // Dispatch DELETE_AREA

      dispatch({type: 'DELETE_AREA', key: key});
      return Promise.resolve(true);
    }
}

/**
 * resetMaxValue
 * 
 * Resets 'maxvalue' area variable
 */
export const resetMaxValue = () => {
  return (dispatch, getState) => {
    dispatch({type: 'RESET_MAX_VALUE'});
    return Promise.resolve(true);
  }
}
