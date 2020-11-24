# Open Carbon Map
[**Open Carbon Map**](https://map.opencarbon.uk) provides an open source map toolkit for displaying current and predicted carbon emissions for geographical regions across the United Kingdom. Users can select regions at a Local Authority level (LAU1), Middle Layer Super Output Area level (MSOA), Lower Layer Super Output Area level (LSOA), Intermediate Geographies level (IG), or Datazones level (DZ). 

Users can select multiple regions at different levels and compare them against each other, both in terms of recorded emissions and predicted emissions. Predicted emissions are calculated according to a simple linear regression equation. Clicking on the title bar of any selected region brings the region into focus on the map.

Note that due to the small size of many MSOAs/IGs/LSOAs/DZs relative to LAU1 areas, smaller regions are kept hidden for low zoom magnifications but become accessible as the user zooms in.

All data used is freely available from public sources, specifically:

- [Department for Business, Energy & Industrial Strategy](https://www.gov.uk/government/organisations/department-for-business-energy-and-industrial-strategy)
- [UK Data Service](https://borders.ukdataservice.ac.uk/)

Data is licensed under the [Open Government Licence v3.0](https://www.nationalarchives.gov.uk/doc/open-government-licence/version/3/)

## Why a map?
Carbon dioxide is invisible and effective visualizations of carbon dioxide emissions are therefore crucial to improving awareness about the extent of current and future carbon emissions. Evidence-based accessible visualizations also help prioritize action towards more impactful interventions.

## Software toolkit
The Open Carbon Map software toolkit consists of a [React](https://reactjs.org/) frontend web application for displaying a map and carbon emissions graphs together with a [Django](https://www.djangoproject.com/) database-driven backend that provides data to the frontend. The data consists of both geographical polygons describing regions in the UK (GIS data) and region-specific carbon emissions data. GIS data is stored in [PostGIS](https://postgis.net/).

To reduce the size of GIS-related downloads, geographical polygons are "zoom-scale dependent", ie. lower resolution versions of LAU1/MSOA/IZ/LSOA/DZ polygons are used when the user is zoomed out, with the resolution increasing as the user zooms in. The creation of geographical polygons for each possible zoom scale (currently in the range 1 - 15) occurs during the initialization phase of the application. To reduce visual clutter, smaller sized polygons (MSOA/IZ/LSOA/DZ) are hidden at low magnifications and become accessible,  via the left-hand menu, as the user zooms in.

The main [Open Carbon Map](https://map.opencarbon.uk) website has been built using this software toolkit. 

## Carbon emissions calculations
Carbon emissions are calculated in the file `app/backend/carbonmodel.py` using the BEIS conversion factors available from:
- https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-2020

The equation used is:
```
Electricity/Gas-related CO2 Emissions = Electricity/Gas Use (in kWH) x BEIS Electricity/Gas Conversion Factor
```

Where emissions predictions are shown, these are calculated by applying first order linear regression separately on (i) Energy Use (ii) Conversion Factor. For example:
```
Predicted Electricity Use [2050] = (2050 * Electricity_Use_Slope) + Electricity_Use_Intercept

Predicted Electricity Conversion Factor [2050] = (2050 * Electricity_Conversion_Slope) + Electricity_Conversion_Intercept)

Predicted Electricity-related CO2 Emissions [2050] = Predicted Electricity Use [2050] x Predicted Electricity Conversion Factor [2050]
```
Note that this is an extreme simplification which assumes a simple linear correlation between time and the respective variables. It does, however, provide a broad estimate of the future trend of electricity/gas CO2 emissions for areas in general.

### Installing software toolkit
The software toolkit can be installed directly on a server or as a [Docker](https://www.docker.com/) container. In both cases the following software environment is used:

- Python 3.6+
- PostGIS database (Postgres with GIS extension)
- Node.js and recent version of Node Package Manager (npm)

An Nginx webserver and Gunicorn application server is used for production deployment though other webservers, such as Apache, can be used.

### Installation - Before you begin
A setup script `setup.sh` creates the necessary configuration files needed to run the application. Before running this script, it is recommended you gather the following information:

- *Domain name of website*: The domain name of your Open Carbon Map website, ie. where your application will be accessible from.

- *Name of PostGIS database to be used for Open Carbon Map system*: For example `opencarbonmap`. If you are installing the toolkit directly on a server, generate a new PostGIS database with this name (assuming PostGIS is already installed). If you are creating a Docker container, the relevant PostGIS database will be created when the container is built.

- *Name/password of new PostGIS database user to be used for Open Carbon Map system*: For example `opencarbonmapuser`. If you are installing the toolkit directly on a server, generate a new PostGIS database user with this name/password and give the user permission to access the database above (assuming PostGIS is already installed). If you are creating a Docker container, the relevant PostGIS user will be created when the container is built.

The `setup.sh` script compiles the frontend application using Node Package Manager (`npm`) and you should therefore have the latest version of `Node.js` and `npm` installed on the machine where you intend to run `setup.sh` - this will be the target server if you are installing direct on the server, or a local development machine if you are creating a Docker container.

To install an up-to-date version of `Node.js`, go to [Node.js](https://nodejs.org/). 

With `Node.js` and `npm` installed and the relevant setup information to hand, run the setup script:

```
./setup.sh
```

This will generate the configuration files for the next stage of installation.

### Installation - Download data files
You will need to download two sets of data files:

- Geographical boundaries files
- Carbon emissions data files

#### Geographical boundaries files
Geographical boundaries files should be stored in the `app/subregions` folder and should comprise the following GeoJSON files:

```
Counties_and_Unitary_Authorities_GB_[YYYY].json
Local_Administrative_Units_Level_1_[YYYY].json
england_lsoa.json
england_msoa.json
scotland_dz.json
scotland_ig.json
wales_lsoa.json
wales_msoa.json
```
Where `[YYYY]` specifies the year, eg. `Counties_and_Unitary_Authorities_GB_2018.json`. Note that for the counties/unitary-authorities and LAU1 files, the year suffix is used to define key fields within the file, eg `ctyua18nm`, and should not be omitted.

The ```Counties_and_Unitary_Authorities_GB_[YYYY].json``` file should contain counties and unitary authorities boundary definitions in GeoJSON format for Great Britain (GB) for the year `YYYY`. A `KML` file for these boundaries can be downloaded from:
- https://geoportal.statistics.gov.uk/datasets/counties-and-unitary-authorities-december-2018-boundaries-gb-bfc/data

The ```Local_Administrative_Units_Level_1_[YYYY].json``` file should contain LAU1 boundaries definitions in GeoJSON format for the UK for year `YYYY`. A `KML` file for these boundaries can be downloaded from:
- https://geoportal.statistics.gov.uk/datasets/local-administrative-units-level-1-january-2018-full-extent-boundaries-in-united-kingdom

Note: the current codebase assumes the year for counties/unitary-authorities and LAU1 levels is `2018`. If you choose a different year, modify the header code within `app/backend/tools.py` to reflect the different file paths.

The ```england_lsoa.json```, ```england_msoa.json```,... and other files should contain LSOA/MSOA/IG/DZ boundary definitions in GeoJSON format for England, Wales and Scotland. `dz` indicates **data zones** which are Scotland's equivalent to the English/Welsh LSOA area while `ig` indicates **intermediate geographies** which are Scotland's equivalent to the English/Welsh MSOA area. `KML` files for LSOA/MSOA/IG/DZ boundaries for England, Wales, and Scotland can be downloaded from:
- https://borders.ukdataservice.ac.uk/bds.html

Select a particular country, then "Statistical Building Block" and download the "generalized, clipped" KML version.

Once you have downloaded all required KML files, convert them to GeoJSON files using `ogr2ogr`:
```
sudo apt install gdal 
[Or on Mac OSX:]
brew install gdal

ogr2ogr -f GeoJSON [filename].json [filename].kml
```

Once all boundaries files are in GeoJSON format, move to the next section - **Carbon emissions data files**

#### Carbon emissions data files
Carbon emissions data files should be stored in the `app/BEIS` folder and should use the following naming convention:
```
[GEOGRAPHICALLEVEL]_[EMISSIONTYPE]_[YYYY].csv
```
Where:
- `[GEOGRAPHICALLEVEL]` is one of `LAU1`, `MSOA`, or `LSOA`
- `[EMISSIONTYPE]` is one of `GAS` or `ELEC`
- `[YYYY]` is a four-digit year

For example:
```
LAU1_ELEC_2012.csv
MSOA_GAS_2014.csv
LSOA_ELEC_2017.csv
```
All emissions data files can be downloaded from BEIS at the following links:
- https://www.gov.uk/government/statistical-data-sets/regional-and-local-authority-electricity-consumption-statistics
- https://www.gov.uk/government/statistics/lower-and-middle-super-output-areas-electricity-consumption

Each emissions data file should contain data in `csv` format for a single year, with a single header row containing the following minimum header fields:

- **LAU1 data files**: Required fields: `LA Code`, `Total consumption`, `Total number of meters`
- **MSOA/IG data files**: Required fields: `MSOACode`, `KHW`, `METERS`
- **LSOA/DZ data files**: Required fields: `LSOACode`, `KHW`, `METERS`

All column headers within downloaded datafiles should be edited to match these fields precisely. If column headers are padded with space as in [`  Total consumption  `] (note the space before and after), these spaces should be removed. Also if column headers differ in the case of any character, they should be edited to exactly match the field names above, eg. `Total number of Meters` should be changed to `Total number of meters`.

While BEIS provides many data files in the required `csv` format, it may be necessary to create additional data files using data extracted from BEIS downloads, for example by copying data from a specific sheet in an Excel workbook and creating a new `csv` file from that data. It may also be necessary to 'clean' certain files, by removing extraneous header, "total" or other rows that do not show region-specific data. 

Before proceeding to the next stage of setup, check the following:

- All emissions data files follow the naming convention of `[GEOGRAPHICALLEVEL]_[EMISSIONTYPE]_[YYYY].csv`
- Each file is in `csv` format and only contains data for a single year - it is not an Excel workbook containing multiple sheets for multiple years
- All data files consist of a single header row of field names followed by a line of data for each region. Additional explanatory rows have been be deleted.
- Each file contains the minimum required fields for that type of file, that is `LA Code`, `Total consumption`, and `Total number of meters` for LAU1 files, `MSOACode`, `KHW`, and `METERS` for MSOA/IG data files, and `LSOACode`, `KWH`, and `METERS` for LSOA/DZ data files

### Installation - Direct on server
With the relevant data files in place, the core installation can be run. This installation assumes `Git` has been installed on the target server and you have cloned the current Git repo at:

```
https://github.com/opencarbon/opencarbonmap.git 
```

If you have not yet run `setup.sh`, install the latest version of `Node.js` and `npm` using the instructions at [Node.js](https://nodejs.org). Then run `setup.sh` and enter the relevant setup information above. The setup process will compile the frontend application using Node Package Manager (`npm`).

Once `setup.sh` has completed, install `Python3`, `Pip`, `Postgres`, `PostGIS`, `virtualenv`, `ssl-cert`, and `Nginx` on the target server if they are not already installed:
```
sudo apt update
sudo apt install python3 python3-dev python-pip postgresql postgis virtualenv ssl-cert nginx 
```

Connect to Postgres and create a new PostGIS-enabled Postgres database and user, consistent with the details you entered during `setup.sh`:

```
sudo su postgres
psql
create database [database_name];
create user [database_user] with encrypted password '[database_password]';
grant all privileges on database [database_name] to [database_user];
\c [database_name];
CREATE EXTENSION postgis;
[CTRL-D to quit Postgres]
exit (to return to main user)
```
Note that `CREATE EXTENSION postgis` enables PostGIS for the particular database.

Create and activate a virtual environment for Python3 by typing:

```
which python3
virtualenv -p [insert_path_from_previous_prompt] venv
source venv/bin/activate
```

Change directory to the main Django application folder:
```
cd app
```

With the virtual environment activated, install the necessary Python modules for the application by typing:
```
pip install -r requirements.txt
```

Initialize the PostGIS database for Django and collect together Django's static files (required for production) by typing:

```
./manage.py makemigrations backend
./manage.py migrate
./manage.py collectstatic --noinput
```
Create a superuser for accessing the Django administration system by typing:
```
./manage.py createsuperuser
```

Import the Open Carbon Map location database by typing:

```
python3 backend/tools.py importlocations
```

The location database is used to map UK place names to specific geographic coordinates. 

Import the Open Carbon Map emissions data files from the `BEIS` folder using the command:
```
python3 backend/tools.py importdata [LEVEL] [YEARSTART] [YEAREND]
```
Where `[LEVEL]` is one of `lau1`, `msoa`, or `lsoa` and `[YEARSTART]` and `[YEAREND]` are the start and end year.

BEIS currently provide LAU1 data for 2012-2018, MSOA data for 2010-2018, and LSOA data for 2010-2018. With these files, it should be possible to run:
```
python3 backend/tools.py importdata lau1 2012 2018
python3 backend/tools.py importdata msoa 2010 2018
python3 backend/tools.py importdata lsoa 2010 2018
```

The final stage of setup involves generating zoom-specific geometries for the LAU1, MSOA/IG and LSOA/DZ geographic definitions. This stage takes several hours to complete on an typical setup and can be left to run overnight:
```
python3 backend/tools.py generategeometries
```
With all the backend database tables set up, start the application by typing:

```
./manage.py runserver
```
Open a web browser and load the application (development not production environment) at:
```
http://127.0.0.1:8000
```

To load the Django administration system, go to:
```
http://127.0.0.1:8000/admin
```

#### Production mode
To install the application in production mode with Nginx as the webserver and gunicorn as the application server, return to the main folder where `README.md` is located:
```
cd ..
```

Change the `app/.env` link to point to `.env.prod` rather than `.env.dev` so the application uses production environment variables:

```
rm app/.env
ln -s .env.prod app/.env
```

Finally, run `install.sh`:

```
./install.sh
```

This will install the Nginx and gunicorn configuration files, restart Nginx and register a gunicorn service called `gunicorn_opencarbonmap`. It will also change the owner of the main `opencarbonmap` folder to `www-data:www-data` so gunicorn can create a Unix socket for communicating with Nginx. 

Once install has completed, you should be able to access the application by entering `localhost` (or equivalent domain name) into a browser address bar.


### Installation - As Docker container
With the relevant data files in place, the core installation can be run. 
Ensure you have run `./setup.sh` first. Also ensure you have **Docker** and **Docker Compose** installed on your machine. If you have neither, install [**Docker Desktop**](https://docker.com) which includes both applications. 

Due to the use of environment variables in the Docker Compose configuration file, the version of Docker Compose must be `> 1.25.4`. To check your version of Docker Compose, type:
```
docker-compose --version
``` 

To run the development Docker container, switch to the directory where this `README.md` is located and type:

```
docker-compose up --build
```

This will build the necessary Docker images, including a PostGIS database and Python 3 environment, and run them as a container. You should then be able to load the skeleton Open Carbon Map application (excluding boundary data and carbon emissions data) by opening a browser and entering `localhost:8000` (or domain name on port 8000 if mapped) into the address bar.

To run the production Docker container, load the production **Docker Compose** file `docker-compose.prod.yml` by typing:

```
docker-compose -f docker-compose.prod.yml up --build
```

This will build an additional Nginx reverse proxy server as part of a production-ready container.

To run either container detached (in the background), press `CTRL-C`, remove `--build` and add `-d`. For example:

```
docker-compose up -d

docker-compose -f docker-compose.prod.yml up -d
```

The Docker installation process automatically imports the location lookup file that is used to map locations to geographical coordinates. However it does not import the geographical boundaries or carbon emissions files. 

To import emissions data files from the `BEIS` folder, enter the command:
```
docker exec -it opencarbonmap_web python3 backend/tools.py importdata [LEVEL] [YEARSTART] [YEAREND]
```
Where `[LEVEL]` is one of `lau1`, `msoa`, or `lsoa` and `[YEARSTART]` and `[YEAREND]` are the start and end year. For example:
```
docker exec -it opencarbonmap_web python3 backend/tools.py importdata lau1 2012 2018
docker exec -it opencarbonmap_web python3 backend/tools.py importdata msoa 2010 2018
docker exec -it opencarbonmap_web python3 backend/tools.py importdata lsoa 2010 2018
```

To import and process the `subregions` folder of boundaries files - a process which can take several hours - type:
```
docker exec -it opencarbonmap_web python3 backend/tools.py generategeometries
```

Due to the processing time of this step, it is recommended this process is run overnight.

To access the Django administration interface, create an administrative **superuser** by typing:
```
docker exec -it opencarbonmap_web python3 manage.py createsuperuser
```

Use the entered credentials to login at:
```
http://yourdomain:8000/admin/ [If development]
http://yourdomain/admin/ [If production]
```

## Compatibility
The system has been tested on recent versions of Chrome, Firefox, Safari, Opera, Microsoft Edge and Internet Explorer 11 internet browsers. 

## Thanks
Many thanks to Chris Pointon and the Cambridge Carbon Map team for developing the principles behind the Open Carbon Map project. 

## Contact
Tackling the climate challenge requires effective collaboration and we are keen to collaborate with any organisations who share our passion for sharing carbon emissions data in an open and public way. To get in contact, email us at:

info@opencarbon.uk

## Copyright

Open Carbon Map  
Copyright (c) Open Carbon, 2020 
Developed by Stefan Haselwimmer  
Released under MIT License