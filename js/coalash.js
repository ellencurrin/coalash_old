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
        return dataObj
}


/// VARIABLES
var map
var states
var ponds
var plants
var plant_fc
var imagery
var BW
var red = "#A82904"
var yellow = "#D9AD24"
var green = "#88AD40"
var supercount = 0




$( document ).ready(function() {
    console.log("document ready")
    loadLayers('data/plants.geojson');
    //loadLayers('data/plants.geojson');
    buildMap();
    $('#layers-list').dropdown('toggle');
    $('#cover').fadeOut(1);
});



function buildMap() {
    L.mapbox.accessToken = 'pk.eyJ1IjoiZWxjdXJyIiwiYSI6IkZMekZlUEEifQ.vsXDy4z_bxRXyhSIvBXc2A';    
    map = L.mapbox.map('map', {
            minZoom: 6,
            zoomControl: false,
        })
        //.setView([34.2190, -83.5266], 7);
        
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
    //.addTo(map);
    
    BW = L.tileLayer('http://openmapsurfer.uni-hd.de/tiles/roadsg/x={x}&y={y}&z={z}', {
	minZoom: 0,
	maxZoom: 19,
	attribution: 'Imagery from <a href="http://giscience.uni-hd.de/">GIScience Research Group @ University of Heidelberg</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })//.addTo(map)
    
    /*var osm_BW = L.tileLayer('http://{s}.tiles.wmflabs.org/bw-mapnik/{z}/{x}/{y}.png', {
	attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    })*/
    //.addTo(map);
    
    imagery = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
	attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    })
    //.addTo(map);

    buildPonds(1)
    buildStates()
    
    states.on('mouseover', function(e) {
        states.setStyle ( {
            weight: 2, 
            fillOpacity: .4, 
        });
        e.layer.setStyle ( {
            weight: 2, 
            fillOpacity: 0, 
        });
    });
    states.on('mouseout', function(e) {
        e.layer.setStyle ( {
            weight: 2, 
            fillOpacity: 0, 
        });
    });
               
        
    //// MAP ZOOM COMMANDS 
    map.on('zoomend', function(){
            if (map.getZoom()>=13) {
                map.addLayer(imagery);
            } else if (map.getZoom()<=10){
                map.removeLayer(ponds);
                map.addLayer(BW);
                map.addLayer(plants);
                map.removeLayer(imagery);
                document.getElementById("instructions").innerHTML= "Click on a state to zoom in, or click on a plant to learn more."
            }
    })
    
    document.getElementById("instructions").innerHTML= "Click on a state to zoom in, or click on a plant to learn more."
       
}

function buildStates() {
    /// ADD OTHER STATES
    others = omnivore.geojson('data/other_states-simple.json')
        .on('ready', function(go) {
            this.eachLayer(function(polygon){
                polygon.setStyle ({
                    color: '#E3E3DD',
                    weight: 1,
                    fillColor: '#E3E3DD',//'#C3C3BE',
                    fillOpacity: .5,
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
                    fillOpacity: .4,
                });
                
                polygon.on('click', function(e){    
                    map.fitBounds(polygon.getBounds())
                    map.addLayer(BW);
                    states.setStyle({
                        weight: 3,
                        fillColor: '#C3C3BE',
                        fillOpacity: .4,
                    });
                    e.layer.setStyle ( {
                        weight: 2, 
                        fillOpacity: 0, 
                    });
                    document.getElementById("instructions").innerHTML= "Click on a plant to learn more."
                }) 
            })
            
            buildPlants();
        })
        .addTo(map);
}

function buildPlants() {
    plants = omnivore.geojson('data/plants.geojson')
    .on('ready', function(go){
        this.eachLayer(function(marker) {
            var color= '#374140'//'rgba(0, 163, 136, 1)' //'#00A388'
            var border_color
            var label = marker.feature.properties.power_plan
            var content
            var src = []
            
            if (marker.feature.properties.selc_ltgtn == "Yes") {
                border_color = 'rgba(255, 97, 56, 1)', //'#FF6138'
                src.push('http://welovemountainislandlake.files.wordpress.com/2013/01/riverbendcoalash-wbobbit.jpg'),
                src.push('http://switchboard.nrdc.org/blogs/bhayat/assets_c/2014/02/Dan%20River%20Spill%20Aerial%202%20Photo%20by%20Waterkeeper%20AllianceRick%20Dove-thumb-500x333-14631.jpg')
                content = marker.feature.properties.power_plan + '</br><img src="' + src[0] + '" style="width: 180px; height: 180px;">',
                marker.bindLabel(content)
            } else {
                border_color = 'rgba(255, 255, 255, .5)',
                marker.bindLabel(label)
            }
            
            marker.setIcon(L.divIcon( {
                iconSize: [1, 1],
                popupAnchor: [0, 10], 
                html: '<div style="margin-top: -10px; margin-left: -10px; text-align:center; color:#fff; border:4px solid ' + border_color +'; height: 20px; width: 20px; padding: 5px; border-radius:50%; background:' +
                color + '"></div>'
            }))
            /*var label = marker.feature.properties.power_plan
            marker.bindLabel(label)*/
            var url = marker.feature.properties.factsheet
            
            marker.on('click', function(e){
                buildPonds(e.target.feature)
                console.log(e)
                map.setView(e.latlng, 15)
                if (marker.feature.properties.selc_ltgtn == "Yes") {
                    openDialog(marker, src)
                }
                map.removeLayer(BW)
                map.removeLayer(plants)
                map.addLayer(imagery)
                map.addLayer(ponds)
               //window.open(url,'_blank')
               document.getElementById("instructions").innerHTML= "Hover over a pond to learn more."
            })
        })
    }).addTo(map)
    map.fitBounds(states.getBounds())
}

