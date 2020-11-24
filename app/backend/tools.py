"""
Copyright (c) Open Carbon, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

backend/tools.py
Provides range of backend tools that can be run from command line:

importlocations: Imports location data from file that is used to geolocate specific locations
generategeometries: Generates multiple geometries of boundaries for multiple zoom levels using simplification
processspecialcases: Perform additional ad-hoc processing
importdata: Imports data for specific area scale and year range (assuming BEIS data)
"""

import os
import pandas
import json
import topojson as tp
import geojson
import csv
import re
from shapely.geometry import Polygon

if __name__ == '__main__':
    import sys
    import django
    parent_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), os.path.pardir))
    sys.path.append(parent_dir)
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "carbonmap.settings")
    django.setup()

from django.contrib.gis.db.models.functions import AsGeoJSON
from django.core.serializers.json import DjangoJSONEncoder
from django.contrib.gis.geos import GEOSException, GEOSGeometry, Point, fromstr
from django.db import connection, transaction
from django.contrib.gis.db.models import Extent
from backend.gis import get_degrees_per_pixel
from backend.models import Location, Geometry, Data, DATATYPES_CHOICES

# Number of zoom levels to cache geometries for
# We generate a target-resolution-dependent simplification for each geometry object to minimize download size
zoomrange = 15

# Paths to subregion geojson files
subregions = {
                'lau1': [   'subregions/Local_Administrative_Units_Level_1_2018.json'],
                'msoa': [   "subregions/england_msoa.json",
                            "subregions/wales_msoa.json",
                            "subregions/scotland_ig.json"],
                'lsoa': [   "subregions/england_lsoa.json",
                            "subregions/wales_lsoa.json",
                            "subregions/scotland_dz.json"],
            }

subregion_scotland_correction = "subregions/Counties_and_Unitary_Authorities_GB_2018.json"

non_decimal = re.compile(r'[^\d.]+')

def getlargestpolygon(areatype):
    """
    Get largest area for particular area type

    Ad-hoc function used to determine minimum zoom levels when MSOA/IG and LSOA/DZ appear
    """
    maxvalue = 0
    areacode = ''
    geometries = Geometry.objects.filter(zoom=15, type=areatype).annotate(Extent('geometry')).values('code', 'geometry__extent')
    for geometry in geometries:
        lng_west, lat_south, lng_east, lat_north = geometry['geometry__extent']
        lat_dif = lat_north - lat_south
        lng_dif = lng_east - lng_west

        if (lng_dif > maxvalue):
            maxvalue = lng_dif
            areacode = geometry['code']
        if (lat_dif > maxvalue):
            maxvalue = lat_dif
            areacode = geometry['code']

    return areacode

def get_yearsuffix_from_filepath(filepath):
    """
    Get year suffix from file path of boundary file
    """
    re_match = re.search(r"(\d{4})", filepath)
    if re_match:
        year = re_match.group(1)
        return year[2:]    
    else: return None

def get_feature_name_code(properties, yearsuffix):
    """
    Get name and code from GeoJSON feature
    """    
    
    code = None
    if 'code' in properties: code = properties['code']
    elif ('lau1' + yearsuffix + 'cd') in properties: code = properties['lau1' + yearsuffix + 'cd']
    elif ('ctyua' + yearsuffix + 'cd') in properties: code = properties['ctyua' + yearsuffix + 'cd']

    name = None
    if 'Name' in properties: name = properties['Name']
    elif 'name' in properties: name = properties['name']
    elif ('lau1' + yearsuffix + 'nm') in properties: name = properties['lau1' + yearsuffix + 'nm']
    elif ('ctyua' + yearsuffix + 'nm') in properties: name = properties['ctyua' + yearsuffix + 'nm']

    return {'name': name, 'code': code}

