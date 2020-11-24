"""
Copyright (c) Open Carbon, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

backend/carbonmodel.py
Functions used to calculate emissions predictions based on existing data
"""

import numpy as np
import json
import datetime
from django.contrib.gis.geos import GEOSGeometry
from random import random

from .models import Data
from .conversionfactors import converter_kg_electricity, converter_kg_gas

def calculatebaseparameters(areadata):
    """
    Calculate base parameters from existing energy data using simple linear regression
    """

    years_electricity, years_gas, electricity, gas = [], [], [], []
    for areadataitem in areadata:
        year = int(areadataitem.year)
        if areadataitem.type == 0:
            years_electricity.append(year)
            electricity.append(float(areadataitem.value))
        if areadataitem.type == 1: 
            years_gas.append(year)
            gas.append(float(areadataitem.value))

    converter_years_electricity, converter_years_gas, converter_electricity, converter_gas = [], [], [], []

    for year in converter_kg_electricity.keys():
        converter_years_electricity.append(int(year))
        converter_electricity.append(converter_kg_electricity[year])

    # We skip first two values for gas as these are copied from 2012 and might distort estimates
    # However we use these values for final carbon conversion as they are conservative estimates
    for year in range(2012, 2021):
        converter_years_gas.append(year)
        converter_gas.append(converter_kg_gas[str(year)])

    # Calculate slope/intercept for electricity, gas, converter-electricity, converter-gas

    slope_electricity, intercept_electricity, slope_gas, intercept_gas = 0, 0, 0, 0    
    slope_converter_electricity, intercept_converter_electricity, slope_converter_gas, intercept_converter_gas = 0, 0, 0, 0

    if len(years_electricity) > 0:
        x = np.array(years_electricity)
        y = np.array(electricity)
        slope_electricity, intercept_electricity = np.polyfit(x, y, 1)

    if len(years_gas) > 0:
        x = np.array(years_gas)
        y = np.array(gas)
        slope_gas, intercept_gas = np.polyfit(x, y, 1)

    if len(converter_years_electricity) > 0:
        x = np.array(converter_years_electricity)
        y = np.array(converter_electricity)
        slope_converter_electricity, intercept_converter_electricity = np.polyfit(x, y, 1)

    if len(converter_years_gas) > 0:
        x = np.array(converter_years_gas)
        y = np.array(converter_gas)
        slope_converter_gas, intercept_converter_gas = np.polyfit(x, y, 1)

    # print("Electricity", slope_electricity, intercept_electricity)
    # print("Gas", slope_gas, intercept_gas)
    # print("Converter electricity", slope_converter_electricity, intercept_converter_electricity)
    # print("Converter gas", slope_converter_gas, intercept_converter_gas)

    return { 
        'electricity': {'slope': slope_electricity, 'intercept': intercept_electricity},        
        'gas': {'slope': slope_gas, 'intercept': intercept_gas},        
        'converter_electricity': {'slope': slope_converter_electricity, 'intercept': intercept_converter_electricity},        
        'converter_gas': {'slope': slope_converter_gas, 'intercept': intercept_converter_gas}        
    }


def makeprediction(baseparameters, prediction_year):        
    """
    Make predictions for electricity and gas use and electricity and gas conversion factors using base parameters for a particular year

    As we're using simple linear regression, it's just a case of (slope * time) + intercept
    """

    predicted_electricity = (baseparameters['electricity']['slope'] * prediction_year) + baseparameters['electricity']['intercept']
    predicted_gas = (baseparameters['gas']['slope'] * prediction_year) + baseparameters['gas']['intercept']

    if str(prediction_year) in converter_kg_electricity:
        predicted_converter_electricity = converter_kg_electricity[str(prediction_year)]
    else:
        predicted_converter_electricity = (baseparameters['converter_electricity']['slope'] * prediction_year) + baseparameters['converter_electricity']['intercept']
    
    if str(prediction_year) in converter_kg_gas:
        predicted_converter_gas = converter_kg_gas[str(prediction_year)]
    else:
        predicted_converter_gas = (baseparameters['converter_gas']['slope'] * prediction_year) + baseparameters['converter_gas']['intercept']

    if predicted_electricity < 0: predicted_electricity = 0
    if predicted_gas < 0: predicted_gas = 0
    if predicted_converter_electricity < 0: predicted_converter_electricity = 0
    if predicted_converter_gas < 0: predicted_converter_gas = 0

    return {
        'predicted_electricity': predicted_electricity,
        'predicted_gas': predicted_gas,
        'predicted_converter_electricity': predicted_converter_electricity,
        'predicted_converter_gas': predicted_converter_gas
    }

def calculateemissions(predictionarray):
    """
    Combine the predicted electricity, gas, electricity conversion factor, gas conversion factor to produce overall CO2 emissions
    """

    emissions_gas = int(predictionarray['predicted_gas'] * predictionarray['predicted_converter_gas'] / 1000)
    emissions_electricity = int(predictionarray['predicted_electricity'] * predictionarray['predicted_converter_electricity'] / 1000)

    return {'gas': emissions_gas, 'electricity': emissions_electricity}


def retrievecarbondata(periodstart, periodend, geometrycode):
    """
    Retrieve carbon data for specific area and make predictions where necessary
    """

    # Calculate base parameters from all area data
    # This uses numeric equations to calculate linear trends
    now = datetime.datetime.now()
    areadata = Data.objects.filter(geometrycode=geometrycode).order_by('year')
    if areadata.exists() is False: return {}
    baseparameters = calculatebaseparameters(areadata)

    # Create blank array for all years in requested range
    data = {}
    for year in range(int(periodstart), 1 + int(periodend)):
        year = str(year)
        data[year] = {'electricity': 0, 'gas': 0}

    # Populate blank array with existing data where it exists
    maxyear = 0
    for areadataitem in areadata:
        year = areadataitem.year
        if int(year) > maxyear: maxyear = int(year)
        if year in data:
            if areadataitem.type == 0: 
                key = 'electricity'
                conversionfactor = converter_kg_electricity[year] / 1000
            if areadataitem.type == 1: 
                key = 'gas'
                conversionfactor = converter_kg_gas[year] / 1000
            data[year][key] = int(conversionfactor * float(areadataitem.value))

    # For years outside provided data, estimate using base parameters
    if maxyear < int(periodend):
        extrastart = maxyear + 1
        if extrastart < int(periodstart): extrastart = int(periodstart)
        for year in range(extrastart, 1 + int(periodend)):
            predictionarray = makeprediction(baseparameters, year)
            data[year] = calculateemissions(predictionarray)
 
    return data
