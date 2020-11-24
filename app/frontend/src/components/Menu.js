/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * components/Menu.js 
 * 
 * Menu element of Open Carbon Map
 * 
 * Contains a location search box and a geographical region selector (LAU1/MSOA-IG/LSOA-DZ)
 * Number of regions that can be selected will depend on current zoom level according to values ZOOM_SHOWLEVEL_2 and ZOOM_SHOWLEVEL_3
 * Number of available regions will appear as a number above the layers icon
 */ 

import React, { Component } from 'react';
import { connect } from 'react-redux';
import { global, map } from "../actions";
import { withRouter } from 'react-router';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import Badge from '@material-ui/core/Badge';
import SearchIcon from '@material-ui/icons/Search';
import LayersIcon from '@material-ui/icons/Layers';
import TextField from '@material-ui/core/TextField';
import FormControl from '@material-ui/core/FormControl';
import MenuItem from '@material-ui/core/MenuItem';

import { LEVELS, ZOOM_SHOWLEVEL_2, ZOOM_SHOWLEVEL_3 } from '../constants';

export class Menu extends Component {

    constructor(props) {
        super(props);

        this.state = {
            searchfield: '',
        }
    }
        
    submitGeometry = (e) => {
        const newgeometrytype = e.target.value;
        this.props.setGeometry(newgeometrytype, this.props.history, this.props.location).then(() => {
            let areaproperties = this.props.map.areaproperties;
            areaproperties.geometrytype = newgeometrytype;
            this.props.fetchGeometries(areaproperties);            
        });
    }

    searchChange = (e) => {
        this.setState({searchfield: e.target.value});
    }

    submitLocation = (e) => {
        e.preventDefault();
        this.props.gotoLocation(this.state.searchfield);
    }

    render() {

        let menu_level1 = (<MenuItem key="level1" value="1">{LEVELS[0]}</MenuItem>);
        let menu_level2 = (null);
        let menu_level3 = (null);
        let badgenumber = 0;

        if (this.props.global.map !== null) {
            const mapzoom = this.props.global.map.getZoom();
            if (mapzoom >= ZOOM_SHOWLEVEL_2) {
                menu_level2 = (<MenuItem key="level2" value="2">{LEVELS[1]}</MenuItem>);
                badgenumber = 2;
            }
            if (mapzoom >= ZOOM_SHOWLEVEL_3) {
                menu_level3 = (<MenuItem key="level3" value="3">{LEVELS[2]}</MenuItem>);
                badgenumber++;
            }
        }

        return (
            <List>
                <ListItem button>
                    <ListItemIcon>
                        <SearchIcon onClick={this.props.onClick}/>
                    </ListItemIcon>
                    <form onSubmit={this.submitLocation} style={{width: "100%"}}>
                        <FormControl fullWidth noValidate autoComplete="off" >
                            <TextField onSubmit={this.submitLocation} id="carbonmap-location" value={this.state.searchfield} onChange={this.searchChange} placeholder="Location / postcode" />
                        </FormControl>
                    </form>
                </ListItem>
                <ListItem button>
                    <ListItemIcon>
                    <Badge onClick={this.props.onClick} badgeContent={badgenumber} color="primary">
                        <LayersIcon />
                    </Badge>
                    </ListItemIcon>
                    <FormControl fullWidth>
                        <TextField
                            id="carbonmap-geometry"
                            select
                            value={this.props.global.geometry}
                            onChange={this.submitGeometry}
                            >
                            {menu_level1}
                            {menu_level2}
                            {menu_level3}
                        </TextField>
                    </FormControl>
                </ListItem>
            </List>
        );
    }
}


export const mapStateToProps = state => {
    return {
        global: state.global,
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
        fetchGeometries: (areaproperties) => {
            return dispatch(map.fetchGeometries(areaproperties));
        },          
        gotoLocation: (location) => {
            return dispatch(map.gotoLocation(location));
        },          
  }
}  

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(Menu));