function buildPonds(plant) {
    if (plant == 1) {
        var plantID = 00000
    } else {
        var plantID = plant.properties.plant_code
    }
    ponds = L.geoJson()
    omnivore.geojson('data/coal_ash_impoundments_selc.geojson')
    .on('ready', function(go) {
        this.eachLayer(function(polygon) {
            var pondID = polygon.feature.properties.plant_id
            if (pondID == plantID) {
                ponds.addData(polygon.feature)
            } else {
                console.log("no")
            }
        })
        pondStyle(ponds)  
    })
}

function pondStyle(ponds) {
    ponds.eachLayer(function(polygon) {
        console.log(polygon)
        
        var label = '<div>'+ polygon.feature.properties.impoundmen +' | '+polygon.feature.properties.plant_full+''
            label += '</br> Condition Assessment: '+ polygon.feature.properties.epa_con_as
            label += '</div>'
            polygon.bindLabel(label)
            
        /// Set Style
            if (polygon.feature.properties.epa_con_as == "Poor") {
                polygon.setStyle ( {
                            color: red, 
                            opacity: 1,
                            weight: 3, 
                            fillColor: red,  
                            fillOpacity: 0
                })
            } else if (polygon.feature.properties.epa_con_as == "Fair") {
                polygon.setStyle ( {
                            color: yellow, 
                            opacity: 1,
                            weight: 3, 
                            fillColor: yellow,  
                            fillOpacity: 0
                })
            } else if (polygon.feature.properties.epa_con_as == "Satisfactory") {
                polygon.setStyle ( {
                            color: green, 
                            opacity: 1,
                            weight: 3, 
                            fillColor: green,  
                            fillOpacity: 0
                })
            } else {
                polygon.setStyle ( {
                            color: '#1334B9',//'#594736', 
                            opacity: 1,
                            weight: 3, 
                            fillColor: '#1334B9',//'#594736',  
                            fillOpacity: 0
                })
            }
            
        polygon.on('click', function(e) {
            //map.setView(e.latlng, 15)
            openDialog("00", "foo")
        })
    })
    map.fitBounds(ponds.getBounds())
}

function openDialog(marker, src) {
    if (marker != "00") {
        imageSRC = src
        name = marker.feature.properties.power_plan
        url = marker.feature.properties.seca_url
        //message = '<img src="'+ imageSRC[0] +'" style="width: 100%; height: 100%">'
        
    }
    
    title = '<h4 style="color: black; display: inline;">'+ name +'</h4>'
        title += '<a style="font-size: 12px; margin-left: 20px;" href="' + url +'" target="_blank;"><button>more at southeastcoalash.org</button> </a>'
        ul = document.createElement('ul')
        ul.className="bxslider"
        for (i = 0; i < imageSRC.length; i++) {
            li = document.createElement('li')
            media = document.createElement('img')
            media.src = imageSRC[i]
            media.style = "margin: auto;"
            p = document.createElement('p')
            txt = document.createTextNode("caption goes here")
            txt.style = "position: absolute; z-index: 200; bottom: 0;"
            p.appendChild(txt)
            li.appendChild(media)
            li.appendChild(p)
            ul.appendChild(li)
            //document.getElementById('sandbox').appendChild(ul)
        }
        message = document.createElement('div').appendChild(ul)
 
    bootbox.dialog({
        message: message,
        title: title
    })
    
    $('.bxslider').bxSlider();
}


function resetExtent(){
    location.reload()  
}


/*var poly_fc = {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "properties": polygon.feature.properties,
        "geometry": polygon.feature.geometry,
      }
    ]
};
     
var item = turf.featurecollection(polygon.toGeoJSON());
//console.log(poly_fc)
//console.log(dataObj)
var ptsWithin = turf.within(dataObj, poly_fc);
console.log(ptsWithin)
var count = 0
for (i = 0; i < ptsWithin.features.length; i++) {
if (ptsWithin.features[i].properties.selc_ltgtn == "Yes") {
    count += 1;
}
}
var op = count/10
console.log(Number(op))


polygon.setStyle ( {
            color: '#C3C3BE', 
            opacity: 1,
            weight: 2, 
            fillColor: '#FF5335',//'#DC3522',  
            fillOpacity: op
});*/