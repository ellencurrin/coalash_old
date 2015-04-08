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
var points = L.geoJson()
var red = "#A82904"
var yellow = "#D9AD24"
var green = "#88AD40"




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
    var Acetate_basemap = L.tileLayer('http://a{s}.acetate.geoiq.com/tiles/acetate-base/{z}/{x}/{y}.png', {
	attribution: '&copy;2012 Esri & Stamen, Data from OSM and Natural Earth',
	subdomains: '0123',
	minZoom: 2,
	maxZoom: 18
    })
    //.addTo(map);
    
    var osm_BW = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })
    .addTo(map);
    
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
                    weight: 5,
                    fillColor: '#E3E3DD',//'#C3C3BE',
                    fillOpacity: .7,
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
                        console.log(polygon.getBounds())
                        map.fitBounds(polygon.getBounds())
                        //map.addLayer(osm_BW)
                        map.addLayer(plants)
                        e.layer.setStyle({
                            weight: 3,
                            fillOpacity: 0.2,
                        })
                    }) 
                })
        })
        .addTo(map);
        
        states.on('mouseover', function(e) {
            if (map.getZoom()<=13) {
                e.layer.setStyle({
                    weight: 3,
                    fillOpacity: 0.2, 
                });
            } else {
                e.layer.setStyle ( {
                    weight: 2, 
                    fillOpacity: 0, 
                });
            }
        });
        states.on('mouseout', function(e) {
            if (map.getZoom()<=13) {
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

    ///SET PLANT LAYER
    plants = omnivore.geojson('data/plants.geojson')
    .on('ready', function(go){
        this.eachLayer(function(marker) {
            marker.on('click', function(e){
                console.log(e)
                map.setView(e.latlng, 14)
                map.removeLayer(plants)
                map.removeLayer(osm_BW)
                map.addLayer(imagery)
                map.addLayer(ponds)
            })
            var color 
            if (marker.feature.properties.contamin_1 == 'Yes') {
                color = red
            } else {
                color = yellow
            }
            marker.setIcon(L.divIcon( {
                iconSize: [1, 1],
                popupAnchor: [0, 10], 
                html: '<div style="margin-top: -10px; margin-left: -10px; text-align:center; color:#fff; border:3px solid rgba( 255, 255, 255, 0.5 ); height: 30px; width: 30px; padding: 5px; border-radius:50%; background:' +
                color + '">' + marker.feature.properties.number_of1 + '</div>'
            }))
            var label = marker.feature.properties.label
            marker.bindLabel(label)
        })
    })
    //.addTo(map)
    
    /// ADD PONDS + CREATE PLANTS
    ponds = omnivore.geojson('data/impoundments_selc.geojson')
    .on('ready', function(go) {
        console.log(go)
        var ONE   
        var TWO
        var ll
        var counter
        this.eachLayer(function(polygon) {
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
                            color: '#594736', 
                            opacity: 1,
                            weight: 3, 
                            fillColor: '#594736',  
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
    })
    //.addTo(map);
        

    //// MAP ZOOM COMMANDS 
    map.on('zoomend', function(){
            if (map.getZoom()>=13) {
                console.log("zoom greater than or equal 13")
                //map.removeLayer(osm_BW);
                map.addLayer(imagery);
            } else if (map.getZoom()<=9){
                console.log("zoom less than 13")
                map.removeLayer(imagery);
                map.addLayer(osm_BW);
                map.removeLayer(ponds);
            }
    })
    
}

  



function resetExtent(){
    map.setView([34.2190, -84.5266], 6)
    map.removeLayer(plants)
    map.removeLayer(ponds)
    
}
