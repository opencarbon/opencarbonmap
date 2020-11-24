/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * actions/map.js 
 * 
 * Actions for map redux object
 */ 

import { API_URL } from "../constants";

/**
 * fetchGeometries
 * 
 * Fetches geometry data from backend server and carries out basic data processing
 * (due to optimized delivery of GeoJSON data)
 * 
 * @param {*} areaproperties 
 */
export const fetchGeometries = (areaproperties) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};
    let body = JSON.stringify(areaproperties);

    return fetch(API_URL + "/geometries/", {headers, method: "POST", body})
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
          const geometries = {
            type: 'FeatureCollection',
            features:
               (res.data).map(segment =>({
                  'type':'Feature',
                  'geometry': JSON.parse(segment.json),
                  'properties': {
                     'name': segment.name,
                     'code': segment.code,
                     'type': segment.type,
                     'geometrytype': areaproperties['geometrytype']
                    }
               })
            )
          }

          return dispatch({type: 'FETCH_GEOMETRIES', areaproperties: areaproperties, geometries: geometries});
        }         
      })
  }
}

/**
 * redrawGeoJSON
 * 
 * Issues 'REDRAW_GEOJSON' message to initiate redraw of GeoJSON layer
 */
export const redrawGeoJSON = () => {
  return (dispatch, getState) => {
    dispatch({type: 'REDRAW_GEOJSON'});
    return Promise.resolve(true);
  }
}

/**
 * zoomToArea
 * 
 * Queries backend system for bounding box of a particular geographical region 
 * Once bounding box parameters have been received, it issues 'fitBounds' on map object to fit bbox within map view
 * 
 * @param {*} areacode 
 */
export const zoomToArea = (areacode) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};
    let body = JSON.stringify({areacode: areacode});

    return fetch(API_URL + "/geometrybounds/", {headers, method: "POST", body})
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
          const map = getState().global.map;   
          if (map === null) return;

          const southWest = [res.data.rect[1], res.data.rect[0]]
          const northEast = [res.data.rect[3], res.data.rect[2]]
          map.fitBounds([southWest, northEast], {animate: false});
        } 
      })
  }
}

/**
 * gotoLocation
 * 
 * Queries backend system for coordinates of a location or postcode
 * Once coordinates have been received, it issues 'flyTo' on map object to move to that position
 * 
 * @param {*} location 
 */
export const gotoLocation = (location) => {
  return (dispatch, getState) => {
    let headers = {"Content-Type": "application/json"};

    return fetch(API_URL + "/locationposition?location=" + encodeURIComponent(location), {headers, method: "GET"})
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
          const { map } = getState().global;

          if (res.data.result === 'success') {
            map.flyTo({lng: res.data.data.lng, lat: res.data.data.lat}, res.data.data.zoom, {animate: false});
          }
        }
      })
  }
}


