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

function getIcon(usertype){
  var size = new OpenLayers.Size(15,15);
  var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
  if (usertype == "user") {
    var icon = new OpenLayers.Icon('/js/tpjs/img/user.png', size, offset);
  } else if (usertype == "trackee"){
    var icon = new OpenLayers.Icon('/js/tpjs/img/trackee.png', size, offset);
  } else {
    var icon = new OpenLayers.Icon('/js/tpjs/img/me.png', size, offset);
  }
  return icon;
}

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

  //plot my position 
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
  mymarker.addMarker(new OpenLayers.Marker(lonLat, getIcon("me")));
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
  map.removePopup(popups[key]);
}




let myUserMapping={};
// plot other users on my map on gettting a message through websocket
function plotPosition(data, usertype) {
  let userposition=data.location;
  let lonLat = new OpenLayers.LonLat( userposition[0] ,userposition[1] )
  .transform(
    new OpenLayers.Projection("EPSG:4326"), // transform from WGS 1984
    map.getProjectionObject() // to Spherical Mercator Projection
  );
  //if iam a new user do below
  if (!myusers[data.from]){
    //add user to myuserlist and set tracking as on by default
    if ( Object.keys(myuserlist).indexOf(data.from) == -1 ){
      myuserlist[data.from]="on";
    }
    //Create a phone to alias mapping
    myUserMapping[data.from]=data.alias;
    //add user to enabledusers and set tracking as on by default
    enabledUsers[data.from]=data.alias;
    //perform actions to put him on the map
    markers[data.from] = new OpenLayers.Layer.Markers( "Markers" );
    myusers[data.from]=new OpenLayers.Marker(lonLat, getIcon(usertype))
    map.addLayer(markers[data.from]);
    markers[data.from].addMarker(myusers[data.from]);
    popups[data.from]= new OpenLayers.Popup.Anchored(
        "Popup", 
        lonLat,
        new OpenLayers.Size(75,30),
        data.alias,
        null,
        true
    );
    map.addPopup(popups[data.from])
  } else {
    //update a phone to alias mapping
    myUserMapping[data.from]=data.alias;
    //if its an old user check if he is enabled and then only plot his position;
    if ( enabledUsers[data.from] ){
      // try catch is needed for filtered and then unfiltered events
      try{
        map.removeLayer(markers[data.from]);
        map.removePopup(popups[data.from]);
      } catch {
        
      }
      //redraw
      markers[data.from] = new OpenLayers.Layer.Markers( "Markers" );
      myusers[data.from]=new OpenLayers.Marker(lonLat, getIcon(usertype))
      map.addLayer(markers[data.from]);
      markers[data.from].addMarker(myusers[data.from]);
      popups[data.from]= new OpenLayers.Popup.Anchored(
          "Popup", 
          lonLat,
          new OpenLayers.Size(75,30),
          data.alias,
          null,
          true
      );
      map.addPopup(popups[data.from])
    } else {
      try{
            map.removeLayer(markers[data.from]);
            map.removePopup(popups[data.from]);
          } catch(err) {
          }
      
    }

    // not enabled users are already filtered in the filtering event;
  }
}


