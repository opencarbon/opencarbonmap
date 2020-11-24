"""
Copyright (c) Open Carbon, 2020
 
This source code is licensed under the MIT license found in the
LICENSE file in the root directory of this source tree.

backend/admin.py
Register forms for Django admin interface
"""

from django.contrib import admin
from .models import Location, LocationAdmin, Geometry, GeometryAdmin, Data, DataAdmin

admin.site.register(Location, LocationAdmin)
admin.site.register(Geometry, GeometryAdmin)
admin.site.register(Data, DataAdmin)