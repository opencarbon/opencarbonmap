"""
Copyright (c) Open Carbon, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

backend/models.py
Django models
"""

from django.db import models
from django.contrib.gis.db import models
from django.contrib.gis.geos import GEOSGeometry, Point
from django.contrib.gis.admin import OSMGeoAdmin
from django.dispatch import receiver
from django.db.models.signals import pre_save

# Range of possible geographical geometries
GEOMETRY_CHOICES = (
    ("lsoa", "Lower Layer Super Output Areas / Scottish Datazones"),
    ("msoa", "Middle Layer Super Output Areas / Scottish Intermediate Geographies"),
    ("lau1", "Local Administrative Units Level 1"),
)

# Range of possible datatypes
DATATYPES_CHOICES = (
    (0, "Electricity"),
    (1, "Gas")
)

class Location(models.Model):
    """
    Stores location lookup for when user queries on specific location
    """
    shortcode = models.CharField(max_length=100)
    scale = models.FloatField(max_length=100, default=0)
    town = models.CharField(max_length=100)
    county = models.CharField(max_length=100)
    country = models.CharField(max_length=100)
    population = models.CharField(max_length=100)
    latitude = models.CharField(max_length=100)
    longitude = models.CharField(max_length=100)
    url = models.CharField(max_length=100)
    location = models.PointField(null=True, blank=True)

    class Meta:
        ordering = ('county', 'town') 
        indexes = [
            models.Index(fields=['shortcode',]),
            models.Index(fields=['town',]),
        ]

    def __str__(self):
        return self.town + ", " + self.county

@receiver(pre_save, sender=Location)
def update_location(sender, instance, *args, **kwargs):
    """
    Whenever location is updated, update its GIS 'location' field baed on long/lat values
    """
    if (instance.longitude != '') and (instance.latitude != ''):
        instance.location = Point(float(instance.longitude), float(instance.latitude))

class LocationAdmin(OSMGeoAdmin):
    """
    Admin class for managing locations through admin interface
    """
    search_fields = (
        'town',
        'county',
        'shortcode',
    )

class Geometry(models.Model):
    """
    Stores geographical geometries, eg. LAU1, MSOA, IG, LSOA, DZ polygons
    Uses zoom-specific resolutions to minimise download size to user
    """
    type = models.CharField(max_length = 200, choices=GEOMETRY_CHOICES)
    name = models.CharField(max_length = 200)
    code = models.CharField(max_length = 200)
    zoom = models.IntegerField(default = 0)
    geometry = models.GeometryField(null=True, blank=True)

    def _get_geometry(self):
        return self.geometry

    geom = property(_get_geometry)
    
    class Meta:
        indexes = [
            models.Index(fields=['type',]),
            models.Index(fields=['code',]),
            models.Index(fields=['zoom']),
            models.Index(fields=['geometry',]),
        ]

class GeometryAdmin(OSMGeoAdmin):
    """
    Admin class for managing geometries through admin interface
    """
    list_display = ['name', 'type', 'code', 'zoom']

    search_fields = (
        'name',
        'type',
        'code'
    )

class Data(models.Model):
    """
    Stores geometry-related emissions data
    geometrycode maps to Geometry.code
    """
    type = models.IntegerField(choices=DATATYPES_CHOICES)
    year = models.CharField(max_length = 4)
    value = models.DecimalField(max_digits = 20, decimal_places=2)
    meters = models.FloatField()
    geometrycode = models.CharField(max_length = 200)
    geometrytype = models.CharField(max_length = 200, choices=GEOMETRY_CHOICES)

    class Meta:
        indexes = [
            models.Index(fields=['type',]),
            models.Index(fields=['year',]),
            models.Index(fields=['geometrycode',]),
            models.Index(fields=['geometrytype',]),
        ]

    def __str__(self):
        return str(self.geometrytype) + ": " + self.geometrycode

class DataAdmin(OSMGeoAdmin):
    """
    Admin class for managing data objects through admin interface
    """
    list_display = ['geometrytype', 'geometrycode', 'type', 'year', 'value', 'meters']

    search_fields = (
        'year',
        'geometrycode'
    )
