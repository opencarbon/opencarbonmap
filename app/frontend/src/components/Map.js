/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * components/Map.js 
 * 
 * Displays main map using Leafletjs
 * 
 * GeoJSON layer within map is reloaded if map is zoomed or moved beyond safe 'padding' area
 */ 

import React, { Component }  from 'react';
import { connect, useSelector, useDispatch } from 'react-redux';
import { withRouter } from 'react-router';
import { withStyles } from '@material-ui/styles';
import { global, map, areas } from "../actions";
import { setGlobalState } from "../actions/global";
import { fetchGeometries } from "../actions/map";
import { useMapEvents, MapContainer, TileLayer, ZoomControl, GeoJSON } from 'react-leaflet';
import * as QueryString from "query-string";

import Leaflet from 'leaflet';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';

import 'leaflet/dist/leaflet.css';
import { globalstyle } from '../styles/globalstyle';
import { getURLState, setURLState } from "../functions/urlstate";

import { 
  AREA_LEVEL_COLOURS, 
  AREA_STYLE_DEFAULT, 
  AREA_STYLE_MOUSEOVER,
  AREA_STYLE_MOUSEOUT,
  LEVELS, 
  LEVELS_DESCRIPTIVE, 
  ZOOM_SHOWLEVEL_2, 
  ZOOM_SHOWLEVEL_3, 
  DEFAULT_LAT, 
  DEFAULT_LNG, 
  DEFAULT_ZOOM 
} from "../constants";

function areaselected(level) {
  return {...AREA_STYLE_DEFAULT, 
    fillColor: AREA_LEVEL_COLOURS[level - 1], 
    weight: 2,
    opacity: 1, 
    color: "#000",
  };
}

/**
 * getAreaProperties
 * 
 * Get properties of current map view, assuming map needs to be updated
 * If no update is required, eg. if user's view is moving within 'pixelpadding' border of last update,
 * then return null
 * 
 * @param {*} map 
 * @param {*} areaproperties 
 * @param {*} geometrytype 
 */
function getAreaProperties(map, areaproperties, geometrytype) {
  let zoom = map.getZoom();
  let mapbounds = map.getBounds();
  let northEast = mapbounds['_northEast'];
  let southWest = mapbounds['_southWest'];
  let xmin = southWest.lng;
  let ymin = southWest.lat;
  let xmax = northEast.lng;
  let ymax = northEast.lat;

  // We grab larger area than we need and only update if user goes beyond padded area
  // This allows flexibility in terms of the user moving around map    

  if ((areaproperties !== null) && (areaproperties.zoom === zoom) && (areaproperties.geometrytype === geometrytype)) {
    if ((xmin >= areaproperties.xmin) && (xmax <= areaproperties.xmax) && (ymin >= areaproperties.ymin) && (ymax <= areaproperties.ymax)) {
      // Hasn't moved sufficiently so don't reload data
      return null;
    }
  }
  
  areaproperties = {zoom: zoom, geometrytype: geometrytype, xmin: southWest.lng, ymin: southWest.lat, xmax: northEast.lng, ymax: northEast.lat};

  // Calculate padding using pixels

  const pixelpadding = 40;
  let point = Leaflet.point(pixelpadding, pixelpadding);
  let markerCoords = map.containerPointToLatLng( point );
  let paddingy = (northEast.lat - markerCoords.lat);
  let paddingx = (markerCoords.lng - southWest.lng);

  areaproperties.xmin -= paddingx;
  areaproperties.xmax += paddingx;
  areaproperties.ymin -= paddingy;
  areaproperties.ymax += paddingy;

  return areaproperties;
}

/**
 * MapGeometry: React functional component to process map events
 * 
 * Fetch (GeoJSON) geometries every time map is moved (which includes on zooming in/out)
 * 
 * @param {*} props 
 */
function MapGeometry(props) {
  const dispatch = useDispatch();
  const global = useSelector(state => state.global);
  const mapstate = useSelector(state => state.map);

  const map = useMapEvents({
    moveend(e) {

      // If change in zoom level requires change of geometry selector, adjust accordingly 

      let zoom = map.getZoom();
      let center = map.getCenter();
      let geometry = global.geometry;
      if ((zoom < ZOOM_SHOWLEVEL_2) && (geometry >=2)) geometry = 1;
      if ((zoom < ZOOM_SHOWLEVEL_3) && (geometry >=3)) geometry = 2;
      if (geometry !== global.geometry) dispatch(setGlobalState({"geometry": geometry}));        

      // Re-render GeoJSON if necessary (checks to see whether sufficient change requires reload)
      let areaproperties = getAreaProperties(map, mapstate.areaproperties, geometry);
      if (areaproperties !== null) dispatch(fetchGeometries(areaproperties));

      setURLState({'lat': center.lat, 'lng': center.lng, 'zoom': zoom, 'g': geometry}, props.history, props.location);
    },
  })

  return null
}

/**
 * Map: Main React component for rendering map
 * 
 */
export class Map extends Component {

  state = {
    lat: null,
    lng: null,
    zoom: null,
    scrollWheelZoom: false,	
    area: '',		
  }

  constructor(props) {
    super(props);

    this.state.lat = props.lat;
    this.state.lng = props.lng;
    this.state.zoom = props.zoom;  

    let params = QueryString.parse(this.props.location.search);
    if (params.lat !== undefined) this.state.lat = params.lat;
    if (params.lng !== undefined) this.state.lng = params.lng;
    if (params.zoom !== undefined) this.state.zoom = params.zoom;
  }
    
