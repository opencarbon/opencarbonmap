"""
Copyright (c) Open Carbon, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

testgeometries.py
Tests the geometries in the 'subregions' folder to ensure they produce no errors
If errors are produced, simplifiy the GeoJSON file using mapshaper.org
"""

import os
import re
import json
import geojson
import topojson as tp

geometriesfolder = "app/subregions/"

def get_yearsuffix_from_filepath(filepath):
    """
    Get year suffix from file path of boundary file
    """
    re_match = re.search(r"(\d{4})", filepath)
    if re_match:
        year = re_match.group(1)
        return year[2:]    
    else: return None

def get_feature_code(properties, yearsuffix):
    """
    Get code from GeoJSON feature
    """    
    
    code = None
    if 'code' in properties: code = properties['code']
    elif ('lau1' + yearsuffix + 'cd') in properties: code = properties['lau1' + yearsuffix + 'cd']

    return code

geometryfiles = os.listdir(geometriesfolder)
for geometryfile in geometryfiles:
    if geometryfile.endswith(".json"):
        with open(geometriesfolder + geometryfile) as f:
            yearsuffix = get_yearsuffix_from_filepath(geometryfile)
            print("Testing file", geometryfile)
            geometrydata = geojson.load(f)
            geojson_codes, topologysafe_codes = [], []

            geometrytopology = tp.Topology(geometrydata, prequantize = False)
            print("If any errors shown, simplify this file and rerun this script")


