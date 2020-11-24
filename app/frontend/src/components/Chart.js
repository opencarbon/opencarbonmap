/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * components/Chart.js 
 * 
 * Chart.js barchart for displaying data
 */ 

import React from "react";
import {connect} from 'react-redux';
import { areas } from "../actions";
import Chart from "chart.js";

Chart.defaults.global.defaultFontFamily = "Roboto, sans-serif";

class BarChart extends React.Component {

    constructor(props) {
      super(props);
      this.canvasRef = React.createRef();
    }
  
    componentDidUpdate() {
      if (this.chart === undefined) return;

      if (this.props.areas.areas[this.props.areacode].data.labels !== undefined) {
        this.chart.data.labels = this.props.areas.areas[this.props.areacode].data.labels;
        this.chart.data.datasets = this.props.areas.areas[this.props.areacode].data.datasets;
        this.chart.options.scales.yAxes[0].ticks.suggestedMax = this.props.areas.maxvalue;
        this.chart.update();
      }
    }
  
    componentDidMount() {

      // With all data for chart loaded, load actual chart

      this.chart = new Chart(this.canvasRef.current, {
        type: 'bar',
        options: {
          legend: {
            labels: {boxWidth: 12}
          },
          animation: {duration: 0},				
          title: {display: false},
          tooltips: {
            mode: 'label',
            callbacks: {
              afterTitle: function() {window.total = 0;},
              label: function(tooltipItem, data) {
                var name = data.datasets[tooltipItem.datasetIndex].label;
                var value = data.datasets[tooltipItem.datasetIndex].data[tooltipItem.index];
                if (name !== 'Selected scenario') {
                  window.total += value;
                }
                return name + ": " + value.toLocaleString() + " TCO2e";             
              },
              footer: function() {
                return "TOTAL: " + window.total.toLocaleString() + " TCO2e";
              }
            }
          },
          responsive: true,
          scales: {
            xAxes: [{
              gridLines: {display:false},
              stacked: true,
              ticks : {beginAtZero : true}   
            }],
            yAxes: [{
              stacked: true,
              ticks : {
                maxTicksLimit: 6,
                beginAtZero : true,
                suggestedMax: this.props.areas.maxvalue,
              }   
            }]
          },
        },
        data: {
          labels: this.props.areas.areas[this.props.areacode].data.labels,
          datasets: this.props.areas.areas[this.props.areacode].data.datasets
        }        
      });
    }   
      
    render() {
      return (<canvas ref={this.canvasRef} style={{backgroundColor: '#ffffff'}} />);
    }
}

export const mapStateToProps = state => {
    return {
      areas: state.areas,
    }
}
      
export const mapDispatchToProps = dispatch => {
    return {
    }
}    
    
export default connect(mapStateToProps, mapDispatchToProps)(BarChart);
