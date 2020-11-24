"""
Copyright (c) Open Carbon, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

backend/views.py
Django views for rendering default React page and delivering data to frontend
"""

import json
import re

from django.shortcuts import render
from django.contrib.gis.geos import Polygon
from django.contrib.gis.db.models import Extent
from django.core.serializers import serialize
from django.http import HttpResponse, HttpResponseRedirect
from django.views.decorators.csrf import csrf_exempt
from django.contrib.gis.db.models.functions import AsGeoJSON
from django.core.serializers.json import DjangoJSONEncoder
from rest_framework import serializers
from ukpostcodeutils import validation

from .models import Location, Geometry
from .carbonmodel import retrievecarbondata
from .gis import get_postcode_point

# Array of geometry type codes used to determine numerical geometry type to send back to server, ie. 1, 2, or 3
geometrytypecode = ['lau1', 'msoa', 'lsoa']

def home(request):
    """
    Shows default home page or other frontend-specific pages to be rendered by frontend React app
    """
    return render(request, 'index.html')

@csrf_exempt
def Geometries(request):
    """
    Get all geometries within boundary box for particular zoom level
    """

    data = json.loads(request.body)
    geometrytype, zoom, xmin, ymin, xmax, ymax = data['geometrytype'], data['zoom'], data['xmin'], data['ymin'], data['xmax'],data['ymax']
    type = geometrytypecode[int(geometrytype) - 1]

    # print(type, zoom, xmin, ymin, xmax, ymax)

    bbox = (xmin, ymin, xmax, ymax)
    geometry = Polygon.from_bbox(bbox)

    allfeatures = Geometry.objects.filter(zoom=zoom, type=type, geometry__bboverlaps=geometry).annotate(json=AsGeoJSON('geometry')).values('name', 'code', 'type', 'json')
    json_data = json.dumps(list(allfeatures), cls=DjangoJSONEncoder)

    return HttpResponse(json_data, content_type="text/json")

@csrf_exempt
def Data(request):
    """
    Get data and properties of particular area
    """

    data = json.loads(request.body)
    result = {'result': 'failure'}
    periodstart, periodend, area = data['periodstart'], data['periodend'], data['area']

    if periodstart is not None and periodend is not None and area is not None:
        data = retrievecarbondata(periodstart, periodend, area)
        geometry = Geometry.objects.filter(zoom=15, code=area).values('name', 'type').first()
        geometrytype = 1 + geometrytypecode.index(geometry['type'])
        area = {'name': geometry['name'], 'code': area, 'type': geometry['type'], 'geometrytype': geometrytype}
        result = {'result': 'success', 'area': area, 'data': data}

    return HttpResponse(json.dumps(result), content_type="text/json-comment-filtered")

@csrf_exempt
def GeometryBounds(request):
    """
    Get bounds of particular area
    """

    data = json.loads(request.body)
    area = Geometry.objects.filter(zoom=15, code=data['areacode']).annotate(Extent('geometry')).values('type', 'geometry__extent').first()
    geometrytype = 1 + geometrytypecode.index(area['type'])
    return HttpResponse(json.dumps({'geometrytype': geometrytype, 'rect': area['geometry__extent']}), content_type="text/json")

@csrf_exempt
def LocationPosition(request):
    """
    Get coordinates for location or postcode
    """

    locationtext = request.GET.get('location').strip()

    location, zoom, result = None, 15, {'result': 'failure'}
    postcodetext = re.sub("[^0-9a-zA-Z]+", "", locationtext).upper()   

    if validation.is_valid_postcode(postcodetext):
        location = get_postcode_point(postcodetext)
    else:
        locationrecord = Location.objects.filter(town__iexact=locationtext).first()
        if (locationrecord is not None):
            location = locationrecord.location
            zoom = locationrecord.scale

    if location:
        result = {'result': 'success', 'data': {'lat': location[1], 'lng': location[0], 'zoom': zoom}}

    return HttpResponse(json.dumps(result), content_type="text/json-comment-filtered")