def processspecialcases():
    """
    Perform additional ad-hoc processing

    - Replace Scotland LAU1s with separate local authority boundaries as BEIS data uses non-standard LAU1 naming
    """

    # Replace Scotland LAU1s with separate unitary authority boundaries as BEIS data uses unitary authorities for Scotland data at large scale
    scottishareas = Geometry.objects.filter(code__startswith="S", type='lau1').delete()
    print("Loading supplemental file for Scottish LAs", subregion_scotland_correction)
    with open(subregion_scotland_correction) as f:
        geojson_codes, topologysafe_codes = [], []
        yearsuffix = get_yearsuffix_from_filepath(subregion_scotland_correction)
        geometrydata = geojson.load(f)

        # Create a list of all feature codes for entire file
        for feature in geometrydata['features']:
            feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
            if feature_namecode['code']: geojson_codes.append(feature_namecode['code'])

        geometrytopology = tp.Topology(geometrydata)

        # Create a list of all feature codes that topojson processed successfully
        topologysafefeatures = json.loads(geometrytopology.to_geojson())
        for feature in topologysafefeatures['features']:
            feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
            if feature_namecode['code']: topologysafe_codes.append(feature_namecode['code'])

        # Get difference of feature codes between original file and topojson successfully processed feature codes
        code_diff = list(set(geojson_codes) - set(topologysafe_codes))

        # Create a custom feature set from the features that topojson failed to process
        # TODO: investigate why topojson fails on certain polygons
        diff_features = []
        for feature in geometrydata['features']:
            feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
            if feature_namecode['code'] in code_diff:
                diff_features.append(feature)

        print("Number of polygons topojson failed on =", len(diff_features))

        for zoom in range(0, zoomrange + 1):

            print("Creating identical polygons for all zoom levels for polygons topojson was not able to process", len(diff_features))

            for feature in diff_features:
                feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
                if feature_namecode['code'][:1] == 'S': # Is scottish feature
                    try:
                        geometry = GEOSGeometry(str(feature['geometry']))
                        print("Saving geometry for", feature_namecode['code'], "zoom level", zoom)
                        geometryobject = Geometry(name=feature_namecode['name'], type='lau1', code=feature_namecode['code'], zoom=zoom, geometry=geometry)
                        geometryobject.save()
                    except:
                        print("Failed to create geometry object - probably too small for zoom level", code, "zoom level", zoom, "degree resolution", zoomepsilon)
       
            zoomepsilon = get_degrees_per_pixel(zoom)

            print("Simplifying", subregion_scotland_correction, "for zoom level", zoom, "equivalent to degree resolution", zoomepsilon)

            simplifiedfeatures = json.loads(geometrytopology.toposimplify(
                epsilon=zoomepsilon, 
                simplify_algorithm='dp', 
                prevent_oversimplify=True
            ).to_geojson())

            count = 0
            for feature in simplifiedfeatures['features']:
                feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
                geometry = GEOSGeometry(str(feature['geometry']))
                if feature_namecode['code'][:1] == 'S': # Is scottish feature
                    print("Saving geometry for", feature_namecode['code'], feature_namecode['name'])
                    geometryobject = Geometry(name=feature_namecode['name'], type='lau1', code=feature_namecode['code'], zoom=zoom, geometry=geometry)
                    geometryobject.save() 

