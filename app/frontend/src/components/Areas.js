/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * components/Areas.js 
 * 
 * Space for displaying information about selected areas
 * By clicking the close/delete icon on a selected area, it will be removed from selection
 * Clicking on body of selected area 'pill' will zoom map to that area
 */ 

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { global, areas, map } from "../actions";
import { withRouter } from 'react-router';
import { withStyles } from '@material-ui/styles';

import Chip from '@material-ui/core/Chip';
import Close from '@material-ui/icons/Close';

import { getURLState } from "../functions/urlstate";
import { AREA_LEVEL_COLOURS } from "../constants";
import { globalstyle } from '../styles/globalstyle';  

export class Areas extends Component {

    componentDidMount() {

        // Load any relevant variables encoded in URL
        // We load periodstart, periodend first as they affect subsequently loading of areas

        let globalstate = {}
        const periodstart = getURLState('start', this.props.location);
        const periodend = getURLState('end', this.props.location);
        const areascale = getURLState('rowgraphs', this.props.location);
        const selectedareas = getURLState('a', this.props.location);
        if (periodstart !== null) globalstate['periodstart'] = parseInt(periodstart);        
        if (periodend !== null) globalstate['periodend'] = parseInt(periodend);
        if (areascale !== null) globalstate['areascale'] = parseInt(areascale);

        this.props.setGlobalState(globalstate).then(() => {
            for (var i = 0; i < selectedareas.length; i++) {
                this.props.addArea(selectedareas[i], null, null, false);
            }
        });
    }
    
    zoomToArea = (key) => {
        this.props.setGeometry(this.props.areas.areas[key].area.geometrytype, this.props.history, this.props.location).then(() => {
            this.props.zoomToArea(key);
        });        
    }

    deleteArea = (key) => {
        this.props.deleteArea(key, this.props.history, this.props.location).then(() => {
            this.props.redrawGeoJSON();
        });
    }

    render() {
        const {classes} = this.props    

        return (
                <div className={classes.areaChips}>
                    {Object.entries(this.props.areas.areas).map(([key, value]) => {
                        const label = value.area['name'];
                        const color = AREA_LEVEL_COLOURS[parseInt(value.area['geometrytype']) - 1];

                        return (
                                <Chip onClick={()=>{this.zoomToArea(key)}} size="small" key={key} data-key={key} label={label} deleteIcon={<Close style={{color: "white"}} />} onDelete={()=>{this.deleteArea(key)}} style={{color: "white", backgroundColor: color}} />
                        );
                    })}                
                </div>
        );
    }
}


export const mapStateToProps = state => {
    return {
        global: state.global,
        areas: state.areas,
        map: state.map,
    }
}
    
export const mapDispatchToProps = dispatch => {
  return {
        setGlobalState: (globalstate) => {
            return dispatch(global.setGlobalState(globalstate));
        },
        setGeometry: (geometry, history, location) => {
            return dispatch(global.setGeometry(geometry, history, location));
        },
        zoomToArea: (areacode) => {
            return dispatch(map.zoomToArea(areacode));
        },      
        addArea: (key, history, location) => {
            return dispatch(areas.addArea(key, history, location));
        },          
        deleteArea: (key, history, location) => {
            return dispatch(areas.deleteArea(key, history, location));
        },
        redrawGeoJSON: () => {
            return dispatch(map.redrawGeoJSON());
        },
  }
}  

export default withStyles(globalstyle)(withRouter(connect(mapStateToProps, mapDispatchToProps)(Areas)));
