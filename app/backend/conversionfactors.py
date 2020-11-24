
"""
Copyright (c) BEIS
 
backend/conversionfactors.py
GHG conversion factors from 
https://www.gov.uk/government/publications/greenhouse-gas-reporting-conversion-factors-20XX
"""

# NOTE: Last two figures for gas were missing so used 2012 figure
converter_kg_gas = {
    '2020':   0.18387,
    '2019':   0.18385,
    '2018':   0.18396,
    '2017':   0.18416,
    '2016':   0.18400,  
    '2015':   0.18445,  
    '2014':   0.184973,  
    '2013':   0.18404,  
    '2012':   0.18521,  
    '2011':   0.18521,  
    '2010':   0.18521  
}

converter_kg_electricity = {
    '2020':   0.23314,
    '2019':   0.2556,
    '2018':   0.28307,
    '2017':   0.35156,
    '2016':   0.41205,  
    '2015':   0.46219,  
    '2014':   0.49426,  
    '2013':   0.44548,  
    '2012':   0.46002,  
    '2011':   0.45205,  
    '2010':   0.48531   
}
