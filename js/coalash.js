function loadLayers (data) { 
    $.ajax({
            type:"GET",
            url: data,
            dataType:"text",
            success: parseData
    });   
}
function parseData(data){
        dataObj = $.parseJSON(data);
        console.log(dataObj);
}


// ****DEFINE VARIABLES
var map
var states
var ponds
//var points = L.geoJson()
var pond_pts = []
var point_fc
//var pond_points
var result
var plants
var red = "#A82904"
var yellow = "#D9AD24"
var green = "#88AD40"
var supercount = 0




$( document ).ready(function() {
    console.log("document ready")
    loadLayers('data/impoundments_selc.geojson');
    //loadLayers('data/plants.geojson');
    buildMap();
    $('#layers-list').dropdown('toggle');
    $('#cover').fadeOut(1);
});



function buildMap() {

//****** BUILDING MAP 
    L.mapbox.accessToken = 'pk.eyJ1IjoiZWxjdXJyIiwiYSI6IkZMekZlUEEifQ.vsXDy4z_bxRXyhSIvBXc2A';    
    map = L.mapbox.map('map', {
            minZoom: 6,
            zoomControl: false,
        })
        .setView([34.2190, -83.5266], 6);
        
        // Disable drag and zoom handlers.
        //map.dragging.disable();
        //map.touchZoom.disable();
        //map.doubleClickZoom.disable();
        //map.scrollWheelZoom.disable();
    
    /// BASE MAP    
    var acetate = L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/acetate-base/{z}/{x}/{y}.png', {
	attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
	subdomains: '0123',
	minZoom: 2,
	maxZoom: 18
    })
    .addTo(map);
    
    var osm_BW = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })
    //.addTo(map);
    
    var imagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    })
    //.addTo(map);
    
    ///ADD OTHER STATES
    others = omnivore.geojson('data/other_states-simple.json')
        .on('ready', function(go) {
            this.eachLayer(function(polygon){
                polygon.setStyle ({
                    color: '#E3E3DD',
                    weight: 1,
                    fillColor: '#E3E3DD',//'#C3C3BE',
                    fillOpacity: .9,
                })    
            })
        })
        .addTo(map)
    
    /// ADD SE STATES
    states = omnivore.geojson('data/states_selc.geojson')
        .on('ready', function(go) {
                this.eachLayer(function(polygon) {
                    polygon.setStyle ( {
                                    color: '#C3C3BE', 
                                    opacity: 1,
                                    weight: 2, 
                                    fillColor: '#C2D193',  
                                    fillOpacity: .4
                    });
                    polygon.on('click', function(e){    
                        map.fitBounds(polygon.getBounds())
                        //map.addLayer(plants);
                        map.removeLayer(acetate);
                        map.addLayer(osm_BW);
                        e.layer.setStyle({
                            weight: 3,
                            fillOpacity: 0,
                        })
                        if (supercount > 0) {
                            map.addLayer(plants)
                        } else {
                            buildPlants();
                            map.addLayer(plants)
                        }

                        
                    }) 
                })
        })
        .addTo(map);
        
        states.on('mouseover', function(e) {
            if (map.getZoom()<=6) {
                e.layer.setStyle({
                    weight: 3,
                    fillOpacity: 0.2, 
                });
            } else {
                states.setStyle ({
                    weight: 2, 
                    fillOpacity: 0.4, 
                })
                e.layer.setStyle ( {
                    weight: 2, 
                    fillOpacity: 0, 
                });
            }
        });
        states.on('mouseout', function(e) {
            if (map.getZoom()<=6) {
                e.layer.setStyle ( {
                    weight: 2, 
                    fillOpacity: 0.4, 
                });
            } else {
                e.layer.setStyle ( {
                    weight: 2, 
                    fillOpacity: 0, 
                });
            }
        });

    /// ADD PONDS + CREATE PLANTS
    ponds = omnivore.geojson('data/coal_ash_impoundments_selc.geojson')
    .on('ready', function(go) {
        this.eachLayer(function(polygon) {
            var ll = [Number(polygon.feature.properties.longitude), Number(polygon.feature.properties.latitude)]
            var pt = turf.point(ll, {
                "condition": polygon.feature.properties.epa_con_as,
                "gal": polygon.feature.properties.gallons,
            })
            pond_pts.push(pt)
                        
            /// Set Style
            if (polygon.feature.properties.epa_con_as == "Poor") {
                polygon.setStyle ( {
                            color: red, 
                            opacity: 1,
                            weight: 3, 
                            fillColor: red,  
                            fillOpacity: .3
                })
            } else if (polygon.feature.properties.epa_con_as == "Fair") {
                polygon.setStyle ( {
                            color: yellow, 
                            opacity: 1,
                            weight: 3, 
                            fillColor: yellow,  
                            fillOpacity: .3
                })
            } else if (polygon.feature.properties.epa_con_as == "Satisfactory") {
                polygon.setStyle ( {
                            color: green, 
                            opacity: 1,
                            weight: 3, 
                            fillColor: green,  
                            fillOpacity: .3
                })
            } else {
                polygon.setStyle ( {
                            color: '#1334B9',//'#594736', 
                            opacity: 1,
                            weight: 3, 
                            fillColor: '#1334B9',//'#594736',  
                            fillOpacity: .3
                })
            }
            
            /// BUILD LABEL
            var label = '<div>'+ polygon.feature.properties.impoundmen +' | '+polygon.feature.properties.plant_full+''
            label += '</br> Condition Assessment: '+ polygon.feature.properties.epa_con_as
            label += '</div>'
            polygon.bindLabel(label)
            
            polygon.on('click', function(e) {
                map.setView(e.latlng, 14)
            })
            
        })
        point_fc = turf.featurecollection(pond_pts)

    })
    //.addTo(map);
    
    
    ///SET PLANT LAYER
    function buildPlants() {
        supercount += 1
        plants = omnivore.geojson('data/plants.geojson')
        .on('ready', function(go){
            this.eachLayer(function(marker) {
                var buffered = turf.buffer(marker.feature, 3, 'miles');
                var result = turf.featurecollection([buffered.features[0]]);
                //L.mapbox.featureLayer(result).addTo(map)
                
                //// TURF.JS WITHIN
                var ptsWithin = turf.within(point_fc, result)
                //console.log(ptsWithin)
                var count = 0
                var gal = 0
                var value = 0
                var condition= 0
                for (i = 0; i < ptsWithin.features.length; i++) {
                    count += 1
                    gal += ptsWithin.features[i].properties.gal;
                    if (ptsWithin.features[i].properties.condition == "Poor") {
                        value = 3;
                    } else if (ptsWithin.features[i].properties.condition == "Fair") {
                        value = 2;
                    } else if (ptsWithin.features[i].properties.condition == "Satisfactory") {
                        value = 1;
                    } else {
                        value = 0;
                    }
                    if (value > condition) {
                        condition = value
                    }
                }
                console.log(condition)
    
                var color            
                if (condition == 3) {
                    color = red;
                } else if (condition == 2) {
                    color = yellow;
                } else if (condition == 1) {
                    color = green;
                } else {color="#594736"}
                
                marker.setIcon(L.divIcon( {
                    iconSize: [1, 1],
                    popupAnchor: [0, 10], 
                    html: '<div style="margin-top: -10px; margin-left: -10px; text-align:center; color:#fff; border:3px solid rgba( 255, 255, 255, 0.5 ); height: 30px; width: 30px; padding: 5px; border-radius:50%; background:' +
                    color + '">' + count + '</div>'
                }))
                var label = marker.feature.properties.power_plan
                marker.bindLabel(label)
                var url = marker.feature.properties.factsheet
                
                marker.on('click', function(e){
                    console.log(e)
                    map.setView(e.latlng, 14)
                    map.removeLayer(plants)
                    map.removeLayer(osm_BW)
                    map.addLayer(imagery)
                    map.addLayer(ponds)
                    window.open(url,'_blank')
                })
            })
        })//.addTo(map)
    }
        
        
    //// MAP ZOOM COMMANDS 
    map.on('zoomend', function(){
            if (map.getZoom()>=13) {
                console.log("zoom greater than or equal 13")
                //map.removeLayer(osm_BW);
                map.addLayer(imagery);
            }else if (map.getZoom()<=6){
                console.log("zoom less than 6")
                map.removeLayer(osm_BW);
                map.addLayer(acetate);
                map.removeLayer(ponds);
                map.removeLayer(plants);
            }
    })
    
}

  



