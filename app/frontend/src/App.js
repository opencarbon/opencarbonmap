/** 
 * Copyright (c) Open Carbon, 2020
 * 
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * App.js
 * 
 * App pulls together menu, map, context sliders, selected areas, and graphs for main Open Carbon Map page
 */ 

import React, { Component } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { createStore, applyMiddleware } from "redux";
import { Provider } from "react-redux";
import thunk from "redux-thunk";
import clsx from 'clsx';

import { withStyles } from '@material-ui/styles';
import Drawer from '@material-ui/core/Drawer';
import Box from '@material-ui/core/Box';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import Divider from '@material-ui/core/Divider';
import IconButton from '@material-ui/core/IconButton';
import Container from '@material-ui/core/Container';
import Grid from '@material-ui/core/Grid';
import Link from '@material-ui/core/Link';
import MenuIcon from '@material-ui/icons/Menu';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';

import CarbonMapApp from "./reducers";
import Menu from './components/Menu';
import Map from './components/Map';
import Areas from './components/Areas';
import ContextSliders from './components/ContextSliders';
import Graphs from './components/Graphs';

import { globalstyle } from './styles/globalstyle';

let store = createStore(CarbonMapApp, applyMiddleware(thunk));

/**
 * Footer for page
 * 
 * Include copyright clauses/attributions for ONS and BEIS
 */
function Footer() {
  return (
    <div>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          An <a target="_new" style={{textDecoration: "none"}} href="https://icebreakerone.org/">Icebreaker One</a> project<br/><br/>
          <a target="_new" href="https://icebreakerone.org/">
              <img alt="Icebreaker One" style={{ maxWidth: "90%", minWidth: "200px", height: "auto"}} src="/static/partners/01_IB1_Logo_Yellow_Roundel_Grey_Words_rgb_400x135.png" />
          </a>
        </Grid>
        <Grid item xs={12} md={6}>
          Supported by <a target="_new" style={{textDecoration: "none"}} href="https://eit.europa.eu/">EIT Climate-KIC</a><br/><br/>
          <a target="_new" href="https://eit.europa.eu/">
              <img alt="EIT Climate-KIC" style={{ maxWidth: "90%", minWidth: "200px", height: "auto"}} src="/static/partners/EIT-Climate-KIC-EU-flag-transparent_400x138.png" />
          </a>
        </Grid>
      </Grid>

      <Typography variant="body2" color="textSecondary" align="center">
        <br/>
        Energy Data from <a target="_new" style={{textDecoration: 'none'}} href="https://www.gov.uk/government/organisations/department-for-business-energy-and-industrial-strategy">BEIS</a><br/>
        Boundaries data: Contains National Statistics data © Crown copyright and database right 2020<br/>
        Contains OS data © copyright and database right 2020<br/>
        All data licensed under the <a target="_new" style={{textDecoration: 'none'}} href="http://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/">UK Open Government Licence</a> v.3.0<br/><br/>
        <Link variant="button" href="https://github.com/opencarbon/opencarbonmap.git">
            GitHub
        </Link>
      </Typography>

      </div>

  );
}

/**
 * Main template class for App 
 */
class App extends Component {

  constructor(props) {
    super(props);

    this.state = {
      open: false,
    };
  }

  handleDrawerOpen = () => {
    this.setState({open: true});
  };

  handleDrawerClose = () => {
    this.setState({open: false});
  };

  render() {
    const {classes} = this.props    

    return (

      <Provider store={store}>
        <BrowserRouter>
          <div className={classes.root}>
            <AppBar position="absolute" className={clsx(classes.appBar, this.state.open && classes.appBarShift)}>
              <Toolbar className={classes.toolbar}>
                <IconButton
                  edge="start"
                  color="inherit"
                  aria-label="open drawer"
                  onClick={this.handleDrawerOpen}
                  className={clsx(classes.menuButton, this.state.open && classes.menuButtonHidden)}
                >
                  <MenuIcon />
                </IconButton>
                <Typography component="h1" variant="h6" color="inherit" noWrap className={classes.title}>
                  <a style={{color: "white", textDecoration: "none"}} href="/">Open Carbon Map</a>
                </Typography>
                <IconButton color="inherit">
                  {/* <Badge badgeContent={4} color="secondary">
                    <NotificationsIcon />
                  </Badge> */}
                </IconButton>
              </Toolbar>
            </AppBar>
            <Drawer
              variant="permanent"
              classes={{
                paper: clsx(classes.drawerPaper, !this.state.open && classes.drawerPaperClose),
              }}
              open={this.state.open}
            >
              <div className={classes.toolbarIcon}>
                <IconButton onClick={this.handleDrawerClose}>
                  <ChevronLeftIcon />
                </IconButton>
              </div>
              <Divider />
              <Menu onClick={this.handleDrawerOpen} />
            </Drawer>
            <main className={classes.content}>
              <div className={classes.appBarSpacer} />
              <Container spacing={0} maxWidth="lg" className={classes.container}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={12} lg={7}>
                    <Map />
                  </Grid>
                  <Grid item xs={12} md={12} lg={5}>
                    <ContextSliders />
                    <Areas />
                  </Grid>
                  <Grid item xs={12}>
                    <Graphs />
                  </Grid>
                </Grid>
                <Box pt={4}>
                  <Footer />
                </Box>
              </Container>
            </main>
          </div>

        </BrowserRouter>
      </Provider>
    )
  }
}

export default withStyles(globalstyle)(App);