  /**
   * setMap
   * 
   * Called when map is initially set
   * 
   * @param {*} mapref 
   */
  setMap = (mapref) => {
    let globalstate = {'map': mapref};
    // Set global 'geometry' if set in URL
    const geometry = getURLState('g', this.props.location);
    if (geometry !== null) globalstate['geometry'] = parseInt(geometry);        

    // Fetch (GeoJSON) geometries when we first load map
    this.props.setGlobalState(globalstate).then(() => {
      let areaproperties = getAreaProperties(mapref, this.props.map.areaproperties, this.props.global.geometry);
      if (areaproperties !== null) this.props.fetchGeometries(areaproperties);
    });
  }

  /**
   * getGeoJSONIndex
   * 
   * This is used to trigger a re-render of the GeoJSON layer
   * Change the value -> triggers redraw
   */
  getGeoJSONIndex = () => {
    return this.props.map.geojsoncounter;
  }

  /**
   * geojsonStyle
   * 
   * Style GeoJSON polygon differently depending on whether it's selected or not
   * 
   * @param {*} feature 
   */
  geojsonStyle = (feature) => {
    const code = feature.properties.code;
    if (code in this.props.areas.areas) {
      return areaselected(this.props.global.geometry);
    } else {
      return AREA_STYLE_DEFAULT;
    }      
  }

  /**
   * onGeoJSONMouseOver
   * 
   * Change style of GeoJSON polygon for mouse over 
   * 
   * @param {*} area 
   */
  onGeoJSONMouseOver = (area) => {
    const name = area.layer.feature.properties.name;
    const geometrytype = area.layer.feature.properties.geometrytype;
    const areatext = LEVELS[geometrytype - 1] + ": " + name;
    this.setState({area: areatext});

    area.layer.setStyle(AREA_STYLE_MOUSEOVER);    
  }

  /**
   * onGeoJSONMouseOut
   * 
   * Revert style of GeoJSON polygon on mouse out
   * 
   * @param {*} area 
   */
  onGeoJSONMouseOut = (area) => {
    this.setState({area: ''});
    if (area.layer.feature.properties.code in this.props.areas.areas) {
      return areaselected(this.props.global.geometry);
    } else {
      area.layer.setStyle(AREA_STYLE_MOUSEOUT);    
    }      
  }

  /**
   * onGeoJSONClick
   * 
   * Select area on click
   * 
   * @param {*} area 
   */
  onGeoJSONClick = (area) => {
        
    // Workaround for bug in Safari and Leaflet where two clicks are generated 
    // See https://github.com/Leaflet/Leaflet/issues/7255
    // Only one click has isTrusted=true

    if (!area.originalEvent.isTrusted) return;

    const code = area.layer.feature.properties.code;

    if (code in this.props.areas.areas) {
      area.layer.setStyle(AREA_STYLE_DEFAULT);    
      this.props.deleteArea(code, this.props.history, this.props.location);
    } else {
      area.layer.setStyle(areaselected(this.props.global.geometry));    
      this.props.addArea(code, this.props.history, this.props.location, true);
    }
  }

  render() {
    const {classes} = this.props;        
    const areacolor = AREA_LEVEL_COLOURS[this.props.global.geometry - 1];
    let title = LEVELS_DESCRIPTIVE[this.props.global.geometry - 1];

    if (this.state.area !== '') title = this.state.area;

    return (

      <Card>
        <CardActions style={{backgroundColor: areacolor}}>
          <Button size="small" style={{color: 'white'}}>
            {title}&nbsp;
          </Button>
        </CardActions>
        <CardContent style={{padding: "0px", margin: "0px"}}>
          <MapContainer 
                  className={classes.mapcontainer}
                  center={[this.state.lat, this.state.lng]} 
                  zoom={this.state.zoom} 
                  maxZoom="15"
                  zoomControl={false}
                  scrollWheelZoom={this.state.scrollWheelZoom} 
                  style={{ width: "100%"}} 
                  whenCreated={this.setMap} >
                  <ZoomControl position="topright" />
                  <TileLayer
                      attribution='&amp;copy <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
            <MapGeometry location={this.props.location} history={this.props.history} />
            <GeoJSON eventHandlers={{
                mouseover: this.onGeoJSONMouseOver,
                mouseout: this.onGeoJSONMouseOut,
                click: this.onGeoJSONClick
              }}
              style={this.geojsonStyle} 
              key={this.getGeoJSONIndex(this.props.map.geometries)} 
              data={this.props.map.geometries} />
          </MapContainer> 
        </CardContent>
      </Card>

    )
  }
}

Map.defaultProps = {
  lat: DEFAULT_LAT,
  lng: DEFAULT_LNG,
  zoom: DEFAULT_ZOOM,
};


export const mapStateToProps = state => {
    return {
      global: state.global,
      map: state.map,
      areas: state.areas,
    }
}
    
export const mapDispatchToProps = dispatch => {
  return {
      setGlobalState: (globalstate) => {
          return dispatch(global.setGlobalState(globalstate));
      },  
      fetchGeometries: (areaproperties) => {
        return dispatch(map.fetchGeometries(areaproperties));
      },      
      addArea: (key, history, location, updateurl) => {
        return dispatch(areas.addArea(key, history, location, updateurl));
      },      
      deleteArea: (key, history, location) => {
        return dispatch(areas.deleteArea(key, history, location));
      },      
  }
}  

export default withStyles(globalstyle)(withRouter(connect(mapStateToProps, mapDispatchToProps)(Map)));