function resetExtent(){
    map.setView([34.2190, -84.5266], 6)
    map.removeLayer(plants)
    map.removeLayer(ponds)
    
}

function concatPlant(polygon, ll, gal, condition, counter, ONE) {
    console.log("concat plant")
    ONE = polygon.feature.properties.plant_labe
    ll.push([Number(polygon.feature.properties.latitude), Number(polygon.feature.properties.longitude)])
    //console.log(ll)
    gal += polygon.feature.properties.gallons
    var value
    if (polygon.feature.properties.epa_con_as == "Poor") {
        value = 3;
    } else if (polygon.feature.properties.epa_con_as == "Fair") {
        value = 2;
    } else if (polygon.feature.properties.epa_con_as == "Satisfactory") {
        value = 1;
    } else {
        value = 0;
    }
    condition += value
    var TWO = polygon.feature.properties.plant_labe
    console.log(TWO)
    return ll, gal, condition, counter, TWO
}

function newPlant(polygon, ll, gal, condition, counter, ONE){
    console.log("creating new plant")
    //console.log(ll)
    ONE = polygon.feature.properties.plant_labe
    if (ll.length == 0) {
        ll = [Number(polygon.feature.properties.longitude), Number(polygon.feature.properties.latitude)]
        type = "Point"
    } else {
        type = "Polygon"
    }
    var geojsonFeature = {
        "type": "Feature",
        "properties": {
            "tot_gallons": gal,
            "con_value": condition,
            "num_ponds": counter
        },
        "geometry": {
            "type": type,
            "coordinates": ll
        }
    };
    plants.addData(geojsonFeature);
    
    var TWO = polygon.feature.properties.plant_labe
    console.log(TWO)
    ll = [Number(polygon.feature.properties.longitude), Number(polygon.feature.properties.latitude)]
    gal = polygon.feature.properties.gallons
    counter = 1
    var value
    if (polygon.feature.properties.epa_con_as == "Poor") {
        value = 3;
    } else if (polygon.feature.properties.epa_con_as == "Fair") {
        value = 2;
    } else if (polygon.feature.properties.epa_con_as == "Satisfactory") {
        value = 1;
    } else {
        value = 0;
    }
    condition = value
    return ll, gal, condition, counter, TWO
}