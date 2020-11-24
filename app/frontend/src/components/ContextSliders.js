/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * components/ContextSliders.js 
 * 
 * Draw context sliders - year range and number of graphs per row
 * Changing year sliders and number of graphs per row will dynamically update graphs
 */ 

import React, { Component } from "react";
import { connect } from 'react-redux';
import { global, areas } from "../actions";
import { withRouter } from 'react-router'
import { withStyles } from '@material-ui/styles';

import Typography from '@material-ui/core/Typography';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Slider from '@material-ui/core/Slider';

import { setURLState } from "../functions/urlstate";
import { globalstyle } from '../styles/globalstyle';

class ContextSliders extends Component {

    updateAreas = () => {
        // After changing year range, reset 'maxvalue' before updating all graphs as this may alter for different time range
        this.props.resetMaxValue().then(() => {
          Object.keys(this.props.areas.areas).forEach((key) => {
            this.props.updateArea(key);
          });
        })
    }
  
    onTimeChange = (e, newValue) => {
        this.props.setTimeRange(newValue[0], newValue[1], this.props.history, this.props.location);        
    }

    onTimeChangeCommitted = () => {
      setURLState({'start': this.props.global.periodstart, 'end': this.props.global.periodend}, this.props.history, this.props.location);
      this.updateAreas();
    }

    onScaleChange = (e, newValue) => {
        this.props.setAreaScale(newValue, this.props.history, this.props.location);
    }

    onScaleChangeCommitted = () => {
      setURLState({'rowgraphs': this.props.global.areascale}, this.props.history, this.props.location);
    }

    render() {
        const {classes} = this.props    

        return (
          <Container maxWidth="lg" className={classes.container}>
            <Grid container spacing={4}>
              <Grid item xs={12} sm={12} md={12}>
                  <Slider
                    min={2010} 
                    max={2100} 
                    step={1}
                    value={[this.props.global.periodstart, this.props.global.periodend]}
                    onChange={this.onTimeChange}
                    onChangeCommitted={this.onTimeChangeCommitted}
                    aria-labelledby="time-slider"
                    valueLabelDisplay="on"
                  />                
                <Typography id="time-slider" gutterBottom>
                  Timescale
                </Typography>
              </Grid>
              <Grid item xs={12} sm={12} md={12}>
                <Slider
                    min={1} 
                    max={4} 
                    step={1}
                    value={this.props.global.areascale}
                    onChange={this.onScaleChange}
                    onChangeCommitted={this.onScaleChangeCommitted}
                    aria-labelledby="areascale-slider"
                    valueLabelDisplay="on"
                  />                
                <Typography id="areascale-slider" gutterBottom>
                  Graphs per row
                </Typography>
              </Grid>
            </Grid>
          </Container>
        );
    }
}

export const mapStateToProps = state => {
    return {
      global: state.global,
      areas: state.areas,
    }
}
      
export const mapDispatchToProps = dispatch => {
    return {
      setTimeRange: (periodstart, periodend, history, location) => {
        return dispatch(global.setTimeRange(periodstart, periodend, history, location));
      },  
      setAreaScale: (areascale, history, location) => {
        return dispatch(global.setAreaScale(areascale, history, location));
      },  
      updateArea: (key) => {
        return dispatch(areas.updateArea(key));
      },      
      resetMaxValue: () => {
        return dispatch(areas.resetMaxValue());
      },      
    }
}    
      
export default withStyles(globalstyle)(withRouter(connect(mapStateToProps, mapDispatchToProps)(ContextSliders)));