def generategeometries():
    """
    Generates multiple geometries of boundaries for multiple zoom levels using simplification
    """

    for areatype in subregions:
        Geometry.objects.filter(type=areatype).delete()
        for areafile in subregions[areatype]:
            print("Loading area file", areafile)
            with open(areafile) as f:
                geojson_codes, topologysafe_codes = [], []
                yearsuffix = get_yearsuffix_from_filepath(areafile)
                geometrydata = geojson.load(f)

                # Create a list of all feature codes for entire file
                for feature in geometrydata['features']:
                    feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
                    if feature_namecode['code']: geojson_codes.append(feature_namecode['code'])

                geometrytopology = tp.Topology(geometrydata)

                # Create a list of all feature codes that topojson processed successfully
                topologysafefeatures = json.loads(geometrytopology.to_geojson())
                for feature in topologysafefeatures['features']:
                    feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
                    if feature_namecode['code']: topologysafe_codes.append(feature_namecode['code'])

                # Get difference of feature codes between original file and topojson successfully processed feature codes
                code_diff = list(set(geojson_codes) - set(topologysafe_codes))

                # Create a custom feature set from the features that topojson failed to process
                # TODO: investigate why topojson fails on certain polygons
                diff_features = []
                for feature in geometrydata['features']:
                    feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
                    if feature_namecode['code'] in code_diff:
                        diff_features.append(feature)

                print("Number of polygons topojson failed on =", len(diff_features))

                for zoom in range(0, zoomrange + 1):

                    print("Creating identical polygons for all zoom levels for polygons topojson was not able to process", len(diff_features))

                    for feature in diff_features:
                        feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
                        try:
                            geometry = GEOSGeometry(str(feature['geometry']))
                            print("Saving geometry for", feature_namecode['code'], "zoom level", zoom)
                            geometryobject = Geometry(name=feature_namecode['name'], type=areatype, code=feature_namecode['code'], zoom=zoom, geometry=geometry)
                            geometryobject.save() 
                        except:
                            print("Failed to create geometry object - probably too small for zoom level", code, "zoom level", zoom, "degree resolution", zoomepsilon)

                    zoomepsilon = get_degrees_per_pixel(zoom)

                    print("Simplifying", areafile, "for zoom level", zoom, "equivalent to degree resolution", zoomepsilon)

                    simplifiedfeatures = json.loads(geometrytopology.toposimplify(
                        epsilon=zoomepsilon, 
                        simplify_algorithm='dp', 
                        prevent_oversimplify=True
                    ).to_geojson())

                    for feature in simplifiedfeatures['features']:
                        feature_namecode = get_feature_name_code(feature['properties'], yearsuffix)
                        try:
                            geometry = GEOSGeometry(str(feature['geometry']))
                            print("Saving geometry for", feature_namecode['code'], "zoom level", zoom, "degree resolution", zoomepsilon)
                            geometryobject = Geometry(name=feature_namecode['name'], type=areatype, code=feature_namecode['code'], zoom=zoom, geometry=geometry)
                            geometryobject.save() 
                        except:
                            print("Failed to create geometry object - probably too small for zoom level", code, "zoom level", zoom, "degree resolution", zoomepsilon)

    processspecialcases()

def importdatabygeometrytype(geometrytype, year, datatype):
    """
    Import data for a specific geometry type and year
    """

    datatypecode = 'ELEC'
    if datatype == 1: datatypecode = 'GAS'
    geometry_prefix = 'LSOA'
    geometrycode_row = 'LSOACode'
    multiplier_meter = 1
    multiplier_value = 1
    if geometrytype == 'msoa': 
        geometry_prefix = 'MSOA'
        geometrycode_row = 'MSOACode'
    if geometrytype == 'lau1': 
        geometry_prefix = 'LAU1'
        geometrycode_row = 'LA Code'
        multiplier_meter = 1000
        multiplier_value = 1000000
    filepath = 'BEIS/' + geometry_prefix + '_' + datatypecode + '_' + str(year) + '.csv'
    Data.objects.filter(geometrytype=geometrytype, year=year, type=datatype).delete()

    count = 0
    if os.path.isfile(filepath):
        with open(filepath, 'r' ) as fileobj:
            reader = csv.DictReader(fileobj)
            for row in reader:
                count += 1
                print("Importing line", count, filepath)
                geometrycode = row[geometrycode_row].strip()
                if geometrytype == 'lau1':
                    if row['Total consumption'] == '..': continue
                    if row['Total consumption'] == ' -   ': continue
                    value = float(non_decimal.sub("", row['Total consumption']))
                    meters = float(row['Total number of meters'])
                else:            
                    value = float(row['KWH'])
                    meters = float(row['METERS'])
                meters = meters * multiplier_meter
                value = value * multiplier_value
                data = Data(
                    type=datatype,
                    year=str(year), 
                    value=value,
                    meters=meters,
                    geometrycode=geometrycode,
                    geometrytype=geometrytype)
                data.save()

        print("Imported " + geometry_prefix + " for type " + str(datatype) + " for " + str(year))
    else:
        print(filepath, "not found")

