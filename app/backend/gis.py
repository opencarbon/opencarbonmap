"""
Copyright (c) Open Carbon, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

backend/gis.py
GIS-related functions
"""

import urllib
import json
import requests
import math

from django.contrib.gis.geos import Point

def get_meters_per_pixel(zoom):
    """
    Get meters per pixel in order to determine appropriate 
    simplification for geometry at particular zoom level

    Formula for calculating distance (m) per pixel at zoom level is:
    d = C * cos(latitude) / 2^(zoom + 8)
    where C = 40075016.686 (equatorial circumference)

    https://wiki.openstreetmap.org/wiki/Zoom_levels
    """

    # We assume smallest distance for UK, so choose northernmost point, eg. Shetland, 61 degrees north
    C = 40075016.686
    d = C * math.cos((61 / 360) * (2 * math.pi)) / (2 ** (zoom + 8))

    return d

def get_degrees_per_pixel(zoom):
    """
    Get degrees per pixel in order to determine appropriate 
    simplification for geometry at particular zoom level

    Formula for calculating degrees per pixel at zoom level is:
    d = 360 * cos(latitude) / 2^(zoom + 8)

    https://wiki.openstreetmap.org/wiki/Zoom_levels
    """

    # We assume smallest distance for UK, so choose northernmost point, eg. Shetland, 61 degrees north
    d = 360 * math.cos((61 / 360) * (2 * math.pi)) / (2 ** (zoom + 8))

    return d

def get_postcode_point(postcode):
    """
    Gets coordinates of postcode using public api 

    Very kindly provided by http://api.getthedata.com/
    """

    if postcode is None: return None
    if postcode == '': return None    

    url = 'http://api.getthedata.com/postcode/' + urllib.parse.quote_plus(postcode)
    req =  urllib.request.Request(url)
    response = urllib.request.urlopen(req)
    result = json.loads(response.read().decode())

    if result['status'] and result['status'] == 'match':
        return Point(float(result['data']['longitude']), float(result['data']['latitude']))
    else:
        return None
