/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * reducers/areas.js 
 * 
 * Reducer for areas redux object and related functions
 * 
 * processdata: Process data received from server
 * 
 * ADD_AREA: Add area and related data to state
 * UPDATE_AREA: Update data for particular area within state
 * RESET_MAX_VALUE: Reset 'maxvalue' prior to recalculating its value for all current areas (eg. in event of changing time range)
 * DELETE_AREA: Remove area from state including recalculating 'maxvalue' for all remaining areas
 */ 
 
import { initialStateAreas } from "./initializers"

/**
 * processdata: Process data received from backend for use in chart.js including checking to see whether 'maxvalue' needs to be updated
 * 
 * @param {*} data 
 * @param {*} maxvalue 
 */
function processdata(data, maxvalue) {
    var dates = Object.keys(data), electricity = [], gas = [];
    for(var i = 0; i < dates.length; i++) {
        let year = dates[i];
        electricity.push(data[year]['electricity'])
        gas.push(data[year]['gas'])
        let total = 0;
        if (data[year].electricity !== undefined) total += data[year].electricity;
        if (data[year].gas !== undefined) total += data[year].gas;
        if (total > maxvalue) maxvalue = total;
    }

    const barchartdata = {
        labels: dates,
        datasets: [
        {label: 'Gas', backgroundColor: '#f44336', data: gas}, 
        {label: 'Elec', backgroundColor: 'rgb(54, 162, 235)', data: electricity
        }]
    };

    return {
        barchartdata: barchartdata,
        maxvalue: maxvalue
    }
}

export default function areas(state=initialStateAreas, action) {

    let newState = {...state, areas: {...state.areas}};        
    var i, j, processeddata;

    switch (action.type) {
  
        case 'ADD_AREA':
            processeddata = processdata(action.data, newState.maxvalue);
            newState.maxvalue = processeddata.maxvalue;
            newState.areas[action.key] = { area: action.area, data: processeddata.barchartdata };
            return newState;
        
        case 'UPDATE_AREA':
            processeddata = processdata(action.data, newState.maxvalue);
            newState.areas[action.key] = { area: {...newState.areas[action.key].area}, data: processeddata.barchartdata};
            newState.maxvalue = processeddata.maxvalue;
            return newState;

        case 'RESET_MAX_VALUE':
            newState.maxvalue = 0;
            return newState;
            
        case 'DELETE_AREA':
            const { [action.key]: _, ...newareas } = newState.areas;
            newState.areas = newareas;

            // As we're deleting area, calculate new max value for remaining datasets

            let newmaxvalue = 0;
            let areacodes = Object.keys(newareas);
            for(i = 0; i < areacodes.length; i++) {
                let gas = newareas[areacodes[i]].data.datasets[0].data;
                let electricity = newareas[areacodes[i]].data.datasets[1].data;
                for(j = 0; j < gas.length; j++) {
                    let total = 0;
                    if (electricity[j] !== undefined) total += electricity[j];
                    if (gas[j] !== undefined) total += gas[j];
                    if (total > newmaxvalue) newmaxvalue = total;
                }
            }
            newState.maxvalue = newmaxvalue;

            return newState;
                    
        default:
            return state;
    }
}

