/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * constants/index.js 
 * 
 * Values for key constants
 */ 

// URL of backend system
// export const API_URL = "http://localhost:8000";
export const API_URL = "";

// Default year start
export const periodstart = 2010; 

// Default year end
export const periodend = 2018; 

// Default number of graphs to display across width
export const areascale = 1; 

// Default latitude
export const DEFAULT_LAT = 55.69142309402058; 

// Default longitude
export const DEFAULT_LNG = -3.7832450866699223; 

// Default zoom scale
export const DEFAULT_ZOOM = 5; 

// Zoom level at which to reveal 'Level 2' geographies, ie. MSOA/IG
export const ZOOM_SHOWLEVEL_2 = 8; 

// Zoom level at which to reveal 'Level 3' geographies, ie. LSOA/DZ
export const ZOOM_SHOWLEVEL_3 = 9; 

// Short text for each of level geographies, 1, 2, 3
export const LEVELS = [
    'Local Authority',
    'MSOA/Intermediate',
    'LSOA/Datazone',
]

// Descriptive text for each of level geographies, 1, 2, 3
export const LEVELS_DESCRIPTIVE = [
    'Local Authorities',
    'MSOA/Intermediate Zones',
    'LSOA/Data Zones',
]

// Default style for GeoJSON polygon (assuming not selected)
export const AREA_STYLE_DEFAULT = {
    fillColor: '#fff', 
    fillOpacity: 0.5,
    weight: 1, 
    color: "#999",
    opacity: 0.7
};

// Style for GeoJSON polyon when mouse over
export const AREA_STYLE_MOUSEOVER = {
    weight: 2, 
    color: "#000",
    opacity: 1,
};

// Style for GeoJSON polygon when mouse out
export const AREA_STYLE_MOUSEOUT = {
    weight: 1, 
    color: "#999",
    opacity: 0.7,
};

// Color values for each of level geographies, 1, 2, 3
export const AREA_LEVEL_COLOURS = ["#3f51b5", "#9c27b0", "#4caf50"];