def importdata(geometrytype, yearstart, yearend):
    """
    Import data for specify geometry type and year range
    """

    for year in range(int(yearstart), 1 + int(yearend)):
        print ("Importing data for year", year)
        for datatype in DATATYPES_CHOICES:
            importdatabygeometrytype(geometrytype, year, datatype[0])

def checkgeometries():
    """
    Check to see if any geometries corrupted
    """

    allgeometries = Geometry.objects.all().annotate(json=AsGeoJSON('geometry')).values('name', 'code', 'zoom', 'type', 'json').order_by('code', 'type', 'zoom')
    for geometry in allgeometries:
        print("Checking geometry", geometry['code'], geometry['type'], geometry['zoom'])
        json_data = json.dumps(list(geometry), cls=DjangoJSONEncoder)

def renameduplicateshortcodes():
    """
    Runs custom piece of SQL to rename duplicate shortcodes in location table
    """

    cursor = connection.cursor()
    cursor.execute("""
    UPDATE backend_location  
    SET shortcode = CONCAT(shortcode, REPLACE(LOWER(county), ' ', '')) 
    WHERE shortcode IN 
    (
        SELECT s.shortcode 
        FROM 
        (
            SELECT shortcode,COUNT(*) AS num 
            FROM backend_location GROUP BY shortcode
        ) AS s 
        WHERE s.num > 1
    );
    """, [])
    transaction.commit()

def computescale(population):
    """
    Computes appropriate scale to show locations with specific population
    """

    if population == '': population = 0
    population = int(population)

    if population < 20000: return 15
    if population < 40000: return 14.5
    if population < 60000: return 14
    if population < 80000: return 13.5
    if population < 100000: return 13
    if population < 200000: return 12.5
    if population < 400000: return 12
    if population < 600000: return 11.5
    if population < 800000: return 11
    if population < 1000000: return 10.5

    return 10

def importlocations():
    """
    Imports location data from file that is used to geolocate specific locations
    """

    with open('Towns_List_Extended.csv') as csvfile:
        reader = csv.DictReader(csvfile)
        count = 0
        Location.objects.all().delete()
        for row in reader:
            shortcode = row['Town'].lower()
            shortcode = re.sub("[ ]", "", shortcode)
            scale = computescale(row['Population'])
            p = Location(   shortcode=shortcode, 
                            town=row['Town'], 
                            county=row['County'], 
                            country=row['Country'], 
                            population=row['Population'], 
                            longitude=row['Longitude'], 
                            latitude=row['Latitude'], 
                            url=row['url'],
                            scale=scale)
            p.save()
            count += 1

    renameduplicateshortcodes()

    print("Import locations finished, imported: " + str(count))

if len(sys.argv) == 1:
    print("""
****** Carbon Map Batch Processing *******

Possible arguments are:

checkgeometries
  Check whether any geometries are corrupted

importlocations
  Imports location data from file that is used to geolocate specific locations

generategeometries
  Generates multiple geometries of boundaries for multiple zoom levels using simplification

processspecialcases
  Perform additional ad-hoc processing

importdata [lsoa/msoa/lau1] [yearstart] [yearend]
  Imports data for specific area scale and year range (assuming BEIS data)
  Leaving off [yearend] will only import for [yearstart]
""")

else:
    primaryargument = sys.argv[1]

    if primaryargument == "checkgeometries":
        checkgeometries()
    if primaryargument == "importlocations":
        importlocations()
    if primaryargument == "generategeometries":
        generategeometries()
    if primaryargument == "processspecialcases":
        processspecialcases()
    if primaryargument == "importdata":
        if len(sys.argv) >= 4:
            yearstart = sys.argv[3]
            yearend = yearstart
            if len(sys.argv) == 5: yearend = sys.argv[4]
            geometrytype = sys.argv[2]
            importdata(geometrytype, yearstart, yearend)    
        else:
            print("Not enough arguments provided for importdata. Format is importdata lsoa/msoa/lau1 yearstart yearend")


