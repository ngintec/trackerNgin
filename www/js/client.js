let options = {
          enableHighAccuracy: false,
          timeout: 5000,
          maximumAge: 5000
        }; //options for getting locations

//Create a map and load into map container
// will be empty till we get tracking data
map = new OpenLayers.Map("mapContainer");
map.addLayer(new OpenLayers.Layer.OSM());


let zoom=12;//zoom the map doth set too high zoom on screen instead
let myposition;//my location
let myusers={};//people who are sending me data
let markers={};// makers of every individual
let popups={};//popups of every individual
let watchid, mypopup, mymarker; //my data only watch id is used to clear the setInterval

// here is where the location service starts
async function getLocation() {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(recordPosition, failure, options);
      } else {
        alert("Geolocation is not supported by this browser.");
      }
    }

// success function for getCurrentPosition
// once we get the location we send through websocket to the server
// then we put ourselves on the map.
function recordPosition(position) {
  myposition=[position.coords.longitude,position.coords.latitude];
  
  //send only data once
  sendData({location: myposition});  
  let lonLat = new OpenLayers.LonLat( myposition[0] ,myposition[1] )
  .transform(
    new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
    map.getProjectionObject() // to Spherical Mercator Projection
  );
  if ( mymarker ){
    map.removeLayer(mymarker);
  }
  if ( mypopup ){
    map.removePopup(mypopup);
  }
  mymarker = new OpenLayers.Layer.Markers( "Markers" );
  mymarker.addMarker(new OpenLayers.Marker(lonLat));
  map.addLayer(mymarker);
  
  map.setCenter(lonLat, zoom);
  mypopup= new OpenLayers.Popup.Anchored(
        "Popup", 
        lonLat,
        new OpenLayers.Size(50,15),
        "You",
        null,
        true
    );
  map.addPopup(mypopup)
}

//hndles failures of the getCurrentPosisiton
//retries infiniely to get the location
//clears the old location watchid
function failure(err){
  alert("Error getting your position", err.message, "Will retry");
  // clearInterval(watchid);
  // watchid=setInterval(navigator.geolocation.getCurrentPosition(recordPosition, failure, options),5000);
  // navigator.geolocation.clearWatch(watchid);
  watchid=navigator.geolocation.getCurrentPosition(recordPosition, failure, options);
}
// destroys all existing markers on the screen on disconnect
function destroy_markers(){
  map.removeLayer(mymarker);
  map.removePopup(mypopup);
  mymarker=undefined;
  mypopup=undefined;
  for (const [key, value] of Object.entries(markers)){
    removeUserMarkers(key);
  }
}
// separated function , so that can be called multiple times.
function removeUserMarkers(key) {
  map.removeLayer(markers[key]);
  markers[key]=undefined;
  map.removePopup(popups[key]);
  popups[key]=undefined;
}
// plot other users on my map on gettting a message through websocket
function plotPosition(data) {
  let userposition=data.location;
  let lonLat = new OpenLayers.LonLat( userposition[0] ,userposition[1] )
  .transform(
    new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
    map.getProjectionObject() // to Spherical Mercator Projection
  );
  //if iam a new user do below
  if (!myusers[data.from]){
    //add user to myuserlist and set tracking as on by default
    myuserlist[data.alias]="on";
    //add user to enabledusers and set tracking as on by default
    enabledUsers.push(data.alias);
    //perform actions to put him on the map
    markers[data.from] = new OpenLayers.Layer.Markers( "Markers" );
    myusers[data.from]=new OpenLayers.Marker(lonLat)
    map.addLayer(markers[data.from]);
    markers[data.from].addMarker(myusers[data.from]);
    popups[data.from]= new OpenLayers.Popup.Anchored(
        "Popup", 
        lonLat,
        new OpenLayers.Size(50,15),
        data.alias,
        null,
        true
    );
    map.addPopup(popups[data.from])
  } else {
    //if its an old user check if he is enabled and then only plot his position;
    if (enabledUsers.indexOf(data.alias) > -1 ){
      //clearmarker
      // map.removeLayer(markers[data.from]);
      map.removePopup(popups[data.from]);
      //redraw
      markers[data.from].addMarker(myusers[data.from]);
      popups[data.from]= new OpenLayers.Popup.Anchored(
          "Popup", 
          lonLat,
          new OpenLayers.Size(50,15),
          data.alias,
          null,
          true
      );
      map.addPopup(popups[data.from])
    } 
    // not enabled users are already filtered in the filtering event;
  }
}


