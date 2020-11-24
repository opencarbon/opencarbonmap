/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * components/Graphs.js 
 * 
 * Draws graphs for all selected areas
 * Number of graphs displayed across width of window will depend on 'areascale' global parameter
 * Clicking on title of graph will zoom map to show area it represents
 * Clicking on 'close' of graph will remove graph and area from interface
 */ 

import React, { Component } from "react";
import {connect} from 'react-redux';
import { global, areas, map } from "../actions";
import { withStyles } from "@material-ui/core/styles";
import { withRouter } from 'react-router';

import Typography from '@material-ui/core/Typography';
import Card from '@material-ui/core/Card';
import CardActionArea from '@material-ui/core/CardActionArea';
import CardActions from '@material-ui/core/CardActions';
import Button from '@material-ui/core/Button';
import Grid from '@material-ui/core/Grid';
import Close from "@material-ui/icons/Close";

import BarChart from './Chart';
import { AREA_LEVEL_COLOURS } from "../constants";
import { globalstyle } from '../styles/globalstyle';

class Graphs extends Component {
  
    zoomToArea = (key) => {
        this.props.setGeometry(this.props.areas.areas[key].area.geometrytype, this.props.history, this.props.location).then(() => {
            this.props.zoomToArea(key);
        });        
    }

    mouseOver = (key) => {
        this.props.setGlobalState({'activegeometry': key});
    }

    mouseOut = () => {
        this.props.setGlobalState({'activegeometry': null});
    }

    deleteArea = (key) => {
        this.props.deleteArea(key, this.props.history, this.props.location).then(() => {
            this.props.redrawGeoJSON();
        });
    }
  
    render() {

        let dataarea = (null);
        let defaulttext = (<Typography variant="body1" style={{textAlign: 'center'}}>Click area on map to display data for area</Typography>);
        if (Object.keys(this.props.areas.areas).length > 0) defaulttext = (null);

          dataarea = (
            <div>
                {defaulttext}

                {Object.entries(this.props.areas.areas).map(([key, value]) => {
                    const label = value.area['name'];
                    const color = AREA_LEVEL_COLOURS[parseInt(value.area['geometrytype']) - 1];
                    const areasize = (100 / this.props.global.areascale).toString() + "%";

                    return (
                    <div key={key} style={{display:'inline-block', width:areasize, padding:"0px 10px 10px 0px"}}>
                        <Card>
                            <CardActions style={{backgroundColor: color}}>

                                <Grid container>
                                    <Grid item xs>
                                        <Button onMouseOver={() => this.mouseOver(key)} onMouseOut={()=>this.mouseOut()} onClick={() => this.zoomToArea(key)} size="small" style={{color: 'white' }}>
                                            <Typography variant="button">
                                                {label}
                                            </Typography>
                                        </Button>                        
                                    </Grid>
                                    <Grid >
                                        <Button onClick={() => this.deleteArea(key)} size="small" style={{color: 'white', float: "right"}}>
                                            <Close />
                                        </Button>
                                    </Grid>
                                </Grid>

                            </CardActions>
                    
                            <CardActionArea>
                                <BarChart 
                                    areacode={key}
                                    color="#70CAD1" />
                            </CardActionArea>
                        </Card>    
                    </div>
                    );
                })}                

            </div>                
          )
        

        return (
            <div>
            {dataarea}
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
        deleteArea: (key, history, location) => {
            return dispatch(areas.deleteArea(key, history, location));
        },
        redrawGeoJSON: () => {
            return dispatch(map.redrawGeoJSON());
        },
        zoomToArea: (areacode) => {
            return dispatch(map.zoomToArea(areacode));
        },      
    }
}    
      
export default withStyles(globalstyle)(withRouter(connect(mapStateToProps, mapDispatchToProps)(Graphs)));


